<script setup lang="ts">
import type { RecurringEntry, EntryType } from '~/types'

const props = defineProps<{
  type: EntryType
  entry?: RecurringEntry
}>()

const emit = defineEmits<{
  deleted: []
}>()

const open = defineModel<boolean>('open', { default: false })

const toast = useToast()

async function onConfirm() {
  if (!props.entry) return

  try {
    await $fetch(`/api/budget/${props.type}s/${props.entry.id}`, {
      method: 'DELETE'
    })
    toast.add({
      title: 'Succes',
      description: `L'entree "${props.entry.label}" a ete supprimee`,
      color: 'success'
    })
    open.value = false
    emit('deleted')
  } catch {
    toast.add({
      title: 'Erreur',
      description: 'Une erreur est survenue lors de la suppression',
      color: 'error'
    })
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Supprimer l'entree"
    :description="`Etes-vous sur de vouloir supprimer '${entry?.label}' ?`"
  >
    <template #body>
      <div class="flex justify-end gap-2">
        <UButton
          label="Annuler"
          color="neutral"
          variant="subtle"
          @click="open = false"
        />
        <UButton
          label="Supprimer"
          color="error"
          variant="solid"
          loading-auto
          @click="onConfirm"
        />
      </div>
    </template>
  </UModal>
</template>
