<script setup lang="ts">
const selectedTab = ref<'incomes' | 'expenses' | 'envelopes'>('incomes')

const tabs = [
  { key: 'incomes' as const, label: 'Revenus', icon: 'i-lucide-trending-up' },
  { key: 'expenses' as const, label: 'Dépenses', icon: 'i-lucide-trending-down' },
  { key: 'envelopes' as const, label: 'Enveloppes', icon: 'i-lucide-mail' }
]
</script>

<template>
  <div>
    <div class="flex items-center gap-1 mb-6">
      <UButton
        v-for="tab in tabs"
        :key="tab.key"
        :label="tab.label"
        :icon="tab.icon"
        :color="selectedTab === tab.key ? 'primary' : 'neutral'"
        :variant="selectedTab === tab.key ? 'subtle' : 'ghost'"
        @click="selectedTab = tab.key"
      />
    </div>

    <div>
      <BudgetRecurringTable
        v-if="selectedTab === 'incomes'"
        type="income"
      />

      <BudgetRecurringTable
        v-else-if="selectedTab === 'expenses'"
        type="expense"
      />

      <BudgetEnvelopeTable
        v-else
      />
    </div>
  </div>
</template>
