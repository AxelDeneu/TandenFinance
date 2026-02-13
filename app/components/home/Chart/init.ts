import type { Ref } from 'vue'
import type { ForecastData, ForecastEntry } from '~/types'

export type ChartDataRecord = {
  month: string
  income: number
  expenses: number
}

interface Context {
  cardRef: Ref<HTMLElement | null>
}

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

export function initHomeChart(ctx: Context) {
  const { width } = useElementSize(ctx.cardRef)

  const { data: forecast } = useFetch<ForecastData>('/api/budget/forecast', {
    query: { months: 6 },
    default: () => ({
      months: [],
      incomes: [],
      expenses: [],
      envelopes: []
    })
  })

  const chartData = computed<ChartDataRecord[]>(() => {
    const f = forecast.value
    if (!f || !f.months.length) return []

    return f.months.map((m) => {
      const key = `${m.year}-${m.month}`
      const income = computeEffectiveTotal(f.incomes, key)
      const expenseTotal = computeEffectiveTotal(f.expenses, key)
      const envelopeTotal = computeEnvelopeEffectiveTotal(f.envelopes, key)

      const formatter = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' })
      const date = new Date(m.year, m.month - 1, 1)

      return {
        month: formatter.format(date),
        income,
        expenses: expenseTotal + envelopeTotal
      }
    })
  })

  const currentMonthRemaining = computed(() => {
    const f = forecast.value
    if (!f || !f.months.length) return 0

    const now = new Date()
    const key = `${now.getFullYear()}-${now.getMonth() + 1}`
    const income = computeEffectiveTotal(f.incomes, key)
    const expenseTotal = computeEffectiveTotal(f.expenses, key)
    const envelopeTotal = computeEnvelopeEffectiveTotal(f.envelopes, key)

    return income - expenseTotal - envelopeTotal
  })

  const x = (_: ChartDataRecord, i: number) => i
  const yIncome = (d: ChartDataRecord) => d.income
  const yExpenses = (d: ChartDataRecord) => d.expenses

  const xTicks = (i: number) => {
    if (!chartData.value[i]) return ''
    return chartData.value[i].month
  }

  const template = (d: ChartDataRecord) =>
    `<div style="font-size:12px;padding:4px 0">
      <div><strong>${d.month}</strong></div>
      <div style="color:var(--ui-success)">Revenus: ${formatEuro(d.income)}</div>
      <div style="color:var(--ui-error)">Depenses: ${formatEuro(d.expenses)}</div>
      <div>Reste: ${formatEuro(d.income - d.expenses)}</div>
    </div>`

  return {
    width,
    chartData,
    currentMonthRemaining,
    x,
    yIncome,
    yExpenses,
    xTicks,
    template
  }
}
