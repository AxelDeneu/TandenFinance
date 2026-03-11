import { describe, it, expect, vi } from 'vitest'

vi.mock('#components', () => ({
  UButton: 'UButton',
  UDropdownMenu: 'UDropdownMenu'
}))

const { sortableHeader, TABLE_UI, dropdownRowItems, actionsColumn } = await import('~/utils/table')

describe('sortableHeader', () => {
  function createColumn(sorted: false | 'asc' | 'desc' = false) {
    return {
      getIsSorted: () => sorted,
      toggleSorting: vi.fn()
    }
  }

  it('returns a render function', () => {
    const header = sortableHeader('Test')
    expect(typeof header).toBe('function')
  })

  it('renders UButton with correct label', () => {
    const header = sortableHeader('Montant')
    const column = createColumn()
    const vnode = header({ column })
    expect(vnode.props.label).toBe('Montant')
  })

  it('shows arrow-up-down icon when not sorted', () => {
    const header = sortableHeader('Test')
    const column = createColumn(false)
    const vnode = header({ column })
    expect(vnode.props.icon).toBe('i-lucide-arrow-up-down')
  })

  it('shows asc icon when sorted ascending', () => {
    const header = sortableHeader('Test')
    const column = createColumn('asc')
    const vnode = header({ column })
    expect(vnode.props.icon).toBe('i-lucide-arrow-up-narrow-wide')
  })

  it('shows desc icon when sorted descending', () => {
    const header = sortableHeader('Test')
    const column = createColumn('desc')
    const vnode = header({ column })
    expect(vnode.props.icon).toBe('i-lucide-arrow-down-wide-narrow')
  })

  it('onClick calls toggleSorting', () => {
    const header = sortableHeader('Test')
    const column = createColumn(false)
    const vnode = header({ column })
    vnode.props.onClick()
    expect(column.toggleSorting).toHaveBeenCalledWith(false)
  })

  it('onClick calls toggleSorting(true) when currently asc', () => {
    const header = sortableHeader('Test')
    const column = createColumn('asc')
    const vnode = header({ column })
    vnode.props.onClick()
    expect(column.toggleSorting).toHaveBeenCalledWith(true)
  })
})

describe('TABLE_UI', () => {
  it('has all required keys', () => {
    expect(TABLE_UI).toHaveProperty('base')
    expect(TABLE_UI).toHaveProperty('thead')
    expect(TABLE_UI).toHaveProperty('tbody')
    expect(TABLE_UI).toHaveProperty('th')
    expect(TABLE_UI).toHaveProperty('td')
    expect(TABLE_UI).toHaveProperty('separator')
  })

  it('values are non-empty strings', () => {
    for (const value of Object.values(TABLE_UI)) {
      expect(typeof value).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    }
  })
})

describe('dropdownRowItems', () => {
  it('returns 4 items with correct structure', () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const row = { original: { id: 1, name: 'Test' } }
    const items = dropdownRowItems(row, { onEdit, onDelete })

    expect(items).toHaveLength(4)
    expect(items[0]).toEqual({ type: 'label', label: 'Actions' })
    expect(items[1].label).toBe('Modifier')
    expect(items[2]).toEqual({ type: 'separator' })
    expect(items[3].label).toBe('Supprimer')
    expect(items[3].color).toBe('error')
  })

  it('calls onEdit when Modifier is selected', () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const entry = { id: 1 }
    const items = dropdownRowItems({ original: entry }, { onEdit, onDelete })
    items[1].onSelect!()
    expect(onEdit).toHaveBeenCalledWith(entry)
  })

  it('calls onDelete when Supprimer is selected', () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const entry = { id: 1 }
    const items = dropdownRowItems({ original: entry }, { onEdit, onDelete })
    items[3].onSelect!()
    expect(onDelete).toHaveBeenCalledWith(entry)
  })
})

describe('actionsColumn', () => {
  it('returns a column with id "actions"', () => {
    const col = actionsColumn({ onEdit: vi.fn(), onDelete: vi.fn() })
    expect(col.id).toBe('actions')
  })

  it('cell renders a vnode', () => {
    const col = actionsColumn({ onEdit: vi.fn(), onDelete: vi.fn() })
    const row = { original: { id: 1 } }
    const vnode = (col as any).cell({ row })
    expect(vnode).toBeDefined()
    expect(vnode.props.class).toBe('text-right')
  })
})
