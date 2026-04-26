<script setup lang="ts">
import type { Notification } from '~/types'

type Tone = 'warn' | 'error' | 'info' | 'success'

const { data: notifications, refresh } = await useAsyncData<Notification[]>(
  'alertes-notifications',
  () => $fetch('/api/notifications'),
  { default: () => [] }
)

const filter = ref<'all' | 'unread' | 'important'>('all')

const filtered = computed(() => {
  if (filter.value === 'unread') return notifications.value.filter(n => !n.read)
  if (filter.value === 'important') {
    return notifications.value.filter((n) => {
      const c = n.color?.toLowerCase()
      return c === 'error' || c === 'warning'
    })
  }
  return notifications.value
})

function toneOf(n: Notification): Tone {
  const c = n.color?.toLowerCase()
  if (c === 'error' || c === 'red') return 'error'
  if (c === 'warning' || c === 'amber' || c === 'yellow') return 'warn'
  if (c === 'success' || c === 'green') return 'success'
  return 'info'
}

function iconOf(n: Notification): string {
  if (n.icon) return n.icon
  const t = toneOf(n)
  if (t === 'error') return 'i-lucide-circle-alert'
  if (t === 'warn') return 'i-lucide-triangle-alert'
  if (t === 'success') return 'i-lucide-check-circle'
  return 'i-lucide-info'
}

function whenOf(n: Notification): string {
  const date = new Date(n.createdAt)
  const diff = (Date.now() - date.getTime()) / 1000
  if (diff < 60) return 'à l\'instant'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  if (diff < 86400 * 2) return 'hier'
  return `il y a ${Math.floor(diff / 86400)} j`
}

const counts = computed(() => {
  let critical = 0
  let warnings = 0
  let infos = 0
  let ok = 0
  for (const n of notifications.value) {
    const t = toneOf(n)
    if (t === 'error') critical++
    else if (t === 'warn') warnings++
    else if (t === 'info') infos++
    else if (t === 'success') ok++
  }
  return { critical, warnings, infos, ok }
})

async function markAllRead() {
  await $fetch('/api/notifications/read-all', { method: 'POST' })
  await refresh()
}
</script>

<template>
  <div class="px-2 py-4 flex flex-col gap-5" style="max-width: 1440px; margin: 0 auto; width: 100%;">
    <TandenPageHead
      title="Alertes"
      lede="Notifications, dépassements de budget, transactions à valider."
    >
      <UButton
        label="Tout marquer comme lu"
        icon="i-lucide-check"
        color="neutral"
        variant="subtle"
        @click="markAllRead"
      />
    </TandenPageHead>

    <div class="tf-stat-grid cols-4">
      <TandenStatCard
        icon="i-lucide-circle-alert"
        icon-kind="expense"
        label="Dépassements"
        :value="counts.critical"
        sub="alertes critiques"
        sub-color="down"
      />
      <TandenStatCard
        icon="i-lucide-triangle-alert"
        icon-kind="envelope"
        label="Avertissements"
        :value="counts.warnings"
        sub="à surveiller"
        sub-color="warn"
      />
      <TandenStatCard
        icon="i-lucide-info"
        icon-kind="info"
        label="Informations"
        :value="counts.infos"
        sub="à venir"
        sub-color="subtle"
      />
      <TandenStatCard
        icon="i-lucide-check-circle"
        icon-kind="income"
        label="OK"
        :value="counts.ok"
        sub="objectifs tenus"
        sub-color="up"
      />
    </div>

    <TandenPanel>
      <template #head>
        <h2>Dernières alertes</h2>
        <span class="tf-tag">{{ filtered.length }} {{ filtered.length > 1 ? 'alertes' : 'alerte' }}</span>
      </template>
      <template #headRight>
        <div class="flex items-center gap-1.5 p-0.5" style="background: var(--bg-elev-2); border: 1px solid var(--border); border-radius: var(--r-2);">
          <button
            v-for="opt in [['all', 'Toutes'], ['unread', 'Non lues'], ['important', 'Importantes']] as const"
            :key="opt[0]"
            class="px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer"
            :style="filter === opt[0]
              ? { background: 'var(--bg-elev-3)', color: 'var(--fg)', boxShadow: 'var(--shadow-xs)' }
              : { background: 'transparent', color: 'var(--fg-muted)' }"
            @click="filter = opt[0]"
          >
            {{ opt[1] }}
          </button>
        </div>
      </template>

      <div v-if="filtered.length === 0" class="px-4 py-12 text-center tf-text-subtle text-sm">
        Aucune alerte à afficher.
      </div>

      <div v-for="n in filtered" :key="n.id" class="tf-alert-row">
        <div class="ico" :class="toneOf(n)">
          <UIcon :name="iconOf(n)" class="size-4" />
        </div>
        <div class="body">
          <div class="title">
            {{ n.title }}
          </div>
          <div v-if="n.body" class="desc">
            {{ n.body }}
          </div>
          <div class="when">
            {{ whenOf(n) }}
          </div>
        </div>
        <UButton
          v-if="n.actionUrl"
          label="Voir"
          color="neutral"
          variant="ghost"
          size="xs"
          :to="n.actionUrl"
        />
      </div>
    </TandenPanel>

    <BudgetRulesTable />
  </div>
</template>
