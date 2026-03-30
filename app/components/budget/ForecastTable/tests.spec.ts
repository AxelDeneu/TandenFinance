import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { stubNuxtAutoImports } from '../../../../test/helpers/nuxt-stubs'
import type { ForecastData, ForecastEntry } from '~/types'

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

stubNuxtAutoImports({
  useFetch: () => ({
    data: ref(mockData),
    status: ref('idle'),
    refresh: mockRefresh
  })
})

vi.mock('#components', () => ({
  UButton: {},
  UBadge: {},
  UIcon: {}
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
      'remaining',
      'selectedEntry',
      'entryDetailOpen'
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

  // -------------------------------------------------------
  // Helper: build a mock row and invoke a column cell renderer
  // -------------------------------------------------------
  function renderCell(columns: { id?: string, cell?: (ctx: { row: { original: ForecastEntry, getValue: (k: string) => unknown } }) => unknown }[], columnId: string, entry: ForecastEntry) {
    const col = columns.find(c => c.id === columnId)
    const mockRow = {
      original: entry,
      getValue: (k: string) => (entry as Record<string, unknown>)[k]
    }
    return (col!.cell as (ctx: { row: typeof mockRow }) => Record<string, unknown>)({ row: mockRow })
  }

  // -------------------------------------------------------
  // openEntryDetail sets selectedEntry and opens slideover
  // -------------------------------------------------------
  it('openEntryDetail sets selectedEntry and opens slideover', () => {
    const result = initBudgetForecastTable()
    result.selectedYear.value = 2026
    result.selectedMonth.value = 2

    const entry = result.incomes.value[0]
    const vnode = renderCell(result.incomeColumns, 'label', entry)

    // Trigger the onClick handler on the button vnode
    vnode.props.onClick()

    expect(result.selectedEntry.value).toEqual(entry.entry)
    expect(result.entryDetailOpen.value).toBe(true)
  })

  // -------------------------------------------------------
  // Income label cell renders clickable button with entry label
  // -------------------------------------------------------
  it('income label cell renders clickable button with entry label', () => {
    const result = initBudgetForecastTable()
    result.selectedYear.value = 2026
    result.selectedMonth.value = 2

    const entry = result.incomes.value[0]
    const vnode = renderCell(result.incomeColumns, 'label', entry)

    expect(vnode.type).toBe('button')
    expect(vnode.children).toBe('Salaire')
    expect(vnode.props.onClick).toBeTypeOf('function')
  })

  // -------------------------------------------------------
  // Income category cell renders UBadge with correct color
  // -------------------------------------------------------
  it('income category cell renders UBadge with correct color', () => {
    const result = initBudgetForecastTable()
    result.selectedYear.value = 2026
    result.selectedMonth.value = 2

    const entry = result.incomes.value[0] // Salaire category
    const vnode = renderCell(result.incomeColumns, 'category', entry)

    // UBadge is rendered via h(UBadge, { variant, color })
    expect(vnode.props.variant).toBe('subtle')
    expect(vnode.props.color).toBe('success') // Salaire -> success
  })

  // -------------------------------------------------------
  // Income category cell renders dash when category is null
  // -------------------------------------------------------
  it('income category cell renders dash when category is null', () => {
    const result = initBudgetForecastTable()
    result.selectedYear.value = 2026
    result.selectedMonth.value = 2

    const entryWithNullCategory: ForecastEntry = {
      entry: { id: 99, type: 'income', label: 'Test', amount: 100, category: null, dayOfMonth: 1, active: true, notes: null, createdAt: '', updatedAt: '' },
      actuals: { '2026-2': 100 }
    }
    const vnode = renderCell(result.incomeColumns, 'category', entryWithNullCategory)

    expect(vnode.type).toBe('span')
    expect(vnode.children).toBe('-')
  })

  // -------------------------------------------------------
  // Planned cell renders formatted euro amount
  // -------------------------------------------------------
  it('planned cell renders formatted euro amount', () => {
    const result = initBudgetForecastTable()
    result.selectedYear.value = 2026
    result.selectedMonth.value = 2

    const entry = result.incomes.value[0] // amount: 3000
    const vnode = renderCell(result.incomeColumns, 'planned', entry)

    expect(vnode.type).toBe('span')
    expect(vnode.props.class).toContain('tabular-nums')
    expect(vnode.children).toContain('3')
    expect(vnode.children).toContain('000')
  })

  // -------------------------------------------------------
  // Income actual cell renders formatted amount when not null
  // -------------------------------------------------------
  it('income actual cell renders formatted amount when not null', () => {
    const result = initBudgetForecastTable()
    result.selectedYear.value = 2026
    result.selectedMonth.value = 2

    const entry = result.incomes.value[0] // actual: 3200
    const vnode = renderCell(result.incomeColumns, 'actual', entry)

    expect(vnode.type).toBe('span')
    expect(vnode.props.class).toContain('tabular-nums')
    expect(vnode.props.class).toContain('font-medium')
    expect(vnode.children).toContain('3')
    expect(vnode.children).toContain('200')
  })

  // -------------------------------------------------------
  // Income actual cell renders dash when actual is null
  // -------------------------------------------------------
  it('income actual cell renders dash when actual is null', () => {
    const result = initBudgetForecastTable()
    result.selectedYear.value = 2026
    result.selectedMonth.value = 2

    const entry = result.expenses.value[0] // Loyer actual: null
    const vnode = renderCell(result.expenseColumns, 'actual', entry)

    expect(vnode.type).toBe('span')
    expect(vnode.props.class).toContain('text-muted')
    expect(vnode.children).toBe('—')
  })

  // -------------------------------------------------------
  // Income variance cell renders positive green for income over plan
  // -------------------------------------------------------
  it('income variance cell renders positive green for income over plan', () => {
    const result = initBudgetForecastTable()
    result.selectedYear.value = 2026
    result.selectedMonth.value = 2

    // Salaire: actual=3200, planned=3000, diff=+200 (income: diff>=0 -> green/success)
    const entry = result.incomes.value[0]
    const vnode = renderCell(result.incomeColumns, 'variance', entry)

    expect(vnode.type).toBe('span')
    expect(vnode.props.class).toContain('text-success')
    expect(vnode.children).toContain('+')
    expect(vnode.children).toContain('200')
  })

  // -------------------------------------------------------
  // Expense variance cell renders dash when actual is null
  // -------------------------------------------------------
  it('expense variance cell renders dash when actual is null', () => {
    const result = initBudgetForecastTable()
    result.selectedYear.value = 2026
    result.selectedMonth.value = 2

    const entry = result.expenses.value[0] // Loyer actual: null
    const vnode = renderCell(result.expenseColumns, 'variance', entry)

    expect(vnode.type).toBe('span')
    expect(vnode.props.class).toContain('text-muted')
    expect(vnode.children).toBe('—')
  })

  // -------------------------------------------------------
  // Expense variance cell renders green for expense under plan
  // -------------------------------------------------------
  it('expense variance cell renders green for expense under plan', () => {
    const result = initBudgetForecastTable()
    result.selectedYear.value = 2026
    result.selectedMonth.value = 2

    const underBudgetExpense: ForecastEntry = {
      entry: { id: 10, type: 'expense', label: 'Eau', amount: 100, category: 'Eau', dayOfMonth: 10, active: true, notes: null, createdAt: '', updatedAt: '' },
      actuals: { '2026-2': 80 }
    }
    const vnode = renderCell(result.expenseColumns, 'variance', underBudgetExpense)

    // diff = 80 - 100 = -20 (expense: diff<=0 -> green/success)
    expect(vnode.props.class).toContain('text-success')
  })

  // -------------------------------------------------------
  // Expense variance cell renders red for expense over plan
  // -------------------------------------------------------
  it('expense variance cell renders red for expense over plan', () => {
    const result = initBudgetForecastTable()
    result.selectedYear.value = 2026
    result.selectedMonth.value = 2

    const overBudgetExpense: ForecastEntry = {
      entry: { id: 11, type: 'expense', label: 'Eau', amount: 100, category: 'Eau', dayOfMonth: 10, active: true, notes: null, createdAt: '', updatedAt: '' },
      actuals: { '2026-2': 120 }
    }
    const vnode = renderCell(result.expenseColumns, 'variance', overBudgetExpense)

    // diff = 120 - 100 = +20 (expense: diff>0 -> red/error)
    expect(vnode.props.class).toContain('text-error')
    expect(vnode.children).toContain('+')
  })

  // -------------------------------------------------------
  // Envelope label cell renders button with alert icon when over budget
  // -------------------------------------------------------
  it('envelope label cell renders button with alert icon when over budget', () => {
    const result = initBudgetForecastTable()
    result.selectedYear.value = 2026
    result.selectedMonth.value = 2

    const overBudgetEnvelope: ForecastEntry = {
      entry: { id: 20, type: 'envelope', label: 'Sorties', amount: 200, category: null, dayOfMonth: null, active: true, notes: null, createdAt: '', updatedAt: '' },
      actuals: { '2026-2': 250 }
    }
    const vnode = renderCell(result.envelopeColumns, 'label', overBudgetEnvelope)

    // Wrapper div with flex
    expect(vnode.type).toBe('div')
    expect(vnode.props.class).toContain('flex')

    // Should have 2 children: button + alert icon
    expect(vnode.children).toHaveLength(2)

    const button = vnode.children[0]
    expect(button.type).toBe('button')
    expect(button.children).toBe('Sorties')

    const icon = vnode.children[1]
    expect(icon.props.name).toBe('i-lucide-triangle-alert')
    expect(icon.props.class).toContain('text-error')
  })

  // -------------------------------------------------------
  // Envelope label cell renders button without alert when under budget
  // -------------------------------------------------------
  it('envelope label cell renders button without alert when under budget', () => {
    const result = initBudgetForecastTable()
    result.selectedYear.value = 2026
    result.selectedMonth.value = 2

    // Courses: actual=480, planned=500 -> under budget
    const entry = result.envelopes.value[0]
    const vnode = renderCell(result.envelopeColumns, 'label', entry)

    expect(vnode.type).toBe('div')
    // Should have only 1 child: the button (no alert icon)
    expect(vnode.children).toHaveLength(1)

    const button = vnode.children[0]
    expect(button.type).toBe('button')
    expect(button.children).toBe('Courses')
  })

  // -------------------------------------------------------
  // Envelope actual cell renders progress bar green when < 75%
  // -------------------------------------------------------
  it('envelope actual cell renders progress bar green when under 75%', () => {
    const result = initBudgetForecastTable()
    result.selectedYear.value = 2026
    result.selectedMonth.value = 2

    const lowSpendEnvelope: ForecastEntry = {
      entry: { id: 30, type: 'envelope', label: 'Loisirs', amount: 400, category: null, dayOfMonth: null, active: true, notes: null, createdAt: '', updatedAt: '' },
      actuals: { '2026-2': 200 } // 200/400 = 50% -> green
    }
    const vnode = renderCell(result.envelopeColumns, 'actual', lowSpendEnvelope)

    // Outer div with flex-col
    expect(vnode.type).toBe('div')
    const [amountSpan, progressContainer] = vnode.children
    expect(amountSpan.type).toBe('span')
    expect(amountSpan.children).toContain('200')

    const progressBar = progressContainer.children[0]
    expect(progressBar.props.class).toContain('bg-success')
    expect(progressBar.props.style.width).toBe('50%')
  })

  // -------------------------------------------------------
  // Envelope actual cell renders progress bar warning when 75-100%
  // -------------------------------------------------------
  it('envelope actual cell renders progress bar warning when between 75% and 100%', () => {
    const result = initBudgetForecastTable()
    result.selectedYear.value = 2026
    result.selectedMonth.value = 2

    // Courses: actual=480, planned=500 -> 96% -> warning
    const entry = result.envelopes.value[0]
    const vnode = renderCell(result.envelopeColumns, 'actual', entry)

    const progressBar = vnode.children[1].children[0]
    expect(progressBar.props.class).toContain('bg-warning')
    expect(progressBar.props.style.width).toBe('96%')
  })

  // -------------------------------------------------------
  // Envelope actual cell renders progress bar error when > 100%
  // -------------------------------------------------------
  it('envelope actual cell renders progress bar error when over 100%', () => {
    const result = initBudgetForecastTable()
    result.selectedYear.value = 2026
    result.selectedMonth.value = 2

    const overBudgetEnvelope: ForecastEntry = {
      entry: { id: 31, type: 'envelope', label: 'Sorties', amount: 200, category: null, dayOfMonth: null, active: true, notes: null, createdAt: '', updatedAt: '' },
      actuals: { '2026-2': 250 } // 250/200 = 125% -> error
    }
    const vnode = renderCell(result.envelopeColumns, 'actual', overBudgetEnvelope)

    const progressBar = vnode.children[1].children[0]
    expect(progressBar.props.class).toContain('bg-error')
    // Width capped at 100%
    expect(progressBar.props.style.width).toBe('100%')
  })

  // -------------------------------------------------------
  // Envelope actual cell renders dash when actual is null
  // -------------------------------------------------------
  it('envelope actual cell renders dash when actual is null', () => {
    const result = initBudgetForecastTable()
    result.selectedYear.value = 2026
    result.selectedMonth.value = 2

    const nullActualEnvelope: ForecastEntry = {
      entry: { id: 32, type: 'envelope', label: 'Cadeaux', amount: 100, category: null, dayOfMonth: null, active: true, notes: null, createdAt: '', updatedAt: '' },
      actuals: { '2026-2': null }
    }
    const vnode = renderCell(result.envelopeColumns, 'actual', nullActualEnvelope)

    expect(vnode.type).toBe('span')
    expect(vnode.props.class).toContain('text-muted')
    expect(vnode.children).toBe('—')
  })
})
