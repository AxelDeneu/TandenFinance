import type { AnalyticsSummary } from '~/types'

export function initAnalyticsSummary() {
  const { data: summary, status } = useFetch<AnalyticsSummary>('/api/budget/analytics/summary', {
    query: { months: 12 },
    lazy: true,
    default: () => ({
      averageMonthlyIncome: 0,
      averageMonthlyExpense: 0,
      averageMonthlySavings: 0,
      savingsRate: 0,
      topGrowingCategories: [],
      topShrinkingCategories: [],
      bestMonth: { label: '-', savings: 0 },
      worstMonth: { label: '-', savings: 0 }
    })
  })

  const cards = computed(() => [
    {
      title: 'Revenu moyen',
      value: formatEuro(summary.value.averageMonthlyIncome),
      icon: 'i-lucide-trending-up',
      color: 'success' as const
    },
    {
      title: 'Dépense moyenne',
      value: formatEuro(summary.value.averageMonthlyExpense),
      icon: 'i-lucide-trending-down',
      color: 'error' as const
    },
    {
      title: 'Épargne moyenne',
      value: formatEuro(summary.value.averageMonthlySavings),
      icon: 'i-lucide-piggy-bank',
      color: summary.value.averageMonthlySavings >= 0 ? 'success' as const : 'error' as const
    },
    {
      title: 'Taux d\'épargne',
      value: `${summary.value.savingsRate}%`,
      icon: 'i-lucide-percent',
      color: summary.value.savingsRate >= 0 ? 'success' as const : 'error' as const
    },
    {
      title: 'Meilleur mois',
      value: summary.value.bestMonth.label,
      subtitle: formatEuro(summary.value.bestMonth.savings),
      icon: 'i-lucide-trophy',
      color: 'success' as const
    },
    {
      title: 'Pire mois',
      value: summary.value.worstMonth.label,
      subtitle: formatEuro(summary.value.worstMonth.savings),
      icon: 'i-lucide-alert-circle',
      color: 'error' as const
    }
  ])

  return { summary, status, cards }
}
