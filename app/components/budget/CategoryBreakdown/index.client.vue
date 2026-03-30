<script setup lang="ts">
import { initCategoryBreakdown } from './init'

const {
  selectedType,
  breakdown,
  total,
  status
} = initCategoryBreakdown()

const typeOptions = [
  { label: 'Dépenses', value: 'expenses' },
  { label: 'Revenus', value: 'incomes' }
]
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-end">
        <USelect
          v-model="selectedType"
          :items="typeOptions"
          size="xs"
          class="w-32"
        />
      </div>
    </template>

    <div v-if="status === 'pending'" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-muted" />
    </div>

    <template v-else>
      <div v-if="breakdown.length === 0" class="text-center text-muted py-8">
        Aucune donnée pour ce mois.
      </div>

      <div v-else class="space-y-3">
        <!-- Total -->
        <div class="flex items-center justify-between pb-2 border-b border-default">
          <span class="text-sm font-medium text-highlighted">Total</span>
          <span class="text-sm font-semibold tabular-nums">{{ formatEuro(total) }}</span>
        </div>

        <!-- Category bars -->
        <div v-for="item in breakdown" :key="item.category" class="space-y-1">
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span class="inline-block size-2.5 rounded-full shrink-0" :style="{ backgroundColor: item.color }" />
              <span class="text-highlighted">{{ item.category }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="tabular-nums font-medium">{{ formatEuro(item.amount) }}</span>
              <span class="tabular-nums text-xs text-muted w-12 text-right">{{ item.percent }}%</span>
            </div>
          </div>
          <div class="w-full bg-elevated rounded-full h-1.5">
            <div
              class="h-1.5 rounded-full transition-all duration-300"
              :style="{ width: `${item.percent}%`, backgroundColor: item.color }"
            />
          </div>
        </div>
      </div>
    </template>
  </UCard>
</template>
