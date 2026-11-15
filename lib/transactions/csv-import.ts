import { createHash } from 'node:crypto'

export type CsvColumnKey =
  | 'date'
  | 'description'
  | 'amount'
  | 'currency'
  | 'status'
  | 'id'

export type CsvColumnMapping = Record<CsvColumnKey, number>

export type CsvImportCandidate = {
  transaction_type: 'income' | 'expense'
  amount: number
  description: string
  occurred_at: string
  currency_code: string
  import_source: 'revolut_csv'
  import_reference: string
}

export type CsvImportPreviewResult =
  | { ok: false; error: string }
  | {
      ok: true
      needsMapping: true
      headers: string[]
      mapping: CsvColumnMapping
    }
  | {
      ok: true
      needsMapping: false
      headers: string[]
      mapping: CsvColumnMapping
      summary: {
        totalRows: number
        ready: number
        alreadyImported: number
        duplicateInFile: number
        pendingOrUnsettled: number
        invalid: number
        currencyMismatch: number
      }
      sample: Array<{
        transaction_type: 'income' | 'expense'
        amount: number
        description: string
        occurred_at: string
        currency_code: string
      }>
    }

export type CsvImportAnalysis = {
  headers: string[]
  mapping: CsvColumnMapping
  needsMapping: boolean
  totalRows: number
  candidates: CsvImportCandidate[]
  duplicateInFile: number
  pendingOrUnsettled: number
  invalid: number
  currencyMismatch: number
}

export class CsvImportParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CsvImportParseError'
  }
}

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

  if (quoted) {
    throw new CsvImportParseError(
      'O CSV contém uma célula entre aspas que não foi fechada.',
    )
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

function resolveColumn(
  headers: string[],
  key: CsvColumnKey,
  aliases: string[],
  overrides?: Partial<CsvColumnMapping>,
): number {
  const override = overrides?.[key]
  if (typeof override === 'number') {
    return Number.isInteger(override) && override >= 0 && override < headers.length
      ? override
      : -1
  }

  return findColumn(headers, aliases)
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
    [
      'booked',
      'completed',
      'complete',
      'confirmed',
      'concluido',
      'concluida',
      'done',
      'finalizado',
      'finalizada',
      'posted',
      'settled',
      'succeeded',
      'success',
    ].includes(status)
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
    : [
        occurredAt,
        amount.toFixed(2),
        description.trim(),
        currency,
        occurrence,
      ].join('|')

  return createHash('sha256').update(basis).digest('hex')
}

export function analyzeCsvImport(
  content: string,
  accountCurrency: string,
  overrides?: Partial<CsvColumnMapping>,
): CsvImportAnalysis {
  if (content.includes('\u0000')) {
    throw new CsvImportParseError('O ficheiro não parece ser um CSV válido.')
  }

  const cleanContent = content.replace(/^\uFEFF/, '')
  const rows = parseCsv(cleanContent, detectCsvDelimiter(cleanContent))

  if (rows.length < 2) {
    throw new CsvImportParseError(
      'O CSV não contém movimentos para analisar.',
    )
  }
  if (rows.length > 2001) {
    throw new CsvImportParseError(
      'O ficheiro contém demasiadas linhas. Importa até 2.000 movimentos de cada vez.',
    )
  }

  const headers = rows[0].map(normalizeHeader)
  const mapping: CsvColumnMapping = {
    date: resolveColumn(headers, 'date', [
      'completed date',
      'started date',
      'date',
      'data',
      'data de conclusao',
    ], overrides),
    description: resolveColumn(headers, 'description', [
      'description',
      'merchant',
      'counterparty',
      'descricao',
      'detalhes',
    ], overrides),
    amount: resolveColumn(headers, 'amount', [
      'amount',
      'valor',
      'montante',
      'amount eur',
      'montante eur',
    ], overrides),
    currency: resolveColumn(headers, 'currency', ['currency', 'moeda'], overrides),
    status: resolveColumn(headers, 'status', ['state', 'status', 'estado'], overrides),
    id: resolveColumn(headers, 'id', [
      'id',
      'transaction id',
      'transaction reference',
      'referencia',
    ], overrides),
  }

  const needsMapping =
    mapping.date < 0 || mapping.description < 0 || mapping.amount < 0

  const analysis: CsvImportAnalysis = {
    headers: rows[0],
    mapping,
    needsMapping,
    totalRows: rows.length - 1,
    candidates: [],
    duplicateInFile: 0,
    pendingOrUnsettled: 0,
    invalid: 0,
    currencyMismatch: 0,
  }

  if (needsMapping) return analysis

  const normalizedAccountCurrency = accountCurrency.toUpperCase()
  const seen = new Set<string>()
  const fallbackOccurrences = new Map<string, number>()

  for (const row of rows.slice(1)) {
    const rawStatus =
      mapping.status >= 0 ? (row[mapping.status] ?? '') : ''
    if (!isCompletedStatus(rawStatus)) {
      analysis.pendingOrUnsettled += 1
      continue
    }

    const rawCurrency =
      mapping.currency >= 0
        ? (row[mapping.currency] ?? '').trim().toUpperCase()
        : normalizedAccountCurrency
    const currency = rawCurrency || normalizedAccountCurrency

    if (currency !== normalizedAccountCurrency) {
      analysis.currencyMismatch += 1
      continue
    }

    const amount = parseAmount(row[mapping.amount] ?? '')
    const occurredAt = parseDate(row[mapping.date] ?? '')
    const description = (row[mapping.description] ?? '').trim().slice(0, 120)

    if (!amount || !occurredAt) {
      analysis.invalid += 1
      continue
    }

    const externalId = mapping.id >= 0 ? (row[mapping.id] ?? '') : ''
    const fallbackKey = [
      occurredAt,
      amount.toFixed(2),
      description,
      currency,
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
      currency,
      occurrence,
    )

    if (seen.has(reference)) {
      analysis.duplicateInFile += 1
      continue
    }
    seen.add(reference)

    analysis.candidates.push({
      transaction_type: amount < 0 ? 'expense' : 'income',
      amount: Math.abs(amount),
      description: description || 'Movimento importado',
      occurred_at: occurredAt,
      currency_code: currency,
      import_source: 'revolut_csv',
      import_reference: reference,
    })
  }

  return analysis
}
