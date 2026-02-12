<script setup lang="ts">
const selectedTab = ref<'incomes' | 'expenses' | 'settings'>('incomes')

const summaryRef = ref<{ refresh: () => void }>()

function onUpdated() {
  summaryRef.value?.refresh()
}

const tabs = [
  { key: 'incomes' as const, label: 'Revenus', icon: 'i-lucide-trending-up' },
  { key: 'expenses' as const, label: 'Depenses', icon: 'i-lucide-trending-down' },
  { key: 'settings' as const, label: 'Parametres', icon: 'i-lucide-settings' }
]
</script>

<template>
  <UDashboardPanel id="budget">
    <template #header>
      <UDashboardNavbar title="Budget">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <div class="flex items-center gap-1">
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
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <BudgetSummaryCards ref="summaryRef" />

      <div class="mt-6">
        <BudgetRecurringTable
          v-if="selectedTab === 'incomes'"
          type="income"
          @updated="onUpdated"
        />

        <BudgetRecurringTable
          v-if="selectedTab === 'expenses'"
          type="expense"
          @updated="onUpdated"
        />

        <BudgetSettingsCard
          v-if="selectedTab === 'settings'"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
