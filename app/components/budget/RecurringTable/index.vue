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

const addLabel = computed(() => props.type === 'income' ? 'Nouveau revenu' : 'Nouvelle dépense')
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-end">
      <UButton
        :label="addLabel"
        icon="i-lucide-plus"
        color="primary"
        @click="addModalOpen = true"
      />
    </div>

    <TandenPanel>
      <template #head>
        <UInput
          v-model="labelSearch"
          icon="i-lucide-search"
          placeholder="Rechercher…"
          size="sm"
          class="w-60"
        />
        <USelect
          v-model="categoryFilter"
          :items="categoryItems"
          :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
          placeholder="Filtrer par catégorie"
          size="sm"
          class="min-w-36"
        />
      </template>

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

      <template #foot>
        <span>{{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} ligne{{ (table?.tableApi?.getFilteredRowModel().rows.length || 0) > 1 ? 's' : '' }}</span>
        <div class="tf-spacer" style="flex: 1;" />
        <UPagination
          :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
          :items-per-page="table?.tableApi?.getState().pagination.pageSize"
          :total="table?.tableApi?.getFilteredRowModel().rows.length"
          size="xs"
          @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
        />
      </template>
    </TandenPanel>

    <BudgetEntryModal
      v-model:open="addModalOpen"
      :type="type"
      @saved="onSaved"
    />

    <BudgetEntryModal
      v-model:open="editModalOpen"
      :type="type"
      :entry="editingEntry"
      @saved="onSaved"
    />

    <BudgetDeleteModal
      v-model:open="deleteModalOpen"
      :type="type"
      :entry="deletingEntry"
      @deleted="onDeleted"
    />
  </div>
</template>
