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
const mockRefresh = vi.fn()

stubNuxtAutoImports({
  useToast: () => ({ add: mockToastAdd }),
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
})
