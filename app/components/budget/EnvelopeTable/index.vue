<script setup lang="ts">
import type { RecurringEntry, ForecastData } from '~/types'
import { initBudgetEnvelopeTable } from './init'

const emit = defineEmits<{
  updated: []
}>()

const {
  data,
  status,
  editingEntry,
  editModalOpen,
  deletingEntry,
  deleteModalOpen,
  addModalOpen,
  onSaved,
  onDeleted
} = initBudgetEnvelopeTable({ emit })

const { selectedMonth } = useSelectedMonth()
const [year, month] = selectedMonth.value.split('-').map(Number)
const monthKey = `${year}-${month}`

const { data: forecast } = await useAsyncData<ForecastData>(
  () => `envelopes-forecast-${selectedMonth.value}`,
  () => $fetch('/api/budget/forecast', {
    query: { year, month, months: 1 }
  }),
  {
    watch: [selectedMonth],
    default: () => ({ months: [], incomes: [], expenses: [], envelopes: [] })
  }
)

const search = ref('')

const enriched = computed(() => {
  return (data.value ?? []).map((env) => {
    const fe = forecast.value.envelopes.find(e => e.entry.id === env.id)
    const spent = fe?.actuals[monthKey] ?? 0
    const pct = env.amount > 0 ? Math.min(100, (spent / env.amount) * 100) : 0
    const over = spent > env.amount
    const near = pct > 80 && !over
    const remaining = env.amount - spent
    return {
      env,
      spent,
      pct,
      over,
      near,
      remaining,
      ...getCategoryStyle(env.category)
    }
  })
})

const filtered = computed(() => {
  if (!search.value) return enriched.value
  const q = search.value.toLowerCase()
  return enriched.value.filter(e => e.env.label.toLowerCase().includes(q))
})

const totalAmount = computed(() => filtered.value.reduce((s, e) => s + e.env.amount, 0))
const totalSpent = computed(() => filtered.value.reduce((s, e) => s + e.spent, 0))

function fmt(v: number, opts: { sign?: boolean, compact?: boolean } = {}): string {
  const abs = Math.abs(v)
  const formatted = abs.toLocaleString('fr-FR', {
    minimumFractionDigits: opts.compact ? 0 : 2,
    maximumFractionDigits: opts.compact ? 0 : 2
  })
  const s = opts.sign && v > 0 ? '+' : (v < 0 ? '−' : '')
  return `${s}${formatted} €`
}

function openEdit(env: RecurringEntry) {
  editingEntry.value = env
  editModalOpen.value = true
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="flex items-center justify-end">
      <UButton
        label="Nouvelle enveloppe"
        icon="i-lucide-plus"
        color="primary"
        @click="addModalOpen = true"
      />
    </div>

    <div class="tf-stat-grid cols-3">
      <TandenStatCard
        icon="i-lucide-mail"
        icon-kind="envelope"
        label="Total alloué"
        :value="fmt(totalAmount)"
        :sub="`${filtered.length} enveloppe${filtered.length > 1 ? 's' : ''}`"
        sub-color="subtle"
      />
      <TandenStatCard
        icon="i-lucide-trending-down"
        icon-kind="expense"
        label="Consommé"
        :value="fmt(totalSpent)"
        :sub="totalAmount > 0 ? `${Math.round((totalSpent / totalAmount) * 100)} % du budget` : '—'"
        sub-color="subtle"
      />
      <TandenStatCard
        icon="i-lucide-wallet"
        icon-kind="income"
        label="Reste"
        :value="fmt(totalAmount - totalSpent)"
        sub="Disponible ce mois"
        sub-color="up"
      />
    </div>

    <TandenPanel>
      <template #head>
        <h2>Enveloppes du mois</h2>
        <span class="tf-tag">{{ filtered.length }} active{{ filtered.length > 1 ? 's' : '' }}</span>
      </template>
      <template #headRight>
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Rechercher…"
          size="sm"
          class="w-60"
        />
      </template>

      <div v-if="status === 'pending'" class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-muted" />
      </div>

      <div v-else-if="filtered.length === 0" class="px-4 py-10 text-center tf-text-subtle text-sm">
        Aucune enveloppe configurée.
      </div>

      <div v-else>
        <div
          v-for="item in filtered"
          :key="item.env.id"
          class="tf-env-row tf-clickable"
          @click="openEdit(item.env)"
        >
          <div class="tf-env-top">
            <span
              class="ico"
              :style="{ color: item.color, borderColor: `${item.color}40`, background: `${item.color}14` }"
            >
              <UIcon :name="item.icon" class="size-3" />
            </span>
            <span class="name">{{ item.env.label }}</span>
            <span class="pct">{{ Math.round(item.pct) }} %</span>
            <span v-if="item.over" class="tf-badge red">
              <span class="dot" />Dépassée
            </span>
            <span v-else-if="item.near" class="tf-badge amber">
              <span class="dot" />Proche du seuil
            </span>
            <span class="rem" :class="item.over ? 'over' : ''">
              {{ fmt(item.spent, { compact: true }) }} / {{ fmt(item.env.amount, { compact: true }) }}
              <span class="tf-text-subtle ml-2">
                · {{ item.over ? `+${fmt(-item.remaining, { compact: true })}` : `${fmt(item.remaining, { compact: true })} restant` }}
              </span>
            </span>
          </div>
          <div class="tf-bar">
            <div
              :class="{ over: item.over, near: item.near }"
              :style="{ width: item.pct + '%', background: item.over ? 'var(--tanden-red-500)' : (item.near ? 'var(--tanden-amber-500)' : item.color) }"
            />
          </div>
        </div>
      </div>
    </TandenPanel>

    <BudgetEnvelopeModal
      v-model:open="addModalOpen"
      @saved="onSaved"
    />
    <BudgetEnvelopeModal
      v-model:open="editModalOpen"
      :entry="editingEntry"
      @saved="onSaved"
    />
    <BudgetDeleteModal
      v-model:open="deleteModalOpen"
      type="envelope"
      :entry="deletingEntry"
      @deleted="onDeleted"
    />
  </div>
</template>
