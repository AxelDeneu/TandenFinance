<script setup lang="ts">
import { initBudgetForecastCell } from './init'

const props = defineProps<{
  plannedAmount: number
  actualAmount: number | null
  entryId: number
  year: number
  month: number
}>()

const emit = defineEmits<{
  saved: []
  cleared: []
}>()

const {
  editing,
  inputValue,
  saving,
  hasActual,
  effectiveAmount,
  variance,
  startEditing,
  save,
  clear,
  onKeydown
} = initBudgetForecastCell({ props, emit: emit as (event: 'saved' | 'cleared') => void })
</script>

<template>
  <div
    class="relative group min-w-24 px-2 py-1"
    :class="[
      hasActual
        ? variance! <= 0
          ? 'border-l-2 border-success'
          : 'border-l-2 border-error'
        : ''
    ]"
  >
    <template v-if="editing">
      <div class="flex items-center gap-1">
        <input
          v-model="inputValue"
          type="number"
          step="0.01"
          class="w-20 px-1 py-0.5 text-sm border border-default rounded bg-default text-highlighted tabular-nums"
          :disabled="saving"
          @keydown="onKeydown"
          @blur="save"
        >
      </div>
    </template>

    <template v-else>
      <div class="flex items-center gap-1 cursor-pointer" @click="startEditing">
        <span
          class="text-sm tabular-nums"
          :class="[
            hasActual
              ? variance! <= 0
                ? 'font-bold text-success'
                : 'font-bold text-error'
              : 'text-muted'
          ]"
        >
          {{ formatEuro(effectiveAmount) }}
        </span>

        <UButton
          v-if="hasActual"
          icon="i-lucide-x"
          size="xs"
          color="neutral"
          variant="ghost"
          class="opacity-0 group-hover:opacity-100 transition-opacity"
          @click.stop="clear"
        />
      </div>

      <div v-if="hasActual && actualAmount !== plannedAmount" class="text-xs text-muted">
        Prévu : {{ formatEuro(plannedAmount) }}
      </div>
    </template>
  </div>
</template>
