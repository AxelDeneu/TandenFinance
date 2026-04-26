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

const {
  state,
  isEdit,
  modalTitle,
  filteredCategoryOptions,
  existingLabels,
  onSubmit
} = initTransactionModal({ props, emit, open })

// ============== UI state (UX layer on top of state) ==============

const QUICK_AMOUNTS = [5, 10, 20, 50, 100]

// keyword → recurringEntry label hint (used to auto-detect category)
const CATEGORY_HINTS: Record<string, string[]> = {
  Courses: ['carrefour', 'monoprix', 'auchan', 'leclerc', 'intermarché', 'lidl', 'bio', 'marché', 'franprix', 'casino', 'picard'],
  Transport: ['total', 'essence', 'sncf', 'uber', 'metro', 'ratp', 'parking', 'peage', 'blablacar', 'garage', 'tesla'],
  Loisirs: ['cinema', 'pathe', 'ugc', 'netflix', 'concert', 'musee', 'livre', 'fnac', 'steam', 'spotify'],
  Salaire: ['salaire', 'paie', 'aden', 'climber', 'prime', 'bonus', 'remboursement'],
  Énergie: ['edf', 'engie', 'gaz', 'electricite', 'eau', 'veolia'],
  Restaurant: ['restaurant', 'resto', 'boulangerie', 'starbucks', 'mcdonald', 'burger', 'sushi', 'paul', 'pizza', 'brasserie', 'bar', 'cafe'],
  Restaurants: ['restaurant', 'resto', 'boulangerie', 'starbucks', 'mcdonald', 'burger', 'sushi', 'paul', 'pizza', 'brasserie', 'bar', 'cafe'],
  Abonnements: ['netflix', 'spotify', 'disney', 'apple', 'amazon prime', 'canal', 'molotov', 'adobe', 'figma', 'github', 'icloud', 'free', 'sfr', 'orange', 'bouygues'],
  Logement: ['loyer', 'copropriete', 'syndic', 'ikea', 'leroy', 'castorama', 'bricorama', 'meuble'],
  Loyer: ['loyer', 'copropriete', 'syndic'],
  Santé: ['pharmacie', 'medecin', 'dentiste', 'optique', 'mutuelle', 'hopital', 'kine', 'laboratoire', 'doctolib'],
  Cadeaux: ['cadeau', 'anniversaire', 'noel', 'fleurs', 'bijou']
}

function detectCategoryFromLabel(label: string): string | null {
  if (!label) return null
  const l = label.toLowerCase()
  for (const [cat, words] of Object.entries(CATEGORY_HINTS)) {
    if (words.some(w => l.includes(w))) return cat
  }
  return null
}

const amountStr = ref('')
const showNotes = ref(false)
const categoryAuto = ref(true)
const dateMode = ref<'yesterday' | 'today' | 'custom'>('today')

// initialise UI state from existing transaction (edit mode)
watch(() => props.transaction, (tx) => {
  if (tx) {
    amountStr.value = tx.amount > 0 ? tx.amount.toFixed(2).replace('.', ',') : ''
    showNotes.value = !!tx.notes
    categoryAuto.value = false
    const today = new Date().toISOString().slice(0, 10)
    dateMode.value = tx.date === today ? 'today' : 'custom'
  } else {
    amountStr.value = ''
    showNotes.value = false
    categoryAuto.value = true
    dateMode.value = 'today'
  }
}, { immediate: true })

// keep state.amount in sync with the keypad input
watch(amountStr, (v) => {
  const num = parseFloat(v.replace(',', '.'))
  state.amount = Number.isFinite(num) ? num : undefined
})

// auto-detect category from label
watch(() => state.label, (label) => {
  if (!categoryAuto.value || !label) return
  const detected = detectCategoryFromLabel(label)
  if (!detected) return
  const match = filteredCategoryOptions.value.find(o => o.label.toLowerCase().includes(detected.toLowerCase()))
  if (match) state.recurringEntryId = match.value
})

// derived
const numAmount = computed(() => parseFloat(amountStr.value.replace(',', '.')) || 0)
const valid = computed(() => numAmount.value > 0 && (state.label?.trim().length ?? 0) > 0)

const categoriesForType = computed(() => filteredCategoryOptions.value.slice(0, 10))
const currentCategory = computed(() => {
  return filteredCategoryOptions.value.find(o => o.value === state.recurringEntryId) ?? null
})

const detectedCategory = computed(() => {
  if (!state.label || !categoryAuto.value) return null
  return detectCategoryFromLabel(state.label)
})

const categoryColor = computed(() => {
  if (currentCategory.value) {
    return getCategoryStyle(currentCategory.value.label).color
  }
  if (detectedCategory.value) return getCategoryStyle(detectedCategory.value).color
  return '#6B7489'
})

const categoryIcon = computed(() => {
  if (currentCategory.value) return getCategoryStyle(currentCategory.value.label).icon
  if (detectedCategory.value) return getCategoryStyle(detectedCategory.value).icon
  return 'i-lucide-tag'
})

const previewLabel = computed(() => state.label?.trim() || (state.type === 'income' ? 'Nouveau revenu' : 'Nouvelle dépense'))
const previewMeta = computed(() => {
  const cat = currentCategory.value?.label ?? 'Non catégorisé'
  const dateLabel = dateMode.value === 'today' ? 'Aujourd\'hui' : dateMode.value === 'yesterday' ? 'Hier' : new Date(state.date ?? '').toLocaleDateString('fr-FR')
  return `${cat} · ${dateLabel}`
})

const recents = computed(() => {
  return (existingLabels.value ?? []).slice(0, 4).map((label) => {
    return {
      label,
      cat: detectCategoryFromLabel(label),
      style: getCategoryStyle(detectCategoryFromLabel(label) ?? null)
    }
  })
})

// ============== Actions ==============

function setQuickAmount(v: number) {
  amountStr.value = v.toFixed(2).replace('.', ',')
}

function pressKey(k: string) {
  if (k === '⌫') {
    amountStr.value = amountStr.value.slice(0, -1)
    return
  }
  if (k === ',') {
    if (amountStr.value.includes(',')) return
    amountStr.value = amountStr.value === '' ? '0,' : amountStr.value + ','
    return
  }
  // digits
  let next = amountStr.value + k
  // limit to 2 decimals
  const parts = next.split(',')
  if (parts.length === 2 && (parts[1]?.length ?? 0) > 2) {
    next = parts[0] + ',' + parts[1]!.slice(0, 2)
  }
  amountStr.value = next
}

function pickRecent(label: string) {
  state.label = label
  categoryAuto.value = true
}

function pickCategory(value: number) {
  state.recurringEntryId = value
  categoryAuto.value = false
}

function setType(t: 'expense' | 'income') {
  state.type = t
}

function setDateMode(mode: 'yesterday' | 'today' | 'custom') {
  dateMode.value = mode
  if (mode === 'today') {
    state.date = new Date().toISOString().slice(0, 10)
  } else if (mode === 'yesterday') {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    state.date = d.toISOString().slice(0, 10)
  }
}

const customDate = ref(state.date)
watch(() => state.date, v => customDate.value = v)
function commitCustomDate(value: string) {
  state.date = value
  dateMode.value = 'custom'
}

async function save() {
  if (!valid.value) return
  // recurringEntry sets the type via the watch in init; just submit
  await onSubmit({
    data: {
      label: state.label!,
      amount: numAmount.value,
      type: state.type ?? 'expense',
      date: state.date!,
      recurringEntryId: state.recurringEntryId ?? null,
      notes: state.notes ?? null
    },
    valid: true
  } as unknown as Parameters<typeof onSubmit>[0])
}

function onKeydown(e: KeyboardEvent) {
  if (!open.value) return
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    save()
  }
  if (e.key === 'Escape') {
    open.value = false
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <UModal
    v-model:open="open"
    :title="modalTitle"
    :description="isEdit ? 'Modifier la transaction.' : 'Ajouter une nouvelle transaction.'"
    :ui="{
      content: 'tf-tx-modal',
      header: 'hidden',
      body: 'p-0 contents'
    }"
  >
    <slot />

    <template #content>
      <div class="tf-tx-modal" @click.stop>
        <!-- ============ LEFT: keypad + amount ============ -->
        <div class="tf-tx-left">
          <div class="tf-tx-type-switch">
            <button
              type="button"
              :class="state.type === 'expense' ? 'active' : ''"
              @click="setType('expense')"
            >
              <UIcon name="i-lucide-trending-down" class="size-3.5" />
              Dépense
            </button>
            <button
              type="button"
              :class="state.type === 'income' ? 'active income' : ''"
              @click="setType('income')"
            >
              <UIcon name="i-lucide-trending-up" class="size-3.5" />
              Revenu
            </button>
          </div>

          <div class="tf-tx-amount-display">
            <div class="tf-tx-sign">
              {{ state.type === 'income' ? '+' : '−' }}
            </div>
            <div class="tf-tx-amount-num">
              <span v-if="amountStr">{{ amountStr }}</span>
              <span v-else class="ph">0,00</span>
            </div>
            <div class="tf-currency">
              €
            </div>
          </div>

          <div class="tf-tx-quick-amounts">
            <button
              v-for="q in QUICK_AMOUNTS"
              :key="q"
              type="button"
              @click="setQuickAmount(q)"
            >
              {{ q }} €
            </button>
          </div>

          <div class="tf-keypad">
            <button
              v-for="k in ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫']"
              :key="k"
              type="button"
              :class="k === '⌫' ? 'back' : ''"
              @click="pressKey(k)"
            >
              <UIcon v-if="k === '⌫'" name="i-lucide-delete" class="size-4" />
              <template v-else>
                {{ k }}
              </template>
            </button>
          </div>
        </div>

        <!-- ============ RIGHT: details ============ -->
        <div class="tf-tx-right">
          <button class="tf-tx-close" type="button" @click="open = false">
            <UIcon name="i-lucide-x" class="size-4" />
          </button>

          <!-- Label -->
          <div class="tf-tx-section">
            <div class="tf-tx-label">
              <span>Libellé</span>
              <span v-if="detectedCategory && categoryAuto" class="tf-tx-detected">
                <span class="dot" :style="{ background: getCategoryStyle(detectedCategory).color }" />
                détecté : {{ detectedCategory }}
              </span>
            </div>
            <div class="tf-tx-input-wrap">
              <input
                v-model="state.label"
                class="tf-tx-label-input"
                :placeholder="state.type === 'income' ? 'ex. Salaire avril, Remboursement…' : 'ex. Carrefour, Total essence…'"
                autofocus
              >
              <button
                v-if="state.label"
                class="tf-tx-clear"
                type="button"
                @click="state.label = ''"
              >
                <UIcon name="i-lucide-x" class="size-3" />
              </button>
            </div>
            <div v-if="!state.label && state.type === 'expense' && recents.length > 0" class="tf-tx-recent">
              <div class="tf-tx-recent-head">
                <UIcon name="i-lucide-history" class="size-2.5" />
                <span>Récents</span>
              </div>
              <div class="tf-tx-recent-list">
                <button
                  v-for="r in recents"
                  :key="r.label"
                  type="button"
                  class="tf-tx-recent-chip"
                  @click="pickRecent(r.label)"
                >
                  <span class="ico" :style="{ color: r.style.color, background: `${r.style.color}14`, borderColor: `${r.style.color}33` }">
                    <UIcon :name="r.style.icon" class="size-3" />
                  </span>
                  <span class="lbl">{{ r.label }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Category -->
          <div v-if="categoriesForType.length > 0" class="tf-tx-section">
            <div class="tf-tx-label">
              <span>Catégorie</span>
              <button
                v-if="!categoryAuto"
                type="button"
                class="tf-tx-mini-link"
                @click="categoryAuto = true; state.recurringEntryId = null"
              >
                <UIcon name="i-lucide-refresh-cw" class="size-2.5" />
                auto
              </button>
            </div>
            <div class="tf-tx-cat-grid">
              <button
                v-for="c in categoriesForType"
                :key="c.value ?? c.label"
                type="button"
                class="tf-tx-cat"
                :class="state.recurringEntryId === c.value ? 'active' : ''"
                :style="state.recurringEntryId === c.value ? {
                  color: getCategoryStyle(c.label).color,
                  borderColor: `${getCategoryStyle(c.label).color}60`,
                  background: `${getCategoryStyle(c.label).color}14`
                } : {}"
                @click="pickCategory(c.value!)"
              >
                <span class="cat-ico" :style="state.recurringEntryId === c.value ? {} : { color: getCategoryStyle(c.label).color }">
                  <UIcon :name="getCategoryStyle(c.label).icon" class="size-3.5" />
                </span>
                <span>{{ c.label }}</span>
              </button>
            </div>
          </div>

          <!-- Date -->
          <div class="tf-tx-section">
            <div class="tf-tx-label">
              <span>Date</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="tf-tx-segment">
                <button
                  type="button"
                  :class="dateMode === 'yesterday' ? 'active' : ''"
                  @click="setDateMode('yesterday')"
                >
                  Hier
                </button>
                <button
                  type="button"
                  :class="dateMode === 'today' ? 'active' : ''"
                  @click="setDateMode('today')"
                >
                  Aujourd'hui
                </button>
                <button
                  type="button"
                  :class="dateMode === 'custom' ? 'active' : ''"
                  @click="dateMode = 'custom'"
                >
                  <UIcon name="i-lucide-calendar" class="size-3" />
                  Autre
                </button>
              </div>
              <input
                v-if="dateMode === 'custom'"
                type="date"
                :value="state.date"
                class="tf-tx-label-input"
                style="padding: 8px 10px; font-size: 13px; max-width: 160px;"
                @input="(e) => commitCustomDate((e.target as HTMLInputElement).value)"
              >
            </div>
          </div>

          <!-- Notes -->
          <div class="tf-tx-section">
            <button
              v-if="!showNotes"
              type="button"
              class="tf-tx-add-notes"
              @click="showNotes = true"
            >
              <UIcon name="i-lucide-plus" class="size-3" />
              Ajouter une note
            </button>
            <template v-else>
              <div class="tf-tx-label">
                <span>Note</span>
              </div>
              <textarea
                v-model="state.notes"
                class="tf-tx-notes"
                rows="2"
                placeholder="Détails, contexte…"
              />
            </template>
          </div>

          <!-- Preview -->
          <div class="tf-tx-preview">
            <div class="tf-tx-preview-head">
              Aperçu
            </div>
            <div class="tf-tx-preview-row">
              <div
                class="tf-tx-preview-ico"
                :style="{ color: categoryColor, background: `${categoryColor}14`, borderColor: `${categoryColor}33` }"
              >
                <UIcon :name="categoryIcon" class="size-3.5" />
              </div>
              <div class="tf-tx-preview-body">
                <div class="tf-tx-preview-label">
                  {{ previewLabel }}
                </div>
                <div class="tf-tx-preview-meta">
                  {{ previewMeta }}
                </div>
              </div>
              <div class="tf-tx-preview-amt" :class="state.type === 'income' ? 'up' : 'down'">
                {{ state.type === 'income' ? '+' : '−' }}{{ numAmount.toFixed(2).replace('.', ',') }} €
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="tf-tx-foot">
            <span class="tf-tx-foot-hint">
              <span class="kb">⌘</span>
              <span class="kb">↵</span>
              pour enregistrer
              <span style="margin: 0 8px; opacity: 0.4;">·</span>
              <span class="kb">esc</span>
              annuler
            </span>
            <div style="flex: 1;" />
            <button class="tf-tx-btn ghost" type="button" @click="open = false">
              Annuler
            </button>
            <button
              class="tf-tx-btn"
              :class="state.type === 'income' ? 'income' : 'primary'"
              :disabled="!valid"
              type="button"
              @click="save"
            >
              <UIcon name="i-lucide-check" class="size-4" />
              {{ valid ? `Enregistrer ${state.type === 'income' ? '+' : '−'}${numAmount.toFixed(2).replace('.', ',')} €` : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
