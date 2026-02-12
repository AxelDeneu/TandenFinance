<script setup lang="ts">
import type { BudgetSummary } from '~/types'

const { data: summary, refresh } = useLazyFetch<BudgetSummary>('/api/budget/summary', {
  default: () => ({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    incomeCount: 0,
    expenseCount: 0
  })
})

defineExpose({ refresh })

const stats = computed(() => [
  {
    title: 'Revenus',
    icon: 'i-lucide-trending-up',
    value: formatEuro(summary.value.totalIncome),
    count: summary.value.incomeCount,
    color: 'success'
  },
  {
    title: 'Depenses',
    icon: 'i-lucide-trending-down',
    value: formatEuro(summary.value.totalExpenses),
    count: summary.value.expenseCount,
    color: 'error'
  },
  {
    title: 'Solde',
    icon: 'i-lucide-wallet',
    value: formatEuro(summary.value.balance),
    count: summary.value.incomeCount + summary.value.expenseCount,
    color: summary.value.balance >= 0 ? 'success' : 'error'
  }
])
</script>

<template>
  <UPageGrid class="lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-px">
    <UPageCard
      v-for="(stat, index) in stats"
      :key="index"
      :icon="stat.icon"
      :title="stat.title"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: `p-2.5 rounded-full bg-${stat.color}/10 ring ring-inset ring-${stat.color}/25 flex-col`,
        title: 'font-normal text-muted text-xs uppercase'
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ stat.value }}
        </span>

        <UBadge
          :color="stat.color as any"
          variant="subtle"
          class="text-xs"
        >
          {{ stat.count }} entree{{ stat.count > 1 ? 's' : '' }}
        </UBadge>
      </div>
    </UPageCard>
  </UPageGrid>
</template>
