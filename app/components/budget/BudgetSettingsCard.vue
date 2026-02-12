<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { BudgetSettings } from '~/types'

const toast = useToast()

const schema = z.object({
  salaryReferenceDay: z.coerce.number().int().min(1, 'Minimum 1').max(31, 'Maximum 31')
})

type Schema = z.output<typeof schema>

const { data: settings } = await useFetch<BudgetSettings>('/api/budget/settings', {
  lazy: true,
  default: () => ({ salaryReferenceDay: 25 })
})

const state = reactive<Partial<Schema>>({
  salaryReferenceDay: 25
})

watch(settings, (val) => {
  if (val) {
    state.salaryReferenceDay = val.salaryReferenceDay
  }
}, { immediate: true })

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    await $fetch('/api/budget/settings', {
      method: 'PUT',
      body: event.data
    })
    toast.add({
      title: 'Succes',
      description: 'Les parametres ont ete enregistres',
      color: 'success'
    })
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
  <UPageCard
    title="Parametres du budget"
    description="Configurez les parametres generaux de votre budget familial."
  >
    <UForm
      :schema="schema"
      :state="state"
      class="space-y-4 max-w-md"
      @submit="onSubmit"
    >
      <UFormField
        label="Jour de reference du salaire"
        name="salaryReferenceDay"
        description="Le jour du mois ou le salaire est verse (1-31)"
      >
        <UInput
          v-model="state.salaryReferenceDay"
          type="number"
          :min="1"
          :max="31"
          placeholder="25"
          class="w-full"
        />
      </UFormField>

      <div class="flex justify-start">
        <UButton
          label="Enregistrer"
          color="primary"
          variant="solid"
          type="submit"
        />
      </div>
    </UForm>
  </UPageCard>
</template>
