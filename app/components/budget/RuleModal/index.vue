<script setup lang="ts">
import type { BudgetRule } from '~/types'
import { initBudgetRuleModal } from './init'

const props = defineProps<{
  rule?: BudgetRule | null
}>()

const emit = defineEmits<{
  saved: []
}>()

const open = defineModel<boolean>('open', { default: false })

const { schema, state, isEdit, modalTitle, typeOptions, categoryOptions, envelopeOptions, onSubmit } = initBudgetRuleModal({ props, emit, open })
</script>

<template>
  <UModal
    v-model:open="open"
    :title="modalTitle"
    :description="isEdit ? 'Modifier les paramètres de la règle' : 'Configurer une nouvelle règle d\'alerte'"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Libellé" name="label">
          <UInput v-model="state.label" placeholder="Ex: Alerte reste à vivre..." class="w-full" />
        </UFormField>

        <UFormField label="Type de règle" name="type">
          <USelect
            v-model="state.type"
            :items="typeOptions"
            class="w-full"
          />
        </UFormField>

        <UFormField v-if="state.type === 'remaining_low' || state.type === 'category_threshold'" label="Seuil (€)" name="threshold">
          <UInput
            v-model="state.threshold"
            type="number"
            step="1"
            placeholder="500"
            class="w-full"
          />
        </UFormField>

        <UFormField v-if="state.type === 'category_threshold'" label="Catégorie" name="category">
          <USelect
            v-model="state.category"
            :items="categoryOptions"
            placeholder="Choisir une catégorie"
            class="w-full"
          />
        </UFormField>

        <UFormField v-if="state.type === 'envelope_exceeded'" label="Enveloppe" name="envelopeId">
          <USelect
            v-model="state.envelopeId"
            :items="envelopeOptions"
            placeholder="Choisir une enveloppe"
            class="w-full"
          />
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
