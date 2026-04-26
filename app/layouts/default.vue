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
      <template #header="{ collapsed: isCollapsed }">
        <NuxtLink
          to="/"
          class="flex items-center gap-2.5 px-2 py-1 select-none"
          :class="isCollapsed ? 'justify-center' : ''"
        >
          <span
            class="grid place-items-center rounded-[7px] shrink-0"
            style="width: 26px; height: 26px; background: var(--tanden-accent-500); box-shadow: var(--shadow-sm);"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 64 64"
              fill="none"
              width="16"
              height="16"
            >
              <rect
                x="14"
                y="18"
                width="36"
                height="4"
                rx="1"
                fill="#fff"
              />
              <rect
                x="20"
                y="18"
                width="4"
                height="32"
                rx="1"
                fill="#fff"
              />
              <path
                d="M30 22 H38 a12 12 0 0 1 0 24 H30 V22 Z"
                fill="none"
                stroke="#fff"
                stroke-width="4"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <span
            v-if="!isCollapsed"
            class="text-sm font-semibold flex items-baseline gap-1.5"
            style="letter-spacing: -0.02em;"
          >
            <span>tanden</span>
            <span
              class="inline-block rounded-full"
              style="width: 3px; height: 3px; background: var(--tanden-accent-500); margin-bottom: 2px;"
            />
            <span>finance</span>
          </span>
          <span
            v-if="!isCollapsed"
            class="ml-auto rounded-sm tf-num"
            style="font: 500 9px var(--font-mono); letter-spacing: 0.06em; text-transform: uppercase; color: var(--fg-subtle); border: 1px solid var(--border); padding: 2px 5px;"
          >
            v0.4
          </span>
        </NuxtLink>
      </template>

      <template #default="{ collapsed: isCollapsed }">
        <UDashboardSearchButton :collapsed="isCollapsed" class="bg-transparent ring-default mt-2" />

        <UNavigationMenu
          :collapsed="isCollapsed"
          :items="links"
          orientation="vertical"
          tooltip
        />
      </template>

      <template #footer="{ collapsed: isCollapsed }">
        <div
          class="flex items-center gap-2.5 px-2 py-1.5"
          :class="isCollapsed ? 'justify-center' : ''"
        >
          <span
            class="grid place-items-center text-white shrink-0"
            style="width: 28px; height: 28px; border-radius: 999px; background: linear-gradient(135deg, var(--tanden-accent-500), var(--tanden-accent-700)); font-weight: 600; font-size: 11px; box-shadow: var(--shadow-xs);"
          >
            AD
          </span>
          <div v-if="!isCollapsed" class="flex-1 min-w-0">
            <div class="text-[12.5px] font-medium truncate">
              Axel & Dorine
            </div>
            <div class="text-[10px] tf-text-subtle tf-num truncate">
              Foyer · Tanden
            </div>
          </div>
        </div>
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
