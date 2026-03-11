import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { stubNuxtAutoImports } from '../../../../test/helpers/nuxt-stubs'
import type { RecurringEntry, EntryType } from '~/types'

vi.mock('#components', () => ({
  UButton: 'UButton',
  UBadge: 'UBadge',
  USwitch: 'USwitch',
  UDropdownMenu: 'UDropdownMenu'
}))

const mockToastAdd = vi.fn()
const mockRefresh = vi.fn()

stubNuxtAutoImports({
  useToast: () => ({ add: mockToastAdd }),
  useFetch: () => ({
    data: ref<RecurringEntry[]>([]),
    status: ref('idle'),
    refresh: mockRefresh
  })
})

const { initBudgetRecurringTable } = await import('./init')

function createContext(overrides: { type?: EntryType } = {}) {
  const emit = vi.fn()
  const props = { type: overrides.type ?? 'expense' as EntryType }
  return { props, emit }
}

function createEntry(overrides: Partial<RecurringEntry> = {}): RecurringEntry {
  return {
    id: 1,
    type: 'expense',
    label: 'Loyer',
    amount: 800,
    category: 'Logement',
    dayOfMonth: 5,
    active: true,
    notes: null,
    createdAt: '',
    updatedAt: '',
    ...overrides
  }
}

describe('initBudgetRecurringTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all expected properties', () => {
    const ctx = createContext()
    const result = initBudgetRecurringTable(ctx)

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
    expect(result).toHaveProperty('categoryFilter')
    expect(result).toHaveProperty('labelSearch')
    expect(result).toHaveProperty('categoryItems')
    expect(result).toHaveProperty('onSaved')
    expect(result).toHaveProperty('onDeleted')
    expect(result).toHaveProperty('getPaginationRowModel')
  })

  it('initializes pagination with correct defaults', () => {
    const ctx = createContext()
    const { pagination } = initBudgetRecurringTable(ctx)

    expect(pagination.value.pageIndex).toBe(0)
    expect(pagination.value.pageSize).toBe(10)
  })

  it('initializes modal states as closed', () => {
    const ctx = createContext()
    const { editModalOpen, deleteModalOpen, addModalOpen } = initBudgetRecurringTable(ctx)

    expect(editModalOpen.value).toBe(false)
    expect(deleteModalOpen.value).toBe(false)
    expect(addModalOpen.value).toBe(false)
  })

  it('categoryItems includes "Toutes" plus expense categories for expense type', () => {
    const ctx = createContext({ type: 'expense' })
    const { categoryItems } = initBudgetRecurringTable(ctx)

    expect(categoryItems.value[0]).toEqual({ label: 'Toutes', value: 'all' })
    expect(categoryItems.value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Logement', value: 'Logement' })
      ])
    )
  })

  it('categoryItems includes income categories for income type', () => {
    const ctx = createContext({ type: 'income' })
    const { categoryItems } = initBudgetRecurringTable(ctx)

    expect(categoryItems.value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Salaire', value: 'Salaire' })
      ])
    )
  })

  it('onSaved calls refresh and emits updated', () => {
    const ctx = createContext()
    const { onSaved } = initBudgetRecurringTable(ctx)

    onSaved()

    expect(mockRefresh).toHaveBeenCalled()
    expect(ctx.emit).toHaveBeenCalledWith('updated')
  })

  it('onDeleted calls refresh and emits updated', () => {
    const ctx = createContext()
    const { onDeleted } = initBudgetRecurringTable(ctx)

    onDeleted()

    expect(mockRefresh).toHaveBeenCalled()
    expect(ctx.emit).toHaveBeenCalledWith('updated')
  })

  it('columns has expected number of column definitions', () => {
    const ctx = createContext()
    const { columns } = initBudgetRecurringTable(ctx)

    expect(columns).toHaveLength(6)
    expect(columns[0].accessorKey).toBe('label')
    expect(columns[1].accessorKey).toBe('amount')
    expect(columns[2].accessorKey).toBe('category')
    expect(columns[3].accessorKey).toBe('dayOfMonth')
    expect(columns[4].accessorKey).toBe('active')
    expect(columns[5].id).toBe('actions')
  })

  it('categoryFilter defaults to all', () => {
    const ctx = createContext()
    const { categoryFilter } = initBudgetRecurringTable(ctx)

    expect(categoryFilter.value).toBe('all')
  })

  it('column label cell renders entry label', () => {
    const ctx = createContext()
    const { columns } = initBudgetRecurringTable(ctx)
    const entry = createEntry({ label: 'Internet' })
    const mockRow = { original: entry, getValue: (k: string) => (entry as any)[k] }

    const vnode = (columns[0] as any).cell({ row: mockRow })

    expect(vnode.type).toBe('span')
    expect(vnode.children).toBe('Internet')
  })

  it('column amount cell renders formatEuro', () => {
    const ctx = createContext()
    const { columns } = initBudgetRecurringTable(ctx)
    const entry = createEntry({ amount: 1250.5 })
    const mockRow = { original: entry, getValue: (k: string) => (entry as any)[k] }

    const vnode = (columns[1] as any).cell({ row: mockRow })

    expect(vnode.type).toBe('span')
    expect(vnode.children).toBe('1250.50 €')
  })

  it('column category cell renders UBadge with color', () => {
    const ctx = createContext()
    const { columns } = initBudgetRecurringTable(ctx)
    const entry = createEntry({ category: 'Logement' })
    const mockRow = { original: entry, getValue: (k: string) => (entry as any)[k] }

    const vnode = (columns[2] as any).cell({ row: mockRow })

    expect(vnode.type).toBe('UBadge')
  })

  it('column category cell renders dash when category is null', () => {
    const ctx = createContext()
    const { columns } = initBudgetRecurringTable(ctx)
    const entry = createEntry({ category: null as any })
    const mockRow = { original: entry, getValue: (k: string) => (entry as any)[k] }

    const vnode = (columns[2] as any).cell({ row: mockRow })

    expect(vnode.type).toBe('span')
    expect(vnode.children).toBe('-')
  })

  it('column dayOfMonth cell renders "le X"', () => {
    const ctx = createContext()
    const { columns } = initBudgetRecurringTable(ctx)
    const entry = createEntry({ dayOfMonth: 5 })
    const mockRow = { original: entry, getValue: (k: string) => (entry as any)[k] }

    const vnode = (columns[3] as any).cell({ row: mockRow })

    expect(vnode.type).toBe('span')
    expect(vnode.children).toBe('le 5')
  })

  it('column dayOfMonth cell renders dash when null', () => {
    const ctx = createContext()
    const { columns } = initBudgetRecurringTable(ctx)
    const entry = createEntry({ dayOfMonth: null as any })
    const mockRow = { original: entry, getValue: (k: string) => (entry as any)[k] }

    const vnode = (columns[3] as any).cell({ row: mockRow })

    expect(vnode.type).toBe('span')
    expect(vnode.children).toBe('-')
  })

  it('column active cell renders USwitch', () => {
    const ctx = createContext()
    const { columns } = initBudgetRecurringTable(ctx)
    const entry = createEntry()
    const mockRow = { original: entry, getValue: (k: string) => (entry as any)[k] }

    const vnode = (columns[4] as any).cell({ row: mockRow })

    expect(vnode.type).toBe('USwitch')
    expect(vnode.props.modelValue).toBe(true)
  })

  it('column actions cell renders dropdown', () => {
    const ctx = createContext()
    const { columns } = initBudgetRecurringTable(ctx)
    const entry = createEntry()
    const mockRow = { original: entry, getValue: (k: string) => (entry as any)[k] }

    const vnode = (columns[5] as any).cell({ row: mockRow })

    expect(vnode.type).toBe('div')
    // h('div', props, h(UDropdownMenu, ...)) stores child as single vnode in children
    const children = Array.isArray(vnode.children) ? vnode.children : [vnode.children]
    const dropdownVnode = children[0]
    expect(dropdownVnode.type).toBe('UDropdownMenu')
  })

  it('getRowItems Modifier onSelect opens edit modal', () => {
    const ctx = createContext()
    const { columns, editModalOpen, editingEntry } = initBudgetRecurringTable(ctx)
    const entry = createEntry()
    const mockRow = { original: entry, getValue: (k: string) => (entry as any)[k] }

    const actionsVnode = (columns[5] as any).cell({ row: mockRow })
    const children = Array.isArray(actionsVnode.children) ? actionsVnode.children : [actionsVnode.children]
    const dropdownVnode = children[0]
    const items = dropdownVnode.props.items

    const modifierItem = items.find((item: any) => item.label === 'Modifier')
    modifierItem.onSelect()

    expect(editModalOpen.value).toBe(true)
    expect(editingEntry.value).toEqual(entry)
  })

  it('getRowItems Supprimer onSelect opens delete modal', () => {
    const ctx = createContext()
    const { columns, deleteModalOpen, deletingEntry } = initBudgetRecurringTable(ctx)
    const entry = createEntry()
    const mockRow = { original: entry, getValue: (k: string) => (entry as any)[k] }

    const actionsVnode = (columns[5] as any).cell({ row: mockRow })
    const children = Array.isArray(actionsVnode.children) ? actionsVnode.children : [actionsVnode.children]
    const dropdownVnode = children[0]
    const items = dropdownVnode.props.items

    const supprimerItem = items.find((item: any) => item.label === 'Supprimer')
    supprimerItem.onSelect()

    expect(deleteModalOpen.value).toBe(true)
    expect(deletingEntry.value).toEqual(entry)
  })

  it('toggleActive calls PATCH and refreshes on success', async () => {
    const ctx = createContext()
    const { columns } = initBudgetRecurringTable(ctx)
    const entry = createEntry({ id: 42 })
    const mockRow = { original: entry, getValue: (k: string) => (entry as any)[k] }

    const switchVnode = (columns[4] as any).cell({ row: mockRow })
    const onUpdate = switchVnode.props['onUpdate:modelValue']

    vi.mocked($fetch).mockResolvedValueOnce(undefined)
    await onUpdate()

    expect($fetch).toHaveBeenCalledWith('/api/budget/expenses/42/toggle', { method: 'PATCH' })
    expect(mockRefresh).toHaveBeenCalled()
    expect(ctx.emit).toHaveBeenCalledWith('updated')
  })

  it('toggleActive shows error toast on failure', async () => {
    const ctx = createContext()
    const { columns } = initBudgetRecurringTable(ctx)
    const entry = createEntry()
    const mockRow = { original: entry, getValue: (k: string) => (entry as any)[k] }

    const switchVnode = (columns[4] as any).cell({ row: mockRow })
    const onUpdate = switchVnode.props['onUpdate:modelValue']

    vi.mocked($fetch).mockRejectedValueOnce(new Error('Network error'))
    await onUpdate()

    expect(mockToastAdd).toHaveBeenCalledWith({
      title: 'Erreur',
      description: 'Impossible de modifier le statut',
      color: 'error'
    })
  })
})
