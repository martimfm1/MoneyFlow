import { redirect } from 'next/navigation'
import { completeOnboarding } from './actions'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, currency_code, onboarding_completed_at')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.onboarding_completed_at) redirect('/dashboard')

  return (
    <main className="moneyflow-shell flex min-h-screen items-center py-10">
      <section className="mx-auto w-full max-w-lg">
        <p className="text-sm font-semibold tracking-tight">MoneyFlow</p>
        <div className="mt-8 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">
            <span className="rounded-full bg-[hsl(var(--primary))] px-2.5 py-1 text-[hsl(var(--primary-foreground))]">
              1 de 1
            </span>
            Configuração inicial
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">
            Vamos preparar o teu MoneyFlow
          </h1>
          <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            Em menos de um minuto definimos o essencial para o dashboard começar
            a fazer sentido.
          </p>

          {params.error ? (
            <p className="mt-5 rounded-[var(--radius-md)] bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-sm">
              {params.error}
            </p>
          ) : null}

          <form action={completeOnboarding} className="mt-7 space-y-4">
            <label className="block space-y-2 text-sm font-medium">
              <span>
                Como te devemos chamar?{' '}
                <span className="font-normal text-[hsl(var(--muted-foreground))]">
                  (opcional)
                </span>
              </span>
              <input
                name="displayName"
                defaultValue={profile?.display_name ?? ''}
                maxLength={80}
                placeholder="Martim"
                className="min-h-11 w-full rounded-[var(--radius-md)] border bg-transparent px-3 outline-none"
                autoComplete="name"
              />
            </label>

            <label className="block space-y-2 text-sm font-medium">
              <span>Moeda principal</span>
              <select
                name="currencyCode"
                defaultValue={profile?.currency_code ?? 'EUR'}
                className="min-h-11 w-full rounded-[var(--radius-md)] border bg-[hsl(var(--surface))] px-3 outline-none"
              >
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dólar americano ($)</option>
                <option value="GBP">Libra (£)</option>
              </select>
            </label>

            <label className="block space-y-2 text-sm font-medium">
              <span>Primeira conta</span>
              <input
                name="accountName"
                defaultValue="Conta principal"
                required
                maxLength={80}
                placeholder="Conta principal"
                className="min-h-11 w-full rounded-[var(--radius-md)] border bg-transparent px-3 outline-none"
              />
            </label>

            <label className="block space-y-2 text-sm font-medium">
              <span>Tipo de conta</span>
              <select
                name="accountType"
                defaultValue="bank"
                className="min-h-11 w-full rounded-[var(--radius-md)] border bg-[hsl(var(--surface))] px-3 outline-none"
              >
                <option value="bank">Banco</option>
                <option value="cash">Dinheiro</option>
                <option value="card">Cartão</option>
                <option value="savings">Poupança</option>
                <option value="other">Outro</option>
              </select>
            </label>

            <label className="block space-y-2 text-sm font-medium">
              <span>Saldo atual</span>
              <input
                name="balance"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                required
                placeholder="0,00"
                className="min-h-12 w-full rounded-[var(--radius-md)] border bg-transparent px-3 text-xl outline-none"
              />
            </label>

            <Button type="submit" className="mt-2 w-full">
              Começar a usar o MoneyFlow
            </Button>
          </form>
        </div>
      </section>
    </main>
  )
}
