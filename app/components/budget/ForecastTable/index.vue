<script setup lang="ts">
import type { ForecastEntry } from '~/types'
import { initBudgetForecastTable } from './init'

const {
  selectedYear,
  selectedMonth,
  selectedMonthLabel,
  monthKey,
  status,
  incomes,
  expenses,
  envelopes,
  incomeTotals,
  expenseTotals,
  envelopeTotals,
  remaining,
  selectedEntry,
  entryDetailOpen
} = initBudgetForecastTable()

function fmt(v: number, opts: { sign?: boolean } = {}): string {
  const abs = Math.abs(v)
  const formatted = abs.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  const s = opts.sign && v > 0 ? '+' : (v < 0 ? '−' : '')
  return `${s}${formatted} €`
}

function actualOf(fe: ForecastEntry): number {
  const v = fe.actuals[monthKey.value]
  return v ?? fe.entry.amount
}

function deltaOf(fe: ForecastEntry): number {
  return actualOf(fe) - fe.entry.amount
}

function openEntry(fe: ForecastEntry) {
  selectedEntry.value = fe.entry
  entryDetailOpen.value = true
}

const sections = computed(() => [
  {
    key: 'income' as const,
    title: 'Revenus',
    icon: 'i-lucide-trending-up',
    color: 'var(--tanden-green-400)',
    items: incomes.value,
    total: incomeTotals.value.effective
  },
  {
    key: 'expense' as const,
    title: 'Dépenses',
    icon: 'i-lucide-trending-down',
    color: 'var(--tanden-red-400)',
    items: expenses.value,
    total: expenseTotals.value.effective
  },
  {
    key: 'envelope' as const,
    title: 'Enveloppes',
    icon: 'i-lucide-mail',
    color: 'var(--tanden-amber-400)',
    items: envelopes.value,
    total: envelopeTotals.value.effective
  }
])
</script>

<template>
  <div class="px-2 py-4 flex flex-col gap-5" style="max-width: 1440px; margin: 0 auto; width: 100%;">
    <TandenPageHead
      :title="`Prévisionnel · ${selectedMonthLabel}`"
      lede="Vue récurrente : revenus, dépenses fixes et enveloppes pour le mois."
    />

    <div v-if="status === 'pending'" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-muted" />
    </div>

    <template v-else>
      <div class="tf-stat-grid cols-4">
        <TandenStatCard
          icon="i-lucide-trending-up"
          icon-kind="income"
          label="Revenus"
          :value="fmt(incomeTotals.effective)"
          :sub="`${incomes.length} entrée${incomes.length > 1 ? 's' : ''}`"
          sub-color="subtle"
        />
        <TandenStatCard
          icon="i-lucide-trending-down"
          icon-kind="expense"
          label="Dépenses"
          :value="fmt(expenseTotals.effective)"
          :sub="`${expenses.length} entrée${expenses.length > 1 ? 's' : ''}`"
          sub-color="subtle"
        />
        <TandenStatCard
          icon="i-lucide-mail"
          icon-kind="envelope"
          label="Enveloppes"
          :value="fmt(envelopeTotals.effective)"
          :sub="`${envelopes.length} active${envelopes.length > 1 ? 's' : ''}`"
          sub-color="subtle"
        />
        <TandenStatCard
          icon="i-lucide-wallet"
          :icon-kind="remaining >= 0 ? 'income' : 'expense'"
          label="Reste"
          :value="fmt(remaining, { sign: true })"
          :sub="remaining >= 0 ? 'Disponible à épargner' : 'Découvert prévu'"
          :sub-color="remaining >= 0 ? 'up' : 'down'"
        />
      </div>

      <TandenPanel v-for="section in sections" :key="section.key">
        <template #head>
          <UIcon :name="section.icon" class="size-4" :style="{ color: section.color }" />
          <h2>{{ section.title }}</h2>
          <span class="tf-tag">{{ section.items.length }} entrée{{ section.items.length > 1 ? 's' : '' }}</span>
        </template>

        <table v-if="section.items.length > 0" class="tf-tbl">
          <thead>
            <tr>
              <th>Libellé</th>
              <th style="width: 160px;">
                Catégorie
              </th>
              <th class="center" style="width: 70px;">
                Jour
              </th>
              <th class="right" style="width: 110px;">
                Prévu
              </th>
              <th class="right" style="width: 130px;">
                Effectif
              </th>
              <th style="width: 60px;" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="fe in section.items" :key="fe.entry.id">
              <td>
                <div class="tf-merchant">
                  <div
                    class="tf-row-ico"
                    :style="{
                      color: getCategoryStyle(fe.entry.category).color,
                      borderColor: `${getCategoryStyle(fe.entry.category).color}33`,
                      background: `${getCategoryStyle(fe.entry.category).color}10`
                    }"
                  >
                    <UIcon
                      :name="getCategoryStyle(fe.entry.category).icon"
                      class="size-3.5"
                    />
                  </div>
                  <button
                    class="name"
                    style="background: none; border: 0; color: inherit; cursor: pointer; padding: 0; font: inherit; text-align: left;"
                    @click="openEntry(fe)"
                  >
                    {{ fe.entry.label }}
                  </button>
                </div>
              </td>
              <td>
                <span class="tf-text-muted text-xs">{{ fe.entry.category ?? '—' }}</span>
              </td>
              <td class="center num tf-text-subtle">
                {{ fe.entry.dayOfMonth ?? '—' }}
              </td>
              <td class="right num tf-text-muted">
                {{ fmt(fe.entry.amount) }}
              </td>
              <td
                class="right num"
                :style="{ fontWeight: 500, color: section.color }"
              >
                {{ fmt(actualOf(fe)) }}
                <div
                  v-if="Math.abs(deltaOf(fe)) > 0.01"
                  class="num"
                  :class="(section.key === 'income' ? deltaOf(fe) >= 0 : deltaOf(fe) <= 0) ? 'tf-up' : 'tf-down'"
                  style="font-size: 10px; margin-top: 2px;"
                >
                  {{ deltaOf(fe) > 0 ? '+' : '' }}{{ deltaOf(fe).toFixed(2) }} €
                </div>
              </td>
              <td>
                <div class="tf-actions">
                  <button class="tf-icon-btn" @click="openEntry(fe)">
                    <UIcon name="i-lucide-pencil" class="size-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="px-4 py-8 text-center tf-text-subtle text-sm">
          Aucune entrée pour ce mois.
        </div>

        <template #foot>
          <span style="font-weight: 600; color: var(--fg);">Total {{ section.title }}</span>
          <div class="tf-spacer" style="flex: 1;" />
          <span class="num" :style="{ fontSize: '14px', fontWeight: 600, color: section.color }">
            {{ fmt(section.total) }}
          </span>
        </template>
      </TandenPanel>

      <div class="tf-reste-bar">
        <div class="ico">
          <UIcon name="i-lucide-wallet" class="size-4" />
        </div>
        <div>
          <div class="lbl">
            Reste à arbitrer
          </div>
          <div class="meta">
            Revenus − Dépenses fixes − Enveloppes
          </div>
        </div>
        <div class="val" :class="remaining >= 0 ? 'up' : 'down'">
          {{ fmt(remaining, { sign: true }) }}
        </div>
      </div>
    </template>

    <BudgetRecurringEntryDetail
      v-model:open="entryDetailOpen"
      :entry="selectedEntry"
      :year="selectedYear"
      :month="selectedMonth"
    />
  </div>
</template>
