<script setup lang="ts">
import type { RecurringEntry, EntryType } from '~/types'
import { initBudgetDeleteModal } from './init'

const props = defineProps<{
  type: EntryType
  entry?: RecurringEntry
}>()

const emit = defineEmits<{
  deleted: []
}>()

const open = defineModel<boolean>('open', { default: false })

const { onConfirm } = initBudgetDeleteModal({ props, emit, open })
</script>

<template>
  <UModal
    v-model:open="open"
    title="Supprimer l'entrée"
    :description="`Êtes-vous sûr de vouloir supprimer '${entry?.label}' ?`"
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
