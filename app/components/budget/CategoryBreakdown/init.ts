import type { CategoryBreakdownItem } from '~/types'

interface BreakdownResponse {
  expenses: CategoryBreakdownItem[]
  incomes: CategoryBreakdownItem[]
}

export function initCategoryBreakdown() {
  const { selectedYear, selectedMonth } = useMonthNavigation()

  const { data, status } = useFetch<BreakdownResponse>('/api/budget/analytics/category-breakdown', {
    lazy: true,
    query: computed(() => ({
      year: selectedYear.value,
      month: selectedMonth.value
    })),
    default: () => ({ expenses: [], incomes: [] })
  })

  const selectedType = ref<'expenses' | 'incomes'>('expenses')

  const breakdown = computed(() =>
    selectedType.value === 'expenses' ? (data.value?.expenses ?? []) : (data.value?.incomes ?? [])
  )

  const total = computed(() =>
    breakdown.value.reduce((s, item) => s + item.amount, 0)
  )

  return {
    selectedType,
    breakdown,
    total,
    status
  }
}
