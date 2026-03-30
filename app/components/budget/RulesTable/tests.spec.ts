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

interface TestVNode {
  type: unknown
  props: Record<string, unknown>
  children: TestVNode[] | string
}

interface CellColumn {
  cell: (ctx: { row: { original: BudgetRule, getValue: (k: string) => unknown } }) => TestVNode
  [key: string]: unknown
}

function renderColumn(columns: unknown[], index: number, rule: BudgetRule): TestVNode {
  const col = columns[index] as CellColumn
  const mockRow = { original: rule, getValue: (k: string) => (rule as Record<string, unknown>)[k] }
  return col.cell({ row: mockRow })
}

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

  function createRule(overrides: Partial<BudgetRule> = {}): BudgetRule {
    return {
      id: 1,
      label: 'Alerte RAV',
      type: 'remaining_low',
      config: '{"threshold":500}',
      active: true,
      createdAt: '',
      updatedAt: '',
      ...overrides
    }
  }

  it('openEditModal sets editingRule and opens modal', () => {
    const rule = createRule()
    const { columns, editingRule, modalOpen } = initBudgetRulesTable()

    const actionsVnode = renderColumn(columns, 3, rule)
    const editButton = (actionsVnode.children as TestVNode[])[0]
    ;(editButton.props.onClick as () => void)()

    expect(editingRule.value).toEqual(rule)
    expect(modalOpen.value).toBe(true)
  })

  it('deleteRule calls DELETE and shows success toast', async () => {
    const rule = createRule()
    const { columns } = initBudgetRulesTable()
    vi.mocked($fetch).mockResolvedValueOnce(undefined)

    const actionsVnode = renderColumn(columns, 3, rule)
    const deleteButton = (actionsVnode.children as TestVNode[])[1]
    await (deleteButton.props.onClick as () => Promise<void>)()

    expect($fetch).toHaveBeenCalledWith('/api/budget/rules/1', { method: 'DELETE' })
    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ color: 'success' }))
  })

  it('deleteRule shows error toast on failure', async () => {
    const rule = createRule()
    const { columns } = initBudgetRulesTable()
    vi.mocked($fetch).mockRejectedValueOnce(new Error('fail'))

    const actionsVnode = renderColumn(columns, 3, rule)
    const deleteButton = (actionsVnode.children as TestVNode[])[1]
    await (deleteButton.props.onClick as () => Promise<void>)()

    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ color: 'error' }))
  })

  it('toggleRule calls PATCH and refreshes', async () => {
    const rule = createRule()
    const { columns } = initBudgetRulesTable()
    vi.mocked($fetch).mockResolvedValueOnce(undefined)

    const activeVnode = renderColumn(columns, 2, rule)
    await (activeVnode.props['onUpdate:modelValue'] as () => Promise<void>)()

    expect($fetch).toHaveBeenCalledWith('/api/budget/rules/1/toggle', { method: 'PATCH' })
    expect(mockRefresh).toHaveBeenCalled()
  })

  it('toggleRule shows error toast on failure', async () => {
    const rule = createRule()
    const { columns } = initBudgetRulesTable()
    vi.mocked($fetch).mockRejectedValueOnce(new Error('fail'))

    const activeVnode = renderColumn(columns, 2, rule)
    await (activeVnode.props['onUpdate:modelValue'] as () => Promise<void>)()

    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ color: 'error' }))
  })

  it('column label cell renders span with rule label', () => {
    const rule = createRule({ label: 'Test Label' })
    const { columns } = initBudgetRulesTable()

    const vnode = renderColumn(columns, 0, rule)

    expect(vnode.type).toBe('span')
    expect(vnode.children).toBe('Test Label')
  })

  it('column type cell renders UBadge with warning color for remaining_low', () => {
    const rule = createRule({ type: 'remaining_low' })
    const { columns } = initBudgetRulesTable()

    const vnode = renderColumn(columns, 1, rule)

    expect(vnode.props.color).toBe('warning')
    expect(vnode.props.variant).toBe('subtle')
  })

  it('column type cell renders UBadge with error color for envelope_exceeded', () => {
    const rule = createRule({ type: 'envelope_exceeded' })
    const { columns } = initBudgetRulesTable()

    const vnode = renderColumn(columns, 1, rule)

    expect(vnode.props.color).toBe('error')
  })

  it('column type cell renders UBadge with info color for category_threshold', () => {
    const rule = createRule({ type: 'category_threshold' })
    const { columns } = initBudgetRulesTable()

    const vnode = renderColumn(columns, 1, rule)

    expect(vnode.props.color).toBe('info')
  })

  it('column active cell renders USwitch', () => {
    const rule = createRule({ active: true })
    const { columns } = initBudgetRulesTable()

    const vnode = renderColumn(columns, 2, rule)

    expect(vnode.type).toBe('USwitch')
    expect(vnode.props.modelValue).toBe(true)
  })
})
