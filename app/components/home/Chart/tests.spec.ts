import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { stubNuxtAutoImports } from '../../../../test/helpers/nuxt-stubs'
import type { ForecastData } from '~/types'

const mockForecastData: ForecastData = {
  months: [
    { year: 2026, month: 2, label: 'fevrier 2026' },
    { year: 2026, month: 3, label: 'mars 2026' },
    { year: 2026, month: 4, label: 'avril 2026' }
  ],
  incomes: [
    {
      entry: { id: 1, type: 'income', label: 'Salaire', amount: 3000, category: 'Salaire', dayOfMonth: 1, active: true, notes: null, createdAt: '', updatedAt: '' },
      actuals: { '2026-2': 3200, '2026-3': null, '2026-4': null }
    }
  ],
  expenses: [
    {
      entry: { id: 2, type: 'expense', label: 'Loyer', amount: 1200, category: 'Logement', dayOfMonth: 5, active: true, notes: null, createdAt: '', updatedAt: '' },
      actuals: { '2026-2': 1200, '2026-3': null, '2026-4': null }
    }
  ],
  envelopes: [
    {
      entry: { id: 3, type: 'envelope', label: 'Courses', amount: 400, category: null, dayOfMonth: null, active: true, notes: null, createdAt: '', updatedAt: '' },
      actuals: { '2026-2': 350, '2026-3': null, '2026-4': null }
    }
  ]
}

const mockWidth = ref(800)

stubNuxtAutoImports({
  useElementSize: () => ({ width: mockWidth }),
  useFetch: (_url: string, opts?: { default?: () => ForecastData }) => {
    const data = ref(mockForecastData)
    return { data, ...(opts?.default ? {} : {}) }
  },
  formatEuro: (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
  }
})

const { initHomeChart } = await import('./init')

describe('initHomeChart', () => {
  function createContext() {
    const cardRef = ref<HTMLElement | null>(null)
    return { cardRef }
  }

  it('should return all expected properties', () => {
    const ctx = createContext()
    const result = initHomeChart(ctx)

    expect(result).toHaveProperty('width')
    expect(result).toHaveProperty('chartData')
    expect(result).toHaveProperty('currentMonthRemaining')
    expect(result).toHaveProperty('x')
    expect(result).toHaveProperty('yIncome')
    expect(result).toHaveProperty('yExpenses')
    expect(result).toHaveProperty('xTicks')
    expect(result).toHaveProperty('template')
  })

  it('should generate chart data records for each month', () => {
    const ctx = createContext()
    const { chartData } = initHomeChart(ctx)

    expect(chartData.value).toHaveLength(3)
    chartData.value.forEach((record) => {
      expect(record).toHaveProperty('month')
      expect(record).toHaveProperty('income')
      expect(record).toHaveProperty('expenses')
      expect(typeof record.income).toBe('number')
      expect(typeof record.expenses).toBe('number')
    })
  })

  it('should compute correct income for first month with actuals', () => {
    const ctx = createContext()
    const { chartData } = initHomeChart(ctx)

    // Month 1 (Feb 2026): income actual = 3200
    expect(chartData.value[0]!.income).toBe(3200)
  })

  it('should compute correct expenses for first month', () => {
    const ctx = createContext()
    const { chartData } = initHomeChart(ctx)

    // Month 1 (Feb 2026): expense actual = 1200, envelope max(350, 400) = 400
    expect(chartData.value[0]!.expenses).toBe(1600)
  })

  it('should fall back to planned amounts when no actuals', () => {
    const ctx = createContext()
    const { chartData } = initHomeChart(ctx)

    // Month 2 (Mar 2026): all actuals are null, so use planned
    // Income = 3000, Expenses = 1200 + 400 = 1600
    expect(chartData.value[1]!.income).toBe(3000)
    expect(chartData.value[1]!.expenses).toBe(1600)
  })

  it('x accessor should return index', () => {
    const ctx = createContext()
    const { x } = initHomeChart(ctx)

    expect(x({ month: 'test', income: 100, expenses: 50 }, 5)).toBe(5)
  })

  it('yIncome accessor should return income', () => {
    const ctx = createContext()
    const { yIncome } = initHomeChart(ctx)

    expect(yIncome({ month: 'test', income: 3000, expenses: 1600 })).toBe(3000)
  })

  it('yExpenses accessor should return expenses', () => {
    const ctx = createContext()
    const { yExpenses } = initHomeChart(ctx)

    expect(yExpenses({ month: 'test', income: 3000, expenses: 1600 })).toBe(1600)
  })

  it('xTicks should return month label', () => {
    const ctx = createContext()
    const { chartData, xTicks } = initHomeChart(ctx)

    // xTicks returns the month label for each index
    const tick = xTicks(0)
    expect(tick).toBe(chartData.value[0]!.month)
  })

  it('xTicks should return empty string for out of range index', () => {
    const ctx = createContext()
    const { xTicks } = initHomeChart(ctx)

    expect(xTicks(99)).toBe('')
  })

  it('template should contain income and expense info', () => {
    const ctx = createContext()
    const { template } = initHomeChart(ctx)

    const record = { month: 'fevr. 2026', income: 3200, expenses: 1600 }
    const result = template(record)
    expect(result).toContain('fevr. 2026')
    expect(result).toContain('Revenus')
    expect(result).toContain('Depenses')
    expect(result).toContain('Reste')
  })
})
