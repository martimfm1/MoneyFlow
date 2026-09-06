import Link from 'next/link'
import {
  ArrowRight,
  Check,
  ChartNoAxesCombined,
  CircleDollarSign,
  ListChecks,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react'
import { LinkButton } from '@/components/ui/link-button'

const benefits = [
  {
    icon: ChartNoAxesCombined,
    title: 'Vê o que está a acontecer',
    description: 'Acompanha saldo, entradas, despesas e evolução sem andar perdido em folhas de cálculo.',
  },
  {
    icon: Target,
    title: 'Dá prioridade ao que importa',
    description: 'Define objetivos e acompanha o progresso para transformar intenção em decisões reais.',
  },
  {
    icon: ListChecks,
    title: 'Mantém tudo organizado',
    description: 'Contas, categorias, transações, recorrências e wishlist num único lugar.',
  },
]

const stats = [
  ['Saldo atual', '€4.286,40'],
  ['Este mês', '+€742,20'],
  ['Poupança', '31,4%'],
]

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <div className="moneyflow-shell">
        <nav className="flex items-center justify-between py-5" aria-label="Navegação principal">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-[10px] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
              <CircleDollarSign aria-hidden="true" className="size-4" />
            </span>
            MoneyFlow
          </Link>

          <div className="hidden items-center gap-1 sm:flex">
            <LinkButton href="/login" variant="ghost" className="min-h-10 px-3">
              Entrar
            </LinkButton>
            <LinkButton href="/signup" className="min-h-10 px-4">
              Começar grátis
            </LinkButton>
          </div>

          <LinkButton href="/login" variant="ghost" className="min-h-10 px-2 sm:hidden">
            Entrar
          </LinkButton>
        </nav>

        <section className="relative py-10 sm:py-16 lg:py-20">
          <div className="absolute left-1/2 top-0 -z-10 h-72 w-[32rem] -translate-x-1/2 rounded-full bg-[hsl(var(--info)/0.08)] blur-3xl" />

          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border bg-[hsl(var(--surface)/0.78)] px-3 py-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))] shadow-sm backdrop-blur">
              <Sparkles aria-hidden="true" className="size-3.5" />
              Finanças pessoais sem complicação
            </div>

            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              O teu dinheiro, finalmente{' '}
              <span className="text-[hsl(var(--muted-foreground))]">num só lugar.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-7 text-[hsl(var(--muted-foreground))] sm:text-lg sm:leading-8">
              Regista o que entra e sai, acompanha objetivos e percebe para onde o teu dinheiro está a ir — sem complicar a tua vida.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <LinkButton href="/signup" className="w-full px-6 sm:w-auto">
                Criar conta grátis
                <ArrowRight aria-hidden="true" className="size-4" />
              </LinkButton>
              <LinkButton href="/login" variant="outline" className="w-full sm:w-auto">
                Já tenho conta
              </LinkButton>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[hsl(var(--muted-foreground))]">
              <span className="inline-flex items-center gap-1.5"><Check aria-hidden="true" className="size-3.5" /> Gratuito para começar</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck aria-hidden="true" className="size-3.5" /> Privacidade por utilizador</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-1 rounded-full bg-current" /> Mobile first</span>
            </div>
          </div>

          <div className="mx-auto mt-12 max-w-5xl sm:mt-16">
            <div className="relative overflow-hidden rounded-[1.5rem] border bg-[hsl(var(--surface)/0.92)] p-3 shadow-2xl shadow-black/20 sm:p-4">
              <div className="rounded-[1.1rem] border bg-[hsl(var(--surface-muted)/0.72)] p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Visão geral</p>
                    <p className="mt-1 text-sm font-medium">As tuas finanças</p>
                  </div>
                  <span className="rounded-full border bg-[hsl(var(--surface))] px-2.5 py-1 text-[10px] font-medium text-[hsl(var(--muted-foreground))]">Este mês</span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {stats.map(([label, value]) => (
                    <div key={label} className="rounded-xl border bg-[hsl(var(--surface))] p-4">
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{label}</p>
                      <p className="mt-2 text-lg font-semibold tracking-tight sm:text-xl">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-[1.35fr_0.65fr]">
                  <div className="rounded-xl border bg-[hsl(var(--surface))] p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">Fluxo financeiro</p>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Últimos 6 meses</span>
                    </div>
                    <div className="mt-6 flex h-40 items-end gap-2 sm:h-48 sm:gap-3" aria-hidden="true">
                      {[34, 48, 41, 62, 55, 78, 69, 88, 74, 96, 83, 92].map((height, index) => (
                        <div key={index} className="flex-1 rounded-t-md bg-[hsl(var(--foreground)/0.12)]" style={{ height: `${height}%` }} />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border bg-[hsl(var(--surface))] p-4 sm:p-5">
                    <p className="text-xs font-medium">Objetivo em destaque</p>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">Fundo de emergência</p>
                        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">€3.420 de €5.000</p>
                      </div>
                      <span className="text-sm font-semibold">68%</span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[hsl(var(--surface-muted))]">
                      <div className="h-full w-[68%] rounded-full bg-[hsl(var(--foreground))]" />
                    </div>
                    <p className="mt-4 text-xs text-[hsl(var(--muted-foreground))]">Faltam €1.580 para chegares ao objetivo.</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] text-[hsl(var(--muted-foreground))]">Uma visão simples para tomar decisões melhores.</p>
          </div>
        </section>

        <section className="border-t py-14 sm:py-20" aria-labelledby="benefits-title">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">Menos ruído. Mais controlo.</p>
            <h2 id="benefits-title" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Tudo o que precisas para perceber o teu dinheiro.
            </h2>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {benefits.map(({ icon: Icon, title, description }) => (
              <article key={title} className="mf-surface mf-interactive p-5 sm:p-6">
                <div className="flex size-10 items-center justify-center rounded-xl bg-[hsl(var(--surface-muted))]">
                  <Icon aria-hidden="true" className="size-5" />
                </div>
                <h3 className="mt-8 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pb-14 sm:pb-20" aria-label="Chamada para ação">
          <div className="overflow-hidden rounded-[1.5rem] border bg-[hsl(var(--surface))] p-6 sm:p-10">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">Começa agora</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Torna as tuas finanças mais fáceis de entender.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))] sm:text-base">
                Cria a tua conta e começa a organizar o teu dinheiro num fluxo simples, claro e feito para o dia a dia.
              </p>
              <div className="mt-6">
                <LinkButton href="/signup" className="w-full sm:w-auto">
                  Criar conta grátis
                  <ArrowRight aria-hidden="true" className="size-4" />
                </LinkButton>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t py-6 text-xs text-[hsl(var(--muted-foreground))] sm:flex-row sm:items-center sm:justify-between">
          <span>MoneyFlow</span>
          <span>Finanças pessoais, sem complicação.</span>
        </footer>
      </div>
    </main>
  )
}
