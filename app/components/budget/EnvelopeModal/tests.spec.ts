import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, reactive, nextTick } from 'vue'
import { stubNuxtAutoImports } from '../../../../test/helpers/nuxt-stubs'
import { initBudgetEnvelopeModal, budgetEnvelopeSchema, type BudgetEnvelopeSchema } from './init'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { RecurringEntry } from '~/types'

const mockToastAdd = vi.fn()

stubNuxtAutoImports({
  useToast: () => ({ add: mockToastAdd })
})

function createEntry(overrides: Partial<RecurringEntry> = {}): RecurringEntry {
  return {
    id: 1,
    type: 'envelope',
    label: 'Courses',
    amount: 500,
    category: null,
    dayOfMonth: null,
    active: true,
    notes: 'Budget courses',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    ...overrides
  }
}

function createContext(overrides: { entry?: RecurringEntry } = {}) {
  const emit = vi.fn()
  const open = ref(true)
  const props = reactive({
    entry: overrides.entry
  })
  return { props, emit, open }
}

describe('budgetEnvelopeSchema', () => {
  it('validates a correct envelope', () => {
    const result = budgetEnvelopeSchema.safeParse({
      label: 'Courses',
      amount: 500,
      active: true,
      notes: null
    })
    expect(result.success).toBe(true)
  })

  it('rejects label shorter than 2 chars', () => {
    const result = budgetEnvelopeSchema.safeParse({
      label: 'C',
      amount: 500,
      active: true
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative amount', () => {
    const result = budgetEnvelopeSchema.safeParse({
      label: 'Courses',
      amount: -10,
      active: true
    })
    expect(result.success).toBe(false)
  })

  it('does not require category or dayOfMonth', () => {
    const result = budgetEnvelopeSchema.safeParse({
      label: 'Courses',
      amount: 500
    })
    expect(result.success).toBe(true)
  })
})

describe('initBudgetEnvelopeModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all expected properties', () => {
    const ctx = createContext()
    const result = initBudgetEnvelopeModal(ctx)

    expect(result).toHaveProperty('schema')
    expect(result).toHaveProperty('state')
    expect(result).toHaveProperty('isEdit')
    expect(result).toHaveProperty('modalTitle')
    expect(result).toHaveProperty('onSubmit')
  })

  it('isEdit is false when no entry provided', () => {
    const ctx = createContext()
    const { isEdit } = initBudgetEnvelopeModal(ctx)

    expect(isEdit.value).toBe(false)
  })

  it('isEdit is true when entry provided', () => {
    const ctx = createContext({ entry: createEntry() })
    const { isEdit } = initBudgetEnvelopeModal(ctx)

    expect(isEdit.value).toBe(true)
  })

  it('modalTitle for new envelope', () => {
    const ctx = createContext()
    const { modalTitle } = initBudgetEnvelopeModal(ctx)
    expect(modalTitle.value).toBe('Nouvelle enveloppe')
  })

  it('modalTitle for edit envelope', () => {
    const ctx = createContext({ entry: createEntry() })
    const { modalTitle } = initBudgetEnvelopeModal(ctx)
    expect(modalTitle.value).toBe('Modifier l\'enveloppe')
  })

  it('populates state from entry via watch', async () => {
    const entry = createEntry({ label: 'Sorties', amount: 200 })
    const ctx = createContext({ entry })
    const { state } = initBudgetEnvelopeModal(ctx)

    await nextTick()

    expect(state.label).toBe('Sorties')
    expect(state.amount).toBe(200)
  })

  it('onSubmit creates new envelope via POST', async () => {
    const ctx = createContext()
    vi.mocked($fetch).mockResolvedValueOnce(undefined)

    const { onSubmit } = initBudgetEnvelopeModal(ctx)
    await onSubmit({ data: { label: 'Courses', amount: 500, active: true } } as unknown as FormSubmitEvent<BudgetEnvelopeSchema>)

    expect($fetch).toHaveBeenCalledWith('/api/budget/envelopes', {
      method: 'POST',
      body: expect.objectContaining({ label: 'Courses' })
    })
    expect(ctx.open.value).toBe(false)
    expect(ctx.emit).toHaveBeenCalledWith('saved')
  })

  it('onSubmit updates existing envelope via PUT', async () => {
    const entry = createEntry({ id: 5 })
    const ctx = createContext({ entry })
    vi.mocked($fetch).mockResolvedValueOnce(undefined)

    const { onSubmit } = initBudgetEnvelopeModal(ctx)
    await onSubmit({ data: { label: 'Courses', amount: 600, active: true } } as unknown as FormSubmitEvent<BudgetEnvelopeSchema>)

    expect($fetch).toHaveBeenCalledWith('/api/budget/envelopes/5', {
      method: 'PUT',
      body: expect.objectContaining({ label: 'Courses' })
    })
    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ color: 'success' }))
  })

  it('onSubmit shows error toast on failure', async () => {
    const ctx = createContext()
    vi.mocked($fetch).mockRejectedValueOnce(new Error('fail'))

    const { onSubmit } = initBudgetEnvelopeModal(ctx)
    await onSubmit({ data: { label: 'Courses', amount: 500, active: true } } as unknown as FormSubmitEvent<BudgetEnvelopeSchema>)

    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ color: 'error' }))
    expect(ctx.open.value).toBe(true)
    expect(ctx.emit).not.toHaveBeenCalled()
  })
})
