import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { UBadge, UButton } from '#components'
import { sortableHeader } from '~/utils/table'
import type { Transaction } from '~/types'

export function initBudgetAccountingView() {
  const { selectedYear, selectedMonth, selectedMonthLabel, previousMonth, nextMonth } = useMonthNavigation()

  const { data: transactions, status, refresh } = useFetch<Transaction[]>('/api/budget/transactions', {
    lazy: true,
    query: computed(() => ({
      year: selectedYear.value,
      month: selectedMonth.value
    })),
    default: () => []
  })

  // Filters
  const typeFilter = ref<'all' | 'income' | 'expense'>('all')
  const categoryFilter = ref<string | null>(null)
  const searchQuery = ref('')
  const amountMin = ref<number | null>(null)
  const amountMax = ref<number | null>(null)
  const uncategorizedOnly = ref(false)

  const availableCategories = computed(() => {
    const cats = new Set<string>()
    for (const t of transactions.value) {
      const cat = t.recurringEntry?.category
      if (cat) cats.add(cat)
    }
    return Array.from(cats).sort().map(c => ({ label: c, value: c }))
  })

  const filteredTransactions = computed(() => {
    let result = transactions.value

    if (typeFilter.value !== 'all') {
      result = result.filter(t => t.type === typeFilter.value)
    }

    if (uncategorizedOnly.value) {
      result = result.filter(t => t.recurringEntryId === null)
    } else if (categoryFilter.value) {
      result = result.filter(t => t.recurringEntry?.category === categoryFilter.value)
    }

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(t =>
        t.label.toLowerCase().includes(q)
        || (t.notes && t.notes.toLowerCase().includes(q))
      )
    }

    if (amountMin.value !== null) {
      result = result.filter(t => t.amount >= amountMin.value!)
    }

    if (amountMax.value !== null) {
      result = result.filter(t => t.amount <= amountMax.value!)
    }

    return result
  })

  const activeFilterCount = computed(() => {
    let count = 0
    if (amountMin.value !== null) count++
    if (amountMax.value !== null) count++
    if (uncategorizedOnly.value) count++
    return count
  })

  const hasActiveFilters = computed(() => {
    return typeFilter.value !== 'all'
      || !!categoryFilter.value
      || searchQuery.value !== ''
      || amountMin.value !== null
      || amountMax.value !== null
      || uncategorizedOnly.value
  })

  function resetFilters() {
    typeFilter.value = 'all'
    categoryFilter.value = null
    searchQuery.value = ''
    amountMin.value = null
    amountMax.value = null
    uncategorizedOnly.value = false
  }

  // Pagination
  const page = ref(1)
  const pageSize = 10

  const paginatedTransactions = computed(() => {
    const start = (page.value - 1) * pageSize
    return filteredTransactions.value.slice(start, start + pageSize)
  })

  const totalPages = computed(() => Math.max(1, Math.ceil(filteredTransactions.value.length / pageSize)))

  // Reset page when filters change
  watch([typeFilter, categoryFilter, searchQuery, amountMin, amountMax, uncategorizedOnly, selectedYear, selectedMonth], () => {
    page.value = 1
  })

  // Totals
  const totalIncome = computed(() => {
    return transactions.value
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
  })

  const totalExpense = computed(() => {
    return transactions.value
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  })

  const balance = computed(() => totalIncome.value - totalExpense.value)

  // Modals
  const modalOpen = ref(false)
  const editingTransaction = ref<Transaction | null>(null)
  const importModalOpen = ref(false)

  function openCreateModal() {
    editingTransaction.value = null
    modalOpen.value = true
  }

  function openEditModal(transaction: Transaction) {
    editingTransaction.value = transaction
    modalOpen.value = true
  }

  async function deleteTransaction(transaction: Transaction) {
    const toast = useToast()
    try {
      await $fetch(`/api/budget/transactions/${transaction.id}`, { method: 'DELETE' })
      toast.add({
        title: 'Succès',
        description: `La transaction "${transaction.label}" a été supprimée`,
        color: 'success'
      })
      refresh()
    } catch {
      toast.add({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        color: 'error'
      })
    }
  }

  function onTransactionSaved() {
    refresh()
  }

  // Category colors from recurring entries
  function getCategoryBadge(transaction: Transaction): { label: string, color: UiColor } {
    const entry = transaction.recurringEntry
    if (!entry) {
      return { label: 'Non catégorisé', color: 'neutral' }
    }

    let color: UiColor = 'neutral'
    if (entry.type === 'income' || entry.type === 'expense') {
      color = getCategoryColor(entry.category ?? '', entry.type)
    } else if (entry.type === 'envelope') {
      color = ENVELOPE_COLOR as UiColor
    }

    return { label: entry.label, color }
  }

  // Table columns
  const columns: TableColumn<Transaction>[] = [
    {
      accessorKey: 'date',
      header: sortableHeader('Date'),
      cell: ({ row }) => {
        const d = new Date(row.original.date)
        return h('span', { class: 'tabular-nums text-muted' },
          new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' }).format(d)
        )
      }
    },
    {
      accessorKey: 'label',
      header: sortableHeader('Libellé'),
      cell: ({ row }) => {
        return h('span', { class: 'font-medium text-highlighted' }, row.original.label)
      }
    },
    {
      id: 'category',
      header: 'Catégorie',
      cell: ({ row }) => {
        const badge = getCategoryBadge(row.original)
        return h(UBadge, {
          variant: 'subtle',
          color: badge.color
        }, () => badge.label)
      }
    },
    {
      accessorKey: 'amount',
      header: 'Montant',
      cell: ({ row }) => {
        const isIncome = row.original.type === 'income'
        const sign = isIncome ? '+' : '-'
        const colorClass = isIncome ? 'text-success' : 'text-error'
        return h('span', {
          class: `tabular-nums font-medium ${colorClass}`
        }, `${sign}${formatEuro(row.original.amount)}`)
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return h('div', { class: 'flex items-center gap-1 justify-end' }, [
          h(UButton, {
            icon: 'i-lucide-pencil',
            color: 'neutral',
            variant: 'ghost',
            size: 'xs',
            onClick: () => openEditModal(row.original)
          }),
          h(UButton, {
            icon: 'i-lucide-trash-2',
            color: 'error',
            variant: 'ghost',
            size: 'xs',
            onClick: () => deleteTransaction(row.original)
          })
        ])
      }
    }
  ]

  function onImported() {
    refresh()
  }

  return {
    selectedYear,
    selectedMonth,
    selectedMonthLabel,
    previousMonth,
    nextMonth,
    transactions,
    status,
    refresh,
    typeFilter,
    categoryFilter,
    searchQuery,
    filteredTransactions,
    paginatedTransactions,
    page,
    totalPages,
    totalIncome,
    totalExpense,
    balance,
    availableCategories,
    amountMin,
    amountMax,
    uncategorizedOnly,
    activeFilterCount,
    hasActiveFilters,
    resetFilters,
    modalOpen,
    editingTransaction,
    importModalOpen,
    openCreateModal,
    openEditModal,
    deleteTransaction,
    onTransactionSaved,
    onImported,
    columns
  }
}
