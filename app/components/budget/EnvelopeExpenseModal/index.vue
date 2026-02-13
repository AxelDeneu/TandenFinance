<script setup lang="ts">
import { initBudgetEnvelopeExpenseModal } from './init'

const props = defineProps<{
  entryId: number
  entryLabel: string
  plannedAmount: number
  year: number
  month: number
}>()

const emit = defineEmits<{
  updated: []
}>()

const open = defineModel<boolean>('open', { default: false })

const {
  expenses,
  loading,
  adding,
  newLabel,
  newAmount,
  total,
  remaining,
  addExpense,
  deleteExpense
} = initBudgetEnvelopeExpenseModal({ props, emit, open })
</script>

<template>
  <UModal
    v-model:open="open"
    :title="`Dépenses — ${entryLabel}`"
    :description="`Budget : ${formatEuro(plannedAmount)}`"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <!-- Summary bar -->
        <div class="flex justify-between items-center px-3 py-2 bg-elevated/25 rounded-lg">
          <div class="text-sm">
            <span class="font-semibold">{{ formatEuro(total) }}</span>
            <span class="text-muted"> / {{ formatEuro(plannedAmount) }}</span>
          </div>
          <UBadge
            :color="remaining >= 0 ? 'success' : 'error'"
            variant="subtle"
          >
            Reste : {{ formatEuro(remaining) }}
          </UBadge>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-6">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-xl text-muted" />
        </div>

        <!-- Expense list -->
        <div v-else class="flex flex-col gap-1 max-h-64 overflow-y-auto">
          <div v-if="expenses.length === 0" class="text-center text-muted py-4 text-sm">
            Aucune dépense enregistrée
          </div>

          <div
            v-for="expense in expenses"
            :key="expense.id"
            class="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-elevated/25 group"
          >
            <span class="text-sm">{{ expense.label }}</span>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium tabular-nums">{{ formatEuro(expense.amount) }}</span>
              <UButton
                icon="i-lucide-trash-2"
                size="xs"
                color="error"
                variant="ghost"
                class="opacity-0 group-hover:opacity-100 transition-opacity"
                @click="deleteExpense(expense.id)"
              />
            </div>
          </div>
        </div>

        <!-- Add form -->
        <div class="flex items-end gap-2 border-t border-default pt-3">
          <div class="flex-1">
            <label class="text-xs text-muted mb-1 block">Libellé</label>
            <UInput
              v-model="newLabel"
              placeholder="Ex: Carrefour"
              size="sm"
              class="w-full"
              @keydown.enter="addExpense"
            />
          </div>
          <div class="w-28">
            <label class="text-xs text-muted mb-1 block">Montant</label>
            <UInput
              v-model="newAmount"
              type="number"
              step="0.01"
              placeholder="0.00"
              size="sm"
              class="w-full"
              @keydown.enter="addExpense"
            />
          </div>
          <UButton
            icon="i-lucide-plus"
            size="sm"
            color="primary"
            :loading="adding"
            @click="addExpense"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
