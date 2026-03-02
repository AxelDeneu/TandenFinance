<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const toast = useToast()

const open = ref(false)
const collapsed = ref(true)
let collapseTimer: ReturnType<typeof setTimeout>

function onMouseEnter() {
  clearTimeout(collapseTimer)
  collapsed.value = false
}

function onMouseLeave() {
  collapseTimer = setTimeout(() => {
    collapsed.value = true
  }, 200)
}

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
    label: 'Comptabilité',
    to: '/budget/comptabilite',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Prévisionnel',
    to: '/budget/previsionnel',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Historique',
    to: '/budget/historique',
    onSelect: () => {
      open.value = false
    }
  }]
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
      v-model:collapsed="collapsed"
      collapsible
      :collapsed-size="4"
      :min-size="10"
      :default-size="18"
      class="bg-elevated/25"
      :ui="{
        root: 'transition-[width,min-width,flex-basis] duration-300 ease-in-out',
        footer: 'lg:border-t lg:border-default'
      }"
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave"
    >
      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default mt-2" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links"
          orientation="vertical"
          tooltip
          popover
        />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
