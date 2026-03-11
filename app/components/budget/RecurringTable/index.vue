<script setup lang="ts">
import type { EntryType } from '~/types'
import { initBudgetRecurringTable } from './init'

const props = defineProps<{
  type: EntryType
}>()

const emit = defineEmits<{
  updated: []
}>()

const {
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
} = initBudgetRecurringTable({ props, emit })
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
          placeholder="Filtrer par catégorie"
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
      :ui="TABLE_UI"
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
