<script setup lang="ts">
const { selectedMonthLabel } = useSelectedMonth()
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Accueil">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <NavbarActions />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex items-center gap-2 mb-4">
        <UIcon name="i-lucide-calendar" class="size-5 text-primary" />
        <h2 class="text-lg font-semibold text-highlighted capitalize">
          {{ selectedMonthLabel }}
        </h2>
      </div>

      <HomeStats />
      <HomeChart />
      <HomeSales />
    </template>
  </UDashboardPanel>
</template>
