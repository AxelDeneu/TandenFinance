import { describe, expect, it, vi } from 'vitest'
import { ref, computed } from 'vue'
import type { Transaction } from '~/types'

const mockTransactions: Transaction[] = [
  { id: 1, label: 'Carrefour', amount: 85.50, type: 'expense', date: '2026-03-12', recurringEntryId: null, notes: null, createdAt: '2026-03-12T10:00:00Z', updatedAt: '2026-03-12T10:00:00Z' },
  { id: 2, label: 'Salaire', amount: 3000, type: 'income', date: '2026-03-25', recurringEntryId: 1, notes: null, createdAt: '2026-03-11T14:00:00Z', updatedAt: '2026-03-11T14:00:00Z' },
  { id: 3, label: 'Cinema', amount: 25.00, type: 'expense', date: '2026-03-10', recurringEntryId: null, notes: null, createdAt: '2026-03-10T20:00:00Z', updatedAt: '2026-03-10T20:00:00Z' }
]

// Mock Nuxt auto-imports
vi.stubGlobal('useAsyncData', async (_key: string, _fn: () => Promise<Transaction[]>, opts?: { default?: () => Transaction[] }) => {
  const data = ref(mockTransactions)
  return { data, ...(opts?.default ? {} : {}) }
})

vi.stubGlobal('$fetch', async () => mockTransactions)
vi.stubGlobal('computed', computed)

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
    expect(columns.map(c => c.accessorKey)).toEqual(['date', 'label', 'type', 'amount'])
  })

  it('should have correct data from API', async () => {
    const { data } = await initHomeSales()

    expect(data.value).toHaveLength(3)
    expect(data.value![0]!.label).toBe('Carrefour')
    expect(data.value![0]!.amount).toBe(85.50)
  })

  it('columns should have correct headers', async () => {
    const { columns } = await initHomeSales()

    expect(columns[0]?.header).toBe('Date')
    expect(columns[1]?.header).toBe('Libellé')
    expect(columns[2]?.header).toBe('Type')
    // Amount header is a render function
    expect(typeof columns[3]?.header).toBe('function')
  })

  it('should not require any props', async () => {
    const result = await initHomeSales()
    expect(result).toBeDefined()
  })
})
