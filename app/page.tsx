import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  ChartNoAxesCombined,
  ListChecks,
  ShieldCheck,
  Sparkles,
  Target,
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
            <Link
              href="/"
              className="group flex items-center gap-2.5 text-sm font-semibold tracking-tight"
            >
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

            <LinkButton
              href="/login"
              variant="ghost"
              className="min-h-10 px-2 sm:hidden"
            >
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
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Visão geral
                      </p>
                      <p className="mt-1 text-sm font-medium">As tuas finanças</p>
                    </div>
                    <span className="rounded-full border border-[hsl(var(--foreground)/0.08)] bg-[hsl(var(--surface)/0.78)] px-2.5 py-1 text-[10px] font-medium text-[hsl(var(--muted-foreground))]">
                      Este mês
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {stats.map(([label, value], index) => (
                      <div
                        key={label}
                        className="rounded-xl border border-[hsl(var(--foreground)/0.07)] bg-[hsl(var(--surface)/0.78)] p-4 shadow-sm"
                      >
                        <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                          {label}
                        </p>
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
                        <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                          Últimos 6 meses
                        </span>
                      </div>
                      <div
                        className="mt-6 flex h-40 items-end gap-2 sm:h-48 sm:gap-3"
                        aria-hidden="true"
                      >
                        {[34, 48, 41, 62, 55, 78, 69, 88, 74, 96, 83, 92].map(
                          (height, index) => (
                            <div
                              key={index}
                              className={`flex-1 rounded-t-md ${index >= 8 ? 'bg-[hsl(var(--brand-green))]' : 'bg-[hsl(var(--foreground)/0.12)]'}`}
                              style={{ height: `${height}%`, opacity: index >= 8 ? 0.7 : 1 }}
                            />
                          ),
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-[hsl(var(--foreground)/0.07)] bg-[hsl(var(--surface)/0.78)] p-4 shadow-sm sm:p-5">
                      <p className="text-xs font-medium">Objetivo em destaque</p>
                      <div className="mt-5 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">Fundo de emergência</p>
                          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                            €3.420 de €5.000
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-[hsl(var(--brand-green))]">68%</span>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[hsl(var(--surface-muted))]">
                        <div className="h-full w-[68%] rounded-full bg-[hsl(var(--brand-green))]" />
                      </div>
                      <p className="mt-4 text-xs text-[hsl(var(--muted-foreground))]">
                        Faltam €1.580 para chegares ao objetivo.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-[11px] text-[hsl(var(--muted-foreground))]">
                Uma visão simples para tomar decisões melhores.
              </p>
            </div>
          </section>

          <section
            className="border-t border-[hsl(var(--foreground)/0.07)] py-14 sm:py-20"
            aria-labelledby="benefits-title"
          >
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--brand-green))]">
                Menos ruído. Mais controlo.
              </p>
              <h2
                id="benefits-title"
                className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
              >
                Uma interface que te mostra o que importa.
              </h2>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {benefits.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="mf-surface mf-interactive border-[hsl(var(--brand-green)/0.08)] bg-[hsl(var(--surface)/0.72)] p-5 backdrop-blur-xl sm:p-6"
                >
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[hsl(var(--brand-green)/0.10)] text-[hsl(var(--brand-green))] ring-1 ring-[hsl(var(--brand-green)/0.16)]">
                    <Icon aria-hidden="true" className="size-5" />
                  </div>
                  <h3 className="mt-8 text-base font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="pb-14 sm:pb-20" aria-label="Chamada para ação">
            <div className="overflow-hidden rounded-[1.5rem] border border-[hsl(var(--brand-green)/0.16)] bg-[linear-gradient(135deg,hsl(var(--brand-navy)/0.98),hsl(var(--brand-navy-soft)/0.9))] p-6 shadow-xl shadow-black/25 sm:p-10">
              <div className="max-w-2xl">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--brand-green))]">
                  Começa agora
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[hsl(var(--brand-white))] sm:text-4xl">
                  O próximo passo começa com uma visão clara.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[hsl(var(--brand-white)/0.72)] sm:text-base">
                  Cria a tua conta e começa a organizar o teu dinheiro num fluxo simples,
                  claro e feito para o dia a dia.
                </p>
                <div className="mt-6">
                  <LinkButton
                    href="/signup"
                    className="w-full shadow-xl shadow-[hsl(var(--brand-green)/0.18)] sm:w-auto"
                  >
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
