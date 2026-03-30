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

interface TestVNode {
  type: unknown
  props: Record<string, unknown>
  children: TestVNode[] | string
}

interface CellColumn {
  cell: (ctx: { row: { original: Transaction, getValue: (k: string) => unknown } }) => TestVNode | string
  [key: string]: unknown
}

function renderColumn(columns: unknown[], index: number, entry: Transaction): TestVNode | string {
  const col = columns[index] as CellColumn
  const mockRow = { original: entry, getValue: (k: string) => (entry as Record<string, unknown>)[k] }
  return col.cell({ row: mockRow })
}

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
    const result = renderColumn(columns, 0, entry)
    expect(result).toMatch(/12/)
    expect(result).toMatch(/mars/i)
  })

  it('label column cell renders span with font-medium class', async () => {
    const { columns } = await initHomeSales()
    const entry = mockTransactions[0]
    const vnode = renderColumn(columns, 1, entry) as TestVNode
    expect(vnode.props.class).toContain('font-medium')
    expect(vnode.children).toBe('Carrefour')
  })

  it('type column cell renders "Revenu" badge for income', async () => {
    const { columns } = await initHomeSales()
    const incomeEntry = mockTransactions[1]
    const vnode = renderColumn(columns, 2, incomeEntry) as TestVNode
    expect(vnode.props.color).toBe('success')
  })

  it('type column cell renders "Dépense" badge for expense', async () => {
    const { columns } = await initHomeSales()
    const expenseEntry = mockTransactions[0]
    const vnode = renderColumn(columns, 2, expenseEntry) as TestVNode
    expect(vnode.props.color).toBe('error')
  })

  it('amount column cell renders signed amount with correct color', async () => {
    const { columns } = await initHomeSales()
    const expenseEntry = mockTransactions[0]
    const incomeEntry = mockTransactions[1]

    const expenseVnode = renderColumn(columns, 3, expenseEntry) as TestVNode
    expect(expenseVnode.props.class).toContain('text-error')
    expect(expenseVnode.children).toContain('-')

    const incomeVnode = renderColumn(columns, 3, incomeEntry) as TestVNode
    expect(incomeVnode.props.class).toContain('text-success')
    expect(incomeVnode.children).toContain('+')
  })
})
