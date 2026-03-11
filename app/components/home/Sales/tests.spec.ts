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

  it('date column cell formats date in French', async () => {
    const { columns } = await initHomeSales()
    const entry = mockTransactions[0]
    const mockRow = { original: entry, getValue: (k: string) => (entry as any)[k] }
    const result = (columns[0] as any).cell({ row: mockRow })
    expect(result).toMatch(/12/)
    expect(result).toMatch(/mars/i)
  })

  it('label column cell renders span with font-medium class', async () => {
    const { columns } = await initHomeSales()
    const entry = mockTransactions[0]
    const mockRow = { original: entry, getValue: (k: string) => (entry as any)[k] }
    const vnode = (columns[1] as any).cell({ row: mockRow })
    expect(vnode.props.class).toContain('font-medium')
    expect(vnode.children).toBe('Carrefour')
  })

  it('type column cell renders "Revenu" badge for income', async () => {
    const { columns } = await initHomeSales()
    const incomeEntry = mockTransactions[1]
    const incomeRow = { original: incomeEntry, getValue: (k: string) => (incomeEntry as any)[k] }
    const vnode = (columns[2] as any).cell({ row: incomeRow })
    expect(vnode.props.color).toBe('success')
  })

  it('type column cell renders "Dépense" badge for expense', async () => {
    const { columns } = await initHomeSales()
    const expenseEntry = mockTransactions[0]
    const expenseRow = { original: expenseEntry, getValue: (k: string) => (expenseEntry as any)[k] }
    const vnode = (columns[2] as any).cell({ row: expenseRow })
    expect(vnode.props.color).toBe('error')
  })

  it('amount column cell renders signed amount with correct color', async () => {
    const { columns } = await initHomeSales()
    const expenseEntry = mockTransactions[0]
    const expenseRow = { original: expenseEntry, getValue: (k: string) => (expenseEntry as any)[k] }
    const incomeEntry = mockTransactions[1]
    const incomeRow = { original: incomeEntry, getValue: (k: string) => (incomeEntry as any)[k] }

    const expenseVnode = (columns[3] as any).cell({ row: expenseRow })
    expect(expenseVnode.props.class).toContain('text-error')
    expect(expenseVnode.children).toContain('-')

    const incomeVnode = (columns[3] as any).cell({ row: incomeRow })
    expect(incomeVnode.props.class).toContain('text-success')
    expect(incomeVnode.children).toContain('+')
  })
})
