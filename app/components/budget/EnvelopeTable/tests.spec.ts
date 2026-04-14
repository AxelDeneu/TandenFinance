import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { stubNuxtAutoImports } from '../../../../test/helpers/nuxt-stubs'
import type { RecurringEntry } from '~/types'

vi.mock('#components', () => ({
  UButton: 'UButton',
  USwitch: 'USwitch',
  UDropdownMenu: 'UDropdownMenu'
}))

const mockToastAdd = vi.fn()
const mockShowErrorToast = vi.fn()
const mockRefresh = vi.fn()

stubNuxtAutoImports({
  useToast: () => ({ add: mockToastAdd }),
  useErrorToast: () => ({ showErrorToast: mockShowErrorToast }),
  useFetch: () => ({
    data: ref<RecurringEntry[]>([]),
    status: ref('idle'),
    refresh: mockRefresh
  })
})

const { initBudgetEnvelopeTable } = await import('./init')

function createContext() {
  const emit = vi.fn()
  return { emit }
}

interface TestVNode {
  type: unknown
  props: Record<string, unknown>
  children: TestVNode[] | string
}

interface CellColumn {
  cell: (ctx: { row: { original: RecurringEntry, getValue: (k: string) => unknown } }) => TestVNode
  [key: string]: unknown
}

function renderColumn(columns: unknown[], index: number, entry: RecurringEntry): TestVNode {
  const col = columns[index] as CellColumn
  const mockRow = { original: entry, getValue: (k: string) => (entry as Record<string, unknown>)[k] }
  return col.cell({ row: mockRow })
}

describe('initBudgetEnvelopeTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all expected properties', () => {
    const ctx = createContext()
    const result = initBudgetEnvelopeTable(ctx)

    expect(result).toHaveProperty('table')
    expect(result).toHaveProperty('columnFilters')
    expect(result).toHaveProperty('pagination')
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('status')
    expect(result).toHaveProperty('columns')
    expect(result).toHaveProperty('editingEntry')
    expect(result).toHaveProperty('editModalOpen')
    expect(result).toHaveProperty('deletingEntry')
    expect(result).toHaveProperty('deleteModalOpen')
    expect(result).toHaveProperty('addModalOpen')
    expect(result).toHaveProperty('labelSearch')
    expect(result).toHaveProperty('onSaved')
    expect(result).toHaveProperty('onDeleted')
    expect(result).toHaveProperty('getPaginationRowModel')
  })

  it('initializes modal states as closed', () => {
    const ctx = createContext()
    const { editModalOpen, deleteModalOpen, addModalOpen } = initBudgetEnvelopeTable(ctx)

    expect(editModalOpen.value).toBe(false)
    expect(deleteModalOpen.value).toBe(false)
    expect(addModalOpen.value).toBe(false)
  })

  it('columns has 4 column definitions (label, amount, active, actions)', () => {
    const ctx = createContext()
    const { columns } = initBudgetEnvelopeTable(ctx)

    expect(columns).toHaveLength(4)
    expect(columns[0].accessorKey).toBe('label')
    expect(columns[1].accessorKey).toBe('amount')
    expect(columns[2].accessorKey).toBe('active')
    expect(columns[3].id).toBe('actions')
  })

  it('onSaved calls refresh and emits updated', () => {
    const ctx = createContext()
    const { onSaved } = initBudgetEnvelopeTable(ctx)

    onSaved()

    expect(mockRefresh).toHaveBeenCalled()
    expect(ctx.emit).toHaveBeenCalledWith('updated')
  })

  it('onDeleted calls refresh and emits updated', () => {
    const ctx = createContext()
    const { onDeleted } = initBudgetEnvelopeTable(ctx)

    onDeleted()

    expect(mockRefresh).toHaveBeenCalled()
    expect(ctx.emit).toHaveBeenCalledWith('updated')
  })

  it('initializes pagination with correct defaults', () => {
    const ctx = createContext()
    const { pagination } = initBudgetEnvelopeTable(ctx)

    expect(pagination.value.pageIndex).toBe(0)
    expect(pagination.value.pageSize).toBe(10)
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
      notes: null,
      createdAt: '',
      updatedAt: '',
      ...overrides
    }
  }

  it('column label cell renders entry label', () => {
    const ctx = createContext()
    const { columns } = initBudgetEnvelopeTable(ctx)
    const entry = createEntry()

    const vnode = renderColumn(columns, 0, entry)

    expect(vnode.type).toBe('span')
    expect(vnode.children).toBe('Courses')
  })

  it('column amount cell renders formatEuro', () => {
    const ctx = createContext()
    const { columns } = initBudgetEnvelopeTable(ctx)
    const entry = createEntry({ amount: 1234 })

    const vnode = renderColumn(columns, 1, entry)

    expect(vnode.type).toBe('span')
    expect(vnode.children).toContain('1')
  })

  it('column active cell renders USwitch', () => {
    const ctx = createContext()
    const { columns } = initBudgetEnvelopeTable(ctx)
    const entry = createEntry()

    const vnode = renderColumn(columns, 2, entry)

    expect(vnode.type).toBe('USwitch')
  })

  it('column actions cell renders dropdown with items', () => {
    const ctx = createContext()
    const { columns } = initBudgetEnvelopeTable(ctx)
    const entry = createEntry()

    const vnode = renderColumn(columns, 3, entry)

    expect(vnode.type).toBe('div')
    const dropdownVnode = (vnode.children as TestVNode[])[0]
    expect(dropdownVnode.type).toBe('UDropdownMenu')
    expect(dropdownVnode.props.items).toBeDefined()
    expect((dropdownVnode.props.items as unknown[]).length).toBeGreaterThan(0)
  })

  it('getRowItems Modifier onSelect opens edit modal', () => {
    const ctx = createContext()
    const { columns, editingEntry, editModalOpen } = initBudgetEnvelopeTable(ctx)
    const entry = createEntry()

    const actionsVnode = renderColumn(columns, 3, entry)
    const items = (actionsVnode.children as TestVNode[])[0].props.items as { label?: string, onSelect: () => void }[]
    const modifierItem = items.find(i => i.label === 'Modifier')

    modifierItem!.onSelect()

    expect(editingEntry.value).toEqual(entry)
    expect(editModalOpen.value).toBe(true)
  })

  it('getRowItems Supprimer onSelect opens delete modal', () => {
    const ctx = createContext()
    const { columns, deletingEntry, deleteModalOpen } = initBudgetEnvelopeTable(ctx)
    const entry = createEntry()

    const actionsVnode = renderColumn(columns, 3, entry)
    const items = (actionsVnode.children as TestVNode[])[0].props.items as { label?: string, onSelect: () => void }[]
    const supprimerItem = items.find(i => i.label === 'Supprimer')

    supprimerItem!.onSelect()

    expect(deletingEntry.value).toEqual(entry)
    expect(deleteModalOpen.value).toBe(true)
  })

  it('toggleActive calls PATCH and refreshes on success', async () => {
    const ctx = createContext()
    const { columns } = initBudgetEnvelopeTable(ctx)
    const entry = createEntry({ id: 42 })

    const switchVnode = renderColumn(columns, 2, entry)

    vi.mocked($fetch).mockResolvedValueOnce(undefined)
    await (switchVnode.props['onUpdate:modelValue'] as () => Promise<void>)()

    expect($fetch).toHaveBeenCalledWith('/api/budget/envelopes/42/toggle', { method: 'PATCH' })
    expect(mockRefresh).toHaveBeenCalled()
    expect(ctx.emit).toHaveBeenCalledWith('updated')
  })

  it('toggleActive shows error toast on failure', async () => {
    const ctx = createContext()
    const { columns } = initBudgetEnvelopeTable(ctx)
    const entry = createEntry()

    const switchVnode = renderColumn(columns, 2, entry)

    vi.mocked($fetch).mockRejectedValueOnce(new Error('fail'))
    await (switchVnode.props['onUpdate:modelValue'] as () => Promise<void>)()

    expect(mockShowErrorToast).toHaveBeenCalledWith(expect.any(String), expect.anything())
  })

  it('labelSearch returns empty string when table ref is null', () => {
    const ctx = createContext()
    const { labelSearch } = initBudgetEnvelopeTable(ctx)

    expect(labelSearch.value).toBe('')
  })

  it('labelSearch setter is callable', () => {
    const ctx = createContext()
    const { labelSearch } = initBudgetEnvelopeTable(ctx)

    expect(() => {
      labelSearch.value = 'test'
    }).not.toThrow()
  })
})
