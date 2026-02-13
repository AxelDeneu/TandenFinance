import { h, type Component } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'
import { UButton, USwitch, UDropdownMenu } from '#components'
import type { RecurringEntry } from '~/types'

interface BudgetEnvelopeTableContext {
  emit: (event: 'updated') => void
}

export function initBudgetEnvelopeTable(ctx: BudgetEnvelopeTableContext) {
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

  const { data, status, refresh } = useFetch<RecurringEntry[]>('/api/budget/envelopes', {
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
      await $fetch(`/api/budget/envelopes/${entry.id}/toggle`, {
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

  const columns: TableColumn<RecurringEntry>[] = [
    {
      accessorKey: 'label',
      header: ({ column }) => {
        const isSorted = column.getIsSorted()

        return h(UButton, {
          color: 'neutral',
          variant: 'ghost',
          label: 'Libellé',
          icon: isSorted
            ? isSorted === 'asc'
              ? 'i-lucide-arrow-up-narrow-wide'
              : 'i-lucide-arrow-down-wide-narrow'
            : 'i-lucide-arrow-up-down',
          class: '-mx-2.5',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
        })
      },
      cell: ({ row }) => {
        return h('span', { class: 'font-medium text-highlighted' }, row.original.label)
      }
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => {
        const isSorted = column.getIsSorted()

        return h(UButton, {
          color: 'neutral',
          variant: 'ghost',
          label: 'Montant',
          icon: isSorted
            ? isSorted === 'asc'
              ? 'i-lucide-arrow-up-narrow-wide'
              : 'i-lucide-arrow-down-wide-narrow'
            : 'i-lucide-arrow-up-down',
          class: '-mx-2.5',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
        })
      },
      cell: ({ row }) => {
        return h('span', { class: 'text-right font-medium tabular-nums' }, formatEuro(row.original.amount))
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

  const labelSearch = computed({
    get: (): string => {
      return (table.value?.tableApi?.getColumn('label')?.getFilterValue() as string) || ''
    },
    set: (value: string) => {
      table.value?.tableApi?.getColumn('label')?.setFilterValue(value || undefined)
    }
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
    labelSearch,
    onSaved,
    onDeleted
  }
}
