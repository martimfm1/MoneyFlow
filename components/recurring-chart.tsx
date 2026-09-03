'use client'

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

const config = {
  monthly: { label: 'Mensal', color: 'var(--chart-1)' },
  quarterly: { label: 'Trimestral', color: 'var(--chart-2)' },
  yearly: { label: 'Anual', color: 'var(--chart-3)' },
} satisfies ChartConfig

export function RecurringChart({
  data,
}: {
  data: { frequency: string; amount: number }[]
}) {
  return (
    <ChartContainer config={config} className="h-[180px] w-full">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="frequency"
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => String(value).slice(0, 3)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="amount" fill="var(--color-monthly)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
