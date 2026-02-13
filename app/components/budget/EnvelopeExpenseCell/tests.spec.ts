import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)

const { initBudgetEnvelopeExpenseCell } = await import('./init')

function createContext(overrides: { actualAmount?: number | null } = {}) {
  const emit = vi.fn()
  const props = {
    plannedAmount: 500,
    actualAmount: overrides.actualAmount ?? null,
    entryId: 1,
    year: 2026,
    month: 2,
    entryLabel: 'Courses'
  }
  return { props, emit }
}

describe('initBudgetEnvelopeExpenseCell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -------------------------------------------------------
  // 1. Returns all expected properties
  // -------------------------------------------------------
  it('returns all expected properties', () => {
    const ctx = createContext()
    const result = initBudgetEnvelopeExpenseCell(ctx)

    const expectedKeys = [
      'modalOpen',
      'hasExpenses',
      'percentage',
      'isOverBudget',
      'openModal',
      'onModalUpdated'
    ]

    for (const key of expectedKeys) {
      expect(result).toHaveProperty(key)
    }
  })

  // -------------------------------------------------------
  // 2. hasExpenses is false when actualAmount is null
  // -------------------------------------------------------
  it('hasExpenses is false when actualAmount is null', () => {
    const ctx = createContext({ actualAmount: null })
    const { hasExpenses } = initBudgetEnvelopeExpenseCell(ctx)

    expect(hasExpenses.value).toBe(false)
  })

  // -------------------------------------------------------
  // 3. hasExpenses is false when actualAmount is 0
  // -------------------------------------------------------
  it('hasExpenses is false when actualAmount is 0', () => {
    const ctx = createContext({ actualAmount: 0 })
    const { hasExpenses } = initBudgetEnvelopeExpenseCell(ctx)

    expect(hasExpenses.value).toBe(false)
  })

  // -------------------------------------------------------
  // 4. hasExpenses is true when actualAmount > 0
  // -------------------------------------------------------
  it('hasExpenses is true when actualAmount > 0', () => {
    const ctx = createContext({ actualAmount: 250 })
    const { hasExpenses } = initBudgetEnvelopeExpenseCell(ctx)

    expect(hasExpenses.value).toBe(true)
  })

  // -------------------------------------------------------
  // 5. percentage is 0 when no expenses
  // -------------------------------------------------------
  it('percentage is 0 when no expenses', () => {
    const ctx = createContext({ actualAmount: null })
    const { percentage } = initBudgetEnvelopeExpenseCell(ctx)

    expect(percentage.value).toBe(0)
  })

  // -------------------------------------------------------
  // 6. percentage calculates correctly
  // -------------------------------------------------------
  it('percentage calculates correctly (e.g., 480/500 = 96%)', () => {
    const ctx = createContext({ actualAmount: 480 })
    const { percentage } = initBudgetEnvelopeExpenseCell(ctx)

    expect(percentage.value).toBe(96)
  })

  // -------------------------------------------------------
  // 7. isOverBudget is false when actual <= planned
  // -------------------------------------------------------
  it('isOverBudget is false when actual <= planned', () => {
    const ctx = createContext({ actualAmount: 500 })
    const { isOverBudget } = initBudgetEnvelopeExpenseCell(ctx)

    expect(isOverBudget.value).toBe(false)
  })

  // -------------------------------------------------------
  // 8. isOverBudget is true when actual > planned
  // -------------------------------------------------------
  it('isOverBudget is true when actual > planned', () => {
    const ctx = createContext({ actualAmount: 550 })
    const { isOverBudget } = initBudgetEnvelopeExpenseCell(ctx)

    expect(isOverBudget.value).toBe(true)
  })

  // -------------------------------------------------------
  // 9. openModal sets modalOpen to true
  // -------------------------------------------------------
  it('openModal sets modalOpen to true', () => {
    const ctx = createContext()
    const { modalOpen, openModal } = initBudgetEnvelopeExpenseCell(ctx)

    expect(modalOpen.value).toBe(false)

    openModal()

    expect(modalOpen.value).toBe(true)
  })

  // -------------------------------------------------------
  // 10. onModalUpdated calls emit
  // -------------------------------------------------------
  it('onModalUpdated calls emit with updated event', () => {
    const ctx = createContext()
    const { onModalUpdated } = initBudgetEnvelopeExpenseCell(ctx)

    onModalUpdated()

    expect(ctx.emit).toHaveBeenCalledWith('updated')
    expect(ctx.emit).toHaveBeenCalledOnce()
  })
})
