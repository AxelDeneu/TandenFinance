<script setup lang="ts">
import { initImportModal } from './init'

const emit = defineEmits<{
  imported: []
}>()

const open = defineModel<boolean>('open', { default: false })

const {
  step,
  loading,
  rows,
  includedRows,
  totalIncome,
  totalExpense,
  onFileSelected,
  onDrop,
  goToSummary,
  goBackToPreview,
  confirmImport,
  confidenceBadge
} = initImportModal({ emit, open })

const typeOptions = [
  { label: 'Dépense', value: 'expense' },
  { label: 'Revenu', value: 'income' }
]

const stepTitle = computed(() => {
  if (step.value === 1) return 'Importer un CSV'
  if (step.value === 2) return 'Vérifier les transactions'
  return 'Confirmer l\'import'
})
</script>

<template>
  <UModal
    v-model:open="open"
    :title="stepTitle"
    :ui="{ content: step === 2 ? 'sm:max-w-4xl' : 'sm:max-w-lg' }"
  >
    <template #body>
      <!-- Step 1: File upload -->
      <div v-if="step === 1" class="space-y-4">
        <div
          class="border-2 border-dashed border-default rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
          @dragover.prevent
          @drop="onDrop"
        >
          <UIcon name="i-lucide-upload" class="text-4xl text-muted mb-3" />
          <p class="text-sm text-muted mb-3">
            Glissez-déposez un fichier CSV ou
          </p>
          <label class="cursor-pointer">
            <UButton
              label="Choisir un fichier"
              color="primary"
              variant="soft"
              :loading="loading"
              as="span"
            />
            <input
              type="file"
              accept=".csv"
              class="hidden"
              @change="onFileSelected"
            >
          </label>
          <p class="text-xs text-dimmed mt-3">
            Formats supportés : CSV avec colonnes date, libellé, montant (ou débit/crédit)
          </p>
        </div>
      </div>

      <!-- Step 2: Preview table -->
      <div v-if="step === 2" class="space-y-4">
        <p class="text-sm text-muted">
          {{ rows.length }} ligne(s) détectée(s). Vérifiez et ajustez avant import.
        </p>

        <div class="max-h-96 overflow-y-auto border border-default rounded-lg">
          <table class="w-full text-sm">
            <thead class="bg-elevated/50 sticky top-0">
              <tr>
                <th class="p-2 text-left w-10" />
                <th class="p-2 text-left">
                  Date
                </th>
                <th class="p-2 text-left">
                  Libellé CSV
                </th>
                <th class="p-2 text-left">
                  Libellé final
                </th>
                <th class="p-2 text-left">
                  Montant
                </th>
                <th class="p-2 text-left">
                  Type
                </th>
                <th class="p-2 text-left">
                  Match
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in rows"
                :key="i"
                class="border-t border-default"
                :class="{ 'opacity-40': !row.included }"
              >
                <td class="p-2">
                  <UCheckbox v-model="row.included" />
                </td>
                <td class="p-2 tabular-nums text-muted">
                  {{ row.date }}
                </td>
                <td class="p-2 text-dimmed text-xs truncate max-w-32">
                  {{ row.rawLabel }}
                </td>
                <td class="p-2">
                  <UInput v-model="row.editedLabel" size="xs" class="w-full min-w-32" />
                </td>
                <td class="p-2 tabular-nums font-medium">
                  {{ formatEuro(row.amount) }}
                </td>
                <td class="p-2">
                  <USelect
                    v-model="row.editedType"
                    :items="typeOptions"
                    size="xs"
                    class="w-24"
                  />
                </td>
                <td class="p-2">
                  <UBadge
                    :color="confidenceBadge(row.suggestedMatch?.confidence).color"
                    variant="subtle"
                    size="xs"
                  >
                    {{ confidenceBadge(row.suggestedMatch?.confidence).label }}
                  </UBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-end gap-2">
          <UButton
            label="Annuler"
            color="neutral"
            variant="subtle"
            @click="open = false"
          />
          <UButton
            :label="`Continuer (${includedRows.length} lignes)`"
            color="primary"
            :disabled="includedRows.length === 0"
            @click="goToSummary"
          />
        </div>
      </div>

      <!-- Step 3: Summary -->
      <div v-if="step === 3" class="space-y-4">
        <div class="grid grid-cols-3 gap-4">
          <UCard variant="subtle">
            <p class="text-xs text-muted uppercase">
              Transactions
            </p>
            <p class="text-2xl font-semibold text-highlighted">
              {{ includedRows.length }}
            </p>
          </UCard>
          <UCard variant="subtle">
            <p class="text-xs text-muted uppercase">
              Total revenus
            </p>
            <p class="text-2xl font-semibold text-success">
              {{ formatEuro(totalIncome) }}
            </p>
          </UCard>
          <UCard variant="subtle">
            <p class="text-xs text-muted uppercase">
              Total dépenses
            </p>
            <p class="text-2xl font-semibold text-error">
              {{ formatEuro(totalExpense) }}
            </p>
          </UCard>
        </div>

        <div class="flex justify-end gap-2">
          <UButton
            label="Retour"
            color="neutral"
            variant="subtle"
            @click="goBackToPreview"
          />
          <UButton
            label="Confirmer l'import"
            color="primary"
            icon="i-lucide-check"
            :loading="loading"
            @click="confirmImport"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
