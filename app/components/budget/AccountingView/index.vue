<script setup lang="ts">
import { initBudgetAccountingView } from './init'

const {
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
  openEditModal,
  deleteTransaction,
  onTransactionSaved,
  onImported
} = initBudgetAccountingView()

const incomeCount = computed(() => filteredTransactions.value.filter(t => t.type === 'income').length)
const expenseCount = computed(() => filteredTransactions.value.filter(t => t.type === 'expense').length)

function fmt(v: number, opts: { sign?: boolean } = {}): string {
  const abs = Math.abs(v)
  const formatted = abs.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  const s = opts.sign && v > 0 ? '+' : (v < 0 ? '−' : '')
  return `${s}${formatted} €`
}
</script>

<template>
  <div class="px-2 py-4 flex flex-col gap-5" style="max-width: 1440px; margin: 0 auto; width: 100%;">
    <TandenPageHead
      title="Comptabilité"
      :lede="`Toutes les transactions du mois — ${filteredTransactions.length} entrée${filteredTransactions.length > 1 ? 's' : ''}`"
    >
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
    </TandenPageHead>

    <div class="tf-stat-grid cols-3">
      <TandenStatCard
        icon="i-lucide-trending-up"
        icon-kind="income"
        label="Revenus"
        :value="fmt(totalIncome)"
        :sub="`${incomeCount} entrée${incomeCount > 1 ? 's' : ''}`"
        sub-color="subtle"
      />
      <TandenStatCard
        icon="i-lucide-trending-down"
        icon-kind="expense"
        label="Dépenses"
        :value="fmt(totalExpense)"
        :sub="`${expenseCount} entrée${expenseCount > 1 ? 's' : ''}`"
        sub-color="subtle"
      />
      <TandenStatCard
        icon="i-lucide-wallet"
        :icon-kind="balance >= 0 ? 'income' : 'expense'"
        label="Solde"
        :value="fmt(balance, { sign: true })"
        :sub="balance >= 0 ? 'Sous le budget' : 'Au-dessus du budget'"
        :sub-color="balance >= 0 ? 'up' : 'down'"
      />
    </div>

    <TandenPanel>
      <template #head>
        <div class="flex flex-1 items-center gap-3 flex-wrap">
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Rechercher libellé ou notes…"
            class="w-64"
            size="sm"
          />
          <USelect
            v-model="typeFilter"
            :items="[
              { label: 'Tous', value: 'all' },
              { label: 'Revenus', value: 'income' },
              { label: 'Dépenses', value: 'expense' }
            ]"
            size="sm"
            class="w-32"
          />
          <USelect
            v-model="categoryFilter"
            :items="availableCategories"
            placeholder="Catégorie"
            size="sm"
            class="w-44"
            :disabled="uncategorizedOnly"
            :trailing-icon="categoryFilter ? 'i-lucide-x' : undefined"
            @click:trailing="categoryFilter = undefined"
          />
          <UPopover>
            <UButton
              icon="i-lucide-sliders-horizontal"
              label="Plus"
              color="neutral"
              variant="ghost"
              size="sm"
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
                    <span class="text-muted">−</span>
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
            label="Reset"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="resetFilters"
          />
        </div>
      </template>

      <div v-if="status === 'pending'" class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-muted" />
      </div>

      <table v-else-if="paginatedTransactions.length > 0" class="tf-tbl">
        <thead>
          <tr>
            <th style="width: 90px;">
              Date
            </th>
            <th>Transaction</th>
            <th style="width: 180px;">
              Catégorie
            </th>
            <th class="right" style="width: 130px;">
              Montant
            </th>
            <th style="width: 80px;" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="tx in paginatedTransactions" :key="tx.id">
            <td class="num tf-text-subtle">
              {{ new Date(tx.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) }}
            </td>
            <td>
              <div class="tf-merchant">
                <div
                  class="tf-row-ico"
                  :style="{
                    color: getCategoryStyle(tx.recurringEntry?.category ?? null).color,
                    borderColor: `${getCategoryStyle(tx.recurringEntry?.category ?? null).color}33`,
                    background: `${getCategoryStyle(tx.recurringEntry?.category ?? null).color}10`
                  }"
                >
                  <UIcon
                    :name="getCategoryStyle(tx.recurringEntry?.category ?? null).icon"
                    class="size-3.5"
                  />
                </div>
                <div>
                  <div class="name">
                    {{ tx.label }}
                  </div>
                  <div v-if="tx.notes" class="note">
                    {{ tx.notes }}
                  </div>
                </div>
              </div>
            </td>
            <td>
              <span
                v-if="tx.recurringEntry"
                class="tf-badge"
                :style="{
                  color: getCategoryStyle(tx.recurringEntry.category).color,
                  borderColor: `${getCategoryStyle(tx.recurringEntry.category).color}40`,
                  background: `${getCategoryStyle(tx.recurringEntry.category).color}12`
                }"
              >
                {{ tx.recurringEntry.label }}
              </span>
              <span v-else class="tf-text-subtle text-xs">Non catégorisé</span>
            </td>
            <td class="right num" :class="tx.type === 'income' ? 'tf-up' : ''" style="font-weight: 500; font-size: 14px;">
              {{ tx.type === 'income' ? '+' : '−' }}{{ fmt(tx.amount).replace('+', '').replace('−', '') }}
            </td>
            <td>
              <div class="tf-actions">
                <button class="tf-icon-btn" title="Modifier" @click="openEditModal(tx)">
                  <UIcon name="i-lucide-pencil" class="size-3.5" />
                </button>
                <button class="tf-icon-btn" title="Supprimer" @click="deleteTransaction(tx)">
                  <UIcon name="i-lucide-trash-2" class="size-3.5" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="px-4 py-10 text-center tf-text-subtle text-sm">
        Aucune transaction pour ce filtre.
      </div>

      <template v-if="totalPages > 1" #foot>
        <span>{{ filteredTransactions.length }} ligne{{ filteredTransactions.length > 1 ? 's' : '' }} · Page {{ page }}/{{ totalPages }}</span>
        <div class="tf-spacer" style="flex: 1;" />
        <UButton
          icon="i-lucide-chevron-left"
          color="neutral"
          variant="ghost"
          size="xs"
          :disabled="page === 1"
          @click="page = Math.max(1, page - 1)"
        />
        <UButton
          icon="i-lucide-chevron-right"
          color="neutral"
          variant="ghost"
          size="xs"
          :disabled="page === totalPages"
          @click="page = Math.min(totalPages, page + 1)"
        />
      </template>
    </TandenPanel>

    <BudgetTransactionModal
      v-model:open="modalOpen"
      :transaction="editingTransaction"
      @saved="onTransactionSaved"
    />

    <BudgetImportModal
      v-model:open="importModalOpen"
      @imported="onImported"
    />
  </div>
</template>
