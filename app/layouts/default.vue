<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { Transaction } from '~/types'

const router = useRouter()

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
  label: 'Configuration',
  icon: 'i-lucide-settings',
  to: '/budget',
  exact: true,
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Comptabilité',
  icon: 'i-lucide-receipt',
  to: '/budget/comptabilite',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Prévisionnel',
  icon: 'i-lucide-calendar-range',
  to: '/budget/previsionnel',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Historique',
  icon: 'i-lucide-history',
  to: '/budget/historique',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Analyse',
  icon: 'i-lucide-bar-chart-3',
  to: '/budget/analyse',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Alertes',
  icon: 'i-lucide-bell',
  to: '/budget/alertes',
  onSelect: () => {
    open.value = false
  }
}] satisfies NavigationMenuItem[]

const searchTerm = ref('')

const { data: searchResults, status: searchStatus } = useFetch<Transaction[]>('/api/budget/transactions/search', {
  query: { q: searchTerm },
  lazy: true,
  default: () => []
})

interface SearchGroup {
  id: string
  label: string
  items: { label: string, suffix?: string, icon?: string, to?: string, onSelect?: () => void }[]
}

const groups = computed<SearchGroup[]>(() => {
  const g: SearchGroup[] = [{
    id: 'links',
    label: 'Aller à',
    items: links
  }]

  if (searchTerm.value.length >= 2) {
    g.unshift({
      id: 'transactions',
      label: 'Transactions',
      items: (searchResults.value ?? []).map((tx) => {
        const amount = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(tx.amount)
        const dateLabel = new Date(tx.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
        return {
          label: tx.label,
          suffix: `${amount} · ${dateLabel}`,
          icon: tx.type === 'income' ? 'i-lucide-arrow-down-left' : 'i-lucide-arrow-up-right',
          onSelect: () => {
            const [year, month] = tx.date.split('-')
            router.push(`/budget/comptabilite?year=${year}&month=${Number(month)}`)
          }
        }
      })
    })
  }

  return g
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
        />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch
      v-model:search-term="searchTerm"
      :groups="groups"
      :loading="searchStatus === 'pending'"
      :fuse="{ resultLimit: 20 }"
    />

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
