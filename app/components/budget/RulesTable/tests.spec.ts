import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { stubNuxtAutoImports } from '../../../../test/helpers/nuxt-stubs'
import type { BudgetRule } from '~/types'

vi.mock('#components', () => ({
  UButton: 'UButton',
  USwitch: 'USwitch',
  UBadge: 'UBadge'
}))

const mockToastAdd = vi.fn()
const mockRefresh = vi.fn()

stubNuxtAutoImports({
  useToast: () => ({ add: mockToastAdd }),
  useFetch: () => ({
    data: ref<BudgetRule[]>([]),
    status: ref('idle'),
    refresh: mockRefresh
  })
})

const { initBudgetRulesTable } = await import('./init')

describe('initBudgetRulesTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all expected properties', () => {
    const result = initBudgetRulesTable()

    expect(result).toHaveProperty('rules')
    expect(result).toHaveProperty('status')
    expect(result).toHaveProperty('refresh')
    expect(result).toHaveProperty('columns')
    expect(result).toHaveProperty('modalOpen')
    expect(result).toHaveProperty('editingRule')
    expect(result).toHaveProperty('openCreateModal')
    expect(result).toHaveProperty('onRuleSaved')
    expect(result).toHaveProperty('evaluateRules')
  })

  it('initializes modal state as closed', () => {
    const { modalOpen, editingRule } = initBudgetRulesTable()

    expect(modalOpen.value).toBe(false)
    expect(editingRule.value).toBeNull()
  })

  it('columns has 4 column definitions', () => {
    const { columns } = initBudgetRulesTable()

    expect(columns).toHaveLength(4)
    expect(columns[0].accessorKey).toBe('label')
    expect(columns[1].accessorKey).toBe('type')
    expect(columns[2].id).toBe('active')
    expect(columns[3].id).toBe('actions')
  })

  it('openCreateModal sets editingRule to null and opens modal', () => {
    const { openCreateModal, modalOpen, editingRule } = initBudgetRulesTable()

    openCreateModal()

    expect(editingRule.value).toBeNull()
    expect(modalOpen.value).toBe(true)
  })

  it('onRuleSaved calls refresh', () => {
    const { onRuleSaved } = initBudgetRulesTable()

    onRuleSaved()

    expect(mockRefresh).toHaveBeenCalled()
  })

  it('evaluateRules calls evaluate endpoint on success with results', async () => {
    const { evaluateRules } = initBudgetRulesTable()
    vi.mocked($fetch).mockResolvedValueOnce({ created: 3 })

    await evaluateRules()

    expect($fetch).toHaveBeenCalledWith('/api/budget/rules/evaluate', { method: 'POST' })
    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ color: 'success' }))
  })

  it('evaluateRules shows info toast when no alerts triggered', async () => {
    const { evaluateRules } = initBudgetRulesTable()
    vi.mocked($fetch).mockResolvedValueOnce({ created: 0 })

    await evaluateRules()

    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ color: 'info' }))
  })

  it('evaluateRules shows error toast on failure', async () => {
    const { evaluateRules } = initBudgetRulesTable()
    vi.mocked($fetch).mockRejectedValueOnce(new Error('fail'))

    await evaluateRules()

    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ color: 'error' }))
  })
})
