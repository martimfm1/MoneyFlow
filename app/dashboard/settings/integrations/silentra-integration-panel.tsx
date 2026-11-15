'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Copy, Link2, RefreshCw, Unplug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  createSilentraIntegrationAccount,
  createSilentraPairingCode,
  disconnectSilentraPlatform,
} from './actions'

type Account = {
  id: string
  name: string
  currencyCode: string
}

type ConnectedAccount = {
  accountId: string
  accountName: string
  currencyCode: string
  connectedAt: string
}

export function SilentraIntegrationPanel({
  accounts,
  connected,
}: {
  accounts: Account[]
  connected: ConnectedAccount | null
}) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [pairingToken, setPairingToken] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  const selectedAccount = accounts.find((account) => account.id === accountId)

  function createCode() {
    setError(null)
    setPairingToken(null)
    startTransition(async () => {
      const result = await createSilentraPairingCode(accountId)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setPairingToken(result.pairingToken)
      setExpiresAt(result.expiresAt)
    })
  }

  function createAccount() {
    setError(null)
    startTransition(async () => {
      const result = await createSilentraIntegrationAccount()
      if (!result.ok) {
        setError(result.error)
        return
      }
      window.location.reload()
    })
  }

  function disconnect() {
    setError(null)
    startTransition(async () => {
      const result = await disconnectSilentraPlatform()
      if (!result.ok) {
        setError(result.error)
        return
      }
      setPairingToken(null)
      window.location.reload()
    })
  }

  async function copyCode() {
    if (!pairingToken) return
    try {
      await navigator.clipboard.writeText(pairingToken)
      setCopied(true)
    } catch {
      setError('Não foi possível copiar. Seleciona o código manualmente.')
    }
  }

  const formattedConnectedAt = connected?.connectedAt
    ? new Intl.DateTimeFormat('pt-PT', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(connected.connectedAt))
    : null

  return (
    <div className="grid gap-4">
      {connected ? (
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">MoneyFlow ligado</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Conta: {connected.accountName} · {connected.currencyCode}
              </p>
              {formattedConnectedAt ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Ligado em {formattedConnectedAt}
                </p>
              ) : null}
            </div>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={disconnect} disabled={isPending}>
            <Unplug className="size-4" aria-hidden="true" />
            Desligar
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border/80 bg-card p-4">
          <p className="text-sm font-semibold">Ainda não está ligado</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Escolhe a conta em EUR onde queres receber as receitas da plataforma
            e gera um código temporário.
          </p>
        </div>
      )}

      {accounts.length ? (
        <label className="grid gap-2 text-sm font-medium">
          Conta de destino
          <select
            value={accountId}
            onChange={(event) => {
              setAccountId(event.target.value)
              setPairingToken(null)
            }}
            className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          >
            {accounts.map((account) => (
              <option value={account.id} key={account.id}>
                {account.name} · {account.currencyCode}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <div className="grid gap-2 rounded-xl border border-dashed p-4">
          <p className="text-sm font-medium">Ainda não existe uma conta em EUR no espaço Silentra.</p>
          <p className="text-xs leading-5 text-muted-foreground">
            Vamos criar uma conta vazia chamada “Silentra for Barbers”. Os
            pagamentos futuros serão adicionados a essa conta.
          </p>
          <Button type="button" variant="secondary" onClick={createAccount} disabled={isPending}>
            Criar conta da plataforma
          </Button>
        </div>
      )}

      {accounts.length && selectedAccount ? (
        <Button type="button" onClick={createCode} disabled={isPending}>
          {isPending ? (
            <RefreshCw className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Link2 className="size-4" aria-hidden="true" />
          )}
          Gerar código de ligação
        </Button>
      ) : null}

      {pairingToken ? (
        <div className="grid gap-3 rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
          <div>
            <p className="text-sm font-semibold">Código pronto</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              No painel interno da Silentra for Barbers, abre a secção MoneyFlow
              e cola este código. É válido durante 15 minutos e só pode ser usado uma vez.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <code className="min-w-0 flex-1 break-all rounded-lg border bg-background px-3 py-3 text-xs">
              {pairingToken}
            </code>
            <Button type="button" variant="outline" onClick={copyCode}>
              <Copy className="size-4" aria-hidden="true" />
              {copied ? 'Copiado' : 'Copiar código'}
            </Button>
          </div>
          {expiresAt ? (
            <p className="text-xs text-muted-foreground">
              Expira: {new Intl.DateTimeFormat('pt-PT', {
                dateStyle: 'short',
                timeStyle: 'short',
              }).format(new Date(expiresAt))}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Conta selecionada: {selectedAccount?.name}
          </p>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
