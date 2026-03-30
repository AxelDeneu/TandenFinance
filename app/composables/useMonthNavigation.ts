export function useMonthNavigation() {
  const { selectedMonth: selectedMonthStr, selectedMonthLabel, previousMonth, nextMonth } = useSelectedMonth()

  const parsed = computed(() => {
    const [y, m] = selectedMonthStr.value.split('-')
    return { year: Number(y), month: Number(m) }
  })

  const selectedYear = computed(() => parsed.value.year)
  const selectedMonth = computed(() => parsed.value.month)
  const monthKey = computed(() => `${parsed.value.year}-${parsed.value.month}`)

  return { selectedYear, selectedMonth, selectedMonthLabel, monthKey, previousMonth, nextMonth }
}
