import { h } from 'vue'
import type { Ref } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { ForecastData, ForecastEntry, MonthlySummary } from '~/types'

function computeEffectiveTotal(entries: ForecastEntry[], monthKey: string): number {
  let total = 0
  for (const fe of entries) {
    const actual = fe.actuals[monthKey]
    if (actual !== null && actual !== undefined) {
      total += actual
    } else {
      total += fe.entry.amount
    }
  }
  return total
}

function computeEnvelopeEffectiveTotal(entries: ForecastEntry[], monthKey: string): number {
  let total = 0
  for (const fe of entries) {
    const actual = fe.actuals[monthKey]
    if (actual !== null && actual !== undefined) {
      total += Math.max(actual, fe.entry.amount)
    } else {
      total += fe.entry.amount
    }
  }
  return total
}

export type HistoryChartRecord = {
  month: string
  income: number
  expenses: number
}

interface Context {
  cardRef: Ref<HTMLElement | null>
}

export function initBudgetHistoryView(ctx: Context) {
  const router = useRouter()
  const { width } = useElementSize(ctx.cardRef)

  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1)
  const startYear = startDate.getFullYear()
  const startMonth = startDate.getMonth() + 1

  const { data, status } = useFetch<ForecastData>('/api/budget/forecast', {
    lazy: true,
    query: {
      year: startYear,
      month: startMonth,
      months: 12
    },
    default: () => ({
      months: [],
      incomes: [],
      expenses: [],
      envelopes: []
    })
  })

  const monthlySummaries = computed<MonthlySummary[]>(() => {
    const f = data.value
    if (!f || !f.months.length) return []

    return f.months.map((m) => {
      const key = `${m.year}-${m.month}`
      const formatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
      const date = new Date(m.year, m.month - 1, 1)
      const label = formatter.format(date)

      const incomePlanned = f.incomes.reduce((sum, fe) => sum + fe.entry.amount, 0)
      const incomeEffective = computeEffectiveTotal(f.incomes, key)

      const expensePlanned = f.expenses.reduce((sum, fe) => sum + fe.entry.amount, 0)
      const expenseEffective = computeEffectiveTotal(f.expenses, key)

      const envelopePlanned = f.envelopes.reduce((sum, fe) => sum + fe.entry.amount, 0)
      const envelopeEffective = computeEnvelopeEffectiveTotal(f.envelopes, key)

      const remaining = incomeEffective - expenseEffective - envelopeEffective
      const remainingPlanned = incomePlanned - expensePlanned - envelopePlanned

      return {
        year: m.year,
        month: m.month,
        label,
        incomePlanned,
        incomeEffective,
        expensePlanned,
        expenseEffective,
        envelopePlanned,
        envelopeEffective,
        remaining,
        remainingPlanned
      }
    })
  })

  const chartData = computed<HistoryChartRecord[]>(() => {
    return monthlySummaries.value.map((s) => ({
      month: s.label,
      income: s.incomeEffective,
      expenses: s.expenseEffective + s.envelopeEffective
    }))
  })

  // Unovis accessors
  const x = (_: HistoryChartRecord, i: number) => i
  const yIncome = (d: HistoryChartRecord) => d.income
  const yExpenses = (d: HistoryChartRecord) => d.expenses

  const xTicks = (i: number) => {
    if (!chartData.value[i]) return ''
    return chartData.value[i].month
  }

  const template = (d: HistoryChartRecord) =>
    `<div style="font-size:12px;padding:4px 0">
      <div><strong>${d.month}</strong></div>
      <div style="color:var(--ui-success)">Revenus: ${formatEuro(d.income)}</div>
      <div style="color:var(--ui-error)">Depenses: ${formatEuro(d.expenses)}</div>
      <div>Reste: ${formatEuro(d.income - d.expenses)}</div>
    </div>`

  function navigateToMonth(year: number, month: number) {
    router.push({ path: '/budget/previsionnel', query: { year: String(year), month: String(month) } })
  }

  function varianceCell(effective: number, planned: number, goodWhen: 'gte' | 'lte') {
    const diff = effective - planned
    const isGood = goodWhen === 'gte' ? diff >= 0 : diff <= 0
    const colorClass = isGood ? 'text-success' : 'text-error'
    const sign = diff > 0 ? '+' : ''

    return h('div', {}, [
      h('span', { class: 'tabular-nums font-medium' }, formatEuro(effective)),
      h('span', { class: `tabular-nums text-xs ml-1.5 ${colorClass}` }, `${sign}${formatEuro(diff)}`)
    ])
  }

  const columns: TableColumn<MonthlySummary>[] = [
    {
      accessorKey: 'label',
      header: 'Mois',
      cell: ({ row }) => {
        return h('button', {
          class: 'font-medium text-highlighted hover:underline cursor-pointer',
          onClick: () => navigateToMonth(row.original.year, row.original.month)
        }, row.original.label)
      }
    },
    {
      id: 'income',
      header: 'Revenus',
      cell: ({ row }) => varianceCell(row.original.incomeEffective, row.original.incomePlanned, 'gte')
    },
    {
      id: 'expense',
      header: 'Dépenses',
      cell: ({ row }) => varianceCell(row.original.expenseEffective, row.original.expensePlanned, 'lte')
    },
    {
      id: 'envelope',
      header: 'Enveloppes',
      cell: ({ row }) => varianceCell(row.original.envelopeEffective, row.original.envelopePlanned, 'lte')
    },
    {
      id: 'remaining',
      header: 'Reste',
      cell: ({ row }) => {
        const val = row.original.remaining
        const colorClass = val >= 0 ? 'text-success' : 'text-error'
        return h('span', { class: `tabular-nums font-medium ${colorClass}` }, formatEuro(val))
      }
    }
  ]

  return {
    width,
    data,
    status,
    monthlySummaries,
    chartData,
    columns,
    x,
    yIncome,
    yExpenses,
    xTicks,
    template,
    navigateToMonth
  }
}
