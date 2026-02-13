<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const toast = useToast()

const open = ref(false)

const links = [{
  label: 'Accueil',
  icon: 'i-lucide-house',
  to: '/',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Budget',
  icon: 'i-lucide-wallet',
  to: '/budget',
  defaultOpen: true,
  type: 'trigger',
  children: [{
    label: 'Configuration',
    to: '/budget',
    exact: true,
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Prévisionnel',
    to: '/budget/previsionnel',
    onSelect: () => {
      open.value = false
    }
  }]
}, {
  label: 'Paramètres',
  to: '/settings',
  icon: 'i-lucide-settings',
  onSelect: () => {
    open.value = false
  }
}] satisfies NavigationMenuItem[]

const groups = computed(() => [{
  id: 'links',
  label: 'Aller à',
  items: links
}])

onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }

  toast.add({
    title: 'Nous utilisons des cookies pour améliorer votre expérience.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Accepter',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        cookie.value = 'accepted'
      }
    }, {
      label: 'Refuser',
      color: 'neutral',
      variant: 'ghost'
    }]
  })
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <UButton
          label="TandenFinance"
          color="neutral"
          variant="ghost"
          block
          :square="collapsed"
          class="data-[state=open]:bg-elevated"
          :class="[!collapsed && 'py-2', 'justify-start']"
          :ui="{
            trailingIcon: 'text-dimmed'
          }"
        />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links"
          orientation="vertical"
          tooltip
          popover
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
