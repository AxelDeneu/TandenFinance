import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed, watch, reactive } from 'vue'
import type { Transaction } from '~/types'

const mockTransactions: Transaction[] = [
  { id: 1, label: 'Salaire', amount: 3000, type: 'income', date: '2026-03-25', recurringEntryId: 1, recurringEntry: { id: 1, type: 'income', label: 'Salaire', amount: 3000, category: 'Salaire', dayOfMonth: 25, active: true, notes: null, createdAt: '', updatedAt: '' }, notes: null, createdAt: '', updatedAt: '' },
  { id: 2, label: 'Courses Carrefour', amount: 85.50, type: 'expense', date: '2026-03-12', recurringEntryId: 3, recurringEntry: { id: 3, type: 'envelope', label: 'Courses', amount: 500, category: null, dayOfMonth: null, active: true, notes: null, createdAt: '', updatedAt: '' }, notes: null, createdAt: '', updatedAt: '' },
  { id: 3, label: 'Imprévu garage', amount: 150, type: 'expense', date: '2026-03-15', recurringEntryId: null, recurringEntry: null, notes: 'Réparation voiture', createdAt: '', updatedAt: '' },
  { id: 4, label: 'Loyer', amount: 800, type: 'expense', date: '2026-03-05', recurringEntryId: 2, recurringEntry: { id: 2, type: 'expense', label: 'Loyer', amount: 800, category: 'Logement', dayOfMonth: 5, active: true, notes: null, createdAt: '', updatedAt: '' }, notes: null, createdAt: '', updatedAt: '' }
]

const mockRefresh = vi.fn()

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)
vi.stubGlobal('reactive', reactive)
vi.stubGlobal('formatEuro', (v: number) => `${v.toFixed(2)} €`)
vi.stubGlobal('INCOME_CATEGORY_COLORS', { Salaire: 'success' })
vi.stubGlobal('EXPENSE_CATEGORY_COLORS', { Logement: 'warning' })
vi.stubGlobal('ENVELOPE_COLOR', 'warning')
vi.stubGlobal('useRoute', () => ({ query: {} }))
vi.stubGlobal('useToast', () => ({ add: vi.fn() }))
vi.stubGlobal('$fetch', vi.fn())
vi.stubGlobal('useFetch', () => ({
  data: ref(mockTransactions),
  status: ref('idle'),
  refresh: mockRefresh
}))

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

  it('filters by category (recurringEntryId)', () => {
    const { categoryFilter, filteredTransactions } = initBudgetAccountingView()

    // Filter uncategorized
    categoryFilter.value = 0
    expect(filteredTransactions.value).toHaveLength(1)
    expect(filteredTransactions.value[0].label).toBe('Imprévu garage')

    // Filter by specific entry
    categoryFilter.value = 1
    expect(filteredTransactions.value).toHaveLength(1)
    expect(filteredTransactions.value[0].label).toBe('Salaire')

    categoryFilter.value = null
    expect(filteredTransactions.value).toHaveLength(4)
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
