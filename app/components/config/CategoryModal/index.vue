<script setup lang="ts">
import type { Category } from '~/types'
import { initCategoryModal, ICON_PRESETS, COLOR_PRESETS } from './init'

const props = defineProps<{
  category?: Category | null
}>()

const emit = defineEmits<{
  saved: []
}>()

const open = defineModel<boolean>('open', { default: false })

const { schema, state, isEdit, modalTitle, onSubmit } = initCategoryModal({ props, emit, open })

const typeOptions = [
  { label: 'Dépense', value: 'expense' },
  { label: 'Revenu', value: 'income' }
]
</script>

<template>
  <UModal
    v-model:open="open"
    :title="modalTitle"
    :description="isEdit ? 'Modifier la catégorie' : 'Créer une nouvelle catégorie'"
  >
    <slot />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Nom" name="name">
          <UInput v-model="state.name" placeholder="Ex: Courses, Salaire…" class="w-full" />
        </UFormField>

        <UFormField label="Type" name="type">
          <USelect v-model="state.type" :items="typeOptions" class="w-full" />
        </UFormField>

        <UFormField label="Couleur" name="color">
          <div class="flex items-center gap-2 flex-wrap">
            <button
              v-for="c in COLOR_PRESETS"
              :key="c"
              type="button"
              class="rounded-full transition"
              :style="{
                width: '24px',
                height: '24px',
                background: c,
                border: state.color === c ? '2px solid var(--fg)' : '2px solid transparent',
                cursor: 'pointer'
              }"
              :title="c"
              @click="state.color = c"
            />
            <UInput
              v-model="state.color"
              placeholder="#1FB578"
              class="w-32"
              size="sm"
            />
          </div>
        </UFormField>

        <UFormField label="Icône" name="icon">
          <div class="grid grid-cols-8 gap-1.5 max-h-32 overflow-y-auto p-1">
            <button
              v-for="i in ICON_PRESETS"
              :key="i"
              type="button"
              class="grid place-items-center rounded-md transition cursor-pointer"
              :style="{
                width: '32px',
                height: '32px',
                color: state.icon === i ? state.color : 'var(--fg-muted)',
                background: state.icon === i ? `${state.color}14` : 'transparent',
                border: state.icon === i ? `1px solid ${state.color}40` : '1px solid var(--border)'
              }"
              @click="state.icon = i"
            >
              <UIcon :name="i" class="size-4" />
            </button>
          </div>
        </UFormField>

        <UFormField label="Ordre d'affichage" name="sortOrder" hint="Plus petit = plus haut dans la liste">
          <UInput
            v-model="state.sortOrder"
            type="number"
            :min="0"
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
