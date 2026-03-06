import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { UBadge, UIcon } from '#components'
import { sortableHeader } from '~/utils/table'
import type { ForecastData, ForecastEntry, EntryType, RecurringEntry } from '~/types'

export function initBudgetForecastTable() {
  const { selectedYear, selectedMonth, selectedMonthLabel, monthKey, previousMonth, nextMonth } = useMonthNavigation()

  const selectedEntry = ref<RecurringEntry | null>(null)
  const entryDetailOpen = ref(false)

  function openEntryDetail(forecastEntry: ForecastEntry) {
    selectedEntry.value = forecastEntry.entry
    entryDetailOpen.value = true
  }

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

  function getCategoryColorMap(type: EntryType): Record<string, UiColor> {
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
        header: sortableHeader('Libellé'),
        cell: ({ row }) => {
          return h('button', {
            class: 'font-medium text-highlighted hover:underline cursor-pointer',
            onClick: () => openEntryDetail(row.original)
          }, row.original.entry.label)
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
              color: ENVELOPE_COLOR as UiColor
            }, () => category)
          }

          const color: UiColor = colorMap[category] || 'neutral'
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
          const actual = row.original.actuals[monthKey.value]
          if (actual === null || actual === undefined) {
            return h('span', { class: 'text-muted' }, '—')
          }
          return h('span', { class: 'tabular-nums font-medium' }, formatEuro(actual))
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
        header: sortableHeader('Libellé'),
        cell: ({ row }) => {
          const actual = row.original.actuals[monthKey.value]
          const planned = row.original.entry.amount
          const isOverBudget = actual !== null && actual !== undefined && actual > planned

          const children = [
            h('button', {
              class: 'font-medium text-highlighted hover:underline cursor-pointer',
              onClick: () => openEntryDetail(row.original)
            }, row.original.entry.label)
          ]

          if (isOverBudget) {
            children.push(h(UIcon, {
              name: 'i-lucide-triangle-alert',
              class: 'text-error text-sm ml-1.5'
            }))
          }

          return h('div', { class: 'flex items-center' }, children)
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
          const actual = row.original.actuals[monthKey.value]
          if (actual === null || actual === undefined) {
            return h('span', { class: 'text-muted' }, '—')
          }

          const planned = row.original.entry.amount
          const percent = planned > 0 ? (actual / planned) * 100 : 0
          const colorClass = percent > 100 ? 'bg-error' : percent >= 75 ? 'bg-warning' : 'bg-success'

          return h('div', { class: 'flex flex-col gap-1' }, [
            h('span', { class: 'tabular-nums font-medium' }, formatEuro(actual)),
            h('div', { class: 'h-1.5 w-full bg-default rounded-full overflow-hidden' }, [
              h('div', {
                class: `h-full rounded-full ${colorClass}`,
                style: { width: `${Math.min(percent, 100)}%` }
              })
            ])
          ])
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
    remaining,
    selectedEntry,
    entryDetailOpen
  }
}
