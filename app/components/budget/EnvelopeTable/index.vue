<script setup lang="ts">
import { initBudgetEnvelopeTable } from './init'

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
  labelSearch,
  onSaved,
  onDeleted
} = initBudgetEnvelopeTable({ emit })
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

      <BudgetEnvelopeModal
        v-model:open="addModalOpen"
        @saved="onSaved"
      />
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
    <BudgetEnvelopeModal
      v-model:open="editModalOpen"
      :entry="editingEntry"
      @saved="onSaved"
    />

    <!-- Delete Modal -->
    <BudgetDeleteModal
      v-model:open="deleteModalOpen"
      type="envelope"
      :entry="deletingEntry"
      @deleted="onDeleted"
    />
  </div>
</template>
