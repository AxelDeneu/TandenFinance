<script setup lang="ts">
import type { AnalyticsSummary, CategoryBreakdownItem, CategoryTrendItem } from '~/types'

const { selectedYear, selectedMonth } = useMonthNavigation()

const type = ref<'expenses' | 'incomes'>('expenses')

const { data: summary } = await useAsyncData<AnalyticsSummary>(
  'analyse-summary',
  () => $fetch('/api/budget/analytics/summary', { query: { months: 12 } }),
  {
    default: () => ({
      averageMonthlyIncome: 0,
      averageMonthlyExpense: 0,
      averageMonthlySavings: 0,
      savingsRate: 0,
      topGrowingCategories: [],
      topShrinkingCategories: [],
      bestMonth: { label: '-', savings: 0 },
      worstMonth: { label: '-', savings: 0 }
    })
  }
)

const { data: breakdown } = await useAsyncData<{ expenses: CategoryBreakdownItem[], incomes: CategoryBreakdownItem[] }>(
  () => `analyse-breakdown-${selectedYear.value}-${selectedMonth.value}`,
  () => $fetch('/api/budget/analytics/category-breakdown', {
    query: { year: selectedYear.value, month: selectedMonth.value }
  }),
  {
    watch: [selectedYear, selectedMonth],
    default: () => ({ expenses: [], incomes: [] })
  }
)

const { data: trends } = await useAsyncData<{ categories: CategoryTrendItem[] }>(
  'analyse-trends',
  () => $fetch('/api/budget/analytics/category-trends', { query: { months: 6 } }),
  { default: () => ({ categories: [] }) }
)

const items = computed<CategoryBreakdownItem[]>(() => {
  const arr = type.value === 'expenses' ? breakdown.value.expenses : breakdown.value.incomes
  return arr.slice().sort((a, b) => b.amount - a.amount)
})

const donutData = computed(() =>
  items.value.map(i => ({
    label: i.category,
    value: i.amount,
    color: getCategoryStyle(i.category).color
  }))
)

const totalsByMonth = computed(() => {
  const wantType = type.value === 'expenses' ? 'expense' : 'income'
  const cats = trends.value.categories.filter(c => c.type === wantType)
  if (cats.length === 0) return []
  const months = cats[0]!.monthlyAmounts.map(m => m.month)
  return months.map((month) => {
    const total = cats.reduce((s, c) => s + (c.monthlyAmounts.find(m => m.month === month)?.amount ?? 0), 0)
    const parts = month.split('-').map(Number)
    const fmtMonth = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
    return {
      label: fmtMonth.format(new Date(parts[0]!, parts[1]! - 1, 1)),
      value: total,
      color: '#F6946A'
    }
  })
})

const lastVsPrev = computed(() => {
  const data = totalsByMonth.value
  if (data.length < 2) return null
  const last = data[data.length - 1]!.value
  const prev = data[data.length - 2]!.value
  if (prev === 0) return null
  return ((last - prev) / prev) * 100
})

const trendsTable = computed(() => {
  const wantType = type.value === 'expenses' ? 'expense' : 'income'
  return trends.value.categories
    .filter(c => c.type === wantType)
    .slice(0, 6)
    .map((c) => {
      const vals = c.monthlyAmounts.map(m => m.amount)
      const last = vals[vals.length - 1] ?? 0
      const prev = vals[vals.length - 2] ?? 0
      const delta = prev > 0 ? ((last - prev) / prev) * 100 : 0
      const months = c.monthlyAmounts.map((m) => {
        const parts = m.month.split('-').map(Number)
        return new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(new Date(parts[0]!, parts[1]! - 1, 1))
      })
      return {
        category: c.category,
        type: c.type,
        vals,
        months,
        delta,
        color: getCategoryStyle(c.category).color
      }
    })
})

function fmt(v: number, opts: { sign?: boolean, compact?: boolean } = {}): string {
  const abs = Math.abs(v)
  const formatted = abs.toLocaleString('fr-FR', {
    minimumFractionDigits: opts.compact ? 0 : 2,
    maximumFractionDigits: opts.compact ? 0 : 2
  })
  const s = opts.sign && v > 0 ? '+' : (v < 0 ? '−' : '')
  return `${s}${formatted} €`
}
</script>

<template>
  <div class="px-2 py-4 flex flex-col gap-5" style="max-width: 1440px; margin: 0 auto; width: 100%;">
    <TandenPageHead
      title="Analyse"
      lede="Répartition par catégorie et évolution dans le temps."
    >
      <div class="flex items-center gap-1.5 p-0.5" style="background: var(--bg-elev-2); border: 1px solid var(--border); border-radius: var(--r-2);">
        <button
          v-for="opt in [['expenses', 'Dépenses'], ['incomes', 'Revenus']] as const"
          :key="opt[0]"
          class="px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer"
          :style="type === opt[0]
            ? { background: 'var(--bg-elev-3)', color: 'var(--fg)', boxShadow: 'var(--shadow-xs)' }
            : { background: 'transparent', color: 'var(--fg-muted)' }"
          @click="type = opt[0]"
        >
          {{ opt[1] }}
        </button>
      </div>
    </TandenPageHead>

    <div class="tf-stat-grid cols-4">
      <TandenStatCard
        icon="i-lucide-trending-up"
        icon-kind="income"
        label="Revenu moyen"
        :value="fmt(summary.averageMonthlyIncome, { compact: true })"
        sub="12 derniers mois"
        sub-color="subtle"
      />
      <TandenStatCard
        icon="i-lucide-trending-down"
        icon-kind="expense"
        label="Dépense moyenne"
        :value="fmt(summary.averageMonthlyExpense, { compact: true })"
        sub="12 derniers mois"
        sub-color="subtle"
      />
      <TandenStatCard
        icon="i-lucide-piggy-bank"
        :icon-kind="summary.averageMonthlySavings >= 0 ? 'income' : 'expense'"
        label="Épargne moyenne"
        :value="fmt(summary.averageMonthlySavings, { compact: true, sign: true })"
        :sub="`Taux ${summary.savingsRate}%`"
        :sub-color="summary.averageMonthlySavings >= 0 ? 'up' : 'down'"
      />
      <TandenStatCard
        icon="i-lucide-trophy"
        icon-kind="peach"
        label="Meilleur mois"
        :value="summary.bestMonth.label"
        :sub="fmt(summary.bestMonth.savings, { sign: true, compact: true })"
        sub-color="up"
      />
    </div>

    <div class="tf-two-col">
      <TandenPanel title="Répartition par catégorie">
        <template #headRight>
          <span class="tf-meta">{{ items.length }} catégorie{{ items.length > 1 ? 's' : '' }}</span>
        </template>
        <div v-if="items.length === 0" class="px-4 py-12 text-center tf-text-subtle text-sm">
          Aucune donnée pour ce mois.
        </div>
        <div
          v-else
          class="grid items-center"
          style="padding: 18px; grid-template-columns: 180px 1fr; gap: 24px;"
        >
          <TandenDonut :data="donutData" />
          <div class="flex flex-col gap-2.5">
            <div v-for="b in items" :key="b.category">
              <div class="flex items-center justify-between" style="font-size: 13px;">
                <div class="flex items-center gap-2">
                  <span style="width: 8px; height: 8px; border-radius: 999px;" :style="{ background: getCategoryStyle(b.category).color }" />
                  <span>{{ b.category }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="num" style="font-weight: 500;">{{ fmt(b.amount, { compact: true }) }}</span>
                  <span class="num tf-text-subtle text-right" style="font-size: 11px; width: 36px;">{{ b.percent }} %</span>
                </div>
              </div>
              <div class="tf-bar mt-1">
                <div :style="{ width: `${b.percent}%`, background: getCategoryStyle(b.category).color }" />
              </div>
            </div>
          </div>
        </div>
      </TandenPanel>

      <TandenPanel title="Top mois">
        <template #headRight>
          <span class="tf-meta">6 mois</span>
        </template>
        <div v-if="totalsByMonth.length === 0" class="px-4 py-12 text-center tf-text-subtle text-sm">
          Pas assez d'historique.
        </div>
        <div v-else style="padding: 16px;">
          <TandenBarChart :data="totalsByMonth" />
        </div>
        <template v-if="lastVsPrev !== null" #foot>
          <span>{{ totalsByMonth[totalsByMonth.length - 1]?.label }} {{ lastVsPrev! >= 0 ? 'en hausse' : 'en baisse' }}</span>
          <div class="tf-spacer" style="flex: 1;" />
          <span class="num" :class="(lastVsPrev! < 0 && type === 'expenses') || (lastVsPrev! > 0 && type === 'incomes') ? 'tf-up' : 'tf-down'">
            {{ lastVsPrev! > 0 ? '+' : '' }}{{ lastVsPrev!.toFixed(1) }} %
          </span>
        </template>
      </TandenPanel>
    </div>

    <TandenPanel title="Tendances par catégorie" tag="6 mois glissants">
      <table v-if="trendsTable.length > 0" class="tf-tbl">
        <thead>
          <tr>
            <th>Catégorie</th>
            <th
              v-for="(m, i) in trendsTable[0]!.months"
              :key="i"
              class="right"
            >
              {{ m }}
            </th>
            <th style="width: 130px;">
              Tendance
            </th>
            <th class="right">
              Δ
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in trendsTable" :key="row.category">
            <td>
              <div class="flex items-center gap-2">
                <span style="width: 8px; height: 8px; border-radius: 999px;" :style="{ background: row.color }" />
                <span style="font-weight: 500;">{{ row.category }}</span>
              </div>
            </td>
            <td
              v-for="(v, i) in row.vals"
              :key="i"
              class="right num"
              :class="i === row.vals.length - 1 ? '' : 'tf-text-subtle'"
            >
              {{ Math.round(v) }}
            </td>
            <td>
              <TandenSparkline
                :data="row.vals"
                :color="row.color"
                :w="110"
                :h="24"
              />
            </td>
            <td
              class="right num"
              style="font-weight: 500;"
              :class="(row.delta < 0 && row.type === 'expense') || (row.delta > 0 && row.type === 'income') ? 'tf-up' : 'tf-down'"
            >
              {{ row.delta > 0 ? '+' : '' }}{{ row.delta.toFixed(1) }} %
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="px-4 py-12 text-center tf-text-subtle text-sm">
        Pas encore d'historique pour générer des tendances.
      </div>
    </TandenPanel>
  </div>
</template>
