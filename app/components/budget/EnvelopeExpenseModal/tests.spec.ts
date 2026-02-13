import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed, watch, reactive } from 'vue'
import type { EnvelopeExpense } from '~/types'

const mockToastAdd = vi.fn()

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)
vi.stubGlobal('reactive', reactive)
vi.stubGlobal('$fetch', vi.fn())
vi.stubGlobal('useToast', () => ({ add: mockToastAdd }))

const { initBudgetEnvelopeExpenseModal } = await import('./init')

function createContext() {
  const emit = vi.fn()
  const props = {
    entryId: 1,
    entryLabel: 'Courses',
    plannedAmount: 500,
    year: 2026,
    month: 2
  }
  const open = ref(false)
  return { props, emit, open }
}

function makeExpense(overrides: Partial<EnvelopeExpense> = {}): EnvelopeExpense {
  return {
    id: 1,
    recurringEntryId: 1,
    year: 2026,
    month: 2,
    label: 'Supermarche',
    amount: 120,
    createdAt: '2026-02-01',
    updatedAt: '2026-02-01',
    ...overrides
  }
}

describe('initBudgetEnvelopeExpenseModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -------------------------------------------------------
  // 1. Returns all expected properties
  // -------------------------------------------------------
  it('returns all expected properties', () => {
    const ctx = createContext()
    const result = initBudgetEnvelopeExpenseModal(ctx)

    const expectedKeys = [
      'expenses',
      'loading',
      'adding',
      'newLabel',
      'newAmount',
      'total',
      'remaining',
      'addExpense',
      'deleteExpense'
    ]

    for (const key of expectedKeys) {
      expect(result).toHaveProperty(key)
    }
  })

  // -------------------------------------------------------
  // 2. total is 0 when no expenses
  // -------------------------------------------------------
  it('total is 0 when no expenses', () => {
    const ctx = createContext()
    const { total } = initBudgetEnvelopeExpenseModal(ctx)

    expect(total.value).toBe(0)
  })

  // -------------------------------------------------------
  // 3. remaining equals plannedAmount when no expenses
  // -------------------------------------------------------
  it('remaining equals plannedAmount when no expenses', () => {
    const ctx = createContext()
    const { remaining } = initBudgetEnvelopeExpenseModal(ctx)

    expect(remaining.value).toBe(500)
  })

  // -------------------------------------------------------
  // 4. total computes correctly from expenses list
  // -------------------------------------------------------
  it('total computes correctly from expenses list', () => {
    const ctx = createContext()
    const { expenses, total } = initBudgetEnvelopeExpenseModal(ctx)

    expenses.value = [
      makeExpense({ id: 1, amount: 120 }),
      makeExpense({ id: 2, amount: 80 }),
      makeExpense({ id: 3, amount: 45.50 })
    ]

    expect(total.value).toBe(245.50)
  })

  // -------------------------------------------------------
  // 5. remaining computes correctly (planned - total)
  // -------------------------------------------------------
  it('remaining computes correctly (planned - total)', () => {
    const ctx = createContext()
    const { expenses, remaining } = initBudgetEnvelopeExpenseModal(ctx)

    expenses.value = [
      makeExpense({ id: 1, amount: 200 }),
      makeExpense({ id: 2, amount: 150 })
    ]

    // planned=500, total=350, remaining=150
    expect(remaining.value).toBe(150)
  })

  // -------------------------------------------------------
  // 6. addExpense shows error toast when label is empty
  // -------------------------------------------------------
  it('addExpense shows error toast when label is empty', async () => {
    const ctx = createContext()
    const { addExpense, newLabel, newAmount } = initBudgetEnvelopeExpenseModal(ctx)

    newLabel.value = ''
    newAmount.value = 50

    await addExpense()

    expect(mockToastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ color: 'error' })
    )
    expect($fetch).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------
  // 7. addExpense shows error toast when amount is missing
  // -------------------------------------------------------
  it('addExpense shows error toast when amount is missing', async () => {
    const ctx = createContext()
    const { addExpense, newLabel, newAmount } = initBudgetEnvelopeExpenseModal(ctx)

    newLabel.value = 'Boulangerie'
    newAmount.value = undefined

    await addExpense()

    expect(mockToastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ color: 'error' })
    )
    expect($fetch).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------
  // 8. addExpense calls POST with correct data
  // -------------------------------------------------------
  it('addExpense calls POST with correct data', async () => {
    const ctx = createContext()
    vi.mocked($fetch)
      .mockResolvedValueOnce(undefined) // POST call
      .mockResolvedValueOnce([]) // fetchExpenses call after success

    const { addExpense, newLabel, newAmount } = initBudgetEnvelopeExpenseModal(ctx)

    newLabel.value = 'Boulangerie'
    newAmount.value = 35

    await addExpense()

    expect($fetch).toHaveBeenCalledWith('/api/budget/envelopes/1/expenses', {
      method: 'POST',
      body: {
        year: 2026,
        month: 2,
        label: 'Boulangerie',
        amount: 35
      }
    })
    expect(ctx.emit).toHaveBeenCalledWith('updated')
  })

  // -------------------------------------------------------
  // 9. deleteExpense calls DELETE with correct URL
  // -------------------------------------------------------
  it('deleteExpense calls DELETE with correct URL', async () => {
    const ctx = createContext()
    vi.mocked($fetch)
      .mockResolvedValueOnce(undefined) // DELETE call
      .mockResolvedValueOnce([]) // fetchExpenses call after success

    const { deleteExpense } = initBudgetEnvelopeExpenseModal(ctx)

    await deleteExpense(42)

    expect($fetch).toHaveBeenCalledWith('/api/budget/envelopes/1/expenses/42', {
      method: 'DELETE'
    })
    expect(ctx.emit).toHaveBeenCalledWith('updated')
  })
})
