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
})
