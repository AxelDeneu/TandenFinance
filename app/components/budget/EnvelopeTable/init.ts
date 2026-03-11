import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'
import { USwitch } from '#components'
import { sortableHeader, actionsColumn } from '~/utils/table'
import { useCrudModals } from '~/composables/useCrudModals'
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
