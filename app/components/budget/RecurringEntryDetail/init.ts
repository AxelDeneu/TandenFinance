import type { RecurringEntry, Transaction } from '~/types'

export function initRecurringEntryDetail(props: {
  entry: Ref<RecurringEntry | null>
  year: Ref<number>
  month: Ref<number>
}) {
  const { data: transactions, status } = useFetch<Transaction[]>('/api/budget/transactions', {
    lazy: true,
    query: computed(() => ({
      year: props.year.value,
      month: props.month.value
    })),
    default: () => []
  })

  const filteredTransactions = computed(() => {
    if (!props.entry.value) return []
    return transactions.value
      .filter(t => t.recurringEntryId === props.entry.value!.id)
      .sort((a, b) => b.date.localeCompare(a.date))
  })

  const totalSpent = computed(() =>
    filteredTransactions.value.reduce((sum, t) => sum + t.amount, 0)
  )

  const budgetRemaining = computed(() => {
    if (!props.entry.value) return 0
    return props.entry.value.amount - totalSpent.value
  })

  const progressPercent = computed(() => {
    if (!props.entry.value || props.entry.value.amount === 0) return 0
    return (totalSpent.value / props.entry.value.amount) * 100
  })

  const progressColor = computed(() => {
    const pct = progressPercent.value
    if (pct > 100) return 'error'
    if (pct >= 75) return 'warning'
    return 'success'
  })

  return {
    filteredTransactions,
    totalSpent,
    budgetRemaining,
    progressPercent,
    progressColor,
    status
  }
}
