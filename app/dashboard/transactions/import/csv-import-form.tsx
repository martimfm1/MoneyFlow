'use client'

import { useRef, useState, useTransition } from 'react'
import { FileSpreadsheet, ShieldCheck } from 'lucide-react'
import { previewCsvImport, importRevolutCsv } from './actions'
import type {
  CsvColumnKey,
  CsvColumnMapping,
  CsvImportPreviewResult,
} from '@/lib/transactions/csv-import'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ImportAccount = {
  id: string
  name: string
  currency_code: string | null
}

type Props = {
  accounts: ImportAccount[]
  contextName: string
  error?: string
}

const MAPPING_FIELDS: Array<{
  key: CsvColumnKey
  label: string
  required: boolean
}> = [
  { key: 'date', label: 'Data do movimento', required: true },
  { key: 'description', label: 'Descrição', required: true },
  { key: 'amount', label: 'Valor (com sinal)', required: true },
  { key: 'currency', label: 'Moeda', required: false },
  { key: 'status', label: 'Estado', required: false },
  { key: 'id', label: 'Referência / ID', required: false },
]

function formatAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-PT').format(date)
}

export function CsvImportForm({ accounts, contextName, error }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [preview, setPreview] = useState<CsvImportPreviewResult | null>(null)
  const [mapping, setMapping] = useState<CsvColumnMapping | null>(null)
  const [isAnalyzing, startAnalysis] = useTransition()

  function analyzeFile() {
    if (!formRef.current) return

    const formData = new FormData(formRef.current)
    startAnalysis(async () => {
      const result = await previewCsvImport(formData)
      setPreview(result)
      if (result.ok) setMapping(result.mapping)
      else setMapping(null)
    })
  }

  function handleFileChange() {
    setPreview(null)
    setMapping(null)

    const accountId = formRef.current?.elements.namedItem(
      'accountId',
    ) as HTMLSelectElement | null
    if (accountId?.value) analyzeFile()
  }

  function handleAccountChange() {
    setPreview(null)
    const fileInput = formRef.current?.elements.namedItem(
      'file',
    ) as HTMLInputElement | null
    if (fileInput?.files?.length) analyzeFile()
  }

  function handleMappingChange(key: CsvColumnKey, value: string) {
    const index = Number(value)
    setMapping((current) =>
      current
        ? { ...current, [key]: Number.isInteger(index) ? index : -1 }
        : current,
    )
    setPreview(null)
  }

  const successfulPreview =
    preview?.ok === true && preview.needsMapping === false ? preview : null

  return (
    <Card className="mt-6 max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSpreadsheet className="size-4" aria-hidden="true" />
          Carregar extrato · {contextName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={importRevolutCsv}
          onSubmit={(event) => {
            if (!successfulPreview || successfulPreview.summary.ready === 0) {
              event.preventDefault()
            }
          }}
          className="grid gap-4"
        >
          <label className="grid gap-2 text-sm font-medium">
            Conta de destino
            <select
              name="accountId"
              required
              defaultValue=""
              onChange={handleAccountChange}
              className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3"
            >
              <option value="" disabled>
                Escolhe uma conta
              </option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} · {account.currency_code ?? '—'}
                </option>
              ))}
            </select>
            {!accounts.length ? (
              <span className="text-xs font-normal text-[hsl(var(--muted-foreground))]">
                Ainda não tens contas ativas neste espaço. Cria primeiro uma
                conta para poderes importar movimentos.
              </span>
            ) : null}
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Ficheiro CSV
            <input
              type="file"
              name="file"
              accept=".csv,text/csv"
              required
              onChange={handleFileChange}
              className="min-h-11 w-full rounded-[var(--radius-md)] border bg-transparent px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[hsl(var(--surface-muted))] file:px-3 file:py-1.5 file:text-sm file:font-medium"
            />
            <span className="text-xs font-normal leading-5 text-[hsl(var(--muted-foreground))]">
              Até 2,5 MB e 2.000 movimentos por importação. São ignorados
              movimentos pendentes, inválidos, de outras moedas e já importados.
            </span>
          </label>

          {successfulPreview && mapping
            ? MAPPING_FIELDS.map((field) => (
                <input
                  key={field.key}
                  type="hidden"
                  name={`${field.key}Column`}
                  value={String(mapping[field.key])}
                />
              ))
            : null}

          {preview?.ok && preview.needsMapping ? (
            <section className="grid gap-3 rounded-[var(--radius-md)] border p-3">
              <div>
                <h3 className="text-sm font-semibold">
                  Identifica as colunas do ficheiro
                </h3>
                <p className="mt-1 text-xs leading-5 text-[hsl(var(--muted-foreground))]">
                  Não foi possível reconhecer todas as colunas automaticamente.
                  Escolhe onde estão a data, a descrição e o valor.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {MAPPING_FIELDS.map((field) => (
                  <label key={field.key} className="grid gap-1.5 text-sm">
                    <span className="font-medium">
                      {field.label}
                      {field.required ? ' *' : ''}
                    </span>
                    <select
                      name={`${field.key}Column`}
                      value={String(mapping?.[field.key] ?? -1)}
                      onChange={(event) =>
                        handleMappingChange(field.key, event.target.value)
                      }
                      className="min-h-10 rounded-[var(--radius-md)] border bg-transparent px-2 text-sm"
                      required={field.required}
                    >
                      <option value="-1">Não importar esta coluna</option>
                      {preview.headers.map((header, index) => (
                        <option key={index} value={String(index)}>
                          {header.trim() || `Coluna ${index + 1}`}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={analyzeFile}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? 'A analisar…' : 'Analisar colunas'}
              </Button>
            </section>
          ) : null}

          {successfulPreview ? (
            <section
              className="grid gap-3 rounded-[var(--radius-md)] border p-3"
              aria-live="polite"
            >
              <div>
                <h3 className="text-sm font-semibold">Pré-visualização</h3>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  Confirma os movimentos antes de os adicionar à conta.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div className="rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))] p-3">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Prontos a importar
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {successfulPreview.summary.ready}
                  </p>
                </div>
                <div className="rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))] p-3">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Já importados
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {successfulPreview.summary.alreadyImported}
                  </p>
                </div>
                <div className="rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))] p-3">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Duplicados no ficheiro
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {successfulPreview.summary.duplicateInFile}
                  </p>
                </div>
                <div className="rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))] p-3">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Pendentes / não concluídos
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {successfulPreview.summary.pendingOrUnsettled}
                  </p>
                </div>
                <div className="rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))] p-3">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Linhas inválidas
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {successfulPreview.summary.invalid}
                  </p>
                </div>
                <div className="rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))] p-3">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Moeda diferente
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {successfulPreview.summary.currencyMismatch}
                  </p>
                </div>
              </div>

              {successfulPreview.sample.length ? (
                <div className="grid gap-2">
                  <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    Primeiros movimentos que serão importados
                  </p>
                  <ul className="divide-y rounded-[var(--radius-md)] border">
                    {successfulPreview.sample.map((item, index) => (
                      <li
                        key={`${item.occurred_at}-${index}`}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {item.description}
                          </p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            {formatDate(item.occurred_at)}
                          </p>
                        </div>
                        <span
                          className={
                            item.amount < 0
                              ? 'shrink-0 font-medium tabular-nums'
                              : 'shrink-0 font-medium tabular-nums text-[hsl(var(--success))]'
                          }
                        >
                          {formatAmount(item.amount, item.currency_code)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {successfulPreview.summary.ready >
                  successfulPreview.sample.length ? (
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      A mostrar {successfulPreview.sample.length} de{' '}
                      {successfulPreview.summary.ready} movimentos.
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))] p-3 text-sm text-[hsl(var(--muted-foreground))]">
                  Não existem movimentos novos para importar neste ficheiro.
                </p>
              )}
            </section>
          ) : null}

          {preview && !preview.ok ? (
            <p
              role="alert"
              className="rounded-[var(--radius-md)] border border-[hsl(var(--danger)/0.25)] bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-sm"
            >
              {preview.error}
            </p>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="rounded-[var(--radius-md)] border border-[hsl(var(--danger)/0.25)] bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-sm"
            >
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              onClick={analyzeFile}
              disabled={!accounts.length || isAnalyzing}
            >
              {isAnalyzing ? 'A analisar…' : 'Pré-visualizar movimentos'}
            </Button>
            <Button
              type="submit"
              disabled={
                !successfulPreview ||
                successfulPreview.summary.ready === 0 ||
                isAnalyzing
              }
            >
              Importar {successfulPreview?.summary.ready ?? 0} movimentos
            </Button>
          </div>

          <div className="flex items-start gap-2 rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))] p-3 text-xs leading-5 text-[hsl(var(--muted-foreground))]">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <p>
              O ficheiro é analisado antes de gravar. A importação volta a
              validar os dados no servidor e não guarda o ficheiro original nem
              credenciais bancárias.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
