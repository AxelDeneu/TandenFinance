<script setup lang="ts">
import type { MonthlySummary } from '~/types'
import { initBudgetHistoryView } from './init'

const cardRef = useTemplateRef<HTMLElement | null>('cardRef')
const { monthlySummaries, navigateToMonth } = initBudgetHistoryView({ cardRef })

function fmt(v: number, opts: { sign?: boolean, compact?: boolean } = {}): string {
  const abs = Math.abs(v)
  const formatted = abs.toLocaleString('fr-FR', {
    minimumFractionDigits: opts.compact ? 0 : 2,
    maximumFractionDigits: opts.compact ? 0 : 2
  })
  const s = opts.sign && v > 0 ? '+' : (v < 0 ? '−' : '')
  return `${s}${formatted} €`
}

const last6 = computed<MonthlySummary[]>(() => monthlySummaries.value.slice(-6))

const monthsReversed = computed(() => [...monthlySummaries.value].reverse())

const avgBalance = computed(() => {
  if (monthlySummaries.value.length === 0) return 0
  return monthlySummaries.value.reduce((s, m) => s + m.remaining, 0) / monthlySummaries.value.length
})

const range = computed(() => {
  if (monthlySummaries.value.length === 0) return ''
  const first = monthlySummaries.value[0]?.label
  const last = monthlySummaries.value[monthlySummaries.value.length - 1]?.label
  return `${first} — ${last}`
})

const window = ref<6 | 12>(6)

const visible = computed(() => {
  return window.value === 6 ? last6.value : monthlySummaries.value
})

const visibleArea = computed(() =>
  visible.value.map(s => ({
    month: s.label.split(' ')[0]?.slice(0, 3) ?? s.label,
    income: s.incomeEffective,
    expense: s.expenseEffective + s.envelopeEffective
  }))
)
</script>

<template>
  <div ref="cardRef" class="px-2 py-4 flex flex-col gap-5" style="max-width: 1440px; margin: 0 auto; width: 100%;">
    <TandenPageHead
      title="Historique"
      lede="Évolution sur les derniers mois — revenus, dépenses, solde."
    >
      <div class="flex items-center gap-1.5 p-0.5" style="background: var(--bg-elev-2); border: 1px solid var(--border); border-radius: var(--r-3);">
        <button
          v-for="opt in [6, 12] as const"
          :key="opt"
          class="px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer"
          :style="window === opt
            ? { background: 'var(--bg-elev-3)', color: 'var(--fg)', boxShadow: 'var(--shadow-xs)' }
            : { background: 'transparent', color: 'var(--fg-muted)' }"
          @click="window = opt"
        >
          {{ opt }} mois
        </button>
      </div>
    </TandenPageHead>

    <TandenPanel title="Flux mensuel" :tag="range">
      <template #headRight>
        <span class="tf-meta">
          Solde moyen
          <span class="ml-1" :class="avgBalance >= 0 ? 'tf-up' : 'tf-down'">
            {{ fmt(avgBalance, { sign: true, compact: true }) }}
          </span>
        </span>
      </template>
      <TandenAreaChart v-if="visibleArea.length > 0" :data="visibleArea" />
      <div v-else class="px-4 py-12 text-center tf-text-subtle text-sm">
        Aucune donnée historique disponible.
      </div>
    </TandenPanel>

    <div class="tf-month-grid">
      <div
        v-for="(m, i) in monthsReversed.slice(0, 6)"
        :key="`${m.year}-${m.month}`"
        class="tf-month-card"
        @click="navigateToMonth(m.year, m.month)"
      >
        <div class="flex items-center justify-between">
          <span class="label">{{ m.label }}</span>
          <span v-if="i === 0" class="tf-badge green">
            <span class="dot" />Mois en cours
          </span>
        </div>
        <div class="balance" :class="m.remaining >= 0 ? 'tf-up' : 'tf-down'">
          {{ fmt(m.remaining, { sign: true, compact: true }) }}
        </div>
        <div class="row">
          <span>Revenus</span>
          <span class="tf-up">+{{ Math.round(m.incomeEffective).toLocaleString('fr-FR') }} €</span>
        </div>
        <div class="row">
          <span>Dépenses</span>
          <span class="tf-down">−{{ Math.round(m.expenseEffective + m.envelopeEffective).toLocaleString('fr-FR') }} €</span>
        </div>
        <div class="tf-bar">
          <div
            :style="{
              width: `${m.incomeEffective > 0 ? Math.min(100, ((m.expenseEffective + m.envelopeEffective) / m.incomeEffective) * 100) : 0}%`,
              background: 'var(--tanden-peach-500)'
            }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
