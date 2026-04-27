import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'
import { USwitch, UIcon } from '#components'
import { sortableHeader, actionsColumn } from '~/utils/table'
import { useCrudModals } from '~/composables/useCrudModals'
import type { RecurringEntry, EntryType, Category } from '~/types'

interface BudgetRecurringTableContext {
  props: { type: EntryType }
  emit: (event: 'updated') => void
}

export function initBudgetRecurringTable(ctx: BudgetRecurringTableContext) {
  const { showErrorToast } = useErrorToast()
  const table = useTemplateRef<{ tableApi?: {
    getFilteredRowModel: () => { rows: unknown[] }
    getState: () => { pagination: { pageIndex: number, pageSize: number } }
    setPageIndex: (index: number) => void
    getColumn: (id: string) => { getFilterValue: () => unknown, setFilterValue: (value: unknown) => void } | undefined
  } }>('table')

  const columnFilters = ref([{
    id: 'label',
    value: ''
  }])

  const pagination = ref({
    pageIndex: 0,
    pageSize: 10
  })

  const { data, status, refresh } = useFetch<RecurringEntry[]>(`/api/budget/${ctx.props.type}s`, {
    lazy: true
  })

  const { data: categories } = useFetch<Category[]>('/api/budget/categories', {
    lazy: true,
    default: () => []
  })

  const categoriesById = computed(() => {
    const map = new Map<number, Category>()
    for (const c of categories.value) map.set(c.id, c)
    return map
  })

  const {
    editingEntry, editModalOpen,
    deletingEntry, deleteModalOpen,
    addModalOpen,
    openEditModal, openDeleteModal,
    onSaved, onDeleted
  } = useCrudModals<RecurringEntry>({
    onRefresh: () => refresh(),
    onNotify: () => ctx.emit('updated')
  })

  async function toggleActive(entry: RecurringEntry) {
    try {
      await $fetch(`/api/budget/${ctx.props.type}s/${entry.id}/toggle`, {
        method: 'PATCH'
      })
      await refresh()
      ctx.emit('updated')
    } catch (error) {
      showErrorToast('Impossible de modifier le statut', error)
    }
  }

  const columns: TableColumn<RecurringEntry>[] = [
    {
      accessorKey: 'label',
      header: sortableHeader('Libellé'),
      cell: ({ row }) => {
        return h('span', { class: 'font-medium text-highlighted' }, row.original.label)
      }
    },
    {
      accessorKey: 'amount',
      header: sortableHeader('Montant'),
      cell: ({ row }) => {
        return h('span', { class: 'text-right font-medium tabular-nums' }, formatEuro(row.original.amount))
      }
    },
    {
      accessorKey: 'categoryId',
      header: 'Catégorie',
      filterFn: 'equals',
      cell: ({ row }) => {
        const cat = row.original.categoryId ? categoriesById.value.get(row.original.categoryId) : null
        if (!cat) return h('span', { class: 'text-muted' }, row.original.category ?? '-')

        return h(
          'span',
          {
            class: 'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium',
            style: {
              color: cat.color,
              borderColor: `${cat.color}40`,
              background: `${cat.color}12`,
              border: '1px solid'
            }
          },
          [
            h(UIcon, { name: cat.icon, class: 'size-3' }),
            cat.name
          ]
        )
      }
    },
    {
      accessorKey: 'dayOfMonth',
      header: sortableHeader('Jour'),
      cell: ({ row }) => {
        return h('span', { class: 'text-muted' }, row.original.dayOfMonth ? `le ${row.original.dayOfMonth}` : '-')
      }
    },
    {
      accessorKey: 'active',
      header: 'Actif',
      cell: ({ row }) => {
        return h(USwitch, {
          'modelValue': row.original.active,
          'onUpdate:modelValue': () => toggleActive(row.original)
        })
      }
    },
    actionsColumn<RecurringEntry>({ onEdit: openEditModal, onDelete: openDeleteModal })
  ]

  const categoryFilter = ref<number | 'all'>('all')

  watch(() => categoryFilter.value, (newVal) => {
    if (!table?.value?.tableApi) return

    const categoryColumn = table.value.tableApi.getColumn('categoryId')
    if (!categoryColumn) return

    if (newVal === 'all') {
      categoryColumn.setFilterValue(undefined)
    } else {
      categoryColumn.setFilterValue(newVal)
    }
  })

  const labelSearch = computed({
    get: (): string => {
      return (table.value?.tableApi?.getColumn('label')?.getFilterValue() as string) || ''
    },
    set: (value: string) => {
      table.value?.tableApi?.getColumn('label')?.setFilterValue(value || undefined)
    }
  })

  const categoryItems = computed(() => {
    const filterType = ctx.props.type === 'income' ? 'income' : 'expense'
    return [
      { label: 'Toutes', value: 'all' as const },
      ...categories.value
        .filter(c => c.type === filterType)
        .map(c => ({ label: c.name, value: c.id }))
    ]
  })

  return {
    table,
    columnFilters,
    pagination,
    getPaginationRowModel,
    data,
    status,
    columns,
    editingEntry,
    editModalOpen,
    deletingEntry,
    deleteModalOpen,
    addModalOpen,
    categoryFilter,
    labelSearch,
    categoryItems,
    onSaved,
    onDeleted
  }
}
