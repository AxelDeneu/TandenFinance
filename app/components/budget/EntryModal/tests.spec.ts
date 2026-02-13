import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { initBudgetEntryModal, budgetEntrySchema, type BudgetEntrySchema } from './init'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { RecurringEntry, EntryType } from '~/types'

const mockToastAdd = vi.fn()

vi.stubGlobal('useToast', () => ({ add: mockToastAdd }))
vi.stubGlobal('$fetch', vi.fn())
vi.stubGlobal('reactive', reactive)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)
vi.stubGlobal('INCOME_CATEGORIES', ['Salaire', 'Freelance', 'Aide', 'Investissements', 'Autre'])
vi.stubGlobal('EXPENSE_CATEGORIES', ['Logement', 'Abonnements', 'Dettes', 'Frais bancaires', 'Assurances', 'Transport', 'Alimentation', 'Loisirs', 'Sante', 'Education', 'Divers'])

function createEntry(overrides: Partial<RecurringEntry> = {}): RecurringEntry {
  return {
    id: 1,
    type: 'expense',
    label: 'Loyer',
    amount: 800,
    category: 'Logement',
    dayOfMonth: 5,
    active: true,
    notes: 'Note test',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    ...overrides
  }
}

function createContext(overrides: { type?: EntryType, entry?: RecurringEntry } = {}) {
  const emit = vi.fn()
  const open = ref(true)
  const props = reactive({
    type: overrides.type ?? 'expense' as EntryType,
    entry: overrides.entry
  })
  return { props, emit, open }
}

describe('budgetEntrySchema', () => {
  it('validates a correct entry', () => {
    const result = budgetEntrySchema.safeParse({
      label: 'Loyer',
      amount: 800,
      category: 'Logement',
      dayOfMonth: 1,
      active: true,
      notes: null
    })
    expect(result.success).toBe(true)
  })

  it('rejects label shorter than 2 chars', () => {
    const result = budgetEntrySchema.safeParse({
      label: 'L',
      amount: 800,
      category: 'Logement',
      dayOfMonth: 1,
      active: true
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative amount', () => {
    const result = budgetEntrySchema.safeParse({
      label: 'Loyer',
      amount: -10,
      category: 'Logement',
      dayOfMonth: 1,
      active: true
    })
    expect(result.success).toBe(false)
  })

  it('rejects dayOfMonth out of range', () => {
    const result = budgetEntrySchema.safeParse({
      label: 'Loyer',
      amount: 800,
      category: 'Logement',
      dayOfMonth: 32,
      active: true
    })
    expect(result.success).toBe(false)
  })
})

describe('initBudgetEntryModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all expected properties', () => {
    const ctx = createContext()
    const result = initBudgetEntryModal(ctx)

    expect(result).toHaveProperty('schema')
    expect(result).toHaveProperty('state')
    expect(result).toHaveProperty('isEdit')
    expect(result).toHaveProperty('modalTitle')
    expect(result).toHaveProperty('categories')
    expect(result).toHaveProperty('onSubmit')
  })

  it('isEdit is false when no entry provided', () => {
    const ctx = createContext()
    const { isEdit } = initBudgetEntryModal(ctx)

    expect(isEdit.value).toBe(false)
  })

  it('isEdit is true when entry provided', () => {
    const ctx = createContext({ entry: createEntry() })
    const { isEdit } = initBudgetEntryModal(ctx)

    expect(isEdit.value).toBe(true)
  })

  it('modalTitle reflects type and edit mode for income', () => {
    const ctx = createContext({ type: 'income' })
    const { modalTitle } = initBudgetEntryModal(ctx)
    expect(modalTitle.value).toBe('Nouveau revenu')
  })

  it('modalTitle reflects type and edit mode for expense edit', () => {
    const ctx = createContext({ type: 'expense', entry: createEntry() })
    const { modalTitle } = initBudgetEntryModal(ctx)
    expect(modalTitle.value).toBe('Modifier la dépense')
  })

  it('categories returns income categories when type is income', () => {
    const ctx = createContext({ type: 'income' })
    const { categories } = initBudgetEntryModal(ctx)

    expect(categories.value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Salaire', value: 'Salaire' })
      ])
    )
  })

  it('categories returns expense categories when type is expense', () => {
    const ctx = createContext({ type: 'expense' })
    const { categories } = initBudgetEntryModal(ctx)

    expect(categories.value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Logement', value: 'Logement' })
      ])
    )
  })

  it('populates state from entry via watch', async () => {
    const entry = createEntry({ label: 'Salaire', amount: 3000, dayOfMonth: 25 })
    const ctx = createContext({ entry })
    const { state } = initBudgetEntryModal(ctx)

    await nextTick()

    expect(state.label).toBe('Salaire')
    expect(state.amount).toBe(3000)
    expect(state.dayOfMonth).toBe(25)
  })

  it('resets state when entry becomes undefined', async () => {
    const ctx = createContext()
    const { state } = initBudgetEntryModal(ctx)

    await nextTick()

    expect(state.label).toBe('')
    expect(state.amount).toBeUndefined()
    expect(state.dayOfMonth).toBe(1)
  })

  it('onSubmit creates new entry via POST', async () => {
    const ctx = createContext({ type: 'income' })
    vi.mocked($fetch).mockResolvedValueOnce(undefined)

    const { onSubmit } = initBudgetEntryModal(ctx)
    await onSubmit({ data: { label: 'Salaire', amount: 3000, category: 'Salaire', dayOfMonth: 25, active: true } } as unknown as FormSubmitEvent<BudgetEntrySchema>)

    expect($fetch).toHaveBeenCalledWith('/api/budget/incomes', {
      method: 'POST',
      body: expect.objectContaining({ label: 'Salaire' })
    })
    expect(ctx.open.value).toBe(false)
    expect(ctx.emit).toHaveBeenCalledWith('saved')
  })

  it('onSubmit updates existing entry via PUT', async () => {
    const entry = createEntry({ id: 7 })
    const ctx = createContext({ type: 'expense', entry })
    vi.mocked($fetch).mockResolvedValueOnce(undefined)

    const { onSubmit } = initBudgetEntryModal(ctx)
    await onSubmit({ data: { label: 'Loyer', amount: 850, category: 'Logement', dayOfMonth: 1, active: true } } as unknown as FormSubmitEvent<BudgetEntrySchema>)

    expect($fetch).toHaveBeenCalledWith('/api/budget/expenses/7', {
      method: 'PUT',
      body: expect.objectContaining({ label: 'Loyer' })
    })
    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ color: 'success' }))
  })

  it('onSubmit shows error toast on failure', async () => {
    const ctx = createContext({ type: 'expense' })
    vi.mocked($fetch).mockRejectedValueOnce(new Error('fail'))

    const { onSubmit } = initBudgetEntryModal(ctx)
    await onSubmit({ data: { label: 'Loyer', amount: 800, category: 'Logement', dayOfMonth: 1, active: true } } as unknown as FormSubmitEvent<BudgetEntrySchema>)

    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ color: 'error' }))
    expect(ctx.open.value).toBe(true)
    expect(ctx.emit).not.toHaveBeenCalled()
  })
})
