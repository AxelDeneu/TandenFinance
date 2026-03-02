import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'
import type { ForecastData } from '~/types'

const mockRefresh = vi.fn()

const mockData: ForecastData = {
  months: [{ year: 2026, month: 2, label: 'f\u00E9vrier 2026' }],
  incomes: [
    {
      entry: { id: 1, type: 'income', label: 'Salaire', amount: 3000, category: 'Salaire', dayOfMonth: 25, active: true, notes: null, createdAt: '', updatedAt: '' },
      actuals: { '2026-2': 3200 }
    }
  ],
  expenses: [
    {
      entry: { id: 2, type: 'expense', label: 'Loyer', amount: 800, category: 'Logement', dayOfMonth: 5, active: true, notes: null, createdAt: '', updatedAt: '' },
      actuals: { '2026-2': null }
    }
  ],
  envelopes: [
    {
      entry: { id: 3, type: 'envelope', label: 'Courses', amount: 500, category: null, dayOfMonth: null, active: true, notes: null, createdAt: '', updatedAt: '' },
      actuals: { '2026-2': 480 }
    }
  ]
}

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('formatEuro', (v: number) => `${v.toFixed(2)} \u20AC`)
vi.stubGlobal('INCOME_CATEGORY_COLORS', { Salaire: 'success' })
vi.stubGlobal('EXPENSE_CATEGORY_COLORS', { Logement: 'warning' })
vi.stubGlobal('ENVELOPE_COLOR', 'warning')
vi.stubGlobal('useRoute', () => ({ query: {} }))
vi.stubGlobal('useMonthNavigation', () => {
  const yr = ref(new Date().getFullYear())
  const mo = ref(new Date().getMonth() + 1)
  const label = computed(() => {
    const date = new Date(yr.value, mo.value - 1, 1)
    return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date)
  })
  const key = computed(() => `${yr.value}-${mo.value}`)
  function previousMonth() {
    if (mo.value === 1) {
      mo.value = 12
      yr.value--
    } else {
      mo.value--
    }
  }
  function nextMonth() {
    if (mo.value === 12) {
      mo.value = 1
      yr.value++
    } else {
      mo.value++
    }
  }
  return { selectedYear: yr, selectedMonth: mo, selectedMonthLabel: label, monthKey: key, previousMonth, nextMonth }
})
vi.stubGlobal('useFetch', () => ({
  data: ref(mockData),
  status: ref('idle'),
  refresh: mockRefresh
}))

vi.mock('#components', () => ({
  UButton: {},
  UBadge: {}
}))

const { initBudgetForecastTable } = await import('./init')

describe('initBudgetForecastTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -------------------------------------------------------
  // 1. Returns all expected properties
  // -------------------------------------------------------
  it('returns all expected properties', () => {
    const result = initBudgetForecastTable()

    const expectedKeys = [
      'selectedYear',
      'selectedMonth',
      'selectedMonthLabel',
      'monthKey',
      'data',
      'status',
      'refresh',
      'previousMonth',
      'nextMonth',
      'incomeColumns',
      'expenseColumns',
      'envelopeColumns',
      'incomes',
      'expenses',
      'envelopes',
      'incomeTotals',
      'expenseTotals',
      'envelopeTotals',
      'remaining'
    ]

    for (const key of expectedKeys) {
      expect(result).toHaveProperty(key)
    }
  })

  // -------------------------------------------------------
  // 2. selectedYear and selectedMonth default to current date
  // -------------------------------------------------------
  it('initializes selectedYear and selectedMonth to current date', () => {
    const now = new Date()
    const { selectedYear, selectedMonth } = initBudgetForecastTable()

    expect(selectedYear.value).toBe(now.getFullYear())
    expect(selectedMonth.value).toBe(now.getMonth() + 1)
  })

  // -------------------------------------------------------
  // 3. selectedMonthLabel is formatted in French
  // -------------------------------------------------------
  it('formats selectedMonthLabel in French', () => {
    const { selectedYear, selectedMonth, selectedMonthLabel } = initBudgetForecastTable()

    selectedYear.value = 2026
    selectedMonth.value = 2

    expect(selectedMonthLabel.value).toBe('f\u00E9vrier 2026')
  })

  it('updates selectedMonthLabel when month changes', () => {
    const { selectedYear, selectedMonth, selectedMonthLabel } = initBudgetForecastTable()

    selectedYear.value = 2026
    selectedMonth.value = 12

    expect(selectedMonthLabel.value).toBe('d\u00E9cembre 2026')
  })

  // -------------------------------------------------------
  // 4. monthKey is computed as "year-month"
  // -------------------------------------------------------
  it('computes monthKey as year-month string', () => {
    const { selectedYear, selectedMonth, monthKey } = initBudgetForecastTable()

    selectedYear.value = 2026
    selectedMonth.value = 2

    expect(monthKey.value).toBe('2026-2')
  })

  it('updates monthKey when year or month changes', () => {
    const { selectedYear, selectedMonth, monthKey } = initBudgetForecastTable()

    selectedYear.value = 2025
    selectedMonth.value = 11

    expect(monthKey.value).toBe('2025-11')
  })

  // -------------------------------------------------------
  // 5. previousMonth decrements month and handles rollover
  // -------------------------------------------------------
  it('previousMonth decrements the month by one', () => {
    const { selectedYear, selectedMonth, previousMonth } = initBudgetForecastTable()

    selectedYear.value = 2026
    selectedMonth.value = 6

    previousMonth()

    expect(selectedMonth.value).toBe(5)
    expect(selectedYear.value).toBe(2026)
  })

  it('previousMonth rolls over from January to December of previous year', () => {
    const { selectedYear, selectedMonth, previousMonth } = initBudgetForecastTable()

    selectedYear.value = 2026
    selectedMonth.value = 1

    previousMonth()

    expect(selectedMonth.value).toBe(12)
    expect(selectedYear.value).toBe(2025)
  })

  // -------------------------------------------------------
  // 6. nextMonth increments month and handles rollover
  // -------------------------------------------------------
  it('nextMonth increments the month by one', () => {
    const { selectedYear, selectedMonth, nextMonth } = initBudgetForecastTable()

    selectedYear.value = 2026
    selectedMonth.value = 6

    nextMonth()

    expect(selectedMonth.value).toBe(7)
    expect(selectedYear.value).toBe(2026)
  })

  it('nextMonth rolls over from December to January of next year', () => {
    const { selectedYear, selectedMonth, nextMonth } = initBudgetForecastTable()

    selectedYear.value = 2026
    selectedMonth.value = 12

    nextMonth()

    expect(selectedMonth.value).toBe(1)
    expect(selectedYear.value).toBe(2027)
  })

  // -------------------------------------------------------
  // 7. incomes, expenses, envelopes computed from data
  // -------------------------------------------------------
  it('incomes are computed from data', () => {
    const { incomes } = initBudgetForecastTable()

    expect(incomes.value).toHaveLength(1)
    expect(incomes.value[0].entry.label).toBe('Salaire')
  })

  it('expenses are computed from data', () => {
    const { expenses } = initBudgetForecastTable()

    expect(expenses.value).toHaveLength(1)
    expect(expenses.value[0].entry.label).toBe('Loyer')
  })

  it('envelopes are computed from data', () => {
    const { envelopes } = initBudgetForecastTable()

    expect(envelopes.value).toHaveLength(1)
    expect(envelopes.value[0].entry.label).toBe('Courses')
  })

  // -------------------------------------------------------
  // 8. Section totals are correctly computed
  // -------------------------------------------------------
  it('computes incomeTotals with actual value when available', () => {
    const { selectedYear, selectedMonth, incomeTotals } = initBudgetForecastTable()

    selectedYear.value = 2026
    selectedMonth.value = 2

    // Salaire: planned=3000, actual=3200
    expect(incomeTotals.value.planned).toBe(3000)
    expect(incomeTotals.value.actual).toBe(3200)
    expect(incomeTotals.value.effective).toBe(3200)
    expect(incomeTotals.value.variance).toBe(200)
  })

  it('computes expenseTotals falling back to planned when actual is null', () => {
    const { selectedYear, selectedMonth, expenseTotals } = initBudgetForecastTable()

    selectedYear.value = 2026
    selectedMonth.value = 2

    // Loyer: planned=800, actual=null => uses planned for actual sum
    // But hasAnyActual is false when ALL actuals are null, so effective = planned
    expect(expenseTotals.value.planned).toBe(800)
    expect(expenseTotals.value.actual).toBe(800)
    expect(expenseTotals.value.effective).toBe(800)
    expect(expenseTotals.value.variance).toBe(0)
  })

  it('computes envelopeTotals using max(actual, planned) for effective', () => {
    const { selectedYear, selectedMonth, envelopeTotals } = initBudgetForecastTable()

    selectedYear.value = 2026
    selectedMonth.value = 2

    // Courses: planned=500, actual=480
    // effective = max(480, 500) = 500 (budget is reserved even if not fully spent)
    expect(envelopeTotals.value.planned).toBe(500)
    expect(envelopeTotals.value.actual).toBe(480)
    expect(envelopeTotals.value.effective).toBe(500)
    expect(envelopeTotals.value.variance).toBe(0)
  })

  // -------------------------------------------------------
  // 8b. envelopeTotals: actual < planned => effective = planned (budget reserved)
  // -------------------------------------------------------
  it('envelopeTotals uses planned as effective when actual < planned (budget reserved)', () => {
    const { selectedYear, selectedMonth, envelopeTotals } = initBudgetForecastTable()

    selectedYear.value = 2026
    selectedMonth.value = 2

    // Mock data: Courses planned=500, actual=480
    // effective = max(480, 500) = 500 (budget reserved even if not fully spent)
    expect(envelopeTotals.value.actual).toBe(480)
    expect(envelopeTotals.value.planned).toBe(500)
    expect(envelopeTotals.value.effective).toBe(500)
    // variance = effective - planned = 500 - 500 = 0
    expect(envelopeTotals.value.variance).toBe(0)
  })

  // -------------------------------------------------------
  // 8c. envelopeTotals: actual > planned => effective = actual (overspend)
  // -------------------------------------------------------
  it('envelopeTotals uses actual as effective when actual > planned (overspend)', () => {
    // Override useFetch with overspend data for this test
    const overspendData: ForecastData = {
      months: [{ year: 2026, month: 2, label: 'f\u00E9vrier 2026' }],
      incomes: [],
      expenses: [],
      envelopes: [
        {
          entry: { id: 3, type: 'envelope', label: 'Courses', amount: 500, category: null, dayOfMonth: null, active: true, notes: null, createdAt: '', updatedAt: '' },
          actuals: { '2026-2': 550 }
        }
      ]
    }

    // Temporarily override useFetch
    vi.stubGlobal('useFetch', () => ({
      data: ref(overspendData),
      status: ref('idle'),
      refresh: mockRefresh
    }))

    const { selectedYear, selectedMonth, envelopeTotals } = initBudgetForecastTable()

    selectedYear.value = 2026
    selectedMonth.value = 2

    // Courses: planned=500, actual=550
    // effective = max(550, 500) = 550 (overspend counts)
    expect(envelopeTotals.value.actual).toBe(550)
    expect(envelopeTotals.value.planned).toBe(500)
    expect(envelopeTotals.value.effective).toBe(550)
    // variance = effective - planned = 550 - 500 = 50
    expect(envelopeTotals.value.variance).toBe(50)

    // Restore original useFetch
    vi.stubGlobal('useFetch', () => ({
      data: ref(mockData),
      status: ref('idle'),
      refresh: mockRefresh
    }))
  })

  // -------------------------------------------------------
  // 9. remaining = income effective - expense effective - envelope effective
  // -------------------------------------------------------
  it('computes remaining as income - expense - envelope effective values', () => {
    const { selectedYear, selectedMonth, remaining } = initBudgetForecastTable()

    selectedYear.value = 2026
    selectedMonth.value = 2

    // income effective=3200, expense effective=800, envelope effective=max(480,500)=500
    // remaining = 3200 - 800 - 500 = 1900
    expect(remaining.value).toBe(1900)
  })

  // -------------------------------------------------------
  // Column definitions
  // -------------------------------------------------------
  it('returns column arrays for each section', () => {
    const { incomeColumns, expenseColumns, envelopeColumns } = initBudgetForecastTable()

    expect(Array.isArray(incomeColumns)).toBe(true)
    expect(incomeColumns.length).toBeGreaterThan(0)

    expect(Array.isArray(expenseColumns)).toBe(true)
    expect(expenseColumns.length).toBeGreaterThan(0)

    expect(Array.isArray(envelopeColumns)).toBe(true)
    expect(envelopeColumns.length).toBeGreaterThan(0)
  })

  it('envelopeColumns does not include a category column', () => {
    const { envelopeColumns, incomeColumns } = initBudgetForecastTable()

    const envelopeColumnIds = envelopeColumns.map((col: { id?: string }) => col.id).filter(Boolean)
    const incomeColumnIds = incomeColumns.map((col: { id?: string }) => col.id).filter(Boolean)

    // Income/expense columns have a category column; envelope columns do not
    expect(incomeColumnIds).toContain('category')
    expect(envelopeColumnIds).not.toContain('category')
  })

  // -------------------------------------------------------
  // refresh is forwarded from useFetch
  // -------------------------------------------------------
  it('exposes the refresh function from useFetch', () => {
    const { refresh } = initBudgetForecastTable()

    refresh()
    expect(mockRefresh).toHaveBeenCalledOnce()
  })

  // -------------------------------------------------------
  // status is forwarded from useFetch
  // -------------------------------------------------------
  it('exposes the status ref from useFetch', () => {
    const { status } = initBudgetForecastTable()

    expect(status.value).toBe('idle')
  })
})
