import Link from 'next/link'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  ChevronRight,
  CircleDollarSign,
  LogOut,
  Plus,
  Target,
  Wallet,
} from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatShortDate } from '@/lib/format'
import { MonthlyOverview } from '@/components/dashboard/monthly-overview'
import { signOut } from './actions'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: accounts },
    { data: transactions },
    { data: goals },
  ] = await Promise.all([
    supabase.from('profiles').select('display_name, currency_code, onboarding_completed_at').eq('id', user.id).maybeSingle(),
    supabase.from('accounts').select('id, name, account_type, balance, currency_code').eq('user_id', user.id).eq('is_active', true).order('created_at', { ascending: true }),
    supabase.from('transactions').select('id, transaction_type, amount, description, occurred_at, accounts(name, currency_code)').eq('user_id', user.id).order('occurred_at', { ascending: false }).limit(5),
    supabase.from('goals').select('id, name, target_amount, current_amount, target_date, priority').eq('user_id', user.id).order('priority', { ascending: true }).order('created_at', { ascending: false }).limit(3),
  ])

  if (!profile?.onboarding_completed_at) redirect('/onboarding')
  const currency = profile.currency_code ?? 'EUR'
  const totalBalance = (accounts ?? []).reduce((sum, account) => sum + Number(account.balance), 0)
  const firstName = profile.display_name?.trim()?.split(/\s+/)[0] ?? 'aí'

  return (
    <main className="min-h-screen pb-24">
      <div className="moneyflow-shell py-6 sm:py-8 lg:py-10">
        <header className="flex items-start justify-between gap-4">
          <div><p className="text-sm text-[hsl(var(--muted-foreground))]">Olá, {firstName}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">O teu dinheiro</h1></div>
          <form action={signOut}><Button type="submit" variant="ghost" size="icon" aria-label="Terminar sessão"><LogOut className="size-4" /></Button></form>
        </header>

        <section className="mt-8 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div><p className="text-sm text-[hsl(var(--muted-foreground))]">Saldo total</p><p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl lg:text-6xl">{formatCurrency(totalBalance, currency)}</p><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Saldo atual das contas ativas. Os compromissos recorrentes aparecem separadamente.</p></div>
            <div className="flex flex-wrap gap-2"><Button asChild><Link href="/dashboard/transactions/new"><Plus className="size-4" />Adicionar movimento</Link></Button><Button asChild variant="outline"><Link href="#accounts">Ver contas<ArrowUpRight className="size-4" /></Link></Button></div>
          </div>
        </section>

        <MonthlyOverview currency={currency} />

        <section id="accounts" className="mt-8 lg:mt-10">
          <div className="flex items-center justify-between gap-4"><div><p className="text-sm text-[hsl(var(--muted-foreground))]">Onde está o teu dinheiro</p><h2 className="mt-1 text-lg font-semibold">Contas</h2></div><Button variant="ghost" size="sm" asChild><Link href="/dashboard/accounts">Gerir</Link></Button></div>
          {accounts?.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{accounts.map((account) => <article key={account.id} className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))]"><Wallet className="size-4" /></span><div className="min-w-0"><p className="truncate font-medium">{account.name}</p><p className="text-xs capitalize text-[hsl(var(--muted-foreground))]">{account.account_type}</p></div></div><p className="shrink-0 font-semibold tabular-nums">{formatCurrency(Number(account.balance), account.currency_code || currency)}</p></div></article>)}</div> : <div className="mt-4 rounded-[var(--radius-lg)] border border-dashed bg-[hsl(var(--surface))] p-6 text-center"><p className="font-medium">Ainda não tens contas</p><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Cria a tua primeira conta para começarmos a acompanhar o saldo.</p><Button className="mt-4" asChild><Link href="/dashboard/accounts/new">Criar conta</Link></Button></div>}
        </section>

        <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.9fr)]">
          <section><div className="flex items-end justify-between gap-4"><div><p className="text-sm text-[hsl(var(--muted-foreground))]">O que aconteceu</p><h2 className="mt-1 text-lg font-semibold">Movimentos recentes</h2></div><Button variant="ghost" size="sm" asChild><Link href="/dashboard/transactions">Ver todos<ChevronRight className="size-4" /></Link></Button></div>
            {!transactions?.length ? <div className="mt-4 rounded-[var(--radius-lg)] border border-dashed bg-[hsl(var(--surface))] p-6 text-center"><p className="font-medium">Ainda não há movimentos</p><p className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Regista uma despesa ou receita para começares a ver atividade aqui.</p></div> : <div className="mt-4 overflow-hidden rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] shadow-sm"><div className="divide-y">{transactions.map((transaction) => { const isIncome = transaction.transaction_type === 'income'; const account = Array.isArray(transaction.accounts) ? transaction.accounts[0] : transaction.accounts; return <div key={transaction.id} className="flex items-center gap-3 p-4 sm:p-5"><span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--surface-muted))]">{isIncome ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{transaction.description || (isIncome ? 'Receita' : 'Despesa')}</p><p className="mt-0.5 truncate text-xs text-[hsl(var(--muted-foreground))]">{account?.name ?? 'Conta'} · {formatShortDate(transaction.occurred_at)}</p></div><p className={`shrink-0 text-sm font-semibold tabular-nums ${isIncome ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>{isIncome ? '+' : '-'}{formatCurrency(Number(transaction.amount), account?.currency_code || currency)}</p></div> })}</div></div>}
          </section>

          <section><div className="flex items-end justify-between gap-4"><div><p className="text-sm text-[hsl(var(--muted-foreground))]">Para onde estás a ir</p><h2 className="mt-1 text-lg font-semibold">Objetivos</h2></div><Button variant="ghost" size="sm" asChild><Link href="/dashboard/goals">Ver todos<ChevronRight className="size-4" /></Link></Button></div>
            {!goals?.length ? <div className="mt-4 rounded-[var(--radius-lg)] border border-dashed bg-[hsl(var(--surface))] p-6 text-center"><Target className="mx-auto size-5" /><p className="mt-3 font-medium">Ainda sem objetivos</p><p className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Cria uma meta para dar propósito ao dinheiro que estás a guardar.</p><Button asChild className="mt-4"><Link href="/dashboard/goals/new">Criar objetivo</Link></Button></div> : <div className="mt-4 space-y-3">{goals.map((goal) => { const current = Number(goal.current_amount); const target = Number(goal.target_amount); const progress = Math.min(100, Math.round((current / target) * 100)); return <Link key={goal.id} href={`/dashboard/goals/${goal.id}`} className="block rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 transition hover:-translate-y-0.5 hover:shadow-sm"><div className="flex items-center justify-between gap-3"><p className="truncate font-medium">{goal.name}</p><span className="shrink-0 text-sm font-semibold tabular-nums">{progress}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[hsl(var(--surface-muted))]"><div className="h-full rounded-full bg-[hsl(var(--primary))] transition-[width]" style={{ width: `${progress}%` }} /></div><div className="mt-2 flex items-center justify-between text-xs"><span className="tabular-nums">{formatCurrency(current, currency)}</span><span className="text-[hsl(var(--muted-foreground))]">{formatCurrency(target, currency)}</span></div></Link> })}</div>}
          </section>
        </div>

        <section id="add" className="mt-8 grid gap-3 sm:grid-cols-2 lg:mt-10 lg:grid-cols-5">
          {[
            ['Despesa','Regista dinheiro que saiu.','/dashboard/transactions/new',Plus],
            ['Receita','Regista dinheiro que entrou.','/dashboard/transactions/new',ArrowDownLeft],
            ['Objetivo','Começa a dar um propósito ao teu dinheiro.','/dashboard/goals/new',Target],
            ['Orçamento','Define limites mensais por categoria.','/dashboard/budgets',CircleDollarSign],
            ['Recorrente','Simula domínios, software e subscrições.','/dashboard/recurring',CalendarClock],
          ].map(([title,description,href,Icon]) => <Link key={title as string} href={href as string} className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 transition hover:-translate-y-0.5 hover:shadow-sm sm:p-5"><span className="inline-flex size-9 items-center justify-center rounded-full bg-[hsl(var(--surface-muted))]"><Icon className="size-4" /></span><p className="mt-3 font-medium">{title as string}</p><p className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{description as string}</p></Link>)}
        </section>
      </div>
    </main>
  )
}
