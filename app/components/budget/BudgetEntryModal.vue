<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { RecurringEntry, EntryType } from '~/types'

const props = defineProps<{
  type: EntryType
  entry?: RecurringEntry
}>()

const emit = defineEmits<{
  saved: []
}>()

const open = defineModel<boolean>('open', { default: false })

const toast = useToast()

const schema = z.object({
  label: z.string().min(2, 'Minimum 2 caracteres'),
  amount: z.coerce.number().positive('Le montant doit etre positif'),
  category: z.string().min(1, 'Categorie requise'),
  dayOfMonth: z.coerce.number().int().min(1, 'Minimum 1').max(31, 'Maximum 31'),
  active: z.boolean().default(true),
  notes: z.string().nullable().optional()
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  label: '',
  amount: undefined,
  category: '',
  dayOfMonth: 1,
  active: true,
  notes: ''
})

const isEdit = computed(() => !!props.entry)

const modalTitle = computed(() => {
  if (isEdit.value) {
    return props.type === 'income' ? 'Modifier le revenu' : 'Modifier la depense'
  }
  return props.type === 'income' ? 'Nouveau revenu' : 'Nouvelle depense'
})

const categories = computed(() => {
  const items = props.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  return items.map(c => ({ label: c, value: c as string }))
})

watch(() => props.entry, (entry) => {
  if (entry) {
    state.label = entry.label
    state.amount = entry.amount
    state.category = entry.category
    state.dayOfMonth = entry.dayOfMonth
    state.active = entry.active
    state.notes = entry.notes || ''
  } else {
    state.label = ''
    state.amount = undefined
    state.category = ''
    state.dayOfMonth = 1
    state.active = true
    state.notes = ''
  }
}, { immediate: true })

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    if (isEdit.value && props.entry) {
      await $fetch(`/api/budget/${props.type}s/${props.entry.id}`, {
        method: 'PUT',
        body: event.data
      })
      toast.add({
        title: 'Succes',
        description: `L'entree "${event.data.label}" a ete modifiee`,
        color: 'success'
      })
    } else {
      await $fetch(`/api/budget/${props.type}s`, {
        method: 'POST',
        body: event.data
      })
      toast.add({
        title: 'Succes',
        description: `L'entree "${event.data.label}" a ete ajoutee`,
        color: 'success'
      })
    }
    open.value = false
    emit('saved')
  } catch {
    toast.add({
      title: 'Erreur',
      description: 'Une erreur est survenue',
      color: 'error'
    })
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="modalTitle"
    :description="isEdit ? 'Modifier les informations de l\'entree' : 'Ajouter une nouvelle entree recurrente'"
  >
    <slot>
      <UButton
        v-if="!entry"
        :label="type === 'income' ? 'Ajouter un revenu' : 'Ajouter une depense'"
        icon="i-lucide-plus"
      />
    </slot>

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Libelle" name="label">
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

        <UFormField label="Categorie" name="category">
          <USelect
            v-model="state.category"
            :items="categories"
            placeholder="Choisir une categorie"
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
            :label="isEdit ? 'Enregistrer' : 'Creer'"
            color="primary"
            variant="solid"
            type="submit"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
