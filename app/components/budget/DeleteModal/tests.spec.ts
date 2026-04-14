import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { initBudgetDeleteModal } from './init'
import type { RecurringEntry, EntryType } from '~/types'

const mockToastAdd = vi.fn()
const mockShowErrorToast = vi.fn()

vi.stubGlobal('useToast', () => ({ add: mockToastAdd }))
vi.stubGlobal('useErrorToast', () => ({ showErrorToast: mockShowErrorToast }))
vi.stubGlobal('$fetch', vi.fn())

function createEntry(overrides: Partial<RecurringEntry> = {}): RecurringEntry {
  return {
    id: 1,
    type: 'expense',
    label: 'Loyer',
    amount: 800,
    category: 'Logement',
    dayOfMonth: 1,
    active: true,
    notes: null,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    ...overrides
  }
}

function createContext(overrides: { type?: EntryType, entry?: RecurringEntry } = {}) {
  const emit = vi.fn()
  const open = ref(true)
  const props = {
    type: overrides.type ?? 'expense' as EntryType,
    entry: 'entry' in overrides ? overrides.entry : createEntry()
  }
  return { props, emit, open }
}

describe('initBudgetDeleteModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns onConfirm function', () => {
    const ctx = createContext()
    const result = initBudgetDeleteModal(ctx)

    expect(result).toHaveProperty('onConfirm')
    expect(typeof result.onConfirm).toBe('function')
  })

  it('does nothing if entry is undefined', async () => {
    const ctx = createContext({ entry: undefined })
    const { onConfirm } = initBudgetDeleteModal(ctx)

    await onConfirm()

    expect($fetch).not.toHaveBeenCalled()
    expect(ctx.emit).not.toHaveBeenCalled()
  })

  it('calls $fetch DELETE and emits deleted on success', async () => {
    const entry = createEntry({ id: 42, label: 'Test' })
    const ctx = createContext({ type: 'income', entry })
    vi.mocked($fetch).mockResolvedValueOnce(undefined)

    const { onConfirm } = initBudgetDeleteModal(ctx)
    await onConfirm()

    expect($fetch).toHaveBeenCalledWith('/api/budget/incomes/42', { method: 'DELETE' })
    expect(mockToastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ color: 'success' })
    )
    expect(ctx.open.value).toBe(false)
    expect(ctx.emit).toHaveBeenCalledWith('deleted')
  })

  it('shows error toast on failure', async () => {
    const ctx = createContext()
    vi.mocked($fetch).mockRejectedValueOnce(new Error('fail'))

    const { onConfirm } = initBudgetDeleteModal(ctx)
    await onConfirm()

    expect(mockShowErrorToast).toHaveBeenCalledWith(expect.any(String), expect.anything())
    expect(ctx.open.value).toBe(true)
    expect(ctx.emit).not.toHaveBeenCalled()
  })
})
