import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { stubNuxtAutoImports } from '../../../../test/helpers/nuxt-stubs'
import type { ForecastData } from '~/types'

const mockPush = vi.fn()

const mockForecastData: ForecastData = {
  months: [
    { year: 2025, month: 3, label: 'mars 2025' },
    { year: 2025, month: 4, label: 'avril 2025' },
    { year: 2025, month: 5, label: 'mai 2025' }
  ],
  incomes: [
    {
      entry: { id: 1, type: 'income', label: 'Salaire', amount: 3000, category: 'Salaire', dayOfMonth: 25, active: true, notes: null, createdAt: '', updatedAt: '' },
      actuals: { '2025-3': 3200, '2025-4': null, '2025-5': 2800 }
    }
  ],
  expenses: [
    {
      entry: { id: 2, type: 'expense', label: 'Loyer', amount: 800, category: 'Logement', dayOfMonth: 5, active: true, notes: null, createdAt: '', updatedAt: '' },
      actuals: { '2025-3': 800, '2025-4': null, '2025-5': 850 }
    }
  ],
  envelopes: [
    {
      entry: { id: 3, type: 'envelope', label: 'Courses', amount: 500, category: null, dayOfMonth: null, active: true, notes: null, createdAt: '', updatedAt: '' },
      actuals: { '2025-3': 480, '2025-4': null, '2025-5': 550 }
    }
  ]
}

const mockWidth = ref(800)

stubNuxtAutoImports({
  useElementSize: () => ({ width: mockWidth }),
  useRouter: () => ({ push: mockPush }),
  useFetch: (_url: string, opts?: { default?: () => ForecastData }) => {
    const data = ref(mockForecastData)
    return { data, status: ref('idle'), ...(opts?.default ? {} : {}) }
  },
  formatEuro: (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
  }
})

const { initBudgetHistoryView } = await import('./init')

describe('initBudgetHistoryView', () => {
  function createContext() {
    const cardRef = ref<HTMLElement | null>(null)
    return { cardRef }
  }

  // -------------------------------------------------------
  // 1. Returns all expected properties
  // -------------------------------------------------------
  it('returns all expected properties', () => {
    const result = initBudgetHistoryView(createContext())

    const expectedKeys = [
      'width',
      'data',
      'status',
      'monthlySummaries',
      'chartData',
      'hasChartData',
      'columns',
      'x',
      'yIncome',
      'yExpenses',
      'xTicks',
      'template',
      'navigateToMonth'
    ]

    for (const key of expectedKeys) {
      expect(result).toHaveProperty(key)
    }
  })

  // -------------------------------------------------------
  // 2. Monthly summaries computed correctly
  // -------------------------------------------------------
  it('computes correct monthly summaries count', () => {
    const { monthlySummaries } = initBudgetHistoryView(createContext())
    expect(monthlySummaries.value).toHaveLength(3)
  })

  it('computes income totals with actual when available', () => {
    const { monthlySummaries } = initBudgetHistoryView(createContext())
    const march = monthlySummaries.value[0]

    // Salaire: planned=3000, actual=3200
    expect(march.incomePlanned).toBe(3000)
    expect(march.incomeEffective).toBe(3200)
  })

  it('falls back to planned income when actual is null', () => {
    const { monthlySummaries } = initBudgetHistoryView(createContext())
    const april = monthlySummaries.value[1]

    // Salaire: planned=3000, actual=null => effective=3000
    expect(april.incomePlanned).toBe(3000)
    expect(april.incomeEffective).toBe(3000)
  })

  it('computes expense totals with actual when available', () => {
    const { monthlySummaries } = initBudgetHistoryView(createContext())
    const may = monthlySummaries.value[2]

    // Loyer: planned=800, actual=850
    expect(may.expensePlanned).toBe(800)
    expect(may.expenseEffective).toBe(850)
  })

  // -------------------------------------------------------
  // 3. Envelope logic: max(actual, planned)
  // -------------------------------------------------------
  it('envelopes use max(actual, planned) when actual < planned', () => {
    const { monthlySummaries } = initBudgetHistoryView(createContext())
    const march = monthlySummaries.value[0]

    // Courses: planned=500, actual=480 => max(480, 500) = 500
    expect(march.envelopePlanned).toBe(500)
    expect(march.envelopeEffective).toBe(500)
  })

  it('envelopes use max(actual, planned) when actual > planned (overspend)', () => {
    const { monthlySummaries } = initBudgetHistoryView(createContext())
    const may = monthlySummaries.value[2]

    // Courses: planned=500, actual=550 => max(550, 500) = 550
    expect(may.envelopePlanned).toBe(500)
    expect(may.envelopeEffective).toBe(550)
  })

  // -------------------------------------------------------
  // 4. Remaining calculation
  // -------------------------------------------------------
  it('computes remaining = incomeEffective - expenseEffective - envelopeEffective', () => {
    const { monthlySummaries } = initBudgetHistoryView(createContext())
    const march = monthlySummaries.value[0]

    // income=3200, expense=800, envelope=max(480,500)=500
    // remaining = 3200 - 800 - 500 = 1900
    expect(march.remaining).toBe(1900)
  })

  it('computes remainingPlanned = incomePlanned - expensePlanned - envelopePlanned', () => {
    const { monthlySummaries } = initBudgetHistoryView(createContext())
    const march = monthlySummaries.value[0]

    // 3000 - 800 - 500 = 1700
    expect(march.remainingPlanned).toBe(1700)
  })

  // -------------------------------------------------------
  // 5. Chart data generation
  // -------------------------------------------------------
  it('generates chartData with correct structure', () => {
    const { chartData } = initBudgetHistoryView(createContext())

    expect(chartData.value).toHaveLength(3)
    chartData.value.forEach((record) => {
      expect(record).toHaveProperty('month')
      expect(record).toHaveProperty('income')
      expect(record).toHaveProperty('expenses')
    })
  })

  it('chartData expenses = expenseEffective + envelopeEffective', () => {
    const { chartData } = initBudgetHistoryView(createContext())
    const march = chartData.value[0]

    // expense=800, envelope=500 => expenses=1300
    expect(march.expenses).toBe(1300)
  })

  // -------------------------------------------------------
  // 6. Unovis accessors
  // -------------------------------------------------------
  it('x accessor returns index', () => {
    const { x } = initBudgetHistoryView(createContext())
    expect(x({ month: 'test', income: 100, expenses: 50 }, 3)).toBe(3)
  })

  it('yIncome accessor returns income', () => {
    const { yIncome } = initBudgetHistoryView(createContext())
    expect(yIncome({ month: 'test', income: 3000, expenses: 1300 })).toBe(3000)
  })

  it('yExpenses accessor returns expenses', () => {
    const { yExpenses } = initBudgetHistoryView(createContext())
    expect(yExpenses({ month: 'test', income: 3000, expenses: 1300 })).toBe(1300)
  })

  it('xTicks returns month label for valid index', () => {
    const { chartData, xTicks } = initBudgetHistoryView(createContext())
    expect(xTicks(0)).toBe(chartData.value[0].month)
  })

  it('xTicks returns empty string for out of range index', () => {
    const { xTicks } = initBudgetHistoryView(createContext())
    expect(xTicks(99)).toBe('')
  })

  // -------------------------------------------------------
  // 7. navigateToMonth
  // -------------------------------------------------------
  it('navigateToMonth pushes correct route', () => {
    const { navigateToMonth } = initBudgetHistoryView(createContext())

    navigateToMonth(2025, 6)

    expect(mockPush).toHaveBeenCalledWith({
      path: '/budget/previsionnel',
      query: { year: '2025', month: '6' }
    })
  })

  // -------------------------------------------------------
  // 8. Columns definition
  // -------------------------------------------------------
  it('defines 5 columns', () => {
    const { columns } = initBudgetHistoryView(createContext())
    expect(columns).toHaveLength(5)
  })

  // -------------------------------------------------------
  // 9. Column cell renderers
  // -------------------------------------------------------
  function makeMockRow(summary: Record<string, unknown>) {
    return { original: summary } as { original: typeof summary }
  }

  it('Mois column renders a clickable button with the label', () => {
    const { columns } = initBudgetHistoryView(createContext())
    const moisCol = columns[0]
    const row = makeMockRow({ year: 2025, month: 3, label: 'mars 2025' })
    const vnode = (moisCol as { cell: (ctx: { row: typeof row }) => unknown }).cell({ row })

    expect(vnode).toBeTruthy()
    // VNode should render a button with the label text
    expect((vnode as { type: string }).type).toBe('button')
    expect((vnode as { children: string }).children).toBe('mars 2025')
  })

  it('Mois column click calls navigateToMonth', () => {
    mockPush.mockClear()
    const { columns } = initBudgetHistoryView(createContext())
    const moisCol = columns[0]
    const row = makeMockRow({ year: 2025, month: 3, label: 'mars 2025' })
    const vnode = (moisCol as { cell: (ctx: { row: typeof row }) => unknown }).cell({ row }) as { props: { onClick: () => void } }

    vnode.props.onClick()

    expect(mockPush).toHaveBeenCalledWith({
      path: '/budget/previsionnel',
      query: { year: '2025', month: '3' }
    })
  })

  it('Income column renders variance with green when effective >= planned', () => {
    const { columns } = initBudgetHistoryView(createContext())
    const incomeCol = columns[1]
    const row = makeMockRow({ incomeEffective: 3200, incomePlanned: 3000 })
    const vnode = (incomeCol as { cell: (ctx: { row: typeof row }) => unknown }).cell({ row }) as { children: Array<{ props: { class: string } }> }

    expect(vnode).toBeTruthy()
    // Second child span should have text-success (earned more than planned)
    expect(vnode.children[1].props.class).toContain('text-success')
  })

  it('Income column renders variance with red when effective < planned', () => {
    const { columns } = initBudgetHistoryView(createContext())
    const incomeCol = columns[1]
    const row = makeMockRow({ incomeEffective: 2800, incomePlanned: 3000 })
    const vnode = (incomeCol as { cell: (ctx: { row: typeof row }) => unknown }).cell({ row }) as { children: Array<{ props: { class: string } }> }

    expect(vnode.children[1].props.class).toContain('text-error')
  })

  it('Expense column renders variance with green when effective <= planned', () => {
    const { columns } = initBudgetHistoryView(createContext())
    const expenseCol = columns[2]
    const row = makeMockRow({ expenseEffective: 750, expensePlanned: 800 })
    const vnode = (expenseCol as { cell: (ctx: { row: typeof row }) => unknown }).cell({ row }) as { children: Array<{ props: { class: string } }> }

    expect(vnode.children[1].props.class).toContain('text-success')
  })

  it('Expense column renders variance with red when effective > planned', () => {
    const { columns } = initBudgetHistoryView(createContext())
    const expenseCol = columns[2]
    const row = makeMockRow({ expenseEffective: 850, expensePlanned: 800 })
    const vnode = (expenseCol as { cell: (ctx: { row: typeof row }) => unknown }).cell({ row }) as { children: Array<{ props: { class: string } }> }

    expect(vnode.children[1].props.class).toContain('text-error')
  })

  it('Envelope column renders variance correctly', () => {
    const { columns } = initBudgetHistoryView(createContext())
    const envelopeCol = columns[3]
    const row = makeMockRow({ envelopeEffective: 500, envelopePlanned: 500 })
    const vnode = (envelopeCol as { cell: (ctx: { row: typeof row }) => unknown }).cell({ row }) as { children: Array<{ props: { class: string } }> }

    // diff = 0, lte check => green
    expect(vnode.children[1].props.class).toContain('text-success')
  })

  it('Remaining column renders green for positive remaining', () => {
    const { columns } = initBudgetHistoryView(createContext())
    const remainingCol = columns[4]
    const row = makeMockRow({ remaining: 1900 })
    const vnode = (remainingCol as { cell: (ctx: { row: typeof row }) => unknown }).cell({ row }) as { props: { class: string } }

    expect(vnode.props.class).toContain('text-success')
  })

  it('Remaining column renders red for negative remaining', () => {
    const { columns } = initBudgetHistoryView(createContext())
    const remainingCol = columns[4]
    const row = makeMockRow({ remaining: -200 })
    const vnode = (remainingCol as { cell: (ctx: { row: typeof row }) => unknown }).cell({ row }) as { props: { class: string } }

    expect(vnode.props.class).toContain('text-error')
  })

  // -------------------------------------------------------
  // 10. Tooltip template
  // -------------------------------------------------------
  it('template contains income, expense and remaining info', () => {
    const { template } = initBudgetHistoryView(createContext())
    const record = { month: 'mars 2025', income: 3200, expenses: 1300 }
    const result = template(record)

    expect(result).toContain('mars 2025')
    expect(result).toContain('Revenus')
    expect(result).toContain('Depenses')
    expect(result).toContain('Reste')
  })

  it('template returns an empty string when no datum is provided', () => {
    const { template } = initBudgetHistoryView(createContext())

    expect(template(undefined)).toBe('')
  })

  // -------------------------------------------------------
  // 11. Empty data edge case
  // -------------------------------------------------------
  it('returns empty summaries when data has no months', () => {
    vi.stubGlobal('useFetch', (_url: string, opts?: { default?: () => ForecastData }) => {
      const emptyData: ForecastData = { months: [], incomes: [], expenses: [], envelopes: [] }
      return { data: ref(emptyData), status: ref('idle'), ...(opts?.default ? {} : {}) }
    })

    const { monthlySummaries, chartData, hasChartData } = initBudgetHistoryView(createContext())
    expect(monthlySummaries.value).toHaveLength(0)
    expect(chartData.value).toHaveLength(0)
    expect(hasChartData.value).toBe(false)

    // Restore
    vi.stubGlobal('useFetch', (_url: string, opts?: { default?: () => ForecastData }) => {
      const data = ref(mockForecastData)
      return { data, status: ref('idle'), ...(opts?.default ? {} : {}) }
    })
  })
})
