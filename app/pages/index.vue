<script setup lang="ts">
import type { ForecastData, Transaction } from '~/types'

const { selectedMonth, selectedMonthLabel } = useSelectedMonth()

const [year, month] = selectedMonth.value.split('-').map(Number)
const monthKey = `${year}-${month}`

const { data: forecast } = await useAsyncData<ForecastData>(
  () => `accueil-forecast-${selectedMonth.value}`,
  () => $fetch('/api/budget/forecast', {
    query: { year, month, months: 6 }
  }),
  {
    watch: [selectedMonth],
    default: () => ({ months: [], incomes: [], expenses: [], envelopes: [] })
  }
)

const { data: txs } = await useAsyncData<Transaction[]>(
  () => `accueil-tx-${selectedMonth.value}`,
  () => $fetch('/api/budget/transactions', {
    query: { year, month }
  }),
  {
    watch: [selectedMonth],
    default: () => []
  }
)

const incomeTotal = computed(() => computeEffectiveTotal(forecast.value.incomes, monthKey))
const expenseTotal = computed(() => computeEffectiveTotal(forecast.value.expenses, monthKey))
const envelopeTotal = computed(() => computeEnvelopeEffectiveTotal(forecast.value.envelopes, monthKey))
const remaining = computed(() => incomeTotal.value - expenseTotal.value - envelopeTotal.value)
const remainingEnvelopes = computed(() => {
  let total = 0
  for (const fe of forecast.value.envelopes) {
    const actual = fe.actuals[monthKey] ?? 0
    total += Math.max(0, fe.entry.amount - actual)
  }
  return total
})

const monthHistory = computed(() => {
  // build 6-month series from forecast.months
  return forecast.value.months.map((m) => {
    const key = `${m.year}-${m.month}`
    const inc = computeEffectiveTotal(forecast.value.incomes, key)
    const exp = computeEffectiveTotal(forecast.value.expenses, key) + computeEnvelopeEffectiveTotal(forecast.value.envelopes, key)
    return {
      month: m.label.split(' ')[0]?.slice(0, 3) ?? m.label,
      income: inc,
      expense: exp,
      balance: inc - exp
    }
  })
})

const recentTxs = computed(() => txs.value.slice(0, 5))

const envelopesView = computed(() =>
  forecast.value.envelopes.slice(0, 4).map((fe) => {
    const spent = fe.actuals[monthKey] ?? 0
    return {
      id: fe.entry.id,
      label: fe.entry.label,
      amount: fe.entry.amount,
      spent,
      pct: Math.min(100, (spent / fe.entry.amount) * 100),
      over: spent > fe.entry.amount,
      ...getCategoryStyle(fe.entry.category)
    }
  })
)

function fmt(v: number, opts: { sign?: boolean, compact?: boolean } = {}): string {
  const abs = Math.abs(v)
  const formatted = abs.toLocaleString('fr-FR', {
    minimumFractionDigits: opts.compact ? 0 : 2,
    maximumFractionDigits: opts.compact ? 0 : 2
  })
  const s = opts.sign && v > 0 ? '+' : (v < 0 ? '−' : '')
  return `${s}${formatted} €`
}

function fmtTxAmount(v: number): string {
  return v > 0 ? `+${fmt(v).replace('+', '')}` : `−${fmt(Math.abs(v))}`
}
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Accueil">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <NavbarActions />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="px-2 py-4 flex flex-col gap-5" style="max-width: 1440px; margin: 0 auto; width: 100%;">
        <TandenPageHead
          title="Bonjour, Axel."
          :lede="`Voici un récap de ${selectedMonthLabel} — vous avez ${remaining >= 0 ? `${fmt(remaining, { compact: true })} de marge` : `${fmt(Math.abs(remaining), { compact: true })} de découvert prévu`}.`"
        />

        <div class="tf-stat-grid cols-4">
          <div class="tf-stat-card">
            <span class="glow" />
            <div class="head">
              <span class="ico"><UIcon name="i-lucide-wallet" class="size-3.5" /></span>
              <span class="lbl">Solde du mois</span>
            </div>
            <div class="val" :class="remaining >= 0 ? 'tf-up' : 'tf-down'">
              {{ fmt(remaining, { sign: true }) }}
            </div>
            <div class="sub">
              <span class="tf-text-subtle">Revenus − Dépenses − Enveloppes</span>
            </div>
          </div>
          <TandenStatCard
            icon="i-lucide-trending-up"
            icon-kind="income"
            label="Revenus du mois"
            :value="fmt(incomeTotal)"
            :sub="`${forecast.incomes.length} entrées récurrentes`"
            sub-color="subtle"
          />
          <TandenStatCard
            icon="i-lucide-trending-down"
            icon-kind="expense"
            label="Dépensé"
            :value="fmt(expenseTotal)"
            :sub="`${forecast.expenses.length} entrées récurrentes`"
            sub-color="subtle"
          />
          <TandenStatCard
            icon="i-lucide-mail"
            icon-kind="envelope"
            label="Reste enveloppes"
            :value="fmt(remainingEnvelopes)"
            :sub="`${forecast.envelopes.length} enveloppes actives`"
            sub-color="warn"
          />
        </div>

        <div class="tf-two-col">
          <TandenPanel title="Flux des 6 derniers mois" tag="Glissant">
            <template #headRight>
              <span class="tf-meta">
                Solde moyen
                <span
                  class="ml-1"
                  :class="monthHistory.reduce((s, m) => s + m.balance, 0) >= 0 ? 'tf-up' : 'tf-down'"
                >
                  {{ fmt(monthHistory.reduce((s, m) => s + m.balance, 0) / Math.max(1, monthHistory.length), { sign: true, compact: true }) }}
                </span>
              </span>
            </template>
            <TandenAreaChart :data="monthHistory" :height="200" />
          </TandenPanel>

          <TandenPanel title="Enveloppes en cours">
            <template #headRight>
              <UButton
                variant="ghost"
                color="neutral"
                size="xs"
                trailing-icon="i-lucide-arrow-right"
                to="/budget"
              >
                Voir tout
              </UButton>
            </template>
            <div v-if="envelopesView.length === 0" class="px-4 py-8 text-center tf-text-subtle text-sm">
              Aucune enveloppe configurée.
            </div>
            <div v-for="env in envelopesView" :key="env.id" class="tf-env-row">
              <div class="tf-env-top">
                <span
                  class="ico"
                  :style="{ color: env.color, borderColor: `${env.color}40`, background: `${env.color}14` }"
                >
                  <UIcon :name="env.icon" class="size-3" />
                </span>
                <span class="name">{{ env.label }}</span>
                <span class="rem" :class="env.over ? 'over' : ''">
                  {{ fmt(env.spent, { compact: true }) }} / {{ fmt(env.amount, { compact: true }) }}
                </span>
              </div>
              <div class="tf-bar">
                <div
                  :class="env.over ? 'over' : ''"
                  :style="{ width: env.pct + '%', background: env.over ? 'var(--tanden-red-500)' : env.color }"
                />
              </div>
            </div>
          </TandenPanel>
        </div>

        <TandenPanel title="Dernières transactions">
          <template #headRight>
            <UButton
              variant="ghost"
              color="neutral"
              size="xs"
              trailing-icon="i-lucide-arrow-right"
              to="/budget/comptabilite"
            >
              Voir tout
            </UButton>
          </template>
          <table v-if="recentTxs.length > 0" class="tf-tbl">
            <thead>
              <tr>
                <th style="width: 90px;">
                  Date
                </th>
                <th>Transaction</th>
                <th style="width: 160px;">
                  Catégorie
                </th>
                <th class="right" style="width: 130px;">
                  Montant
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tx in recentTxs" :key="tx.id">
                <td class="num tf-text-subtle">
                  {{ new Date(tx.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) }}
                </td>
                <td>
                  <div class="tf-merchant">
                    <div
                      class="tf-row-ico"
                      :style="{
                        color: getCategoryStyle(tx.recurringEntry?.category ?? null).color,
                        borderColor: `${getCategoryStyle(tx.recurringEntry?.category ?? null).color}33`,
                        background: `${getCategoryStyle(tx.recurringEntry?.category ?? null).color}10`
                      }"
                    >
                      <UIcon :name="getCategoryStyle(tx.recurringEntry?.category ?? null).icon" class="size-3.5" />
                    </div>
                    <div>
                      <div class="name">
                        {{ tx.label }}
                      </div>
                      <div v-if="tx.notes" class="note">
                        {{ tx.notes }}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span
                    v-if="tx.recurringEntry"
                    class="tf-badge"
                    :style="{
                      color: getCategoryStyle(tx.recurringEntry.category).color,
                      borderColor: `${getCategoryStyle(tx.recurringEntry.category).color}40`,
                      background: `${getCategoryStyle(tx.recurringEntry.category).color}12`
                    }"
                  >
                    {{ tx.recurringEntry.label }}
                  </span>
                  <span v-else class="tf-text-subtle text-xs">Non catégorisé</span>
                </td>
                <td class="right num" :class="tx.type === 'income' ? 'tf-up' : ''" style="font-weight: 500;">
                  {{ fmtTxAmount(tx.type === 'income' ? tx.amount : -tx.amount) }}
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="px-4 py-8 text-center tf-text-subtle text-sm">
            Aucune transaction ce mois-ci.
          </div>
        </TandenPanel>
      </div>
    </template>
  </UDashboardPanel>
</template>
