import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  ChartNoAxesCombined,
  CircleDollarSign,
  Heart,
  List,
  Tags,
  Target,
  WalletCards,
} from 'lucide-react'

type PreviewType =
  | 'overview'
  | 'transactions'
  | 'accounts'
  | 'budgets'
  | 'goals'
  | 'wishlist'
  | 'analytics'
  | 'recurring'
  | 'categories'

const rows = {
  overview: [
    ['Saldo total', '€4.286,40'],
    ['Receitas', '+€2.740,00'],
    ['Despesas', '−€1.997,80'],
  ],
  transactions: [
    ['Ordenado', '+€1.920,00', 'Hoje'],
    ['Supermercado', '−€76,42', 'Ontem'],
    ['Subscrição', '−€12,99', '05 Set'],
  ],
  accounts: [
    ['Conta principal', '€2.840,20'],
    ['Poupança', '€1.240,00'],
    ['Dinheiro', '€206,20'],
  ],
  budgets: [
    ['Alimentação', 62],
    ['Transporte', 41],
    ['Lazer', 78],
  ],
  goals: [
    ['Fundo de emergência', 68, '€3.420 / €5.000'],
    ['Viagem', 42, '€840 / €2.000'],
  ],
  wishlist: [
    ['Laptop', '€1.299', 'Alta'],
    ['Auscultadores', '€249', 'Média'],
    ['Monitor', '€379', 'Baixa'],
  ],
  recurring: [
    ['Renda', '€650', 'Em 4 dias'],
    ['Ordenado', '+€1.920', 'Em 11 dias'],
    ['Streaming', '€12,99', 'Em 16 dias'],
  ],
  categories: [
    ['Casa', '12 movimentos'],
    ['Alimentação', '18 movimentos'],
    ['Trabalho', '7 movimentos'],
  ],
} as const

const chart = [36, 48, 44, 58, 51, 72, 64, 82, 74, 91]

export function FeaturePreview({ type }: { type: PreviewType }) {
  const icons = {
    overview: ChartNoAxesCombined,
    transactions: List,
    accounts: WalletCards,
    budgets: CircleDollarSign,
    goals: Target,
    wishlist: Heart,
    analytics: ChartNoAxesCombined,
    recurring: CalendarClock,
    categories: Tags,
  }

  const Icon = icons[type]

  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-[hsl(var(--brand-green)/0.14)] bg-[linear-gradient(145deg,hsl(var(--brand-navy)/0.96),hsl(var(--brand-navy-soft)/0.9))] p-2.5 shadow-2xl shadow-black/25 sm:p-3">
      <div className="rounded-[1.15rem] border border-white/7 bg-white/[0.035] p-4 backdrop-blur-xl sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[hsl(var(--brand-green)/0.10)] text-[hsl(var(--brand-green))] ring-1 ring-[hsl(var(--brand-green)/0.16)]">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">
                MoneyFlow
              </p>
              <p className="mt-1 text-sm font-medium text-white">
                {type === 'overview' ? 'Visão geral' : type === 'transactions' ? 'Movimentos' : type === 'accounts' ? 'Contas' : type === 'budgets' ? 'Orçamentos' : type === 'goals' ? 'Objetivos' : type === 'wishlist' ? 'Wishlist' : type === 'analytics' ? 'Analytics' : type === 'recurring' ? 'Recorrentes' : 'Categorias'}
              </p>
            </div>
          </div>
          <span className="rounded-full border border-white/7 bg-white/[0.035] px-2.5 py-1 text-[9px] text-white/45">
            Exemplo
          </span>
        </div>

        {type === 'overview' || type === 'analytics' ? (
          <>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {rows.overview.map(([label, value], index) => (
                <div key={label} className="rounded-xl border border-white/7 bg-white/[0.03] p-3">
                  <p className="text-[9px] text-white/40">{label}</p>
                  <p className={`mt-2 truncate text-xs font-semibold ${index === 1 ? 'text-[hsl(var(--brand-green))]' : 'text-white/85'}`}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-white/7 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-white/75">Fluxo dos últimos meses</p>
                <span className="text-[9px] text-white/40">6 meses</span>
              </div>
              <div className="mt-5 flex h-28 items-end gap-1.5" aria-hidden="true">
                {chart.map((height, index) => (
                  <span
                    key={index}
                    className={index > 6 ? 'flex-1 rounded-t bg-[hsl(var(--brand-green))]' : 'flex-1 rounded-t bg-white/10'}
                    style={{ height: `${height}%`, opacity: index > 6 ? 0.8 : 1 }}
                  />
                ))}
              </div>
            </div>
          </>
        ) : null}

        {type === 'transactions' ? (
          <div className="mt-5 space-y-2">
            {rows.transactions.map(([label, value, date], index) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-white/7 bg-white/[0.03] p-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                  {index === 0 ? <ArrowDownLeft className="size-4 text-[hsl(var(--brand-green))]" /> : <ArrowUpRight className="size-4 text-white/55" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-white/85">{label}</p>
                  <p className="mt-0.5 text-[9px] text-white/35">Conta principal · Categoria</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-semibold ${index === 0 ? 'text-[hsl(var(--brand-green))]' : 'text-white/80'}`}>{value}</p>
                  <p className="mt-0.5 text-[9px] text-white/35">{date}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {type === 'accounts' ? (
          <div className="mt-5 grid gap-2">
            {rows.accounts.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-xl border border-white/7 bg-white/[0.03] p-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-[hsl(var(--brand-green)/0.08)] text-[hsl(var(--brand-green))]">
                    <WalletCards className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs font-medium text-white/85">{label}</p>
                    <p className="mt-0.5 text-[9px] text-white/35">Ativa</p>
                  </div>
                </div>
                <p className="text-xs font-semibold text-white/80">{value}</p>
              </div>
            ))}
          </div>
        ) : null}

        {type === 'budgets' ? (
          <div className="mt-5 space-y-4">
            {rows.budgets.map(([label, value]) => (
              <div key={label}>
                <div className="mb-2 flex items-center justify-between text-[10px]">
                  <span className="text-white/70">{label}</span>
                  <span className={value > 75 ? 'text-white/75' : 'text-[hsl(var(--brand-green))]'}>{value}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/7">
                  <div
                    className={value > 75 ? 'h-full rounded-full bg-white/45' : 'h-full rounded-full bg-[hsl(var(--brand-green))]'}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {type === 'goals' ? (
          <div className="mt-5 space-y-3">
            {rows.goals.map(([label, value, amount]) => (
              <div key={label} className="rounded-xl border border-white/7 bg-white/[0.03] p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-white/85">{label}</p>
                    <p className="mt-1 text-[9px] text-white/35">{amount}</p>
                  </div>
                  <span className="text-xs font-semibold text-[hsl(var(--brand-green))]">{value}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/7">
                  <div className="h-full rounded-full bg-[hsl(var(--brand-green))]" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {type === 'wishlist' ? (
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {rows.wishlist.map(([label, value, priority]) => (
              <div key={label} className="rounded-xl border border-white/7 bg-white/[0.03] p-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-[hsl(var(--brand-green)/0.08)] text-[hsl(var(--brand-green))]">
                  <Heart className="size-4" />
                </span>
                <p className="mt-3 truncate text-xs font-medium text-white/85">{label}</p>
                <p className="mt-1 text-xs font-semibold text-white/75">{value}</p>
                <p className="mt-2 text-[9px] uppercase tracking-[0.12em] text-white/35">Prioridade {priority}</p>
              </div>
            ))}
          </div>
        ) : null}

        {type === 'recurring' ? (
          <div className="mt-5 space-y-2">
            {rows.recurring.map(([label, value, date], index) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-white/7 bg-white/[0.03] p-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--brand-green)/0.08)] text-[hsl(var(--brand-green))]">
                  <CalendarClock className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-white/85">{label}</p>
                  <p className="mt-0.5 text-[9px] text-white/35">{date}</p>
                </div>
                <p className={`text-xs font-semibold ${index === 1 ? 'text-[hsl(var(--brand-green))]' : 'text-white/80'}`}>{value}</p>
              </div>
            ))}
          </div>
        ) : null}

        {type === 'categories' ? (
          <div className="mt-5 space-y-2">
            {rows.categories.map(([label, count], index) => (
              <div key={label} className="flex items-center justify-between rounded-xl border border-white/7 bg-white/[0.03] p-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-white/[0.04] text-white/55">
                    <Tags className="size-4" />
                  </span>
                  <span className="text-xs font-medium text-white/80">{label}</span>
                </div>
                <span className="text-[9px] text-white/35">{count}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
