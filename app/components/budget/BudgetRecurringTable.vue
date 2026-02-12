<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { RecurringEntry, EntryType } from '~/types'

const props = defineProps<{
  type: EntryType
}>()

const emit = defineEmits<{
  updated: []
}>()

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const USwitch = resolveComponent('USwitch')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const toast = useToast()
const table = useTemplateRef('table')

const columnFilters = ref([{
  id: 'label',
  value: ''
}])

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

const { data, status, refresh } = await useFetch<RecurringEntry[]>(`/api/budget/${props.type}s`, {
  lazy: true
})

const editingEntry = ref<RecurringEntry | undefined>()
const editModalOpen = ref(false)
const deletingEntry = ref<RecurringEntry | undefined>()
const deleteModalOpen = ref(false)

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
    await $fetch(`/api/budget/${props.type}s/${entry.id}/toggle`, {
      method: 'PATCH'
    })
    await refresh()
    emit('updated')
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
  emit('updated')
}

function onDeleted() {
  refresh()
  emit('updated')
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
  return props.type === 'income' ? INCOME_CATEGORY_COLORS : EXPENSE_CATEGORY_COLORS
})

const columns: TableColumn<RecurringEntry>[] = [
  {
    accessorKey: 'label',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Libelle',
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
    accessorKey: 'category',
    header: 'Categorie',
    filterFn: 'equals',
    cell: ({ row }) => {
      const color = categoryColors.value[row.original.category] || 'neutral'

      return h(UBadge, { variant: 'subtle', color }, () => row.original.category)
    }
  },
  {
    accessorKey: 'dayOfMonth',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Jour',
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
      return h('span', { class: 'text-muted' }, `le ${row.original.dayOfMonth}`)
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
          UDropdownMenu,
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
  const cats = props.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  return [
    { label: 'Toutes', value: 'all' },
    ...cats.map(c => ({ label: c, value: c }))
  ]
})

const addModalOpen = ref(false)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-1.5">
      <UInput
        v-model="labelSearch"
        class="max-w-sm"
        icon="i-lucide-search"
        placeholder="Rechercher..."
      />

      <div class="flex flex-wrap items-center gap-1.5">
        <USelect
          v-model="categoryFilter"
          :items="categoryItems"
          :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
          placeholder="Filtrer par categorie"
          class="min-w-36"
        />

        <BudgetEntryModal
          v-model:open="addModalOpen"
          :type="type"
          @saved="onSaved"
        />
      </div>
    </div>

    <UTable
      ref="table"
      v-model:column-filters="columnFilters"
      v-model:pagination="pagination"
      :pagination-options="{
        getPaginationRowModel: getPaginationRowModel()
      }"
      class="shrink-0"
      :data="data"
      :columns="columns"
      :loading="status === 'pending'"
      :ui="{
        base: 'table-fixed border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'border-b border-default',
        separator: 'h-0'
      }"
    />

    <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
      <div class="text-sm text-muted">
        {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} ligne(s) au total.
      </div>

      <div class="flex items-center gap-1.5">
        <UPagination
          :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
          :items-per-page="table?.tableApi?.getState().pagination.pageSize"
          :total="table?.tableApi?.getFilteredRowModel().rows.length"
          @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
        />
      </div>
    </div>

    <!-- Edit Modal -->
    <BudgetEntryModal
      v-model:open="editModalOpen"
      :type="type"
      :entry="editingEntry"
      @saved="onSaved"
    />

    <!-- Delete Modal -->
    <BudgetDeleteModal
      v-model:open="deleteModalOpen"
      :type="type"
      :entry="deletingEntry"
      @deleted="onDeleted"
    />
  </div>
</template>
