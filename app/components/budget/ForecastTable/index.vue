<script setup lang="ts">
import { initBudgetForecastTable } from './init'

const {
  selectedYear,
  selectedMonth,
  status,
  incomeColumns,
  expenseColumns,
  envelopeColumns,
  incomes,
  expenses,
  envelopes,
  incomeTotals,
  expenseTotals,
  envelopeTotals,
  remaining,
  selectedEntry,
  entryDetailOpen
} = initBudgetForecastTable()

const leadingClasses = {
  success: 'p-2.5 rounded-full bg-success/10 ring ring-inset ring-success/25 flex-col',
  error: 'p-2.5 rounded-full bg-error/10 ring ring-inset ring-error/25 flex-col',
  warning: 'p-2.5 rounded-full bg-warning/10 ring ring-inset ring-warning/25 flex-col',
  yellow: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col'
} as const

const summaryStats = computed(() => [
  {
    title: 'Revenus',
    icon: 'i-lucide-trending-up',
    value: formatEuro(incomeTotals.value.effective),
    count: incomes.value.length,
    color: 'success' as const,
    leadingClass: leadingClasses.yellow
  },
  {
    title: 'Dépenses',
    icon: 'i-lucide-trending-down',
    value: formatEuro(expenseTotals.value.effective),
    count: expenses.value.length,
    color: 'error' as const,
    leadingClass: leadingClasses.yellow
  },
  {
    title: 'Enveloppes',
    icon: 'i-lucide-mail',
    value: formatEuro(envelopeTotals.value.effective),
    count: envelopes.value.length,
    color: 'warning' as const,
    leadingClass: leadingClasses.yellow
  },
  {
    title: 'Reste',
    icon: 'i-lucide-wallet',
    value: formatEuro(remaining.value),
    count: incomes.value.length + expenses.value.length + envelopes.value.length,
    color: (remaining.value >= 0 ? 'success' : 'error') as 'success' | 'error',
    leadingClass: leadingClasses.yellow
  }
])
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Summary Cards -->
    <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px">
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
        <div class="flex items-center gap-2">
          <span class="text-2xl font-semibold text-highlighted">{{ stat.value }}</span>
          <UBadge :color="stat.color" variant="subtle" class="text-xs">
            {{ stat.count }} entrée{{ stat.count > 1 ? 's' : '' }}
          </UBadge>
        </div>
      </UPageCard>
    </UPageGrid>

    <!-- Loading -->
    <div v-if="status === 'pending'" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-muted" />
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Revenus -->
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-trending-up" class="text-success" />
          <h3 class="font-semibold text-highlighted">
            Revenus
          </h3>
        </div>
        <UTable
          :data="incomes"
          :columns="incomeColumns"
          :ui="TABLE_UI"
        />
        <div class="flex justify-between px-3 py-2 bg-elevated/25 rounded-lg">
          <span class="font-semibold">Total Revenus</span>
          <span class="font-semibold tabular-nums text-success">
            {{ formatEuro(incomeTotals.effective) }}
          </span>
        </div>
      </div>

      <!-- Depenses -->
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-trending-down" class="text-error" />
          <h3 class="font-semibold text-highlighted">
            Dépenses
          </h3>
        </div>
        <UTable
          :data="expenses"
          :columns="expenseColumns"
          :ui="TABLE_UI"
        />
        <div class="flex justify-between px-3 py-2 bg-elevated/25 rounded-lg">
          <span class="font-semibold">Total Dépenses</span>
          <span class="font-semibold tabular-nums text-error">
            {{ formatEuro(expenseTotals.effective) }}
          </span>
        </div>
      </div>

      <!-- Enveloppes -->
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-mail" class="text-warning" />
          <h3 class="font-semibold text-highlighted">
            Enveloppes
          </h3>
        </div>
        <UTable
          :data="envelopes"
          :columns="envelopeColumns"
          :ui="TABLE_UI"
        />
        <div class="flex justify-between px-3 py-2 bg-elevated/25 rounded-lg">
          <span class="font-semibold">Total Enveloppes</span>
          <span class="font-semibold tabular-nums text-warning">
            {{ formatEuro(envelopeTotals.effective) }}
          </span>
        </div>
      </div>

      <!-- Remaining (sticky) -->
      <div class="sticky bottom-0 z-10 flex justify-between px-4 py-3 bg-elevated rounded-lg border-t-2 border-default shadow-lg backdrop-blur-sm">
        <div class="flex items-center gap-2 font-bold">
          <UIcon name="i-lucide-wallet" />
          Reste
        </div>
        <span
          class="font-bold tabular-nums"
          :class="remaining >= 0 ? 'text-success' : 'text-error'"
        >
          {{ formatEuro(remaining) }}
        </span>
      </div>
    </template>

    <!-- Entry Detail Slideover -->
    <BudgetRecurringEntryDetail
      v-model:open="entryDetailOpen"
      :entry="selectedEntry"
      :year="selectedYear"
      :month="selectedMonth"
    />
  </div>
</template>
