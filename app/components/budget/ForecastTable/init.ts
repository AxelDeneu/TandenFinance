import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { UButton, UBadge, BudgetForecastCell, BudgetEnvelopeExpenseCell } from '#components'
import type { ForecastData, ForecastEntry, EntryType } from '~/types'

export function initBudgetForecastTable() {
  const now = new Date()
  const selectedYear = ref(now.getFullYear())
  const selectedMonth = ref(now.getMonth() + 1)

  const selectedMonthLabel = computed(() => {
    const date = new Date(selectedYear.value, selectedMonth.value - 1, 1)
    return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date)
  })

  const monthKey = computed(() => `${selectedYear.value}-${selectedMonth.value}`)

  const { data, status, refresh } = useFetch<ForecastData>('/api/budget/forecast', {
    lazy: true,
    query: computed(() => ({
      year: selectedYear.value,
      month: selectedMonth.value,
      months: 1
    })),
    default: () => ({
      months: [],
      incomes: [],
      expenses: [],
      envelopes: []
    })
  })

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

  function getCategoryColorMap(type: EntryType): Record<string, string> {
    if (type === 'income') return INCOME_CATEGORY_COLORS
    if (type === 'expense') return EXPENSE_CATEGORY_COLORS
    return {}
  }

  function getColumns(type: EntryType): TableColumn<ForecastEntry>[] {
    const colorMap = getCategoryColorMap(type)

    return [
      {
        accessorFn: (row: ForecastEntry) => row.entry.label,
        id: 'label',
        header: ({ column }) => {
          const isSorted = column.getIsSorted()

          return h(UButton, {
            color: 'neutral',
            variant: 'ghost',
            label: 'Libellé',
            icon: isSorted
              ? isSorted === 'asc'
                ? 'i-lucide-arrow-up-narrow-wide'
                : 'i-lucide-arrow-down-wide-narrow'
              : 'i-lucide-arrow-up-down',
            class: '-mx-2.5',
            onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
          })
        },
        cell: ({ row }) => {
          return h('span', { class: 'font-medium text-highlighted' }, row.original.entry.label)
        }
      },
      {
        accessorFn: (row: ForecastEntry) => row.entry.category,
        id: 'category',
        header: 'Catégorie',
        cell: ({ row }) => {
          const category = row.original.entry.category
          if (!category) return h('span', { class: 'text-muted' }, '-')

          if (type === 'envelope') {
            return h(UBadge, {
              variant: 'subtle',
              color: ENVELOPE_COLOR as 'warning'
            }, () => category)
          }

          const color = (colorMap[category] || 'neutral') as 'neutral' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
          return h(UBadge, { variant: 'subtle', color }, () => category)
        }
      },
      {
        id: 'planned',
        header: 'Prévu',
        cell: ({ row }) => {
          return h('span', { class: 'tabular-nums' }, formatEuro(row.original.entry.amount))
        }
      },
      {
        id: 'actual',
        header: 'Réel',
        cell: ({ row }) => {
          return h(BudgetForecastCell, {
            plannedAmount: row.original.entry.amount,
            actualAmount: row.original.actuals[monthKey.value] ?? null,
            entryId: row.original.entry.id,
            year: selectedYear.value,
            month: selectedMonth.value,
            onSaved: () => refresh(),
            onCleared: () => refresh()
          })
        }
      },
      {
        id: 'variance',
        header: 'Écart',
        cell: ({ row }) => {
          const actual = row.original.actuals[monthKey.value]
          if (actual === null || actual === undefined) {
            return h('span', { class: 'text-muted' }, '—')
          }

          const planned = row.original.entry.amount
          const diff = actual - planned
          const isPositive = diff > 0

          // For expenses/envelopes: positive diff means over budget (bad), negative means under (good)
          // For incomes: positive diff means earned more (good), negative means earned less (bad)
          const isGood = type === 'income' ? diff >= 0 : diff <= 0
          const colorClass = isGood ? 'text-success' : 'text-error'

          return h('span', {
            class: `tabular-nums font-medium ${colorClass}`
          }, `${isPositive ? '+' : ''}${formatEuro(diff)}`)
        }
      }
    ]
  }

  function getEnvelopeColumns(): TableColumn<ForecastEntry>[] {
    return [
      {
        accessorFn: (row: ForecastEntry) => row.entry.label,
        id: 'label',
        header: ({ column }) => {
          const isSorted = column.getIsSorted()

          return h(UButton, {
            color: 'neutral',
            variant: 'ghost',
            label: 'Libellé',
            icon: isSorted
              ? isSorted === 'asc'
                ? 'i-lucide-arrow-up-narrow-wide'
                : 'i-lucide-arrow-down-wide-narrow'
              : 'i-lucide-arrow-up-down',
            class: '-mx-2.5',
            onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
          })
        },
        cell: ({ row }) => {
          return h('span', { class: 'font-medium text-highlighted' }, row.original.entry.label)
        }
      },
      {
        id: 'planned',
        header: 'Prévu',
        cell: ({ row }) => {
          return h('span', { class: 'tabular-nums' }, formatEuro(row.original.entry.amount))
        }
      },
      {
        id: 'actual',
        header: 'Réel',
        cell: ({ row }) => {
          return h(BudgetEnvelopeExpenseCell, {
            plannedAmount: row.original.entry.amount,
            actualAmount: row.original.actuals[monthKey.value] ?? null,
            entryId: row.original.entry.id,
            year: selectedYear.value,
            month: selectedMonth.value,
            entryLabel: row.original.entry.label,
            onUpdated: () => refresh()
          })
        }
      },
      {
        id: 'variance',
        header: 'Écart',
        cell: ({ row }) => {
          const actual = row.original.actuals[monthKey.value]
          if (actual === null || actual === undefined) {
            return h('span', { class: 'text-muted' }, '—')
          }

          const planned = row.original.entry.amount
          const diff = actual - planned
          const isPositive = diff > 0

          // For envelopes: positive diff means over budget (bad), negative means under (good)
          const colorClass = diff <= 0 ? 'text-success' : 'text-error'

          return h('span', {
            class: `tabular-nums font-medium ${colorClass}`
          }, `${isPositive ? '+' : ''}${formatEuro(diff)}`)
        }
      }
    ]
  }

  const incomeColumns = getColumns('income')
  const expenseColumns = getColumns('expense')
  const envelopeColumns = getEnvelopeColumns()

  const incomes = computed(() => data.value?.incomes ?? [])
  const expenses = computed(() => data.value?.expenses ?? [])
  const envelopes = computed(() => data.value?.envelopes ?? [])

  function computeSectionTotals(entries: Ref<ForecastEntry[]>) {
    return computed(() => {
      const key = monthKey.value
      let planned = 0
      let actual = 0
      let hasAnyActual = false

      for (const fe of entries.value) {
        planned += fe.entry.amount
        const act = fe.actuals[key]
        if (act !== null && act !== undefined) {
          actual += act
          hasAnyActual = true
        } else {
          actual += fe.entry.amount
        }
      }

      return {
        planned,
        actual,
        effective: hasAnyActual ? actual : planned,
        variance: actual - planned
      }
    })
  }

  function computeEnvelopeTotals(entries: Ref<ForecastEntry[]>) {
    return computed(() => {
      const key = monthKey.value
      let planned = 0
      let effective = 0

      for (const fe of entries.value) {
        planned += fe.entry.amount
        const act = fe.actuals[key]
        if (act !== null && act !== undefined) {
          // For envelopes: effective = max(actual, planned)
          // Budget is reserved even if not fully spent, but overspend counts
          effective += Math.max(act, fe.entry.amount)
        } else {
          effective += fe.entry.amount
        }
      }

      return {
        planned,
        actual: entries.value.reduce((sum, fe) => {
          const act = fe.actuals[key]
          return sum + (act ?? 0)
        }, 0),
        effective,
        variance: effective - planned
      }
    })
  }

  const incomeTotals = computeSectionTotals(incomes)
  const expenseTotals = computeSectionTotals(expenses)
  const envelopeTotals = computeEnvelopeTotals(envelopes)

  const remaining = computed(() => {
    return incomeTotals.value.effective - expenseTotals.value.effective - envelopeTotals.value.effective
  })

  return {
    selectedYear,
    selectedMonth,
    selectedMonthLabel,
    monthKey,
    data,
    status,
    refresh,
    previousMonth,
    nextMonth,
    incomeColumns,
    expenseColumns,
    envelopeColumns,
    incomes,
    expenses,
    envelopes,
    incomeTotals,
    expenseTotals,
    envelopeTotals,
    remaining
  }
}
