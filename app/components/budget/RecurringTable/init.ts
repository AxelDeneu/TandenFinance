import { h, type Component } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'
import { UBadge, UButton, USwitch, UDropdownMenu } from '#components'
import { sortableHeader } from '~/utils/table'
import type { RecurringEntry, EntryType } from '~/types'

interface BudgetRecurringTableContext {
  props: { type: EntryType }
  emit: (event: 'updated') => void
}

export function initBudgetRecurringTable(ctx: BudgetRecurringTableContext) {
  const toast = useToast()
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

  const editingEntry = ref<RecurringEntry | undefined>()
  const editModalOpen = ref(false)
  const deletingEntry = ref<RecurringEntry | undefined>()
  const deleteModalOpen = ref(false)
  const addModalOpen = ref(false)

  function openEditModal(entry: RecurringEntry) {
    editingEntry.value = entry
    editModalOpen.value = true
  }

  function openDeleteModal(entry: RecurringEntry) {
    deletingEntry.value = entry
    deleteModalOpen.value = true
  }

  async function toggleActive(entry: RecurringEntry) {
    try {
      await $fetch(`/api/budget/${ctx.props.type}s/${entry.id}/toggle`, {
        method: 'PATCH'
      })
      await refresh()
      ctx.emit('updated')
    } catch {
      toast.add({
        title: 'Erreur',
        description: 'Impossible de modifier le statut',
        color: 'error'
      })
    }
  }

  function onSaved() {
    refresh()
    ctx.emit('updated')
  }

  function onDeleted() {
    refresh()
    ctx.emit('updated')
  }

  function getRowItems(row: { original: RecurringEntry }) {
    return [
      {
        type: 'label' as const,
        label: 'Actions'
      },
      {
        label: 'Modifier',
        icon: 'i-lucide-pencil',
        onSelect() {
          openEditModal(row.original)
        }
      },
      {
        type: 'separator' as const
      },
      {
        label: 'Supprimer',
        icon: 'i-lucide-trash',
        color: 'error' as const,
        onSelect() {
          openDeleteModal(row.original)
        }
      }
    ]
  }

  const categoryColors = computed(() => {
    return ctx.props.type === 'income' ? INCOME_CATEGORY_COLORS : EXPENSE_CATEGORY_COLORS
  })

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
      accessorKey: 'category',
      header: 'Catégorie',
      filterFn: 'equals',
      cell: ({ row }) => {
        if (!row.original.category) return h('span', { class: 'text-muted' }, '-')
        const color: UiColor = categoryColors.value[row.original.category] || 'neutral'

        return h(UBadge, { variant: 'subtle', color }, () => row.original.category)
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
    {
      id: 'actions',
      cell: ({ row }) => {
        return h(
          'div',
          { class: 'text-right' },
          h(
            UDropdownMenu as Component,
            {
              content: {
                align: 'end'
              },
              items: getRowItems(row)
            },
            () =>
              h(UButton, {
                icon: 'i-lucide-ellipsis-vertical',
                color: 'neutral',
                variant: 'ghost',
                class: 'ml-auto'
              })
          )
        )
      }
    }
  ]

  const categoryFilter = ref('all')

  watch(() => categoryFilter.value, (newVal) => {
    if (!table?.value?.tableApi) return

    const categoryColumn = table.value.tableApi.getColumn('category')
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
    const cats = ctx.props.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
    return [
      { label: 'Toutes', value: 'all' },
      ...cats.map(c => ({ label: c, value: c }))
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
