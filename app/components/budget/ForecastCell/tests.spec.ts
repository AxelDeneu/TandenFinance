import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'

const mockToastAdd = vi.fn()

vi.stubGlobal('useToast', () => ({ add: mockToastAdd }))
vi.stubGlobal('$fetch', vi.fn())
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('formatEuro', (v: number) => `${v.toFixed(2)} \u20AC`)

const { initBudgetForecastCell } = await import('./init')

function createContext(overrides: { actualAmount?: number | null } = {}) {
  const emit = vi.fn()
  const props = {
    plannedAmount: 500,
    actualAmount: overrides.actualAmount ?? null,
    entryId: 1,
    year: 2025,
    month: 3
  }
  return { props, emit }
}

describe('initBudgetForecastCell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all expected properties', () => {
    const ctx = createContext()
    const result = initBudgetForecastCell(ctx)

    expect(result).toHaveProperty('editing')
    expect(result).toHaveProperty('inputValue')
    expect(result).toHaveProperty('saving')
    expect(result).toHaveProperty('hasActual')
    expect(result).toHaveProperty('effectiveAmount')
    expect(result).toHaveProperty('startEditing')
    expect(result).toHaveProperty('cancelEditing')
    expect(result).toHaveProperty('save')
    expect(result).toHaveProperty('clear')
    expect(result).toHaveProperty('onKeydown')
    expect(result).toHaveProperty('variance')
  })

  it('hasActual is false when no actual', () => {
    const ctx = createContext({ actualAmount: null })
    const { hasActual } = initBudgetForecastCell(ctx)

    expect(hasActual.value).toBe(false)
  })

  it('hasActual is true when actual exists', () => {
    const ctx = createContext({ actualAmount: 480 })
    const { hasActual } = initBudgetForecastCell(ctx)

    expect(hasActual.value).toBe(true)
  })

  it('effectiveAmount returns planned when no actual', () => {
    const ctx = createContext({ actualAmount: null })
    const { effectiveAmount } = initBudgetForecastCell(ctx)

    expect(effectiveAmount.value).toBe(500)
  })

  it('effectiveAmount returns actual when available', () => {
    const ctx = createContext({ actualAmount: 480 })
    const { effectiveAmount } = initBudgetForecastCell(ctx)

    expect(effectiveAmount.value).toBe(480)
  })

  it('save calls PUT with correct data and emits saved', async () => {
    const ctx = createContext()
    vi.mocked($fetch).mockResolvedValueOnce(undefined)

    const { startEditing, inputValue, save } = initBudgetForecastCell(ctx)
    startEditing()
    inputValue.value = '520'
    await save()

    expect($fetch).toHaveBeenCalledWith('/api/budget/actuals/1', {
      method: 'PUT',
      body: { year: 2025, month: 3, actualAmount: 520 }
    })
    expect(ctx.emit).toHaveBeenCalledWith('saved')
  })

  it('clear calls DELETE with correct data and emits cleared', async () => {
    const ctx = createContext({ actualAmount: 480 })
    vi.mocked($fetch).mockResolvedValueOnce(undefined)

    const { clear } = initBudgetForecastCell(ctx)
    await clear()

    expect($fetch).toHaveBeenCalledWith('/api/budget/actuals/1', {
      method: 'DELETE',
      body: { year: 2025, month: 3 }
    })
    expect(ctx.emit).toHaveBeenCalledWith('cleared')
  })

  it('save shows error toast on invalid value', async () => {
    const ctx = createContext()
    const { startEditing, inputValue, save } = initBudgetForecastCell(ctx)
    startEditing()
    inputValue.value = 'abc'
    await save()

    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ color: 'error' }))
    expect($fetch).not.toHaveBeenCalled()
  })

  it('variance is null when no actual', () => {
    const ctx = createContext({ actualAmount: null })
    const { variance } = initBudgetForecastCell(ctx)

    expect(variance.value).toBe(null)
  })

  it('variance is negative when actual is under budget', () => {
    const ctx = createContext({ actualAmount: 480 })
    const { variance } = initBudgetForecastCell(ctx)

    expect(variance.value).toBe(-20)
  })

  it('variance is positive when actual is over budget', () => {
    const ctx = createContext({ actualAmount: 550 })
    const { variance } = initBudgetForecastCell(ctx)

    expect(variance.value).toBe(50)
  })

  it('cancelEditing resets editing state', () => {
    const ctx = createContext()
    const { startEditing, cancelEditing, editing } = initBudgetForecastCell(ctx)

    startEditing()
    expect(editing.value).toBe(true)

    cancelEditing()
    expect(editing.value).toBe(false)
  })
})
