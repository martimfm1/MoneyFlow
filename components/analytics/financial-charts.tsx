'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '@/lib/format'

type MonthlyPoint = {
  label: string
  income: number
  expense: number
}

type CategoryPoint = {
  name: string
  value: number
}

type FinancialChartsProps = {
  monthly: MonthlyPoint[]
  categories: CategoryPoint[]
  currency: string
}

const tooltipFormatter = (value: number | undefined, currency: string) =>
  value === undefined ? '' : formatCurrency(value, currency)

export function FinancialCharts({
  monthly,
  categories,
  currency,
}: FinancialChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
      <section className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm sm:p-6">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Últimos 6 meses
          </p>
          <h2 className="mt-1 text-lg font-semibold">Receitas vs despesas</h2>
        </div>
        <div className="mt-6 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthly}
              margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) =>
                  formatCurrency(Number(value), currency)
                }
              />
              <Tooltip
                formatter={(value, name) => [
                  tooltipFormatter(Number(value), currency),
                  name === 'income' ? 'Receitas' : 'Despesas',
                ]}
              />
              <Bar dataKey="income" name="income" radius={[5, 5, 0, 0]} />
              <Bar dataKey="expense" name="expense" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm sm:p-6">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Período atual
          </p>
          <h2 className="mt-1 text-lg font-semibold">Despesas por categoria</h2>
        </div>
        {categories.length ? (
          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={94}
                  paddingAngle={2}
                >
                  {categories.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    tooltipFormatter(Number(value), currency)
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-6 flex min-h-72 items-center justify-center rounded-[var(--radius-md)] border border-dashed px-6 text-center">
            <p className="max-w-xs text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              Ainda não existem despesas categorizadas no mês atual.
            </p>
          </div>
        )}
        {categories.length ? (
          <div className="mt-4 grid gap-2">
            {categories.slice(0, 6).map((category) => (
              <div
                key={category.name}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="truncate">{category.name}</span>
                <span className="shrink-0 font-medium tabular-nums">
                  {formatCurrency(category.value, currency)}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}
