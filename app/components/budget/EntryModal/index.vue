<script setup lang="ts">
import type { RecurringEntry, EntryType } from '~/types'
import { initBudgetEntryModal } from './init'

const props = defineProps<{
  type: EntryType
  entry?: RecurringEntry
}>()

const emit = defineEmits<{
  saved: []
}>()

const open = defineModel<boolean>('open', { default: false })

const { schema, state, isEdit, modalTitle, categories, onSubmit } = initBudgetEntryModal({ props, emit, open })
</script>

<template>
  <UModal
    v-model:open="open"
    :title="modalTitle"
    :description="isEdit ? 'Modifier les informations de l\'entrée' : 'Ajouter une nouvelle entrée récurrente'"
  >
    <slot>
      <div class="flex justify-end">
        <UButton
          v-if="!entry"
          :label="type === 'income' ? 'Ajouter un revenu' : 'Ajouter une dépense'"
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
          <UInput v-model="state.label" placeholder="Ex: Loyer, Salaire..." class="w-full" />
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

        <UFormField label="Catégorie" name="categoryId">
          <USelect
            v-model="state.categoryId"
            :items="categories"
            placeholder="Choisir une catégorie"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Jour du mois" name="dayOfMonth">
          <UInput
            v-model="state.dayOfMonth"
            type="number"
            :min="1"
            :max="31"
            placeholder="1"
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
