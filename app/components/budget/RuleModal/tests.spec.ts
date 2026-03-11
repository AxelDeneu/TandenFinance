import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, reactive, nextTick } from 'vue'
import { stubNuxtAutoImports } from '../../../../test/helpers/nuxt-stubs'
import { initBudgetRuleModal, budgetRuleSchema, type BudgetRuleSchema } from './init'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { BudgetRule } from '~/types'

const mockToastAdd = vi.fn()

stubNuxtAutoImports({
  useToast: () => ({ add: mockToastAdd }),
  useFetch: () => ({ data: ref([]) })
})

function createRule(overrides: Partial<BudgetRule> = {}): BudgetRule {
  return {
    id: 1,
    label: 'Alerte reste à vivre',
    type: 'remaining_low',
    config: JSON.stringify({ threshold: 500 }),
    active: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    ...overrides
  }
}

function createContext(overrides: { rule?: BudgetRule | null } = {}) {
  const emit = vi.fn()
  const open = ref(true)
  const props = reactive({
    rule: overrides.rule ?? undefined
  })
  return { props, emit, open }
}

describe('budgetRuleSchema', () => {
  it('validates a correct remaining_low rule', () => {
    const result = budgetRuleSchema.safeParse({
      label: 'Alerte RAV',
      type: 'remaining_low',
      threshold: 500
    })
    expect(result.success).toBe(true)
  })

  it('validates a correct category_threshold rule', () => {
    const result = budgetRuleSchema.safeParse({
      label: 'Alerte Restaurant',
      type: 'category_threshold',
      threshold: 200,
      category: 'Restaurant'
    })
    expect(result.success).toBe(true)
  })

  it('validates a correct envelope_exceeded rule', () => {
    const result = budgetRuleSchema.safeParse({
      label: 'Enveloppe courses',
      type: 'envelope_exceeded',
      envelopeId: 5
    })
    expect(result.success).toBe(true)
  })

  it('rejects label shorter than 2 chars', () => {
    const result = budgetRuleSchema.safeParse({
      label: 'A',
      type: 'remaining_low'
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid type', () => {
    const result = budgetRuleSchema.safeParse({
      label: 'Test',
      type: 'unknown_type'
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative threshold', () => {
    const result = budgetRuleSchema.safeParse({
      label: 'Test',
      type: 'remaining_low',
      threshold: -100
    })
    expect(result.success).toBe(false)
  })

  it('accepts missing optional fields', () => {
    const result = budgetRuleSchema.safeParse({
      label: 'Test rule',
      type: 'remaining_low'
    })
    expect(result.success).toBe(true)
  })
})

describe('initBudgetRuleModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all expected properties', () => {
    const ctx = createContext()
    const result = initBudgetRuleModal(ctx)

    expect(result).toHaveProperty('schema')
    expect(result).toHaveProperty('state')
    expect(result).toHaveProperty('isEdit')
    expect(result).toHaveProperty('modalTitle')
    expect(result).toHaveProperty('typeOptions')
    expect(result).toHaveProperty('categoryOptions')
    expect(result).toHaveProperty('envelopeOptions')
    expect(result).toHaveProperty('onSubmit')
  })

  it('isEdit is false when no rule provided', () => {
    const ctx = createContext()
    const { isEdit } = initBudgetRuleModal(ctx)
    expect(isEdit.value).toBe(false)
  })

  it('isEdit is true when rule provided', () => {
    const ctx = createContext({ rule: createRule() })
    const { isEdit } = initBudgetRuleModal(ctx)
    expect(isEdit.value).toBe(true)
  })

  it('modalTitle is "Nouvelle règle" for creation', () => {
    const ctx = createContext()
    const { modalTitle } = initBudgetRuleModal(ctx)
    expect(modalTitle.value).toBe('Nouvelle règle')
  })

  it('modalTitle is "Modifier la règle" for edit', () => {
    const ctx = createContext({ rule: createRule() })
    const { modalTitle } = initBudgetRuleModal(ctx)
    expect(modalTitle.value).toBe('Modifier la règle')
  })

  it('populates state from rule via watch', async () => {
    const rule = createRule({ label: 'Test', type: 'category_threshold', config: JSON.stringify({ category: 'Restaurant', threshold: 200 }) })
    const ctx = createContext({ rule })
    const { state } = initBudgetRuleModal(ctx)

    await nextTick()

    expect(state.label).toBe('Test')
    expect(state.type).toBe('category_threshold')
    expect(state.threshold).toBe(200)
    expect(state.category).toBe('Restaurant')
  })

  it('resets state when rule is undefined', async () => {
    const ctx = createContext()
    const { state } = initBudgetRuleModal(ctx)

    await nextTick()

    expect(state.label).toBe('')
    expect(state.type).toBe('remaining_low')
    expect(state.threshold).toBeUndefined()
  })

  it('typeOptions contains all three types', () => {
    const ctx = createContext()
    const { typeOptions } = initBudgetRuleModal(ctx)

    expect(typeOptions).toHaveLength(3)
    expect(typeOptions.map(o => o.value)).toEqual(['remaining_low', 'envelope_exceeded', 'category_threshold'])
  })

  it('onSubmit creates new rule via POST', async () => {
    const ctx = createContext()
    vi.mocked($fetch).mockResolvedValueOnce(undefined)

    const { onSubmit, state } = initBudgetRuleModal(ctx)
    state.type = 'remaining_low'
    state.threshold = 500

    await onSubmit({ data: { label: 'Test', type: 'remaining_low', threshold: 500 } } as unknown as FormSubmitEvent<BudgetRuleSchema>)

    expect($fetch).toHaveBeenCalledWith('/api/budget/rules', {
      method: 'POST',
      body: expect.objectContaining({ label: 'Test', type: 'remaining_low' })
    })
    expect(ctx.open.value).toBe(false)
    expect(ctx.emit).toHaveBeenCalledWith('saved')
  })

  it('onSubmit updates existing rule via PUT', async () => {
    const rule = createRule({ id: 5 })
    const ctx = createContext({ rule })
    vi.mocked($fetch).mockResolvedValueOnce(undefined)

    const { onSubmit, state } = initBudgetRuleModal(ctx)
    state.type = 'remaining_low'
    state.threshold = 300

    await onSubmit({ data: { label: 'Updated', type: 'remaining_low', threshold: 300 } } as unknown as FormSubmitEvent<BudgetRuleSchema>)

    expect($fetch).toHaveBeenCalledWith('/api/budget/rules/5', {
      method: 'PUT',
      body: expect.objectContaining({ label: 'Updated' })
    })
    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ color: 'success' }))
  })

  it('onSubmit shows error toast on failure', async () => {
    const ctx = createContext()
    vi.mocked($fetch).mockRejectedValueOnce(new Error('fail'))

    const { onSubmit } = initBudgetRuleModal(ctx)
    await onSubmit({ data: { label: 'Test', type: 'remaining_low' } } as unknown as FormSubmitEvent<BudgetRuleSchema>)

    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ color: 'error' }))
    expect(ctx.open.value).toBe(true)
    expect(ctx.emit).not.toHaveBeenCalled()
  })

  it('buildConfig for remaining_low produces correct JSON', async () => {
    const ctx = createContext()
    vi.mocked($fetch).mockResolvedValueOnce(undefined)
    const { onSubmit, state } = initBudgetRuleModal(ctx)
    state.type = 'remaining_low'
    state.threshold = 500
    await onSubmit({ data: { label: 'Test', type: 'remaining_low', threshold: 500 } } as unknown as FormSubmitEvent<BudgetRuleSchema>)
    expect($fetch).toHaveBeenCalledWith('/api/budget/rules', {
      method: 'POST',
      body: expect.objectContaining({ config: JSON.stringify({ threshold: 500 }) })
    })
  })

  it('buildConfig for envelope_exceeded produces correct JSON', async () => {
    const ctx = createContext()
    vi.mocked($fetch).mockResolvedValueOnce(undefined)
    const { onSubmit, state } = initBudgetRuleModal(ctx)
    state.type = 'envelope_exceeded'
    state.envelopeId = 3
    await onSubmit({ data: { label: 'Test', type: 'envelope_exceeded', envelopeId: 3 } } as unknown as FormSubmitEvent<BudgetRuleSchema>)
    expect($fetch).toHaveBeenCalledWith('/api/budget/rules', {
      method: 'POST',
      body: expect.objectContaining({ config: JSON.stringify({ envelopeId: 3 }) })
    })
  })

  it('buildConfig for category_threshold produces correct JSON', async () => {
    const ctx = createContext()
    vi.mocked($fetch).mockResolvedValueOnce(undefined)
    const { onSubmit, state } = initBudgetRuleModal(ctx)
    state.type = 'category_threshold'
    state.category = 'Restaurant'
    state.threshold = 200
    await onSubmit({ data: { label: 'Test', type: 'category_threshold', category: 'Restaurant', threshold: 200 } } as unknown as FormSubmitEvent<BudgetRuleSchema>)
    expect($fetch).toHaveBeenCalledWith('/api/budget/rules', {
      method: 'POST',
      body: expect.objectContaining({ config: JSON.stringify({ category: 'Restaurant', threshold: 200 }) })
    })
  })

  it('watch handles invalid JSON config gracefully', async () => {
    const rule = createRule({ config: 'invalid json' })
    const ctx = createContext({ rule })
    const { state } = initBudgetRuleModal(ctx)
    await nextTick()
    expect(state.threshold).toBeUndefined()
    expect(state.category).toBe('')
  })

  it('categoryOptions maps EXPENSE_CATEGORIES', () => {
    const ctx = createContext()
    const { categoryOptions } = initBudgetRuleModal(ctx)
    expect(categoryOptions.value.length).toBeGreaterThan(0)
    expect(categoryOptions.value[0]).toHaveProperty('label')
    expect(categoryOptions.value[0]).toHaveProperty('value')
  })
})
