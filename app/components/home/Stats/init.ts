import type { ForecastData, ForecastEntry } from '~/types'

export interface HomeStat {
  title: string
  icon: string
  value: string
  count: number
  color: 'success' | 'error' | 'warning'
}

export const leadingClasses: Record<string, string> = {
  success: 'p-2.5 rounded-full bg-success/10 ring ring-inset ring-success/25 flex-col',
  error: 'p-2.5 rounded-full bg-error/10 ring ring-inset ring-error/25 flex-col',
  warning: 'p-2.5 rounded-full bg-warning/10 ring ring-inset ring-warning/25 flex-col'
}

export function computeEffectiveTotal(entries: ForecastEntry[], monthKey: string): number {
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

export function computeEnvelopeEffectiveTotal(entries: ForecastEntry[], monthKey: string): number {
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

export async function initHomeStats() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const { data: forecast } = await useAsyncData<ForecastData>('home-stats-forecast', () =>
    $fetch('/api/budget/forecast', {
      query: { year, month, months: 1 }
    })
  , {
    default: () => ({
      months: [],
      incomes: [],
      expenses: [],
      envelopes: []
    })
  })

  const monthKey = `${year}-${month}`

  const stats = computed<HomeStat[]>(() => {
    const f = forecast.value
    if (!f) return []

    const incomeTotal = computeEffectiveTotal(f.incomes, monthKey)
    const expenseTotal = computeEffectiveTotal(f.expenses, monthKey)
    const envelopeTotal = computeEnvelopeEffectiveTotal(f.envelopes, monthKey)
    const remaining = incomeTotal - expenseTotal - envelopeTotal

    return [
      {
        title: 'Revenus',
        icon: 'i-lucide-trending-up',
        value: formatEuro(incomeTotal),
        count: f.incomes.length,
        color: 'success'
      },
      {
        title: 'Depenses',
        icon: 'i-lucide-trending-down',
        value: formatEuro(expenseTotal),
        count: f.expenses.length,
        color: 'error'
      },
      {
        title: 'Enveloppes',
        icon: 'i-lucide-wallet',
        value: formatEuro(envelopeTotal),
        count: f.envelopes.length,
        color: 'warning'
      },
      {
        title: 'Reste a vivre',
        icon: 'i-lucide-piggy-bank',
        value: formatEuro(remaining),
        count: f.incomes.length + f.expenses.length + f.envelopes.length,
        color: remaining >= 0 ? 'success' : 'error'
      }
    ]
  })

  return { stats, leadingClasses }
}
