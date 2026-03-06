<script setup lang="ts">
import type { RecurringEntry } from '~/types'
import { initRecurringEntryDetail } from './init'

const props = defineProps<{
  entry: RecurringEntry | null
  year: number
  month: number
}>()

const open = defineModel<boolean>('open', { default: false })

const entryRef = computed(() => props.entry)
const yearRef = computed(() => props.year)
const monthRef = computed(() => props.month)

const {
  filteredTransactions,
  totalSpent,
  budgetRemaining,
  progressPercent,
  progressColor,
  status
} = initRecurringEntryDetail({
  entry: entryRef,
  year: yearRef,
  month: monthRef
})

const typeLabel: Record<string, string> = {
  income: 'Revenu',
  expense: 'Dépense',
  envelope: 'Enveloppe'
}

const typeBadgeColor: Record<string, string> = {
  income: 'success',
  expense: 'error',
  envelope: 'warning'
}

const progressBarClass = computed(() => {
  if (progressColor.value === 'error') return 'bg-error'
  if (progressColor.value === 'warning') return 'bg-warning'
  return 'bg-success'
})
</script>

<template>
  <USlideover
    v-model:open="open"
    :title="entry?.label ?? ''"
  >
    <template #header>
      <div class="flex items-center gap-2 w-full">
        <span class="text-lg font-semibold truncate">{{ entry?.label }}</span>
        <UBadge
          v-if="entry"
          :color="(typeBadgeColor[entry.type] as any)"
          variant="subtle"
          size="xs"
        >
          {{ typeLabel[entry.type] }}
        </UBadge>
      </div>
    </template>

    <template #body>
      <div v-if="!entry" class="text-center text-muted py-8">
        Aucune entrée sélectionnée.
      </div>

      <div v-else class="flex flex-col gap-6">
        <!-- Summary -->
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted">Dépensé</span>
            <span class="font-medium tabular-nums">{{ formatEuro(totalSpent) }} / {{ formatEuro(entry.amount) }}</span>
          </div>

          <!-- Progress bar -->
          <div class="h-2 w-full bg-default rounded-full overflow-hidden">
            <div
              :class="['h-full rounded-full transition-all', progressBarClass]"
              :style="{ width: `${Math.min(progressPercent, 100)}%` }"
            />
          </div>

          <div class="flex items-center justify-between text-sm">
            <span class="text-muted">Reste</span>
            <span
              class="font-medium tabular-nums"
              :class="budgetRemaining >= 0 ? 'text-success' : 'text-error'"
            >
              {{ formatEuro(budgetRemaining) }}
            </span>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="status === 'pending'" class="flex items-center justify-center py-8">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-xl text-muted" />
        </div>

        <!-- Transactions list -->
        <template v-else>
          <div v-if="filteredTransactions.length === 0" class="text-center text-muted py-8">
            Aucune transaction ce mois.
          </div>

          <div v-else class="flex flex-col gap-1">
            <h4 class="text-sm font-medium text-muted mb-1">
              Transactions ({{ filteredTransactions.length }})
            </h4>
            <div
              v-for="tx in filteredTransactions"
              :key="tx.id"
              class="flex items-center justify-between py-2 px-3 rounded-md hover:bg-elevated/50"
            >
              <div class="flex flex-col min-w-0">
                <span class="text-sm font-medium text-highlighted truncate">{{ tx.label }}</span>
                <span class="text-xs text-muted">{{ tx.date }}</span>
              </div>
              <span class="text-sm tabular-nums font-medium shrink-0 ml-3">
                {{ formatEuro(tx.amount) }}
              </span>
            </div>
          </div>
        </template>
      </div>
    </template>
  </USlideover>
</template>
