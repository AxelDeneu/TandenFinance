<script setup lang="ts">
const selectedTab = ref<'incomes' | 'expenses' | 'envelopes'>('incomes')

const tabs = [
  { key: 'incomes' as const, label: 'Revenus', icon: 'i-lucide-trending-up', tone: 'var(--tanden-green-400)' },
  { key: 'expenses' as const, label: 'Dépenses', icon: 'i-lucide-trending-down', tone: 'var(--tanden-red-400)' },
  { key: 'envelopes' as const, label: 'Enveloppes', icon: 'i-lucide-mail', tone: 'var(--tanden-amber-400)' }
]
</script>

<template>
  <div class="px-2 py-4 flex flex-col gap-5" style="max-width: 1440px; margin: 0 auto; width: 100%;">
    <TandenPageHead
      title="Budget mensuel"
      lede="Gérez vos revenus, dépenses récurrentes et enveloppes mensuelles."
    />

    <div class="flex items-center gap-1.5">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer"
        :style="selectedTab === tab.key
          ? { background: 'var(--bg-elev-2)', color: 'var(--fg)', border: '1px solid var(--border-strong)' }
          : { background: 'transparent', color: 'var(--fg-muted)', border: '1px solid transparent' }"
        @click="selectedTab = tab.key"
      >
        <UIcon :name="tab.icon" class="size-4" :style="{ color: selectedTab === tab.key ? tab.tone : 'var(--fg-subtle)' }" />
        <span>{{ tab.label }}</span>
      </button>
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
