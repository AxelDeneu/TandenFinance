import { createSharedComposable } from '@vueuse/core'

function toYYYYMM(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function parseYYYYMM(value: string): [number, number] {
  const [y, m] = value.split('-')
  return [Number(y), Number(m)]
}

const _useSelectedMonth = () => {
  const now = new Date()
  const defaultMonth = toYYYYMM(now.getFullYear(), now.getMonth() + 1)

  const { data } = useFetch<{ value: string }>('/api/settings/selected-month', {
    default: () => ({ value: defaultMonth })
  })

  const selectedMonth = computed(() => data.value.value)

  const selectedMonthLabel = computed(() => {
    const [year, month] = parseYYYYMM(selectedMonth.value)
    const date = new Date(year, month - 1, 1)
    return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date)
  })

  async function setMonth(value: string) {
    data.value = { value }
    await $fetch('/api/settings/selected-month', { method: 'PUT', body: { value } })
  }

  function previousMonth() {
    const [year, month] = parseYYYYMM(selectedMonth.value)
    const newValue = month === 1 ? toYYYYMM(year - 1, 12) : toYYYYMM(year, month - 1)
    setMonth(newValue)
  }

  function nextMonth() {
    const [year, month] = parseYYYYMM(selectedMonth.value)
    const newValue = month === 12 ? toYYYYMM(year + 1, 1) : toYYYYMM(year, month + 1)
    setMonth(newValue)
  }

  return {
    selectedMonth,
    selectedMonthLabel,
    setMonth,
    previousMonth,
    nextMonth
  }
}

export const useSelectedMonth = createSharedComposable(_useSelectedMonth)
