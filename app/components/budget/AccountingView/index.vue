<script setup lang="ts">
import { initBudgetAccountingView } from './init'

const {
  selectedMonthLabel,
  previousMonth,
  nextMonth,
  status,
  typeFilter,
  categoryFilter,
  searchQuery,
  availableCategories,
  amountMin,
  amountMax,
  uncategorizedOnly,
  activeFilterCount,
  hasActiveFilters,
  resetFilters,
  filteredTransactions,
  paginatedTransactions,
  page,
  totalPages,
  totalIncome,
  totalExpense,
  balance,
  modalOpen,
  editingTransaction,
  importModalOpen,
  openCreateModal,
  onTransactionSaved,
  onImported,
  columns
} = initBudgetAccountingView()

const tableUi = {
  base: 'table-fixed border-separate border-spacing-0',
  thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
  tbody: '[&>tr]:last:[&>td]:border-b-0',
  th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
  td: 'border-b border-default',
  separator: 'h-0'
}

const leadingClasses = {
  success: 'p-2.5 rounded-full bg-success/10 ring ring-inset ring-success/25 flex-col',
  error: 'p-2.5 rounded-full bg-error/10 ring ring-inset ring-error/25 flex-col'
} as const

const summaryStats = computed(() => [
  {
    title: 'Revenus',
    icon: 'i-lucide-trending-up',
    value: formatEuro(totalIncome.value),
    color: 'success' as const,
    leadingClass: leadingClasses.success
  },
  {
    title: 'Dépenses',
    icon: 'i-lucide-trending-down',
    value: formatEuro(totalExpense.value),
    color: 'error' as const,
    leadingClass: leadingClasses.error
  },
  {
    title: 'Solde',
    icon: 'i-lucide-wallet',
    value: formatEuro(balance.value),
    color: (balance.value >= 0 ? 'success' : 'error') as 'success' | 'error',
    leadingClass: balance.value >= 0 ? leadingClasses.success : leadingClasses.error
  }
])

const typeFilterOptions = [
  { label: 'Tous', value: 'all' },
  { label: 'Revenus', value: 'income' },
  { label: 'Dépenses', value: 'expense' }
]
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Month Navigator -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-chevron-left"
          variant="ghost"
          color="neutral"
          @click="previousMonth"
        />
        <span class="text-lg font-semibold capitalize min-w-48 text-center">
          {{ selectedMonthLabel }}
        </span>
        <UButton
          icon="i-lucide-chevron-right"
          variant="ghost"
          color="neutral"
          @click="nextMonth"
        />
      </div>
      <div class="flex items-center gap-2">
        <UButton
          label="Importer CSV"
          icon="i-lucide-upload"
          color="neutral"
          variant="subtle"
          @click="importModalOpen = true"
        />
        <UButton
          label="Ajouter"
          icon="i-lucide-plus"
          color="primary"
          @click="openCreateModal"
        />
      </div>
    </div>

    <!-- Summary Cards -->
    <UPageGrid class="lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-px">
      <UPageCard
        v-for="(stat, index) in summaryStats"
        :key="index"
        :icon="stat.icon"
        :title="stat.title"
        variant="subtle"
        :ui="{
          container: 'gap-y-1.5',
          wrapper: 'items-start',
          leading: stat.leadingClass,
          title: 'font-normal text-muted text-xs uppercase'
        }"
        class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
      >
        <span class="text-2xl font-semibold text-highlighted">{{ stat.value }}</span>
      </UPageCard>
    </UPageGrid>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3">
      <UInput
        v-model="searchQuery"
        icon="i-lucide-search"
        placeholder="Rechercher label ou notes..."
        class="w-64"
      />
      <USelect
        v-model="typeFilter"
        :items="typeFilterOptions"
        class="w-40"
      />
      <USelect
        v-model="categoryFilter"
        :items="availableCategories"
        placeholder="Catégorie"
        class="w-44"
        :disabled="uncategorizedOnly"
        :trailing-icon="categoryFilter ? 'i-lucide-x' : undefined"
        @click:trailing="categoryFilter = null"
      />

      <UPopover>
        <UButton
          icon="i-lucide-sliders-horizontal"
          label="Plus de filtres"
          color="neutral"
          variant="subtle"
        >
          <template #trailing>
            <UBadge
              v-if="activeFilterCount > 0"
              :label="String(activeFilterCount)"
              color="primary"
              size="xs"
              class="rounded-full"
            />
          </template>
        </UButton>

        <template #content>
          <div class="p-4 space-y-4 w-72">
            <div class="space-y-2">
              <span class="text-sm font-medium">Montant</span>
              <div class="flex items-center gap-2">
                <UInput
                  v-model="amountMin"
                  type="number"
                  placeholder="Min"
                  step="0.01"
                  class="w-full"
                />
                <span class="text-muted">-</span>
                <UInput
                  v-model="amountMax"
                  type="number"
                  placeholder="Max"
                  step="0.01"
                  class="w-full"
                />
              </div>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm">Non catégorisé uniquement</span>
              <USwitch v-model="uncategorizedOnly" />
            </div>
          </div>
        </template>
      </UPopover>

      <UButton
        v-if="hasActiveFilters"
        icon="i-lucide-x"
        label="Réinitialiser"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="resetFilters"
      />
    </div>

    <!-- Loading -->
    <div v-if="status === 'pending'" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-muted" />
    </div>

    <!-- Table -->
    <template v-else>
      <UTable
        :data="paginatedTransactions"
        :columns="columns"
        :ui="tableUi"
      />

      <!-- Empty state -->
      <div v-if="paginatedTransactions.length === 0" class="text-center py-8 text-muted">
        Aucune transaction pour ce mois.
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center">
        <UPagination
          v-model:page="page"
          :total="filteredTransactions.length"
          :items-per-page="10"
        />
      </div>
    </template>

    <!-- Transaction Modal -->
    <BudgetTransactionModal
      v-model:open="modalOpen"
      :transaction="editingTransaction"
      @saved="onTransactionSaved"
    />

    <!-- Import CSV Modal -->
    <BudgetImportModal
      v-model:open="importModalOpen"
      @imported="onImported"
    />
  </div>
</template>
