<script setup lang="ts">
const { isNotificationsSlideoverOpen } = useDashboard()

const now = new Date()
const currentMonthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(now)
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Accueil" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UTooltip text="Notifications" :shortcuts="['N']">
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip color="error" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex items-center gap-2 mb-4">
        <UIcon name="i-lucide-calendar" class="size-5 text-primary" />
        <h2 class="text-lg font-semibold text-highlighted capitalize">
          {{ currentMonthLabel }}
        </h2>
      </div>

      <HomeStats />
      <HomeChart />
      <HomeSales />
    </template>
  </UDashboardPanel>
</template>
