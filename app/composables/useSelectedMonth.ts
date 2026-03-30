import { createSharedComposable, useLocalStorage } from '@vueuse/core'

function toYYYYMM(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function parseYYYYMM(value: string): [number, number] {
  const [y, m] = value.split('-')
  return [Number(y), Number(m)]
}

const _useSelectedMonth = () => {
  const now = new Date()
  const selectedMonth = useLocalStorage('selected-month', toYYYYMM(now.getFullYear(), now.getMonth() + 1))

  const selectedMonthLabel = computed(() => {
    const [year, month] = parseYYYYMM(selectedMonth.value)
    const date = new Date(year, month - 1, 1)
    return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date)
  })

  function previousMonth() {
    const [year, month] = parseYYYYMM(selectedMonth.value)
    selectedMonth.value = month === 1
      ? toYYYYMM(year - 1, 12)
      : toYYYYMM(year, month - 1)
  }

  function nextMonth() {
    const [year, month] = parseYYYYMM(selectedMonth.value)
    selectedMonth.value = month === 12
      ? toYYYYMM(year + 1, 1)
      : toYYYYMM(year, month + 1)
  }

  return {
    selectedMonth,
    selectedMonthLabel,
    previousMonth,
    nextMonth
  }
}

export const useSelectedMonth = createSharedComposable(_useSelectedMonth)
