'use server'

import { createHash } from 'node:crypto'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type FinanceContext = 'personal' | 'silentra'

function normalizeHeader(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function detectCsvDelimiter(input: string) {\n  const firstLine = input.split(/\\r?\\n/, 1)[0] ?? ''\n  let quoted = false\n  let commas = 0\n  let semicolons = 0\n\n  for (let index = 0; index < firstLine.length; index += 1) {\n    const character = firstLine[index]\n    if (character === '\"') {\n      if (quoted && firstLine[index + 1] === '\"') index += 1\n      else quoted = !quoted\n    } else if (!quoted && character === ',') commas += 1\n    else if (!quoted && character === ';') semicolons += 1\n  }\n\n  return semicolons > commas ? ';' : ','\n}\n\nfunction parseCsv(input: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index]

    if (character === '"') {
      if (quoted && input[index + 1] === '"') {
        field += '"'
        index += 1
      } else {
        quoted = !quoted
      }
      continue
    }

    if (character === delimiter && !quoted) {
      row.push(field)
      field = ''
      continue
    }

    if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && input[index + 1] === '\n') index += 1
      row.push(field)
      if (row.some((cell) => cell.trim() !== '')) rows.push(row)
      row = []
      field = ''
      continue
    }

    field += character
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    if (row.some((cell) => cell.trim() !== '')) rows.push(row)
  }

  return rows
}

function findColumn(headers: string[], aliases: string[]) {
  return headers.findIndex((header) => aliases.includes(header))
}

function parseAmount(value: string) {
  const normalized = value
    .replace(/[−–]/g, '-')
    .replace(/[^0-9,.-]/g, '')
    .trim()

  if (!normalized) return null

  const comma = normalized.lastIndexOf(',')
  const dot = normalized.lastIndexOf('.')
  let numeric = normalized

  if (comma >= 0 && dot >= 0) {
    numeric =
      comma > dot
        ? normalized.replace(/\./g, '').replace(',', '.')
        : normalized.replace(/,/g, '')
  } else if (comma >= 0) {
    numeric = normalized.replace(',', '.')
  }

  const result = Number(numeric)
  return Number.isFinite(result) && result !== 0 ? result : null
}

function parseDate(value: string) {
  const input = value.trim()
  if (!input) return null

  const iso = input.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/)
  if (iso) {
    const [, year, month, day, hour = '00', minute = '00', second = '00'] = iso
    const date = new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
      ),
    )
    if (
      date.getUTCFullYear() !== Number(year) ||
      date.getUTCMonth() !== Number(month) - 1 ||
      date.getUTCDate() !== Number(day)
    ) {
      return null
    }
    return date.toISOString()
  }

  const european = input.match(
    /^(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})(?:[ ,T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
  )
  if (european) {
    const [, day, month, rawYear, hour = '00', minute = '00', second = '00'] =
      european
    const year = Number(rawYear.length === 2 ? `20${rawYear}` : rawYear)
    const date = new Date(
      Date.UTC(
        year,
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
      ),
    )
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== Number(month) - 1 ||
      date.getUTCDate() !== Number(day)
    ) {
      return null
    }
    return date.toISOString()
  }

  const fallback = new Date(input)
  return Number.isNaN(fallback.getTime()) ? null : fallback.toISOString()
}

function isCompletedStatus(value: string) {
  const status = normalizeHeader(value)
  return (
    status === '' ||
    status === 'completed' ||
    status === 'complete' ||
    status === 'concluido' ||
    status === 'concluida' ||
    status === 'succeeded' ||
    status === 'success' ||
    status === 'settled'
  )
}

function makeReference(
  externalId: string,
  occurredAt: string,
  amount: number,
  description: string,
  currency: string,
) {
  const basis = externalId
    ? `revolut-id:${externalId.trim()}`
    : [occurredAt, amount.toFixed(2), description.trim(), currency].join('|')

  return createHash('sha256').update(basis).digest('hex')
}

function importError(message: string): never {
  redirect(`/dashboard/transactions/import?error=${encodeURIComponent(message)}`)
}

export async function importRevolutCsv(formData: FormData) {
  const file = formData.get('file')
  const accountId = formData.get('accountId')
  const requestedContext = formData.get('financeContext')

  if (!(file instanceof File) || file.size === 0 || file.size > 5 * 1024 * 1024) {
    importError('Escolhe um ficheiro CSV válido (máximo 5 MB).')
  }

  if (typeof accountId !== 'string' || !accountId) {
    importError('Escolhe a conta onde queres importar os movimentos.')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('active_finance_context')
    .eq('id', user.id)
    .maybeSingle()

  const activeContext =
    profile?.active_finance_context === 'silentra' ||
    profile?.active_finance_context === 'general'
      ? profile.active_finance_context
      : 'personal'

  if (activeContext === 'general') {
    importError('O contexto Geral é apenas de leitura. Muda para Pessoal ou Silentra antes de importar.')
  }

  const financeContext: FinanceContext = activeContext

  const { data: account } = await supabase
    .from('accounts')
    .select('id, name, currency_code, finance_context, is_active')
    .eq('id', accountId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!account || !account.is_active) {
    importError('A conta escolhida não existe ou está arquivada.')
  }

  if (account.finance_context !== financeContext) {
    importError('A conta tem de pertencer ao contexto financeiro selecionado.')
  }

  const content = await file.text()
  if (content.includes('\u0000')) importError('O ficheiro não parece ser um CSV válido.')

  const rows = parseCsv(content.replace(/^\uFEFF/, ''))
  if (rows.length < 2) importError('O CSV não contém movimentos para importar.')
  if (rows.length > 2001) {
    importError('O ficheiro contém demasiadas linhas. Importa até 2.000 movimentos de cada vez.')
  }

  const headers = rows[0].map(normalizeHeader)
  const dateIndex = findColumn(headers, [
    'completed date',
    'started date',
    'date',
    'data',
    'data de conclusao',
    'data de conclusão',
  ])
  const descriptionIndex = findColumn(headers, [
    'description',
    'merchant',
    'counterparty',
    'descricao',
    'descrição',
    'detalhes',
  ])
  const amountIndex = findColumn(headers, ['amount', 'valor', 'montante'])
  const currencyIndex = findColumn(headers, ['currency', 'moeda'])
  const statusIndex = findColumn(headers, ['state', 'status', 'estado'])
  const idIndex = findColumn(headers, [
    'id',
    'transaction id',
    'transaction reference',
    'referencia',
    'referência',
  ])

  if (dateIndex < 0 || descriptionIndex < 0 || amountIndex < 0) {
    importError(
      'Não reconheci as colunas do CSV. O ficheiro precisa de ter Data, Descrição e Amount/Valor.',
    )
  }

  const candidates: Array<{
    user_id: string
    account_id: string
    finance_context: FinanceContext
    transaction_type: 'income' | 'expense'
    amount: number
    description: string
    occurred_at: string
    import_source: string
    import_reference: string
  }> = []

  const seen = new Set<string>()
  let skipped = 0

  for (const row of rows.slice(1)) {
    const rawStatus = statusIndex >= 0 ? (row[statusIndex] ?? '') : ''
    if (!isCompletedStatus(rawStatus)) {
      skipped += 1
      continue
    }

    const currency =
      currencyIndex >= 0
        ? (row[currencyIndex] ?? '').trim().toUpperCase()
        : (account.currency_code || 'EUR').toUpperCase()

    if (currency && currency !== (account.currency_code || 'EUR').toUpperCase()) {
      skipped += 1
      continue
    }

    const amount = parseAmount(row[amountIndex] ?? '')
    const occurredAt = parseDate(row[dateIndex] ?? '')
    const description = (row[descriptionIndex] ?? '').trim().slice(0, 120)

    if (!amount || !occurredAt) {
      skipped += 1
      continue
    }

    const externalId = idIndex >= 0 ? (row[idIndex] ?? '') : ''
    const referenceCurrency = currency || (account.currency_code ?? 'EUR')
    const fallbackKey = [
      occurredAt,
      amount.toFixed(2),
      description,
      referenceCurrency,
    ].join('|')
    const occurrence = externalId
      ? 1
      : (fallbackOccurrences.get(fallbackKey) ?? 0) + 1
    if (!externalId) fallbackOccurrences.set(fallbackKey, occurrence)

    const reference = makeReference(
      externalId,
      occurredAt,
      amount,
      description,
      referenceCurrency,
      occurrence,
    )

    if (seen.has(reference)) {
      skipped += 1
      continue
    }
    seen.add(reference)

    candidates.push({
      user_id: user.id,
      account_id: account.id,
      finance_context: financeContext,
      transaction_type: amount < 0 ? 'expense' : 'income',
      amount: Math.abs(amount),
      description: description || 'Movimento Revolut',
      occurred_at: occurredAt,
      import_source: 'revolut_csv',
      import_reference: reference,
    })
  }

  if (candidates.length === 0) {
    importError('Não encontrei movimentos concluídos e válidos para importar.')
  }

  const references = candidates.map((item) => item.import_reference)
  const existing = new Set<string>()

  for (let index = 0; index < references.length; index += 100) {
    const batch = references.slice(index, index + 100)
    const { data, error } = await supabase
      .from('transactions')
      .select('import_reference')
      .eq('user_id', user.id)
      .eq('finance_context', financeContext)
      .eq('import_source', 'revolut_csv')
      .in('import_reference', batch)

    if (error) importError('Não foi possível verificar importações anteriores.')
    for (const item of data ?? []) {
      if (item.import_reference) existing.add(item.import_reference)
    }
  }

  const newRows = candidates.filter(
    (item) => !existing.has(item.import_reference),
  )

  if (newRows.length === 0) {
    importError('Estes movimentos já tinham sido importados. Não foram criadas duplicações.')
  }

  let importedCount = 0
  for (let index = 0; index < newRows.length; index += 100) {
    const batch = newRows.slice(index, index + 100)
    const { data, error } = await supabase
      .from('transactions')
      .upsert(batch, {
        onConflict: 'user_id,finance_context,import_source,import_reference',
        ignoreDuplicates: true,
      })
      .select('id')
    if (error) {
      importError('A importação foi interrompida. Verifica a conta e volta a tentar.')
    }
    importedCount += data?.length ?? 0
  }

  if (importedCount === 0) {
    importError('Estes movimentos já tinham sido importados. Não foram criadas duplicações.')
  }

  const contextLabel = financeContext === 'silentra' ? 'Silentra' : 'Pessoal'
  const ignoredCount = skipped + existing.size + newRows.length - importedCount
  const message = `${importedCount} movimentos importados para ${contextLabel}; ${ignoredCount} ignorados.`
  redirect(`/dashboard/transactions?toast=${encodeURIComponent(message)}`)
}
