<script setup lang="ts">
import { initBudgetEnvelopeExpenseCell } from './init'

const props = defineProps<{
  plannedAmount: number
  actualAmount: number | null
  entryId: number
  year: number
  month: number
  entryLabel: string
}>()

const emit = defineEmits<{
  updated: []
}>()

const {
  modalOpen,
  hasExpenses,
  percentage,
  isOverBudget,
  openModal,
  onModalUpdated
} = initBudgetEnvelopeExpenseCell({ props, emit })
</script>

<template>
  <div class="min-w-24 px-2 py-1">
    <div class="flex items-center gap-1.5 cursor-pointer" @click="openModal">
      <span
        class="text-sm tabular-nums"
        :class="[
          !hasExpenses ? 'text-muted' :
          isOverBudget ? 'font-bold text-error' : 'font-bold text-success'
        ]"
      >
        {{ formatEuro(actualAmount ?? 0) }}
      </span>

      <UBadge
        v-if="hasExpenses"
        :color="isOverBudget ? 'error' : 'success'"
        variant="subtle"
        size="xs"
      >
        {{ percentage }}%
      </UBadge>

      <UButton
        icon="i-lucide-plus"
        size="xs"
        color="neutral"
        variant="ghost"
        class="ml-auto"
        @click.stop="openModal"
      />
    </div>

    <!-- Expense Modal -->
    <BudgetEnvelopeExpenseModal
      v-model:open="modalOpen"
      :entry-id="entryId"
      :entry-label="entryLabel"
      :planned-amount="plannedAmount"
      :year="year"
      :month="month"
      @updated="onModalUpdated"
    />
  </div>
</template>
