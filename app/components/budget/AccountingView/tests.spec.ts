import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { stubNuxtAutoImports } from '../../../../test/helpers/nuxt-stubs'
import type { Transaction } from '~/types'

const mockTransactions: Transaction[] = [
  { id: 1, label: 'Salaire', amount: 3000, type: 'income', date: '2026-03-25', recurringEntryId: 1, recurringEntry: { id: 1, type: 'income', label: 'Salaire', amount: 3000, category: 'Salaire', dayOfMonth: 25, active: true, notes: null, createdAt: '', updatedAt: '' }, notes: null, createdAt: '', updatedAt: '' },
  { id: 2, label: 'Courses Carrefour', amount: 85.50, type: 'expense', date: '2026-03-12', recurringEntryId: 3, recurringEntry: { id: 3, type: 'envelope', label: 'Courses', amount: 500, category: null, dayOfMonth: null, active: true, notes: null, createdAt: '', updatedAt: '' }, notes: null, createdAt: '', updatedAt: '' },
  { id: 3, label: 'Imprévu garage', amount: 150, type: 'expense', date: '2026-03-15', recurringEntryId: null, recurringEntry: null, notes: 'Réparation voiture', createdAt: '', updatedAt: '' },
  { id: 4, label: 'Loyer', amount: 800, type: 'expense', date: '2026-03-05', recurringEntryId: 2, recurringEntry: { id: 2, type: 'expense', label: 'Loyer', amount: 800, category: 'Logement', dayOfMonth: 5, active: true, notes: null, createdAt: '', updatedAt: '' }, notes: null, createdAt: '', updatedAt: '' }
]

const mockRefresh = vi.fn()

stubNuxtAutoImports({
  useFetch: () => ({
    data: ref(mockTransactions),
    status: ref('idle'),
    refresh: mockRefresh
  })
})

vi.mock('#components', () => ({
  UBadge: {},
  UButton: {}
}))

const { initBudgetAccountingView } = await import('./init')

describe('initBudgetAccountingView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all expected properties', () => {
    const result = initBudgetAccountingView()

    const expectedKeys = [
      'selectedYear', 'selectedMonth', 'selectedMonthLabel',
      'previousMonth', 'nextMonth',
      'transactions', 'status', 'refresh',
      'typeFilter', 'categoryFilter', 'searchQuery',
      'availableCategories', 'amountMin', 'amountMax',
      'uncategorizedOnly', 'activeFilterCount',
      'hasActiveFilters', 'resetFilters',
      'filteredTransactions', 'paginatedTransactions',
      'page', 'totalPages',
      'totalIncome', 'totalExpense', 'balance',
      'modalOpen', 'editingTransaction',
      'openCreateModal', 'openEditModal', 'deleteTransaction',
      'onTransactionSaved', 'columns'
    ]

    for (const key of expectedKeys) {
      expect(result).toHaveProperty(key)
    }
  })

  it('initializes year/month to current date', () => {
    const now = new Date()
    const { selectedYear, selectedMonth } = initBudgetAccountingView()

    expect(selectedYear.value).toBe(now.getFullYear())
    expect(selectedMonth.value).toBe(now.getMonth() + 1)
  })

  it('computes totalIncome correctly', () => {
    const { totalIncome } = initBudgetAccountingView()
    // Only Salaire (3000) is income
    expect(totalIncome.value).toBe(3000)
  })

  it('computes totalExpense correctly', () => {
    const { totalExpense } = initBudgetAccountingView()
    // Courses (85.50) + Imprévu (150) + Loyer (800) = 1035.50
    expect(totalExpense.value).toBe(1035.50)
  })

  it('computes balance as income minus expense', () => {
    const { balance } = initBudgetAccountingView()
    // 3000 - 1035.50 = 1964.50
    expect(balance.value).toBe(1964.50)
  })

  it('filters by type', () => {
    const { typeFilter, filteredTransactions } = initBudgetAccountingView()

    typeFilter.value = 'income'
    expect(filteredTransactions.value).toHaveLength(1)
    expect(filteredTransactions.value[0].label).toBe('Salaire')

    typeFilter.value = 'expense'
    expect(filteredTransactions.value).toHaveLength(3)

    typeFilter.value = 'all'
    expect(filteredTransactions.value).toHaveLength(4)
  })

  it('filters by search query', () => {
    const { searchQuery, filteredTransactions } = initBudgetAccountingView()

    searchQuery.value = 'carrefour'
    expect(filteredTransactions.value).toHaveLength(1)
    expect(filteredTransactions.value[0].label).toBe('Courses Carrefour')

    searchQuery.value = ''
    expect(filteredTransactions.value).toHaveLength(4)
  })

  it('filters by category string', () => {
    const { categoryFilter, filteredTransactions } = initBudgetAccountingView()

    categoryFilter.value = 'Salaire'
    expect(filteredTransactions.value).toHaveLength(1)
    expect(filteredTransactions.value[0].label).toBe('Salaire')

    categoryFilter.value = 'Logement'
    expect(filteredTransactions.value).toHaveLength(1)
    expect(filteredTransactions.value[0].label).toBe('Loyer')

    categoryFilter.value = undefined
    expect(filteredTransactions.value).toHaveLength(4)
  })

  it('filters uncategorized only', () => {
    const { uncategorizedOnly, filteredTransactions } = initBudgetAccountingView()

    uncategorizedOnly.value = true
    expect(filteredTransactions.value).toHaveLength(1)
    expect(filteredTransactions.value[0].label).toBe('Imprévu garage')

    uncategorizedOnly.value = false
    expect(filteredTransactions.value).toHaveLength(4)
  })

  it('searches in notes too', () => {
    const { searchQuery, filteredTransactions } = initBudgetAccountingView()

    searchQuery.value = 'voiture'
    expect(filteredTransactions.value).toHaveLength(1)
    expect(filteredTransactions.value[0].label).toBe('Imprévu garage')

    searchQuery.value = ''
    expect(filteredTransactions.value).toHaveLength(4)
  })

  it('filters by amount min', () => {
    const { amountMin, filteredTransactions } = initBudgetAccountingView()

    amountMin.value = 200
    expect(filteredTransactions.value).toHaveLength(2)
    expect(filteredTransactions.value.map(t => t.label).sort()).toEqual(['Loyer', 'Salaire'])

    amountMin.value = null
    expect(filteredTransactions.value).toHaveLength(4)
  })

  it('filters by amount max', () => {
    const { amountMax, filteredTransactions } = initBudgetAccountingView()

    amountMax.value = 100
    expect(filteredTransactions.value).toHaveLength(1)
    expect(filteredTransactions.value[0].label).toBe('Courses Carrefour')

    amountMax.value = null
    expect(filteredTransactions.value).toHaveLength(4)
  })

  it('filters by amount range', () => {
    const { amountMin, amountMax, filteredTransactions } = initBudgetAccountingView()

    amountMin.value = 100
    amountMax.value = 800
    expect(filteredTransactions.value).toHaveLength(2)
    expect(filteredTransactions.value.map(t => t.label).sort()).toEqual(['Imprévu garage', 'Loyer'])

    amountMin.value = null
    amountMax.value = null
  })

  it('computes availableCategories from transactions', () => {
    const { availableCategories } = initBudgetAccountingView()

    const values = availableCategories.value.map(c => c.value)
    expect(values).not.toContain('')
    expect(values).toContain('Salaire')
    expect(values).toContain('Logement')
    // Envelope has no category
    expect(values).not.toContain(null)
  })

  it('computes hasActiveFilters correctly', () => {
    const { hasActiveFilters, typeFilter, amountMin } = initBudgetAccountingView()

    expect(hasActiveFilters.value).toBe(false)

    typeFilter.value = 'income'
    expect(hasActiveFilters.value).toBe(true)

    typeFilter.value = 'all'
    expect(hasActiveFilters.value).toBe(false)

    amountMin.value = 50
    expect(hasActiveFilters.value).toBe(true)
    amountMin.value = null
  })

  it('computes activeFilterCount for secondary filters', () => {
    const { activeFilterCount, amountMin, amountMax, uncategorizedOnly } = initBudgetAccountingView()

    expect(activeFilterCount.value).toBe(0)

    amountMin.value = 10
    expect(activeFilterCount.value).toBe(1)

    amountMax.value = 500
    expect(activeFilterCount.value).toBe(2)

    uncategorizedOnly.value = true
    expect(activeFilterCount.value).toBe(3)

    amountMin.value = null
    amountMax.value = null
    uncategorizedOnly.value = false
  })

  it('resetFilters clears all filters', () => {
    const { resetFilters, typeFilter, categoryFilter, searchQuery, amountMin, amountMax, uncategorizedOnly } = initBudgetAccountingView()

    typeFilter.value = 'income'
    categoryFilter.value = 'Salaire'
    searchQuery.value = 'test'
    amountMin.value = 10
    amountMax.value = 500
    uncategorizedOnly.value = true

    resetFilters()

    expect(typeFilter.value).toBe('all')
    expect(categoryFilter.value).toBeUndefined()
    expect(searchQuery.value).toBe('')
    expect(amountMin.value).toBeNull()
    expect(amountMax.value).toBeNull()
    expect(uncategorizedOnly.value).toBe(false)
  })

  it('paginates correctly', () => {
    const { paginatedTransactions, totalPages } = initBudgetAccountingView()

    // 4 items, 10 per page => 1 page
    expect(totalPages.value).toBe(1)
    expect(paginatedTransactions.value).toHaveLength(4)
  })

  it('month navigation works', () => {
    const { selectedYear, selectedMonth, previousMonth, nextMonth } = initBudgetAccountingView()

    selectedYear.value = 2026
    selectedMonth.value = 6

    previousMonth()
    expect(selectedMonth.value).toBe(5)

    nextMonth()
    expect(selectedMonth.value).toBe(6)
  })

  it('month navigation rolls over year boundaries', () => {
    const { selectedYear, selectedMonth, previousMonth, nextMonth } = initBudgetAccountingView()

    selectedYear.value = 2026
    selectedMonth.value = 1
    previousMonth()
    expect(selectedMonth.value).toBe(12)
    expect(selectedYear.value).toBe(2025)

    selectedYear.value = 2026
    selectedMonth.value = 12
    nextMonth()
    expect(selectedMonth.value).toBe(1)
    expect(selectedYear.value).toBe(2027)
  })

  it('openCreateModal sets editingTransaction to null and opens modal', () => {
    const { modalOpen, editingTransaction, openCreateModal } = initBudgetAccountingView()

    openCreateModal()
    expect(modalOpen.value).toBe(true)
    expect(editingTransaction.value).toBeNull()
  })

  it('openEditModal sets editingTransaction and opens modal', () => {
    const { modalOpen, editingTransaction, openEditModal } = initBudgetAccountingView()

    openEditModal(mockTransactions[0])
    expect(modalOpen.value).toBe(true)
    expect(editingTransaction.value).toStrictEqual(mockTransactions[0])
  })

  it('returns table columns', () => {
    const { columns } = initBudgetAccountingView()

    expect(Array.isArray(columns)).toBe(true)
    expect(columns.length).toBe(5) // date, label, category, amount, actions
  })
})
