'use client'

import { useState, useTransition } from 'react'
import { Check, Copy, Link2, Unplug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type Account = { id: string; name: string; currency_code: string }
type Props = {
  accounts: Account[]
  connected: boolean
  accountName: string | null
  connectedAt: string | null
  lastSyncedAt: string | null
}

export function SilentraForBarbersPanel({
  accounts,
  connected,
  accountName,
  connectedAt,
  lastSyncedAt,
}: Props) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [pairingToken, setPairingToken] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function createPairing() {
    setMessage(null)
    setPairingToken(null)
    startTransition(async () => {
      try {
        const response = await fetch(
          '/api/integrations/silentra-for-barbers/pairing',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accountId }),
          },
        )
        const result = await response.json()
        if (!response.ok || !result.ok)
          throw new Error(result.error ?? 'Não foi possível gerar o código.')
        setPairingToken(result.pairingToken)
        setExpiresAt(result.expiresAt)
        setMessage(`Código criado para a conta ${result.accountName}.`)
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : 'Ocorreu um erro inesperado.',
        )
      }
    })
  }

  async function disconnect() {
    if (
      !window.confirm(
        'Queres desligar a integração com a Silentra for Barbers?',
      )
    )
      return
    setMessage(null)
    startTransition(async () => {
      try {
        const response = await fetch(
          '/api/integrations/silentra-for-barbers/disconnect',
          { method: 'POST' },
        )
        const result = await response.json()
        if (!response.ok || !result.ok)
          throw new Error(result.error ?? 'Não foi possível desligar.')
        window.location.reload()
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : 'Ocorreu um erro inesperado.',
        )
      }
    })
  }

  async function copyToken() {
    if (!pairingToken) return
    try {
      await navigator.clipboard.writeText(pairingToken)
      setMessage(
        'Código copiado. Cola-o na Silentra for Barbers para concluir a ligação.',
      )
    } catch {
      setMessage(
        'Não foi possível copiar automaticamente. Seleciona e copia o código.',
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Link2 className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <CardTitle>Silentra for Barbers</CardTitle>
            <CardDescription className="mt-1">
              Regista no teu espaço financeiro unificado as receitas
              confirmadas das subscrições da plataforma. Marcações e pagamentos
              dos clientes das barbearias não são importados.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {connected ? (
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Check className="size-4 text-emerald-500" />
              Integração ligada
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Conta de destino:{' '}
              <span className="font-medium text-foreground">
                {accountName ?? 'Conta principal'}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ligada em{' '}
              {connectedAt
                ? new Date(connectedAt).toLocaleString('pt-PT')
                : '—'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Último pagamento recebido:{' '}
              {lastSyncedAt
                ? new Date(lastSyncedAt).toLocaleString('pt-PT')
                : 'Ainda sem pagamentos sincronizados'}
            </p>
            <Button
              className="mt-4"
              type="button"
              variant="outline"
              size="sm"
              onClick={disconnect}
              disabled={isPending}
            >
              <Unplug className="size-4" /> Desligar integração
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label
                htmlFor="silentra-integration-account"
                className="text-sm font-medium"
              >
                Conta de destino (EUR)
              </label>
              <select
                id="silentra-integration-account"
                value={accountId}
                onChange={(event) => setAccountId(event.target.value)}
                disabled={isPending || accounts.length === 0}
                className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              onClick={createPairing}
              disabled={isPending || !accountId || accounts.length === 0}
            >
              <Link2 className="size-4" /> Gerar código de ligação
            </Button>
            {accounts.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Cria primeiro uma conta ativa em EUR na tua dashboard.
              </p>
            ) : null}
            {pairingToken ? (
              <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium">
                  Código de utilização única
                </p>
                <code className="block break-all rounded-lg bg-background p-3 text-xs">
                  {pairingToken}
                </code>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={copyToken}
                  >
                    <Copy className="size-4" /> Copiar código
                  </Button>
                  {expiresAt ? (
                    <span className="text-xs text-muted-foreground">
                      Expira {new Date(expiresAt).toLocaleTimeString('pt-PT')}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  Abre a área de integrações da Silentra for Barbers e introduz
                  este código. Não partilhes o código com terceiros.
                </p>
              </div>
            ) : null}
          </>
        )}
        {message ? (
          <p role="status" className="text-sm text-muted-foreground">
            {message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
