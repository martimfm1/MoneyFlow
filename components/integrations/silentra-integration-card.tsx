'use client'

import { useState, useTransition } from 'react'
import { Check, Copy, Link2, RefreshCw, Unplug, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/button'

type AccountOption = {
  id: string
  name: string
  currency_code: string
}

type Connection = {
  account_id: string
  account_name: string
  currency_code: string
  connected_at: string
  last_synced_at: string | null
} | null

type Props = {
  accounts: AccountOption[]
  initialConnection: Connection
  locale: 'pt-PT' | 'en'
  isSilentraContext: boolean
}

function formatDate(value: string | null, isEnglish: boolean) {
  if (!value) return isEnglish ? 'Not yet' : 'Ainda não'
  return new Intl.DateTimeFormat(isEnglish ? 'en-GB' : 'pt-PT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function SilentraIntegrationCard({
  accounts,
  initialConnection,
  locale,
  isSilentraContext,
}: Props) {
  const isEnglish = locale === 'en'
  const [connection, setConnection] = useState(initialConnection)
  const [accountId, setAccountId] = useState(
    initialConnection?.account_id ?? accounts[0]?.id ?? '',
  )
  const [pairingToken, setPairingToken] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function generatePairingCode() {
    setError(null)
    setMessage(null)
    setPairingToken(null)
    startTransition(async () => {
      try {
        const response = await fetch(
          '/api/integrations/silentra/pairing',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accountId }),
            cache: 'no-store',
          },
        )
        const payload = await response.json()
        if (!response.ok || payload.ok !== true) {
          throw new Error(
            payload.error ||
              (isEnglish
                ? 'Could not create the pairing code.'
                : 'Não foi possível gerar o código de ligação.'),
          )
        }
        setPairingToken(payload.pairingToken)
        setExpiresAt(payload.expiresAt)
        setMessage(
          isEnglish
            ? 'Pairing code created. It can only be used once.'
            : 'Código gerado. Só pode ser utilizado uma vez.',
        )
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : 'Unexpected error.',
        )
      }
    })
  }

  async function copyCode() {
    if (!pairingToken) return
    try {
      await navigator.clipboard.writeText(pairingToken)
      setCopied(true)
    } catch {
      setError(
        isEnglish
          ? 'Could not copy the code. Select it and copy manually.'
          : 'Não foi possível copiar. Seleciona o código e copia manualmente.',
      )
    }
  }

  async function disconnect() {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      try {
        const response = await fetch(
          '/api/integrations/silentra/pairing',
          { method: 'DELETE', cache: 'no-store' },
        )
        const payload = await response.json()
        if (!response.ok || payload.ok !== true) {
          throw new Error(
            payload.error ||
              (isEnglish
                ? 'Could not disconnect the integration.'
                : 'Não foi possível desligar a integração.'),
          )
        }
        setConnection(null)
        setPairingToken(null)
        setExpiresAt(null)
        setMessage(
          isEnglish
            ? 'Silentra for Barbers has been disconnected.'
            : 'A ligação ao Silentra for Barbers foi desligada.',
        )
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : 'Unexpected error.',
        )
      }
    })
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border/80 bg-card/75 shadow-sm">
      <div className="border-b border-border/70 p-5 sm:p-6">
        <span className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <WalletCards className="size-[18px]" aria-hidden="true" />
        </span>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold tracking-tight">
            Silentra for Barbers
          </h2>
          <span
            className={
              connection
                ? 'rounded-full border border-[hsl(var(--success)/0.25)] bg-[hsl(var(--success)/0.08)] px-2.5 py-1 text-[10px] font-semibold text-[hsl(var(--success))]'
                : 'rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-muted-foreground'
            }
          >
            {connection
              ? isEnglish
                ? 'Connected'
                : 'Ligado'
              : isEnglish
                ? 'Not connected'
                : 'Não ligado'}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {isEnglish
            ? 'Automatically records confirmed Silentra platform subscription payments as income in your Silentra finance space. Barbershop bookings and POS sales are excluded.'
            : 'Regista automaticamente como entrada os pagamentos confirmados das subscrições da plataforma Silentra, no espaço financeiro Silentra. As marcações e vendas POS das barbearias ficam de fora.'}
        </p>
      </div>

      <div className="grid gap-4 p-5 sm:p-6">
        {connection ? (
          <>
            <div className="rounded-xl border border-border/70 bg-muted/35 p-4">
              <p className="text-sm font-semibold">{connection.account_name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {isEnglish ? 'Linked account' : 'Conta associada'} · {connection.currency_code}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {isEnglish ? 'Connected' : 'Ligado em'}
                  </p>
                  <p className="mt-1 text-xs font-medium">
                    {formatDate(connection.connected_at, isEnglish)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {isEnglish ? 'Last payment received' : 'Último pagamento recebido'}
                  </p>
                  <p className="mt-1 text-xs font-medium">
                    {formatDate(connection.last_synced_at, isEnglish)}
                  </p>
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={disconnect}
              disabled={isPending}
            >
              <Unplug className="size-4" aria-hidden="true" />
              {isPending
                ? isEnglish
                  ? 'Disconnecting…'
                  : 'A desligar…'
                : isEnglish
                  ? 'Disconnect'
                  : 'Desligar integração'}
            </Button>
          </>
        ) : (
          <>
            {!isSilentraContext ? (
              <p className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4 text-sm text-muted-foreground">
                {isEnglish
                  ? 'Switch the financial context to Silentra using the selector at the top before pairing the app.'
                  : 'Muda para o contexto financeiro Silentra no seletor do topo antes de ligares a aplicação.'}
              </p>
            ) : null}
            {accounts.length ? (
              <label className="grid gap-2 text-sm font-medium">
                {isEnglish ? 'Income account' : 'Conta onde entram as receitas'}
                <select
                  value={accountId}
                  onChange={(event) => setAccountId(event.target.value)}
                  className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm"
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} · {account.currency_code}
                    </option>
                  ))}
                </select>
                <span className="text-xs font-normal text-muted-foreground">
                  {isEnglish
                    ? 'Only active EUR accounts from the Silentra finance space are available.'
                    : 'Só aparecem contas ativas em EUR do espaço financeiro Silentra.'}
                </span>
              </label>
            ) : (
              <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                {isEnglish
                  ? 'Create an active EUR account in the Silentra finance space first.'
                  : 'Cria primeiro uma conta ativa em EUR no espaço financeiro Silentra.'}
              </p>
            )}

            <Button
              type="button"
              onClick={generatePairingCode}
              disabled={!accountId || isPending || !isSilentraContext}
            >
              {isPending ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <Link2 className="size-4" />
              )}
              {isPending
                ? isEnglish
                  ? 'Generating…'
                  : 'A gerar…'
                : isEnglish
                  ? 'Generate one-time pairing code'
                  : 'Gerar código de ligação'}
            </Button>

            {pairingToken ? (
              <div className="grid gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
                <div>
                  <p className="text-sm font-semibold">
                    {isEnglish ? 'One-time pairing code' : 'Código de ligação único'}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {isEnglish
                      ? 'Copy this code and paste it into the MoneyFlow panel in Silentra for Barbers. It expires in 15 minutes.'
                      : 'Copia este código e cola-o no painel MoneyFlow do Silentra for Barbers. Expira em 15 minutos.'}
                  </p>
                </div>
                <code className="block break-all rounded-lg border border-border bg-background px-3 py-3 text-xs leading-5">
                  {pairingToken}
                </code>
                <Button type="button" variant="outline" onClick={copyCode}>
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  {copied
                    ? isEnglish
                      ? 'Copied'
                      : 'Copiado'
                    : isEnglish
                      ? 'Copy code'
                      : 'Copiar código'}
                </Button>
                {expiresAt ? (
                  <p className="text-[11px] text-muted-foreground">
                    {isEnglish ? 'Expires at' : 'Expira em'}{' '}
                    {formatDate(expiresAt, isEnglish)}
                  </p>
                ) : null}
                <a
                  href="https://barbers.silentra.me/silentra-admin?tab=moneyflow"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-background px-3 text-xs font-semibold transition-colors hover:bg-muted"
                >
                  {isEnglish
                    ? 'Open Silentra for Barbers'
                    : 'Abrir Silentra for Barbers'}
                </a>
              </div>
            ) : null}
          </>
        )}

        {message ? (
          <p
            role="status"
            className="rounded-xl border border-[hsl(var(--success)/0.25)] bg-[hsl(var(--success)/0.08)] px-3 py-2.5 text-xs text-[hsl(var(--success))]"
          >
            {message}
          </p>
        ) : null}
        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-xs text-destructive"
          >
            {error}
          </p>
        ) : null}
      </div>
    </section>
  )
}
