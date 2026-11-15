'use server'

import { createHash } from 'node:crypto'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getFinancialContext } from '@/lib/financial-context'

function normalizeHeader(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function detectCsvDelimiter(input: string) {
  const firstLine = input.split(/\r?\n/, 1)[0] ?? ''
  let quoted = false
  let commas = 0
  let semicolons = 0

  for (let index = 0; index < firstLine.length; index += 1) {
    const character = firstLine[index]
    if (character === '"') {
      if (quoted && firstLine[index + 1] === '"') index += 1
      else quoted = !quoted
    } else if (!quoted && character === ',') {
      commas += 1
    } else if (!quoted && character === ';') {
      semicolons += 1
    }
  }

  return semicolons > commas ? ';' : ','
}

function parseCsv(input: string, delimiter: string): string[][] {
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

  if (quoted) throw new Error('CSV contém uma célula entre aspas que não foi fechada.')

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
    .replace(/[€$£\s]/g, '')
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

  const iso = input.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/,
  )

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
  occurrence: number,
) {
  const basis = externalId.trim()
    ? `external-id:${externalId.trim()}`
    : [occurredAt, amount.toFixed(2), description.trim(), currency, occurrence].join('|')

  return createHash('sha256').update(basis).digest('hex')
}

function importError(message: string): never {
  redirect(`/dashboard/transactions/import?error=${encodeURIComponent(message)}`)
}

export async function importRevolutCsv(formData: FormData) {
  const file = formData.get('file')
  const accountId = formData.get('accountId')

  if (!(file instanceof File) || file.size === 0 || file.size > 2.5 * 1024 * 1024) {
    importError('Escolhe um ficheiro CSV válido (máximo 2,5 MB).')
  }

  if (typeof accountId !== 'string' || !accountId) {
    importError('Escolhe a conta onde queres importar os movimentos.')
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
    importError('A conta escolhida não existe ou está arquivada neste espaço financeiro.')
  }

  const content = await file.text()
  if (content.includes('\u0000')) {
    importError('O ficheiro não parece ser um CSV válido.')
  }

  let rows: string[][]
  try {
    const cleanContent = content.replace(/^\uFEFF/, '')
    rows = parseCsv(cleanContent, detectCsvDelimiter(cleanContent))
  } catch {
    importError('O CSV não é válido. Verifica as aspas e o separador do ficheiro.')
  }

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
    context_id: string
    account_id: string
    transaction_type: 'income' | 'expense'
    amount: number
    description: string
    occurred_at: string
    import_source: string
    import_reference: string
  }> = []

  const seen = new Set<string>()
  const fallbackOccurrences = new Map<string, number>()
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
        : (account.currency_code || financialContext.currency_code || 'EUR').toUpperCase()

    const accountCurrency = (
      account.currency_code ||
      financialContext.currency_code ||
      'EUR'
    ).toUpperCase()

    if (currency && currency !== accountCurrency) {
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
    const fallbackKey = [
      occurredAt,
      amount.toFixed(2),
      description,
      currency || accountCurrency,
    ].join('|')
    const occurrence = externalId.trim()
      ? 1
      : (fallbackOccurrences.get(fallbackKey) ?? 0) + 1

    if (!externalId.trim()) {
      fallbackOccurrences.set(fallbackKey, occurrence)
    }

    const reference = makeReference(
      externalId,
      occurredAt,
      amount,
      description,
      currency || accountCurrency,
      occurrence,
    )

    if (seen.has(reference)) {
      skipped += 1
      continue
    }
    seen.add(reference)

    candidates.push({
      user_id: user.id,
      context_id: financialContext.id,
      account_id: account.id,
      transaction_type: amount < 0 ? 'expense' : 'income',
      amount: Math.abs(amount),
      description: description || 'Movimento importado',
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
      .eq('context_id', financialContext.id)
      .eq('import_source', 'revolut_csv')
      .in('import_reference', batch)

    if (error) {
      importError('Não foi possível verificar importações anteriores.')
    }
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
        onConflict: 'user_id,context_id,import_source,import_reference',
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

  const ignoredCount = skipped + existing.size + newRows.length - importedCount
  const message = `${importedCount} movimentos importados para ${financialContext.name}; ${ignoredCount} ignorados.`
  redirect(`/dashboard/transactions?toast=${encodeURIComponent(message)}`)
}
