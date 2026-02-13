import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { RecentEnvelopeExpense } from './init'

const mockExpenses: RecentEnvelopeExpense[] = [
  { id: 1, label: 'Carrefour', envelopeLabel: 'Courses', amount: 85.50, year: 2026, month: 2, createdAt: '2026-02-12T10:00:00Z' },
  { id: 2, label: 'Leclerc', envelopeLabel: 'Courses', amount: 42.30, year: 2026, month: 2, createdAt: '2026-02-11T14:00:00Z' },
  { id: 3, label: 'Cinema', envelopeLabel: 'Loisirs', amount: 25.00, year: 2026, month: 2, createdAt: '2026-02-10T20:00:00Z' }
]

// Mock Nuxt auto-imports
vi.stubGlobal('useAsyncData', async (_key: string, _fn: () => Promise<RecentEnvelopeExpense[]>, opts?: { default?: () => RecentEnvelopeExpense[] }) => {
  const data = ref(mockExpenses)
  return { data, ...(opts?.default ? {} : {}) }
})

vi.stubGlobal('$fetch', async () => mockExpenses)

vi.stubGlobal('formatEuro', (value: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
})

vi.mock('#components', () => ({
  UBadge: 'UBadge'
}))

const { initHomeSales } = await import('./init')

describe('initHomeSales', () => {
  it('should return data and columns', async () => {
    const result = await initHomeSales()

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('columns')
  })

  it('should define 4 table columns', async () => {
    const { columns } = await initHomeSales()

    expect(columns).toHaveLength(4)
    expect(columns.map(c => c.accessorKey)).toEqual(['envelopeLabel', 'label', 'createdAt', 'amount'])
  })

  it('should have correct data from API', async () => {
    const { data } = await initHomeSales()

    expect(data.value).toHaveLength(3)
    expect(data.value![0]!.label).toBe('Carrefour')
    expect(data.value![0]!.envelopeLabel).toBe('Courses')
    expect(data.value![0]!.amount).toBe(85.50)
  })

  it('columns should have correct headers', async () => {
    const { columns } = await initHomeSales()

    expect(columns[0]?.header).toBe('Enveloppe')
    expect(columns[1]?.header).toBe('Libelle')
    expect(columns[2]?.header).toBe('Date')
    // Amount header is a render function
    expect(typeof columns[3]?.header).toBe('function')
  })

  it('should not require any props', async () => {
    // initHomeSales takes no arguments
    const result = await initHomeSales()
    expect(result).toBeDefined()
  })
})
