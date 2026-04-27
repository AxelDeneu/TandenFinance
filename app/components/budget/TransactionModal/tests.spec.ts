import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { stubNuxtAutoImports } from '../../../../test/helpers/nuxt-stubs'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Transaction, RecurringEntry, Category } from '~/types'
import type { TransactionSchema } from './init'

const mockIncomes: RecurringEntry[] = [
  { id: 1, type: 'income', label: 'Salaire', amount: 3000, category: 'Salaire', categoryId: 11, dayOfMonth: 25, active: true, notes: null, createdAt: '', updatedAt: '' }
]

const mockExpenses: RecurringEntry[] = [
  { id: 2, type: 'expense', label: 'Loyer', amount: 800, category: 'Logement', categoryId: 12, dayOfMonth: 5, active: true, notes: null, createdAt: '', updatedAt: '' }
]

const mockEnvelopes: RecurringEntry[] = [
  { id: 3, type: 'envelope', label: 'Courses', amount: 500, category: null, categoryId: 13, dayOfMonth: null, active: true, notes: null, createdAt: '', updatedAt: '' }
]

const mockCategories: Category[] = [
  { id: 11, name: 'Salaire', icon: 'i-lucide-briefcase', color: '#4ADE80', type: 'income', sortOrder: 10, createdAt: '', updatedAt: '' },
  { id: 12, name: 'Logement', icon: 'i-lucide-home', color: '#60A5FA', type: 'expense', sortOrder: 20, createdAt: '', updatedAt: '' },
  { id: 13, name: 'Courses', icon: 'i-lucide-shopping-cart', color: '#1FB578', type: 'expense', sortOrder: 30, createdAt: '', updatedAt: '' }
]

stubNuxtAutoImports({
  useFetch: (url: string) => {
    if (url.includes('categories')) return { data: ref(mockCategories), status: ref('idle') }
    if (url.includes('incomes')) return { data: ref(mockIncomes), status: ref('idle') }
    if (url.includes('expenses')) return { data: ref(mockExpenses), status: ref('idle') }
    if (url.includes('envelopes')) return { data: ref(mockEnvelopes), status: ref('idle') }
    return { data: ref([]), status: ref('idle') }
  }
})

const { initTransactionModal } = await import('./init')

describe('initTransactionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createContext(transaction?: Transaction | null) {
    return {
      props: { transaction: transaction ?? undefined },
      emit: vi.fn(),
      open: ref(true)
    }
  }

  it('returns all expected properties', () => {
    const ctx = createContext()
    const result = initTransactionModal(ctx)

    expect(result).toHaveProperty('schema')
    expect(result).toHaveProperty('state')
    expect(result).toHaveProperty('isEdit')
    expect(result).toHaveProperty('modalTitle')
    expect(result).toHaveProperty('recurringOptions')
    expect(result).toHaveProperty('filteredRecurringOptions')
    expect(result).toHaveProperty('categories')
    expect(result).toHaveProperty('onSubmit')
  })

  it('isEdit is false for new transaction', () => {
    const ctx = createContext()
    const { isEdit } = initTransactionModal(ctx)
    expect(isEdit.value).toBe(false)
  })

  it('isEdit is true when editing', () => {
    const transaction: Transaction = {
      id: 1, label: 'Test', amount: 50, type: 'expense', date: '2026-03-01',
      recurringEntryId: null, notes: null, createdAt: '', updatedAt: ''
    }
    const ctx = createContext(transaction)
    const { isEdit } = initTransactionModal(ctx)
    expect(isEdit.value).toBe(true)
  })

  it('modalTitle shows "Nouvelle transaction" for create', () => {
    const ctx = createContext()
    const { modalTitle } = initTransactionModal(ctx)
    expect(modalTitle.value).toBe('Nouvelle transaction')
  })

  it('modalTitle shows "Modifier la transaction" for edit', () => {
    const transaction: Transaction = {
      id: 1, label: 'Test', amount: 50, type: 'expense', date: '2026-03-01',
      recurringEntryId: null, notes: null, createdAt: '', updatedAt: ''
    }
    const ctx = createContext(transaction)
    const { modalTitle } = initTransactionModal(ctx)
    expect(modalTitle.value).toBe('Modifier la transaction')
  })

  it('state defaults to expense type with today date', () => {
    const ctx = createContext()
    const { state } = initTransactionModal(ctx)

    expect(state.type).toBe('expense')
    expect(state.label).toBe('')
    expect(state.amount).toBeUndefined()
    expect(state.recurringEntryId).toBeNull()
    expect(state.date).toBe(new Date().toISOString().slice(0, 10))
  })

  it('state is populated when editing', () => {
    const transaction: Transaction = {
      id: 1, label: 'Courses', amount: 85.50, type: 'expense', date: '2026-03-12',
      recurringEntryId: 3, notes: 'Test note', createdAt: '', updatedAt: ''
    }
    const ctx = createContext(transaction)
    const { state } = initTransactionModal(ctx)

    expect(state.label).toBe('Courses')
    expect(state.amount).toBe(85.50)
    expect(state.type).toBe('expense')
    expect(state.date).toBe('2026-03-12')
    expect(state.recurringEntryId).toBe(3)
    expect(state.notes).toBe('Test note')
  })

  it('recurringOptions includes entries from all types', () => {
    const ctx = createContext()
    const { recurringOptions } = initTransactionModal(ctx)

    expect(recurringOptions.value).toHaveLength(3)
    expect(recurringOptions.value.find(o => o.label === 'Salaire')).toBeDefined()
    expect(recurringOptions.value.find(o => o.label === 'Loyer')).toBeDefined()
    expect(recurringOptions.value.find(o => o.label === 'Courses')).toBeDefined()
  })

  it('recurringOptions groups entries correctly', () => {
    const ctx = createContext()
    const { recurringOptions } = initTransactionModal(ctx)

    const salaire = recurringOptions.value.find(o => o.label === 'Salaire')
    expect(salaire?.group).toBe('Revenus')
    expect(salaire?.type).toBe('income')

    const loyer = recurringOptions.value.find(o => o.label === 'Loyer')
    expect(loyer?.group).toBe('Dépenses')
    expect(loyer?.type).toBe('expense')

    const courses = recurringOptions.value.find(o => o.label === 'Courses')
    expect(courses?.group).toBe('Enveloppes')
    expect(courses?.type).toBe('expense')
  })

  it('recurringOptions resolves categoryName via FK', () => {
    const ctx = createContext()
    const { recurringOptions } = initTransactionModal(ctx)

    const loyer = recurringOptions.value.find(o => o.label === 'Loyer')
    expect(loyer?.categoryId).toBe(12)
    expect(loyer?.categoryName).toBe('Logement')
  })

  it('auto-selects income type when income recurring entry is chosen', async () => {
    const ctx = createContext()
    const { state } = initTransactionModal(ctx)

    state.type = 'expense'
    state.recurringEntryId = 1 // Salaire (income)

    await new Promise(resolve => setTimeout(resolve, 0))
    expect(state.type).toBe('income')
  })

  it('auto-selects expense type when expense recurring entry is chosen', async () => {
    const ctx = createContext()
    const { state } = initTransactionModal(ctx)

    state.type = 'income'
    state.recurringEntryId = 2 // Loyer (expense)

    await new Promise(resolve => setTimeout(resolve, 0))
    expect(state.type).toBe('expense')
  })

  it('onSubmit POST for new transaction', async () => {
    const ctx = createContext()
    vi.mocked($fetch).mockResolvedValueOnce(undefined)
    const { onSubmit } = initTransactionModal(ctx)
    await onSubmit({ data: { label: 'Test', amount: 50, type: 'expense', date: '2026-03-01', recurringEntryId: null, notes: '' } } as FormSubmitEvent<TransactionSchema>)
    expect($fetch).toHaveBeenCalledWith('/api/budget/transactions', { method: 'POST', body: expect.objectContaining({ label: 'Test' }) })
    expect(ctx.open.value).toBe(false)
    expect(ctx.emit).toHaveBeenCalledWith('saved')
  })

  it('onSubmit PUT for existing transaction', async () => {
    const transaction: Transaction = {
      id: 5, label: 'Old', amount: 50, type: 'expense', date: '2026-03-01',
      recurringEntryId: null, notes: null, createdAt: '', updatedAt: ''
    }
    const ctx = createContext(transaction)
    vi.mocked($fetch).mockResolvedValueOnce(undefined)
    const { onSubmit } = initTransactionModal(ctx)
    await onSubmit({ data: { label: 'Updated', amount: 75, type: 'expense', date: '2026-03-01', recurringEntryId: null, notes: '' } } as FormSubmitEvent<TransactionSchema>)
    expect($fetch).toHaveBeenCalledWith('/api/budget/transactions/5', { method: 'PUT', body: expect.objectContaining({ label: 'Updated' }) })
  })

  it('onSubmit shows error toast on failure', async () => {
    const ctx = createContext()
    vi.mocked($fetch).mockRejectedValueOnce(new Error('fail'))
    const { onSubmit } = initTransactionModal(ctx)
    await onSubmit({ data: { label: 'Test', amount: 50, type: 'expense', date: '2026-03-01' } } as FormSubmitEvent<TransactionSchema>)
    expect(ctx.open.value).toBe(true)
    expect(ctx.emit).not.toHaveBeenCalled()
  })

  it('existingLabels is available', () => {
    const ctx = createContext()
    const { existingLabels } = initTransactionModal(ctx)
    expect(existingLabels).toBeDefined()
  })
})
