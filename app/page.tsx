import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarClock,
  Check,
  ChartNoAxesCombined,
  CircleDollarSign,
  Heart,
  Home,
  Languages,
  List,
  LockKeyhole,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tags,
  Target,
  WalletCards,
  Zap,
} from 'lucide-react'
import { LinkButton } from '@/components/ui/link-button'
import { FeaturePreview } from '@/components/home/feature-preview'
import { SilentraCredit } from '@/components/silentra-credit'

const featureSections = [
  {
    id: 'dashboard',
    href: '/dashboard',
    label: 'Início',
    eyebrow: '01 · Visão geral',
    title: 'Um ecrã para saberes onde estás antes de decidires o próximo passo.',
    description:
      'O dashboard junta o contexto essencial da tua vida financeira: saldo das contas ativas, receitas, despesas, poupança, movimentos recentes, progresso dos objetivos e uma visão rápida da wishlist. Em vez de saltar entre páginas para perceber o mês, começas pelo panorama geral.',
    icon: Home,
    preview: 'overview' as const,
    points: [
      'Saldo total calculado a partir das contas ativas.',
      'Leitura mensal de receitas, despesas e resultado líquido.',
      'Movimentos recentes com contexto de conta e categoria.',
      'Progresso dos objetivos e uma amostra do que tens planeado comprar.',
    ],
    details: [
      'É o ponto de entrada diário: mostra primeiro informação de contexto e depois as ações que podem exigir atenção.',
      'Os valores apresentados são baseados nos teus próprios registos; não são estimativas externas.',
      'O layout adapta-se a desktop e mobile para manter as mesmas decisões acessíveis em ecrãs pequenos.',
    ],
  },
  {
    id: 'movimentos',
    href: '/dashboard/transactions',
    label: 'Movimentos',
    eyebrow: '02 · Registo diário',
    title: 'Regista o dinheiro que entra e sai sem perder o contexto.',
    description:
      'Cada movimento pode ser associado a uma conta e a uma categoria. O histórico permite pesquisar, filtrar por tipo, conta e categoria, abrir detalhes, editar e apagar com controlo de propriedade.',
    icon: List,
    preview: 'transactions' as const,
    points: [
      'Receitas e despesas num histórico único.',
      'Pesquisa por descrição e filtros por conta, tipo e categoria.',
      'Conta afetada visível em cada movimento.',
      'Edição e eliminação protegidas por validações no servidor.',
    ],
    details: [
      'Ao criar uma transação, a conta afetada faz parte do fluxo para evitar registos sem origem financeira.',
      'Os saldos das contas são sincronizados com os movimentos através de triggers PostgreSQL.',
      'Contas arquivadas não podem ser escolhidas para novos movimentos, mantendo o histórico existente intacto.',
      'A interface mostra estados vazios e resultados de pesquisa para que saibas sempre o que está a acontecer.',
    ],
  },
  {
    id: 'contas',
    href: '/dashboard/accounts',
    label: 'Contas',
    eyebrow: '03 · Onde está o dinheiro',
    title: 'Distingue banco, dinheiro, cartão e poupança sem perder a visão total.',
    description:
      'Podes manter várias contas financeiras, definir o tipo de cada uma, acompanhar o saldo e arquivar contas que já não usas. Os movimentos continuam associados às contas certas.',
    icon: WalletCards,
    preview: 'accounts' as const,
    points: [
      'Várias contas com saldo e moeda definidos.',
      'Tipos de conta: banco, dinheiro, cartão, poupança ou outro.',
      'Estado ativo ou arquivado para não misturar contas antigas com o dia a dia.',
      'Saldo total das contas ativas numa leitura imediata.',
    ],
    details: [
      'Arquivar é diferente de apagar: uma conta antiga pode sair dos fluxos de criação sem desaparecer do contexto histórico.',
      'As relações entre utilizador, conta e movimento são verificadas no servidor.',
      'Os valores respeitam a moeda configurada no perfil e a moeda específica de cada conta quando aplicável.',
    ],
  },
  {
    id: 'recorrentes',
    href: '/dashboard/recurring',
    label: 'Recorrentes',
    eyebrow: '04 · Compromissos e entradas',
    title: 'Conhece antecipadamente o dinheiro que vai entrar e sair.',
    description:
      'As recorrências permitem representar despesas e ganhos que se repetem. A aplicação acompanha frequência, próxima data, conta afetada e estado ativo ou pausado, para que os compromissos previsíveis deixem de ser surpresa.',
    icon: CalendarClock,
    preview: 'recurring' as const,
    points: [
      'Despesas recorrentes com frequência mensal, trimestral ou anual.',
      'Ganhos recorrentes com as mesmas frequências.',
      'Próxima data e contagem de itens nos próximos 30 dias.',
      'Projeções de reserva mensal e custo anual para despesas.',
    ],
    details: [
      'As recorrências podem ser ativas ou pausadas sem perder a configuração.',
      'Cada item pode ter uma conta associada, tornando claro onde o movimento futuro terá impacto.',
      'A área de ganhos tem navegação dedicada para não misturar entradas e despesas.',
      'As projeções anualizadas ajudam a perceber o peso de compromissos que parecem pequenos quando vistos isoladamente.',
    ],
  },
  {
    id: 'orcamentos',
    href: '/dashboard/budgets',
    label: 'Orçamentos',
    eyebrow: '05 · Controlo mensal',
    title: 'Define limites por categoria e compara plano com realidade.',
    description:
      'Os orçamentos transformam uma intenção mensal num limite concreto. Para cada categoria, consegues comparar o valor planeado com o que já foi gasto e perceber rapidamente onde estás a aproximar-te do limite.',
    icon: CircleDollarSign,
    preview: 'budgets' as const,
    points: [
      'Um orçamento diferente para cada categoria.',
      'Navegação mês a mês.',
      'Gasto real calculado a partir dos movimentos desse período.',
      'Diferença entre orçamento, gasto e valor disponível.',
    ],
    details: [
      'O cálculo usa apenas despesas categorizadas desse mês, permitindo comparar orçamento e realidade no mesmo período.',
      'Categorias sem orçamento continuam visíveis quando já existem despesas relevantes.',
      'Quando o gasto ultrapassa o limite, o saldo disponível passa a comunicar esse desvio visualmente.',
    ],
  },
  {
    id: 'objetivos',
    href: '/dashboard/goals',
    label: 'Objetivos',
    eyebrow: '06 · Poupança com propósito',
    title: 'Transforma uma intenção financeira num objetivo mensurável.',
    description:
      'Define quanto queres alcançar, quanto já tens, uma data alvo e uma prioridade. O progresso fica visível e podes adicionar contribuições validadas no servidor.',
    icon: Target,
    preview: 'goals' as const,
    points: [
      'Valor alvo e valor atual com percentagem de progresso.',
      'Data alvo para dar contexto temporal à meta.',
      'Prioridade alta, média ou baixa.',
      'Contribuições incrementais com validação.',
    ],
    details: [
      'O progresso é calculado com base no valor atual face ao objetivo, limitado a 100%.',
      'A página mostra também quanto falta, evitando obrigar-te a fazer contas manualmente.',
      'Os objetivos foram pensados para acompanhar dinheiro com um propósito, e não apenas um saldo.',
    ],
  },
  {
    id: 'wishlist',
    href: '/dashboard/wishlist',
    label: 'Wishlist',
    eyebrow: '07 · Compras com intenção',
    title: 'Adia a decisão de compra sem perder o que realmente queres.',
    description:
      'Guarda artigos futuros com preço, categoria, prioridade, estado, URL, imagem, data desejada e notas. A wishlist funciona como uma camada entre “quero isto” e “vou gastar dinheiro agora”.',
    icon: Heart,
    preview: 'wishlist' as const,
    points: [
      'Preço, categoria e prioridade para comparar compras.',
      'Estados: quero, a guardar, pronto e comprado.',
      'Data desejada, notas, URL e imagem.',
      'Conversão de um item da wishlist num objetivo financeiro.',
    ],
    details: [
      'O valor planeado da wishlist exclui itens já comprados para representar apenas o que ainda pode exigir dinheiro.',
      'A prioridade e o estado tornam a lista útil para decisão, não apenas para guardar links.',
      'Um item pode transformar-se diretamente numa meta, ligando intenção de compra a planeamento financeiro.',
    ],
  },
  {
    id: 'analytics',
    href: '/dashboard/analytics',
    label: 'Analytics',
    eyebrow: '08 · Decisões com dados',
    title: 'Troca uma lista de números por padrões que consegues interpretar.',
    description:
      'A análise financeira olha para os últimos seis meses, compara entradas e despesas, mostra o resultado líquido, distribui os gastos por categoria e gera leituras rápidas sobre o comportamento registado.',
    icon: ChartNoAxesCombined,
    preview: 'analytics' as const,
    points: [
      'Evolução de receitas e despesas ao longo de seis meses.',
      'Distribuição das despesas por categoria.',
      'Resultado líquido do período.',
      'Taxa de poupança quando existem receitas suficientes para a calcular.',
    ],
    details: [
      'Os gráficos são derivados dos movimentos reais guardados no teu perfil.',
      'A maior categoria de despesa é identificada a partir das despesas categorizadas do período.',
      'O objetivo não é prever o futuro, mas tornar padrões passados suficientemente claros para apoiar decisões.',
    ],
  },
  {
    id: 'categorias',
    href: '/dashboard/categories',
    label: 'Categorias',
    eyebrow: '09 · Estrutura',
    title: 'Monta a taxonomia que torna o resto do MoneyFlow mais inteligente.',
    description:
      'Categorias bem definidas melhoram pesquisa, filtros, orçamentos e analytics. Podes criar, renomear, apagar com salvaguardas e ordenar as categorias usadas nos teus movimentos.',
    icon: Tags,
    preview: 'categories' as const,
    points: [
      'Criar categorias com nomes próprios.',
      'Renomear e apagar quando permitido.',
      'Ordenar para manter a lista como preferes.',
      'Usar categorias como base para filtros, orçamentos e análises.',
    ],
    details: [
      'A aplicação protege relações que impediriam uma eliminação segura quando existem dados dependentes.',
      'A ordem escolhida torna a seleção de categorias mais previsível noutras áreas do produto.',
      'Uma estrutura simples aqui reduz ruído no histórico e melhora a leitura dos analytics.',
    ],
  },
] as const

const supportFeatures = [
  {
    icon: Zap,
    title: 'Quick add',
    text: 'Entrada rápida para registares movimentos sem interromper o fluxo do dia a dia.',
  },
  {
    icon: Smartphone,
    title: 'Pensado para mobile',
    text: 'Navegação inferior, controlos táteis, safe-area e layouts que crescem para desktop.',
  },
  {
    icon: Languages,
    title: 'Português e English',
    text: 'Idioma do produto ajustável nas definições, com datas e moedas adaptadas ao perfil.',
  },
  {
    icon: Settings,
    title: 'Definições',
    text: 'Mantém preferências de idioma e contexto pessoal alinhados com a tua experiência.',
  },
]

const securityItems = [
  {
    icon: LockKeyhole,
    title: 'Dados isolados por utilizador',
    text: 'As tabelas e ações respeitam propriedade do utilizador, com Row Level Security no Supabase.',
  },
  {
    icon: ShieldCheck,
    title: 'Validação no servidor',
    text: 'As operações sensíveis validam dados e relações no servidor antes de alterar o estado.',
  },
  {
    icon: Smartphone,
    title: 'PWA e acesso rápido',
    text: 'Pode ser instalada como aplicação e inclui uma base de navegação offline para recursos estáticos.',
  },
]

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[hsl(var(--background))]">
      <div className="relative z-10">
        <div className="moneyflow-shell">
          <header className="sticky top-0 z-30 border-b border-[hsl(var(--foreground)/0.06)] bg-[hsl(var(--background)/0.88)] backdrop-blur-xl">
            <div className="flex min-h-16 items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-2.5 text-sm font-semibold tracking-tight">
                <Image
                  src="/moneyflow-icon.svg"
                  alt=""
                  width={34}
                  height={34}
                  priority
                  className="rounded-[10px] shadow-lg shadow-[hsl(var(--brand-green)/0.12)]"
                />
                <span>MoneyFlow</span>
              </Link>

              <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegação da página">
                <a href="#funcionalidades" className="rounded-lg px-3 py-2 text-sm text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--surface-muted))] hover:text-[hsl(var(--foreground))]">Funcionalidades</a>
                <a href="#como-funciona" className="rounded-lg px-3 py-2 text-sm text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--surface-muted))] hover:text-[hsl(var(--foreground))]">Como funciona</a>
                <a href="#seguranca" className="rounded-lg px-3 py-2 text-sm text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--surface-muted))] hover:text-[hsl(var(--foreground))]">Segurança</a>
              </nav>

              <div className="flex items-center gap-1.5">
                <LinkButton href="/login" variant="ghost" className="min-h-10 px-3">
                  Entrar
                </LinkButton>
                <LinkButton href="/signup" className="min-h-10 px-3.5 shadow-lg shadow-[hsl(var(--brand-green)/0.14)]">
                  <span className="hidden sm:inline">Começar grátis</span>
                  <span className="sm:hidden">Começar</span>
                </LinkButton>
              </div>
            </div>
          </header>

          <section className="relative py-14 sm:py-20 lg:py-28">
            <div className="pointer-events-none absolute left-1/2 top-8 -z-10 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-[hsl(var(--brand-green)/0.06)] blur-3xl" />
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--brand-green)/0.20)] bg-[hsl(var(--brand-green)/0.07)] px-3 py-1.5 text-xs font-medium text-[hsl(var(--brand-green))]">
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  Track · Understand · Prioritize · Decide
                </div>

                <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.03] tracking-[-0.055em] sm:text-6xl lg:text-[4.75rem]">
                  A tua vida financeira,
                  <span className="block bg-gradient-to-r from-[hsl(var(--foreground))] via-[hsl(var(--brand-green))] to-[hsl(var(--foreground))] bg-clip-text text-transparent">
                    finalmente no mesmo lugar.
                  </span>
                </h1>

                <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-[hsl(var(--muted-foreground))] sm:text-lg sm:leading-8">
                  O MoneyFlow junta registo diário, contas, recorrências, orçamentos,
                  objetivos, wishlist e analytics numa única experiência para te ajudar
                  a perceber o teu dinheiro e decidir melhor.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <LinkButton href="/signup" className="w-full px-6 shadow-xl shadow-[hsl(var(--brand-green)/0.16)] sm:w-auto">
                    Criar conta grátis
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </LinkButton>
                  <LinkButton href="#funcionalidades" variant="outline" className="w-full sm:w-auto">
                    Explorar funcionalidades
                  </LinkButton>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    { icon: Check, title: 'Mobile-first', text: 'Feito para usar no dia a dia' },
                    { icon: ShieldCheck, title: 'Privacidade', text: 'Dados isolados por utilizador' },
                    { icon: Zap, title: 'Fluxo simples', text: 'Do registo à decisão' },
                  ].map(({ icon: Icon, title, text }) => (
                    <div key={title} className="rounded-xl border border-[hsl(var(--foreground)/0.07)] bg-[hsl(var(--surface)/0.58)] p-3.5">
                      <Icon className="size-4 text-[hsl(var(--brand-green))]" aria-hidden="true" />
                      <p className="mt-3 text-xs font-medium">{title}</p>
                      <p className="mt-1 text-[11px] leading-5 text-[hsl(var(--muted-foreground))]">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <FeaturePreview type="overview" />
                <div className="pointer-events-none absolute -bottom-8 -left-5 hidden w-52 rounded-xl border border-[hsl(var(--brand-green)/0.14)] bg-[hsl(var(--surface)/0.86)] p-3 shadow-xl backdrop-blur-xl sm:block">
                  <p className="text-[9px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">Decisão rápida</p>
                  <p className="mt-2 text-sm font-semibold">O mês está positivo.</p>
                  <p className="mt-1 text-[10px] leading-4 text-[hsl(var(--muted-foreground))]">Exemplo baseado em dados ilustrativos.</p>
                </div>
              </div>
            </div>
          </section>

          <section id="como-funciona" className="scroll-mt-20 border-y border-[hsl(var(--foreground)/0.07)] py-14 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--brand-green))]">Como funciona</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Quatro passos para sair do “onde foi o dinheiro?”.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                  O produto foi organizado para acompanhar a forma como tomamos decisões:
                  primeiro registamos, depois percebemos, priorizamos e finalmente decidimos.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['01', 'Track', 'Regista receitas, despesas, contas e compromissos recorrentes.'],
                  ['02', 'Understand', 'Lê o mês, os saldos, categorias e tendências.'],
                  ['03', 'Prioritize', 'Define orçamentos, objetivos e compras futuras.'],
                  ['04', 'Decide', 'Usa o contexto para saber onde ajustar o próximo movimento.'],
                ].map(([number, title, text]) => (
                  <article key={number} className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface)/0.72)] p-5">
                    <span className="text-xs font-semibold text-[hsl(var(--brand-green))]">{number}</span>
                    <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section id="funcionalidades" className="scroll-mt-20 py-16 sm:py-24">
            <div className="max-w-3xl">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--brand-green))]">Tudo explicado</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
                Cada área existe por uma razão.
              </h2>
              <p className="mt-4 text-sm leading-6 text-[hsl(var(--muted-foreground))] sm:text-base">
                Em vez de esconder funcionalidades atrás de uma lista de menus, esta página
                mostra o papel de cada área, o que consegues fazer e como as partes se ligam.
              </p>
            </div>

            <div className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {featureSections.map(({ id, label, icon: Icon, eyebrow }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="mf-interactive group flex items-center gap-3 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface)/0.64)] p-4"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--brand-green)/0.09)] text-[hsl(var(--brand-green))] ring-1 ring-[hsl(var(--brand-green)/0.14)]">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--brand-green))]">{eyebrow}</span>
                    <span className="mt-0.5 block truncate text-sm font-medium">{label}</span>
                  </span>
                  <ArrowRight className="ml-auto size-4 text-[hsl(var(--muted-foreground))] transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </a>
              ))}
            </div>

            <div className="mt-12 space-y-5 sm:mt-16 sm:space-y-7">
              {featureSections.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <article
                    key={feature.id}
                    id={feature.id}
                    className="scroll-mt-24 overflow-hidden rounded-[1.6rem] border border-[hsl(var(--brand-green)/0.09)] bg-[hsl(var(--surface)/0.52)] shadow-xl shadow-black/10"
                  >
                    <div className="grid items-center gap-8 p-5 sm:p-7 lg:grid-cols-2 lg:gap-12 lg:p-9">
                      <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                        <div className="flex items-center gap-3">
                          <span className="flex size-11 items-center justify-center rounded-xl bg-[hsl(var(--brand-green)/0.09)] text-[hsl(var(--brand-green))] ring-1 ring-[hsl(var(--brand-green)/0.15)]">
                            <Icon className="size-5" aria-hidden="true" />
                          </span>
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--brand-green))]">
                              {feature.eyebrow}
                            </p>
                            <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                              {feature.label}
                            </p>
                          </div>
                        </div>

                        <h3 className="mt-6 max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
                          {feature.title}
                        </h3>
                        <p className="mt-4 max-w-xl text-sm leading-7 text-[hsl(var(--muted-foreground))] sm:text-base">
                          {feature.description}
                        </p>

                        <div className="mt-6 grid gap-2">
                          {feature.points.map((point) => (
                            <div key={point} className="flex items-start gap-2.5 rounded-xl border border-[hsl(var(--foreground)/0.06)] bg-[hsl(var(--background)/0.24)] p-3">
                              <Check className="mt-0.5 size-4 shrink-0 text-[hsl(var(--brand-green))]" aria-hidden="true" />
                              <span className="text-sm leading-6 text-[hsl(var(--foreground)/0.84)]">{point}</span>
                            </div>
                          ))}
                        </div>

                        <details className="group mt-4 rounded-xl border border-[hsl(var(--foreground)/0.06)] bg-[hsl(var(--background)/0.24)]">
                          <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-medium">
                            Ver como funciona em detalhe
                          </summary>
                          <div className="border-t border-[hsl(var(--foreground)/0.06)] px-4 pb-4 pt-3">
                            <div className="space-y-2">
                              {feature.details.map((detail) => (
                                <p key={detail} className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                                  {detail}
                                </p>
                              ))}
                            </div>
                          </div>
                        </details>

                        <div className="mt-6 flex flex-wrap gap-2">
                          <LinkButton href={feature.href} variant="outline" className="bg-[hsl(var(--background)/0.22)]">
                            Abrir {feature.label.toLowerCase()}
                            <ArrowRight className="size-4" aria-hidden="true" />
                          </LinkButton>
                          {index < featureSections.length - 1 ? (
                            <a href={`#${featureSections[index + 1].id}`} className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] px-3 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-muted))]">
                              Próxima
                            </a>
                          ) : null}
                        </div>
                      </div>

                      <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                        <FeaturePreview type={feature.preview} />
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <section className="border-t border-[hsl(var(--foreground)/0.07)] py-16 sm:py-20" aria-labelledby="support-title">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--brand-green))]">Além das áreas principais</p>
              <h2 id="support-title" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Pequenas decisões de produto que tornam o uso mais simples.
              </h2>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {supportFeatures.map(({ icon: Icon, title, text }) => (
                <article key={title} className="mf-interactive rounded-[var(--radius-lg)] border bg-[hsl(var(--surface)/0.68)] p-5">
                  <Icon className="size-5 text-[hsl(var(--brand-green))]" aria-hidden="true" />
                  <h3 className="mt-6 text-base font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{text}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="seguranca" className="scroll-mt-20 border-t border-[hsl(var(--foreground)/0.07)] py-16 sm:py-20" aria-labelledby="security-title">
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--brand-green))]">Segurança e plataforma</p>
                <h2 id="security-title" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  A simplicidade da interface não significa menos proteção.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-[hsl(var(--muted-foreground))]">
                  O MoneyFlow usa Next.js, Supabase/PostgreSQL, validação no servidor e
                  Row Level Security para manter as operações financeiras ligadas ao utilizador certo.
                </p>
              </div>

              <div className="grid gap-3">
                {securityItems.map(({ icon: Icon, title, text }) => (
                  <article key={title} className="flex gap-4 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface)/0.68)] p-5 sm:p-6">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--brand-green)/0.09)] text-[hsl(var(--brand-green))]">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-base font-semibold">{title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="py-16 sm:py-24" aria-labelledby="cta-title">
            <div className="relative overflow-hidden rounded-[1.7rem] border border-[hsl(var(--brand-green)/0.16)] bg-[linear-gradient(135deg,hsl(var(--brand-navy)/0.98),hsl(var(--brand-navy-soft)/0.90))] p-6 shadow-2xl shadow-black/25 sm:p-10">
              <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-[hsl(var(--brand-green)/0.08)] blur-3xl" />
              <div className="relative max-w-2xl">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--brand-green))]">Começa com uma conta</p>
                <h2 id="cta-title" className="mt-3 text-3xl font-semibold tracking-tight text-[hsl(var(--brand-white))] sm:text-4xl">
                  Menos tempo a procurar números. Mais tempo a decidir o que fazer com eles.
                </h2>
                <p className="mt-4 text-sm leading-7 text-[hsl(var(--brand-white)/0.70)] sm:text-base">
                  Cria o perfil, define a tua moeda e começa pelo primeiro movimento ou pela primeira conta.
                  O resto pode crescer contigo.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <LinkButton href="/signup" className="w-full shadow-xl shadow-[hsl(var(--brand-green)/0.16)] sm:w-auto">
                    Criar conta grátis
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </LinkButton>
                  <LinkButton href="/login" variant="outline" className="w-full border-white/10 bg-white/[0.02] text-[hsl(var(--brand-white))] sm:w-auto">
                    Já tenho conta
                  </LinkButton>
                </div>
              </div>
            </div>
          </section>

          <footer className="flex flex-col gap-3 border-t border-[hsl(var(--foreground)/0.07)] py-7 text-xs text-[hsl(var(--muted-foreground))] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-[hsl(var(--foreground))]">MoneyFlow</p>
              <p className="mt-1">Finanças pessoais sem complicação.</p>
              <SilentraCredit className="mt-3" />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <Link href="/login" className="hover:text-[hsl(var(--foreground))]">Entrar</Link>
              <Link href="/signup" className="hover:text-[hsl(var(--foreground))]">Criar conta</Link>
              <a href="#funcionalidades" className="hover:text-[hsl(var(--foreground))]">Funcionalidades</a>
            </div>
          </footer>
        </div>
      </div>
    </main>
  )
}
