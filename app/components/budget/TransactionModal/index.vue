<script setup lang="ts">
import type { Transaction } from '~/types'
import { initTransactionModal } from './init'

const props = defineProps<{
  transaction?: Transaction | null
}>()

const emit = defineEmits<{
  saved: []
}>()

const open = defineModel<boolean>('open', { default: false })

const { schema, state, isEdit, modalTitle, categoryOptions, existingLabels, onSubmit } = initTransactionModal({ props, emit, open })

const typeOptions = [
  { label: 'Dépense', value: 'expense' },
  { label: 'Revenu', value: 'income' }
]

const NONE_LABEL = 'Non catégorisé'

const categoryLabels = computed(() => {
  const labels: string[] = [NONE_LABEL]
  for (const opt of categoryOptions.value) {
    labels.push(`${opt.group} — ${opt.label}`)
  }
  return labels
})

const selectedCategoryLabel = computed({
  get: () => {
    if (!state.recurringEntryId) return NONE_LABEL
    const opt = categoryOptions.value.find(o => o.value === state.recurringEntryId)
    return opt ? `${opt.group} — ${opt.label}` : NONE_LABEL
  },
  set: (label: string) => {
    if (label === NONE_LABEL) {
      state.recurringEntryId = null
      return
    }
    const opt = categoryOptions.value.find(o => `${o.group} — ${o.label}` === label)
    if (opt) {
      state.recurringEntryId = opt.value
    }
  }
})
</script>

<template>
  <UModal
    v-model:open="open"
    :title="modalTitle"
    :description="isEdit ? 'Modifier les informations de la transaction' : 'Ajouter une nouvelle transaction'"
  >
    <slot />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Libellé" name="label">
          <UInputMenu
            v-model="state.label"
            :items="existingLabels"
            placeholder="Ex: Courses Carrefour..."
            class="w-full"
          />
        </UFormField>

        <UFormField label="Montant" name="amount">
          <UInput
            v-model="state.amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Type" name="type">
          <USelect
            v-model="(state.type as string)"
            :items="typeOptions"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Date" name="date">
          <UInput
            v-model="state.date"
            type="date"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Catégorie" name="recurringEntryId">
          <USelectMenu
            v-model="selectedCategoryLabel"
            :items="categoryLabels"
            placeholder="Non catégorisé"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Notes" name="notes">
          <UTextarea v-model="state.notes" placeholder="Notes optionnelles..." class="w-full" />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton
            label="Annuler"
            color="neutral"
            variant="subtle"
            @click="open = false"
          />
          <UButton
            :label="isEdit ? 'Enregistrer' : 'Créer'"
            color="primary"
            variant="solid"
            type="submit"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
