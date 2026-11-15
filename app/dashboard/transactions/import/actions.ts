'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getFinancialContext } from '@/lib/financial-context'
import {
  analyzeCsvImport,
  CsvImportParseError,
  type CsvColumnKey,
  type CsvColumnMapping,
  type CsvImportAnalysis,
  type CsvImportCandidate,
  type CsvImportPreviewResult,
} from '@/lib/transactions/csv-import'

const MAX_FILE_SIZE = 2.5 * 1024 * 1024
const BATCH_SIZE = 100

type ImportPlanResult =
  | { kind: 'error'; message: string }
  | {
      kind: 'mapping'
      headers: string[]
      mapping: CsvColumnMapping
    }
  | {
      kind: 'ready'
      supabase: Awaited<ReturnType<typeof createClient>>
      userId: string
      contextId: string
      contextName: string
      accountId: string
      analysis: CsvImportAnalysis
      existing: Set<string>
      newRows: CsvImportCandidate[]
    }

function errorRedirect(message: string): never {
  redirect(
    `/dashboard/transactions/import?error=${encodeURIComponent(message)}`,
  )
}

async function readCsvFile(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer())

  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(bytes.subarray(2))
  }
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(bytes.subarray(2))
  }

  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

function getColumnMapping(formData: FormData) {
  const keys: CsvColumnKey[] = [
    'date',
    'description',
    'amount',
    'currency',
    'status',
    'id',
  ]
  const mapping: Partial<CsvColumnMapping> = {}
  let hasOverrides = false

  for (const key of keys) {
    const value = formData.get(`${key}Column`)
    if (typeof value !== 'string' || value === '') continue

    const index = Number(value)
    if (!Number.isInteger(index)) continue

    mapping[key] = index
    hasOverrides = true
  }

  return hasOverrides ? mapping : undefined
}

async function findExistingReferences(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  contextId: string,
  candidates: CsvImportCandidate[],
) {
  const references = candidates.map((item) => item.import_reference)
  const existing = new Set<string>()

  for (let index = 0; index < references.length; index += BATCH_SIZE) {
    const batch = references.slice(index, index + BATCH_SIZE)
    const { data, error } = await supabase
      .from('transactions')
      .select('import_reference')
      .eq('user_id', userId)
      .eq('context_id', contextId)
      .eq('import_source', 'revolut_csv')
      .in('import_reference', batch)

    if (error) return { error: true, existing }

    for (const item of data ?? []) {
      if (item.import_reference) existing.add(item.import_reference)
    }
  }

  return { error: false, existing }
}

async function createImportPlan(formData: FormData): Promise<ImportPlanResult> {
  const file = formData.get('file')
  const accountId = formData.get('accountId')

  if (
    !(file instanceof File) ||
    file.size === 0 ||
    file.size > MAX_FILE_SIZE
  ) {
    return {
      kind: 'error',
      message: 'Escolhe um ficheiro CSV válido (máximo 2,5 MB).',
    }
  }

  if (typeof accountId !== 'string' || !accountId) {
    return {
      kind: 'error',
      message: 'Escolhe a conta onde queres importar os movimentos.',
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const financialContext = await getFinancialContext(supabase, user.id)
  const { data: account } = await supabase
    .from('accounts')
    .select('id, name, currency_code, context_id, is_active')
    .eq('id', accountId)
    .eq('user_id', user.id)
    .eq('context_id', financialContext.id)
    .maybeSingle()

  if (!account || !account.is_active) {
    return {
      kind: 'error',
      message:
        'A conta escolhida não existe ou está arquivada neste espaço financeiro.',
    }
  }

  let analysis: CsvImportAnalysis
  try {
    const content = await readCsvFile(file)
    analysis = analyzeCsvImport(
      content,
      (
        account.currency_code ||
        financialContext.currency_code ||
        'EUR'
      ).toUpperCase(),
      getColumnMapping(formData),
    )
  } catch (error) {
    return {
      kind: 'error',
      message:
        error instanceof CsvImportParseError
          ? error.message
          : 'Não foi possível ler o ficheiro. Confirma que está em formato CSV ou Excel compatível.',
    }
  }

  if (analysis.needsMapping) {
    return {
      kind: 'mapping',
      headers: analysis.headers,
      mapping: analysis.mapping,
    }
  }

  const lookup = await findExistingReferences(
    supabase,
    user.id,
    financialContext.id,
    analysis.candidates,
  )

  if (lookup.error) {
    return {
      kind: 'error',
      message: 'Não foi possível verificar importações anteriores.',
    }
  }

  const newRows = analysis.candidates.filter(
    (item) => !lookup.existing.has(item.import_reference),
  )

  return {
    kind: 'ready',
    supabase,
    userId: user.id,
    contextId: financialContext.id,
    contextName: financialContext.name,
    accountId: account.id,
    analysis,
    existing: lookup.existing,
    newRows,
  }
}

export async function previewCsvImport(
  formData: FormData,
): Promise<CsvImportPreviewResult> {
  const plan = await createImportPlan(formData)

  if (plan.kind === 'error') {
    return { ok: false, error: plan.message }
  }

  if (plan.kind === 'mapping') {
    return {
      ok: true,
      needsMapping: true,
      headers: plan.headers,
      mapping: plan.mapping,
    }
  }

  return {
    ok: true,
    needsMapping: false,
    headers: plan.analysis.headers,
    mapping: plan.analysis.mapping,
    summary: {
      totalRows: plan.analysis.totalRows,
      ready: plan.newRows.length,
      alreadyImported: plan.existing.size,
      duplicateInFile: plan.analysis.duplicateInFile,
      pendingOrUnsettled: plan.analysis.pendingOrUnsettled,
      invalid: plan.analysis.invalid,
      currencyMismatch: plan.analysis.currencyMismatch,
    },
    sample: plan.newRows.slice(0, 5).map((item) => ({
      transaction_type: item.transaction_type,
      amount:
        item.transaction_type === 'expense' ? -item.amount : item.amount,
      description: item.description,
      occurred_at: item.occurred_at,
      currency_code: item.currency_code,
    })),
  }
}

export async function importRevolutCsv(formData: FormData) {
  const plan = await createImportPlan(formData)

  if (plan.kind === 'error') errorRedirect(plan.message)
  if (plan.kind === 'mapping') {
    errorRedirect(
      'Não reconheci as colunas obrigatórias. Mapeia Data, Descrição e Valor na pré-visualização.',
    )
  }

  if (plan.newRows.length === 0) {
    errorRedirect(
      'Não há movimentos novos para importar. Os restantes já foram importados ou foram ignorados pela validação.',
    )
  }

  const rows = plan.newRows.map((item) => ({
    user_id: plan.userId,
    context_id: plan.contextId,
    account_id: plan.accountId,
    transaction_type: item.transaction_type,
    amount: item.amount,
    description: item.description,
    occurred_at: item.occurred_at,
    import_source: item.import_source,
    import_reference: item.import_reference,
  }))

  let importedCount = 0
  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    const batch = rows.slice(index, index + BATCH_SIZE)
    const { data, error } = await plan.supabase
      .from('transactions')
      .upsert(batch, {
        onConflict: 'user_id,context_id,import_source,import_reference',
        ignoreDuplicates: true,
      })
      .select('id')

    if (error) {
      errorRedirect(
        'A importação foi interrompida. Verifica a conta e volta a tentar.',
      )
    }
    importedCount += data?.length ?? 0
  }

  if (importedCount === 0) {
    errorRedirect(
      'Estes movimentos já tinham sido importados. Não foram criadas duplicações.',
    )
  }

  const ignoredCount =
    plan.analysis.pendingOrUnsettled +
    plan.analysis.invalid +
    plan.analysis.currencyMismatch +
    plan.analysis.duplicateInFile +
    plan.existing.size +
    plan.newRows.length -
    importedCount
  const message = `${importedCount} movimentos importados para ${plan.contextName}; ${ignoredCount} ignorados.`

  redirect(`/dashboard/transactions?toast=${encodeURIComponent(message)}`)
}
