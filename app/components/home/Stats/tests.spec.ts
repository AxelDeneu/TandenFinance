import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { stubNuxtAutoImports } from '../../../../test/helpers/nuxt-stubs'
import type { ForecastData } from '~/types'

const mockForecastData: ForecastData = {
  months: [{ year: 2026, month: 2, label: 'fevrier 2026' }],
  incomes: [
    {
      entry: { id: 1, type: 'income', label: 'Salaire', amount: 3000, category: 'Salaire', dayOfMonth: 1, active: true, notes: null, createdAt: '', updatedAt: '' },
      actuals: { '2026-2': 3200 }
    },
    {
      entry: { id: 2, type: 'income', label: 'Freelance', amount: 500, category: 'Freelance', dayOfMonth: 15, active: true, notes: null, createdAt: '', updatedAt: '' },
      actuals: { '2026-2': null }
    }
  ],
  expenses: [
    {
      entry: { id: 3, type: 'expense', label: 'Loyer', amount: 1200, category: 'Logement', dayOfMonth: 5, active: true, notes: null, createdAt: '', updatedAt: '' },
      actuals: { '2026-2': 1200 }
    }
  ],
  envelopes: [
    {
      entry: { id: 4, type: 'envelope', label: 'Courses', amount: 400, category: null, dayOfMonth: null, active: true, notes: null, createdAt: '', updatedAt: '' },
      actuals: { '2026-2': 350 }
    }
  ]
}

stubNuxtAutoImports({
  useAsyncData: async (_key: string, _fn: () => Promise<ForecastData>, opts?: { default?: () => ForecastData }) => {
    const data = ref(mockForecastData)
    return { data, ...(opts?.default ? {} : {}) }
  },
  $fetch: async () => mockForecastData,
  formatEuro: (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
  }
})

const { initHomeStats } = await import('./init')

function computeEffectiveTotal(entries: { entry: { amount: number }, actuals: Record<string, number | null> }[], monthKey: string): number {
  let total = 0
  for (const fe of entries) {
    const actual = fe.actuals[monthKey]
    total += (actual !== null && actual !== undefined) ? actual : fe.entry.amount
  }
  return total
}

function computeEnvelopeEffectiveTotal(entries: { entry: { amount: number }, actuals: Record<string, number | null> }[], monthKey: string): number {
  let total = 0
  for (const fe of entries) {
    const actual = fe.actuals[monthKey]
    total += (actual !== null && actual !== undefined) ? Math.max(actual, fe.entry.amount) : fe.entry.amount
  }
  return total
}

describe('initHomeStats', () => {
  it('should return stats and leadingClasses', async () => {
    const result = await initHomeStats()

    expect(result).toHaveProperty('stats')
    expect(result).toHaveProperty('leadingClasses')
  })

  it('should generate 4 stat cards', async () => {
    const { stats } = await initHomeStats()

    expect(stats.value).toHaveLength(4)
  })

  it('should include all expected stat titles', async () => {
    const { stats } = await initHomeStats()

    const titles = stats.value.map(s => s.title)
    expect(titles).toContain('Revenus')
    expect(titles).toContain('Depenses')
    expect(titles).toContain('Enveloppes')
    expect(titles).toContain('Reste a vivre')
  })

  it('each stat should have icon, value, count, and color', async () => {
    const { stats } = await initHomeStats()

    stats.value.forEach((stat) => {
      expect(stat).toHaveProperty('title')
      expect(stat).toHaveProperty('icon')
      expect(stat).toHaveProperty('value')
      expect(stat).toHaveProperty('count')
      expect(stat).toHaveProperty('color')
      expect(typeof stat.value).toBe('string')
      expect(typeof stat.count).toBe('number')
    })
  })

  it('should use correct colors for each stat', async () => {
    const { stats } = await initHomeStats()

    const revenusStat = stats.value.find(s => s.title === 'Revenus')
    expect(revenusStat?.color).toBe('success')

    const depensesStat = stats.value.find(s => s.title === 'Depenses')
    expect(depensesStat?.color).toBe('error')

    const enveloppesStat = stats.value.find(s => s.title === 'Enveloppes')
    expect(enveloppesStat?.color).toBe('warning')
  })

  it('should have correct entry counts', async () => {
    const { stats } = await initHomeStats()

    const revenusStat = stats.value.find(s => s.title === 'Revenus')
    expect(revenusStat?.count).toBe(2)

    const depensesStat = stats.value.find(s => s.title === 'Depenses')
    expect(depensesStat?.count).toBe(1)

    const enveloppesStat = stats.value.find(s => s.title === 'Enveloppes')
    expect(enveloppesStat?.count).toBe(1)
  })

  it('should provide leadingClasses for all color variants', async () => {
    const { leadingClasses } = await initHomeStats()

    expect(leadingClasses).toHaveProperty('success')
    expect(leadingClasses).toHaveProperty('error')
    expect(leadingClasses).toHaveProperty('warning')
  })

  it('remaining stat uses success color when remaining >= 0', async () => {
    const { stats } = await initHomeStats()
    const remaining = stats.value.find(s => s.title === 'Reste a vivre')
    expect(remaining?.color).toBe('success')
  })

  it('remaining stat count is sum of all entry counts', async () => {
    const { stats } = await initHomeStats()
    const remaining = stats.value.find(s => s.title === 'Reste a vivre')
    expect(remaining?.count).toBe(4)
  })

  it('stat values are formatted euro strings', async () => {
    const { stats } = await initHomeStats()
    for (const stat of stats.value) {
      expect(stat.value).toContain('€')
    }
  })
})

describe('computeEffectiveTotal', () => {
  it('should use actual when available', () => {
    const entries = mockForecastData.incomes
    const total = computeEffectiveTotal(entries, '2026-2')

    // Entry 1: actual 3200, Entry 2: no actual so uses planned 500
    expect(total).toBe(3700)
  })

  it('should use planned when actual is null', () => {
    const entries = [
      {
        entry: { id: 1, type: 'income' as const, label: 'Test', amount: 1000, category: null, dayOfMonth: null, active: true, notes: null, createdAt: '', updatedAt: '' },
        actuals: { '2026-2': null }
      }
    ]
    const total = computeEffectiveTotal(entries, '2026-2')
    expect(total).toBe(1000)
  })

  it('should use planned when no actual for month key', () => {
    const entries = [
      {
        entry: { id: 1, type: 'income' as const, label: 'Test', amount: 1000, category: null, dayOfMonth: null, active: true, notes: null, createdAt: '', updatedAt: '' },
        actuals: {}
      }
    ]
    const total = computeEffectiveTotal(entries, '2026-2')
    expect(total).toBe(1000)
  })
})

describe('computeEnvelopeEffectiveTotal', () => {
  it('should use max(actual, planned) when actual exists', () => {
    const entries = [
      {
        entry: { id: 1, type: 'envelope' as const, label: 'Courses', amount: 400, category: null, dayOfMonth: null, active: true, notes: null, createdAt: '', updatedAt: '' },
        actuals: { '2026-2': 350 }
      }
    ]
    // max(350, 400) = 400
    const total = computeEnvelopeEffectiveTotal(entries, '2026-2')
    expect(total).toBe(400)
  })

  it('should use actual when actual exceeds planned', () => {
    const entries = [
      {
        entry: { id: 1, type: 'envelope' as const, label: 'Courses', amount: 400, category: null, dayOfMonth: null, active: true, notes: null, createdAt: '', updatedAt: '' },
        actuals: { '2026-2': 500 }
      }
    ]
    // max(500, 400) = 500
    const total = computeEnvelopeEffectiveTotal(entries, '2026-2')
    expect(total).toBe(500)
  })

  it('should use planned when no actual exists', () => {
    const entries = [
      {
        entry: { id: 1, type: 'envelope' as const, label: 'Courses', amount: 400, category: null, dayOfMonth: null, active: true, notes: null, createdAt: '', updatedAt: '' },
        actuals: { '2026-2': null }
      }
    ]
    const total = computeEnvelopeEffectiveTotal(entries, '2026-2')
    expect(total).toBe(400)
  })
})
