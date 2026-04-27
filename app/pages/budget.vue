<script setup lang="ts">
const route = useRoute()

const titles: Record<string, string> = {
  '/budget': 'Budget mensuel',
  '/budget/comptabilite': 'Comptabilité',
  '/budget/previsionnel': 'Prévisionnel',
  '/budget/historique': 'Historique',
  '/budget/analyse': 'Analyse'
}

const title = computed(() => titles[route.path] ?? 'Budget')
</script>

<template>
  <UDashboardPanel id="budget">
    <template #header>
      <UDashboardNavbar :title="title">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <NavbarActions />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <NuxtPage />
    </template>
  </UDashboardPanel>
</template>
