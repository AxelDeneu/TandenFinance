<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const links = [[{
  label: 'Configuration',
  icon: 'i-lucide-settings',
  to: '/budget',
  exact: true
}, {
  label: 'Prévisionnel',
  icon: 'i-lucide-calendar-range',
  to: '/budget/previsionnel'
}, {
  label: 'Historique',
  icon: 'i-lucide-history',
  to: '/budget/historique'
}]] satisfies NavigationMenuItem[][]
</script>

<template>
  <UDashboardPanel id="budget">
    <template #header>
      <UDashboardNavbar title="Budget">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <NuxtPage />
    </template>
  </UDashboardPanel>
</template>
