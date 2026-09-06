import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarClock,
  ChartNoAxesCombined,
  Check,
  CircleDollarSign,
  Heart,
  Home,
  List,
  ListChecks,
  ShieldCheck,
  Sparkles,
  Tags,
  Target,
  WalletCards,
} from 'lucide-react'
import { LinkButton } from '@/components/ui/link-button'
import { StarsBackground } from '@/components/backgrounds/stars-background'

const benefits = [
  {
    icon: ChartNoAxesCombined,
    title: 'Vê para onde vai o dinheiro',
    description:
      'Saldo, entradas, despesas e evolução numa leitura rápida, sem folhas de cálculo.',
  },
  {
    icon: Target,
    title: 'Transforma planos em objetivos',
    description:
      'Define metas, acompanha progresso e sabe exatamente o próximo passo.',
  },
  {
    icon: ListChecks,
    title: 'Organiza tudo no mesmo fluxo',
    description:
      'Contas, categorias, recorrências, transações e wishlist sem espalhar informação.',
  },
]

const stats = [
  ['Saldo atual', '€4.286,40'],
  ['Este mês', '+€742,20'],
  ['Poupança', '31,4%'],
]

const navSections = [
  {
    href: '/dashboard',
    label: 'Início',
    eyebrow: 'Visão geral',
    title: 'Começa pelo que realmente importa.',
    description:
      'Um resumo do teu dinheiro para perceber rapidamente o saldo, o mês e os próximos movimentos.',
    icon: Home,
    accent: 'overview',
    preview: ['Saldo total', 'Entradas', 'Despesas'],
  },
  {
    href: '/dashboard/goals',
    label: 'Objetivos',
    eyebrow: 'Planeamento',
    title: 'Transforma objetivos em progresso visível.',
    description:
      'Define metas financeiras, acompanha contribuições e percebe quanto falta para chegar lá.',
    icon: Target,
    accent: 'goal',
    preview: ['Fundo de emergência', 'Viagem', 'Novo equipamento'],
  },
  {
    href: '/dashboard/wishlist',
    label: 'Wishlist',
    eyebrow: 'Compras com intenção',
    title: 'Compra melhor porque sabes o que queres.',
    description:
      'Guarda compras futuras, preços, prioridades e datas desejadas antes de gastar.',
    icon: Heart,
    accent: 'wishlist',
    preview: ['Laptop', 'Headphones', 'Monitor'],
  },
  {
    href: '/dashboard/transactions',
    label: 'Movimentos',
    eyebrow: 'Registo diário',
    title: 'Cada movimento tem contexto.',
    description:
      'Regista entradas e despesas, escolhe a conta e mantém o histórico financeiro organizado.',
    icon: List,
    accent: 'transactions',
    preview: ['Supermercado', 'Ordenado', 'Subscrição'],
  },
  {
    href: '/dashboard/accounts',
    label: 'Contas',
    eyebrow: 'Dinheiro por origem',
    title: 'Sabe onde o teu dinheiro está.',
    description:
      'Centraliza várias contas e mantém os saldos sincronizados com os teus movimentos.',
    icon: WalletCards,
    accent: 'accounts',
    preview: ['Conta principal', 'Poupança', 'Dinheiro'],
  },
  {
    href: '/dashboard/budgets',
    label: 'Orçamentos',
    eyebrow: 'Controlo mensal',
    title: 'Define limites antes de ultrapassá-los.',
    description:
      'Cria orçamentos por categoria e percebe onde estás a gastar acima do planeado.',
    icon: CircleDollarSign,
    accent: 'budget',
    preview: ['Alimentação', 'Transporte', 'Lazer'],
  },
  {
    href: '/dashboard/analytics',
    label: 'Analytics',
    eyebrow: 'Decisões com dados',
    title: 'Vê padrões que passam despercebidos.',
    description:
      'Analisa evolução, categorias e tendências para transformar números em decisões.',
    icon: ChartNoAxesCombined,
    accent: 'analytics',
    preview: ['6 meses', 'Categorias', 'Tendência'],
  },
  {
    href: '/dashboard/recurring',
    label: 'Recorrentes',
    eyebrow: 'Automatiza a atenção',
    title: 'Nunca percas de vista uma despesa recorrente.',
    description:
      'Acompanha pagamentos e entradas recorrentes, frequência e próxima data.',
    icon: CalendarClock,
    accent: 'recurring',
    preview: ['Netflix', 'Renda', 'Ordenado'],
  },
  {
    href: '/dashboard/categories',
    label: 'Categorias',
    eyebrow: 'Organização',
    title: 'Cria uma estrutura que faz sentido para ti.',
    description:
      'Personaliza categorias para que cada movimento seja mais fácil de entender e analisar.',
    icon: Tags,
    accent: 'categories',
    preview: ['Casa', 'Alimentação', 'Trabalho'],
  },
] as const

const previewBars = [32, 44, 38, 58, 50, 72, 63, 84]

function FeaturePreview({
  accent,
  preview,
}: {
  accent: (typeof navSections)[number]['accent']
  preview: readonly string[]
}) {
  const showBars = accent === 'overview' || accent === 'analytics' || accent === 'budget'

  return (
    <div className="relative overflow-hidden rounded-[1.35rem] border border-[hsl(var(--brand-green)/0.14)] bg-[linear-gradient(145deg,hsl(var(--brand-navy)/0.94),hsl(var(--brand-navy-soft)/0.82))] p-3 shadow-2xl shadow-black/25 sm:p-4">
      <div className="rounded-[1rem] border border-white/8 bg-white/[0.035] p-4 backdrop-blur-xl sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">MoneyFlow</p>
            <p className="mt-1 text-sm font-medium text-white">{preview[0]}</p>
          </div>
          <div className="size-8 rounded-lg border border-[hsl(var(--brand-green)/0.20)] bg-[hsl(var(--brand-green)/0.10)]" />
        </div>

        {showBars ? (
          <div className="mt-6 flex h-28 items-end gap-1.5 sm:h-36 sm:gap-2" aria-hidden="true">
            {previewBars.map((height, index) => (
              <div
                key={index}
                className={`flex-1 rounded-t-md ${index >= previewBars.length - 2 ? 'bg-[hsl(var(--brand-green))]' : 'bg-white/10'}`}
                style={{ height: `${height}%`, opacity: index >= previewBars.length - 2 ? 0.82 : 1 }}
              />
            ))}
          </div>
        ) : (
          <div className="mt-5 space-y-2">
            {preview.map((item, index) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-xl border border-white/7 bg-white/[0.035] px-3 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="size-2.5 shrink-0 rounded-full bg-[hsl(var(--brand-green))]" style={{ opacity: 0.45 + index * 0.2 }} />
                  <span className="truncate text-xs font-medium text-white/85">{item}</span>
                </div>
                <span className="h-2 w-14 rounded-full bg-white/10 sm:w-20" />
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          {['Hoje', 'Mês', 'Total'].map((item, index) => (
            <div key={item} className="rounded-lg border border-white/7 bg-white/[0.03] p-2.5">
              <p className="text-[9px] text-white/40">{item}</p>
              <p className={`mt-1 text-xs font-semibold ${index === 1 ? 'text-[hsl(var(--brand-green))]' : 'text-white/80'}`}>
                {index === 0 ? '€42' : index === 1 ? '+€742' : '€4.2k'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[hsl(var(--background))]">
      <StarsBackground density={0.00005} />

      <div className="relative z-10">
        <div className="moneyflow-shell">
          <nav
            className="flex items-center justify-between border-b border-[hsl(var(--foreground)/0.06)] py-5"
            aria-label="Navegação principal"
          >
            <Link href="/" className="group flex items-center gap-2.5 text-sm font-semibold tracking-tight">
              <Image
                src="/moneyflow-icon.svg"
                alt=""
                width={34}
                height={34}
                priority
                className="rounded-[10px] shadow-lg shadow-[hsl(var(--brand-green)/0.10)]"
              />
              <span>MoneyFlow</span>
            </Link>

            <div className="hidden items-center gap-1 sm:flex">
              <LinkButton href="/login" variant="ghost" className="min-h-10 px-3">
                Entrar
              </LinkButton>
              <LinkButton href="/signup" className="min-h-10 px-4 shadow-lg shadow-[hsl(var(--brand-green)/0.14)]">
                Começar grátis
              </LinkButton>
            </div>

            <LinkButton href="/login" variant="ghost" className="min-h-10 px-2 sm:hidden">
              Entrar
            </LinkButton>
          </nav>

          <section className="relative py-10 sm:py-16 lg:py-20">
            <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-[hsl(var(--brand-green)/0.06)] blur-3xl" />

            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[hsl(var(--brand-green)/0.22)] bg-[hsl(var(--brand-green)/0.08)] px-3 py-1.5 text-xs font-medium text-[hsl(var(--brand-green))] shadow-sm backdrop-blur-xl">
                <Sparkles aria-hidden="true" className="size-3.5" />
                Finanças pessoais sem complicação
              </div>

              <h1 className="mt-5 text-balance text-[2.7rem] font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                Vê para onde vai o teu dinheiro.
                <span className="mt-1 block bg-gradient-to-r from-[hsl(var(--foreground))] via-[hsl(var(--brand-green))] to-[hsl(var(--foreground))] bg-clip-text text-transparent">
                  Decide o que fazer a seguir.
                </span>
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-7 text-[hsl(var(--muted-foreground))] sm:text-lg sm:leading-8">
                Organiza contas, despesas, objetivos e wishlist numa experiência
                simples, clara e construída à volta das decisões que realmente importam.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <LinkButton
                  href="/signup"
                  className="w-full px-6 shadow-xl shadow-[hsl(var(--brand-green)/0.14)] sm:w-auto"
                >
                  Criar conta grátis
                  <ArrowRight aria-hidden="true" className="size-4" />
                </LinkButton>
                <LinkButton
                  href="/login"
                  variant="outline"
                  className="w-full border-[hsl(var(--brand-green)/0.18)] bg-[hsl(var(--surface)/0.62)] sm:w-auto"
                >
                  Já tenho conta
                </LinkButton>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[hsl(var(--muted-foreground))]">
                <span className="inline-flex items-center gap-1.5">
                  <Check aria-hidden="true" className="size-3.5 text-[hsl(var(--brand-green))]" />
                  Gratuito para começar
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck aria-hidden="true" className="size-3.5 text-[hsl(var(--brand-green))]" />
                  Privacidade por utilizador
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-[hsl(var(--brand-green))]" />
                  Mobile first
                </span>
              </div>
            </div>

            <div className="mx-auto mt-12 max-w-5xl sm:mt-16">
              <div className="rounded-[1.5rem] border border-[hsl(var(--brand-green)/0.14)] bg-[hsl(var(--surface)/0.72)] p-2 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-3">
                <div className="rounded-[1.1rem] border border-[hsl(var(--foreground)/0.07)] bg-[hsl(var(--surface-muted)/0.66)] p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">Visão geral</p>
                      <p className="mt-1 text-sm font-medium">As tuas finanças</p>
                    </div>
                    <span className="rounded-full border border-[hsl(var(--foreground)/0.08)] bg-[hsl(var(--surface)/0.78)] px-2.5 py-1 text-[10px] font-medium text-[hsl(var(--muted-foreground))]">Este mês</span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {stats.map(([label, value], index) => (
                      <div key={label} className="rounded-xl border border-[hsl(var(--foreground)/0.07)] bg-[hsl(var(--surface)/0.78)] p-4 shadow-sm">
                        <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{label}</p>
                        <p className={`mt-2 text-lg font-semibold tracking-tight sm:text-xl ${index === 1 ? 'text-[hsl(var(--brand-green))]' : ''}`}>
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 grid gap-3 lg:grid-cols-[1.35fr_0.65fr]">
                    <div className="rounded-xl border border-[hsl(var(--foreground)/0.07)] bg-[hsl(var(--surface)/0.78)] p-4 shadow-sm sm:p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium">Fluxo financeiro</p>
                        <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Últimos 6 meses</span>
                      </div>
                      <div className="mt-6 flex h-40 items-end gap-2 sm:h-48 sm:gap-3" aria-hidden="true">
                        {[34, 48, 41, 62, 55, 78, 69, 88, 74, 96, 83, 92].map((height, index) => (
                          <div key={index} className={`flex-1 rounded-t-md ${index >= 8 ? 'bg-[hsl(var(--brand-green))]' : 'bg-[hsl(var(--foreground)/0.12)]'}`} style={{ height: `${height}%`, opacity: index >= 8 ? 0.7 : 1 }} />
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-[hsl(var(--foreground)/0.07)] bg-[hsl(var(--surface)/0.78)] p-4 shadow-sm sm:p-5">
                      <p className="text-xs font-medium">Objetivo em destaque</p>
                      <div className="mt-5 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">Fundo de emergência</p>
                          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">€3.420 de €5.000</p>
                        </div>
                        <span className="text-sm font-semibold text-[hsl(var(--brand-green))]">68%</span>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[hsl(var(--surface-muted))]">
                        <div className="h-full w-[68%] rounded-full bg-[hsl(var(--brand-green))]" />
                      </div>
                      <p className="mt-4 text-xs text-[hsl(var(--muted-foreground))]">Faltam €1.580 para chegares ao objetivo.</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-[11px] text-[hsl(var(--muted-foreground))]">Uma visão simples para tomar decisões melhores.</p>
            </div>
          </section>

          <section className="border-t border-[hsl(var(--foreground)/0.07)] py-14 sm:py-20" aria-labelledby="benefits-title">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--brand-green))]">Menos ruído. Mais controlo.</p>
              <h2 id="benefits-title" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Uma interface que te mostra o que importa.</h2>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {benefits.map(({ icon: Icon, title, description }) => (
                <article key={title} className="mf-surface mf-interactive border-[hsl(var(--brand-green)/0.08)] bg-[hsl(var(--surface)/0.72)] p-5 backdrop-blur-xl sm:p-6">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[hsl(var(--brand-green)/0.10)] text-[hsl(var(--brand-green))] ring-1 ring-[hsl(var(--brand-green)/0.16)]">
                    <Icon aria-hidden="true" className="size-5" />
                  </div>
                  <h3 className="mt-8 text-base font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="border-t border-[hsl(var(--foreground)/0.07)] py-14 sm:py-20" aria-labelledby="product-sections-title">
            <div className="max-w-3xl">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--brand-green))]">Explora o MoneyFlow</p>
              <h2 id="product-sections-title" className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Cada parte da tua vida financeira, no lugar certo.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))] sm:text-base">
                Em vez de apenas dizer o que o MoneyFlow faz, vê como cada área encaixa no mesmo fluxo de decisão.
              </p>
            </div>

            <div className="mt-10 space-y-4 sm:mt-12 sm:space-y-6">
              {navSections.map(({ href, label, eyebrow, title, description, icon: Icon, accent, preview }, index) => (
                <article
                  key={href}
                  id={href.replace('/dashboard/', '').replace('/dashboard', 'inicio')}
                  className="group relative overflow-hidden rounded-[1.5rem] border border-[hsl(var(--brand-green)/0.10)] bg-[hsl(var(--surface)/0.62)] p-4 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-6 lg:p-8"
                >
                  <div className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-[hsl(var(--brand-green)/0.05)] blur-3xl transition-opacity group-hover:opacity-100" />
                  <div className="relative grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
                    <div className={`${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span className="flex size-11 items-center justify-center rounded-xl bg-[hsl(var(--brand-green)/0.10)] text-[hsl(var(--brand-green))] ring-1 ring-[hsl(var(--brand-green)/0.16)]">
                          <Icon aria-hidden="true" className="size-5" />
                        </span>
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[hsl(var(--brand-green))]">{eyebrow}</p>
                          <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
                        </div>
                      </div>

                      <h3 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h3>
                      <p className="mt-3 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))] sm:text-base">{description}</p>

                      <div className="mt-6">
                        <LinkButton href={href} variant="outline" className="border-[hsl(var(--brand-green)/0.18)] bg-[hsl(var(--background)/0.32)]">
                          Ver {label.toLowerCase()}
                          <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
                        </LinkButton>
                      </div>
                    </div>

                    <div className={`${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                      <FeaturePreview accent={accent} preview={preview} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="border-t border-[hsl(var(--foreground)/0.07)] pb-14 pt-14 sm:pb-20 sm:pt-20" aria-label="Chamada para ação">
            <div className="overflow-hidden rounded-[1.5rem] border border-[hsl(var(--brand-green)/0.16)] bg-[linear-gradient(135deg,hsl(var(--brand-navy)/0.98),hsl(var(--brand-navy-soft)/0.9))] p-6 shadow-xl shadow-black/25 sm:p-10">
              <div className="max-w-2xl">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--brand-green))]">Começa agora</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[hsl(var(--brand-white))] sm:text-4xl">O próximo passo começa com uma visão clara.</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[hsl(var(--brand-white)/0.72)] sm:text-base">Cria a tua conta e começa a organizar o teu dinheiro num fluxo simples, claro e feito para o dia a dia.</p>
                <div className="mt-6">
                  <LinkButton href="/signup" className="w-full shadow-xl shadow-[hsl(var(--brand-green)/0.18)] sm:w-auto">
                    Criar conta grátis
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </LinkButton>
                </div>
              </div>
            </div>
          </section>

          <footer className="flex flex-col gap-3 border-t border-[hsl(var(--foreground)/0.07)] py-6 text-xs text-[hsl(var(--muted-foreground))] sm:flex-row sm:items-center sm:justify-between">
            <span>MoneyFlow</span>
            <span>Finanças pessoais, sem complicação.</span>
          </footer>
        </div>
      </div>
    </main>
  )
}
