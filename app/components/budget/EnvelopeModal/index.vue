<script setup lang="ts">
import type { RecurringEntry } from '~/types'
import { initBudgetEnvelopeModal } from './init'

const props = defineProps<{
  entry?: RecurringEntry
}>()

const emit = defineEmits<{
  saved: []
}>()

const open = defineModel<boolean>('open', { default: false })

const { schema, state, isEdit, modalTitle, onSubmit } = initBudgetEnvelopeModal({ props, emit, open })
</script>

<template>
  <UModal
    v-model:open="open"
    :title="modalTitle"
    :description="isEdit ? 'Modifier les informations de l\'enveloppe' : 'Ajouter une nouvelle enveloppe budgétaire'"
  >
    <slot>
      <div class="flex justify-end">
        <UButton
          v-if="!entry"
          label="Ajouter une enveloppe"
          icon="i-lucide-plus"
        />
      </div>
    </slot>

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Libellé" name="label">
          <UInput v-model="state.label" placeholder="Ex: Courses, Sorties..." class="w-full" />
        </UFormField>

        <UFormField label="Montant mensuel" name="amount">
          <UInput
            v-model="state.amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Actif" name="active">
          <USwitch v-model="state.active" />
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
