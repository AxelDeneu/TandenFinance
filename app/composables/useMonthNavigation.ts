export function useMonthNavigation() {
  const now = new Date()
  const route = useRoute()
  const selectedYear = ref(Number(route.query.year) || now.getFullYear())
  const selectedMonth = ref(Number(route.query.month) || (now.getMonth() + 1))

  const selectedMonthLabel = computed(() => {
    const date = new Date(selectedYear.value, selectedMonth.value - 1, 1)
    return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date)
  })

  const monthKey = computed(() => `${selectedYear.value}-${selectedMonth.value}`)

  function previousMonth() {
    if (selectedMonth.value === 1) {
      selectedMonth.value = 12
      selectedYear.value--
    } else {
      selectedMonth.value--
    }
  }

  function nextMonth() {
    if (selectedMonth.value === 12) {
      selectedMonth.value = 1
      selectedYear.value++
    } else {
      selectedMonth.value++
    }
  }

  return { selectedYear, selectedMonth, selectedMonthLabel, monthKey, previousMonth, nextMonth }
}
