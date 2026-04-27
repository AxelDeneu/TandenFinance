<script setup lang="ts">
import type { Transaction, Category } from '~/types'
import { initTransactionModal } from './init'
import type { RecurringEntryOption } from './init'

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
  filteredRecurringOptions,
  categories,
  categoriesById,
  existingLabels,
  onSubmit
} = initTransactionModal({ props, emit, open })

// ============== UI state ==============

const QUICK_AMOUNTS = [5, 10, 20, 50, 100]

// keyword → category name hint (used to auto-detect a category from the label)
const CATEGORY_HINTS: Record<string, string[]> = {
  Courses: ['carrefour', 'monoprix', 'auchan', 'leclerc', 'intermarché', 'lidl', 'bio', 'marché', 'franprix', 'casino', 'picard'],
  Transport: ['total', 'essence', 'sncf', 'uber', 'metro', 'ratp', 'parking', 'peage', 'blablacar', 'garage', 'tesla'],
  Loisirs: ['cinema', 'pathe', 'ugc', 'concert', 'musee', 'livre', 'fnac', 'steam'],
  Salaire: ['salaire', 'paie', 'aden', 'climber', 'prime', 'bonus'],
  Énergie: ['edf', 'engie', 'gaz', 'electricite', 'veolia'],
  Eau: ['eau', 'veolia'],
  Restaurants: ['restaurant', 'resto', 'boulangerie', 'starbucks', 'mcdonald', 'burger', 'sushi', 'paul', 'pizza', 'brasserie', 'bar', 'cafe'],
  Abonnements: ['netflix', 'spotify', 'disney', 'apple', 'amazon prime', 'canal', 'molotov', 'adobe', 'figma', 'github', 'icloud', 'free', 'sfr', 'orange', 'bouygues'],
  Logement: ['ikea', 'leroy', 'castorama', 'bricorama', 'meuble'],
  Loyer: ['loyer', 'copropriete', 'syndic'],
  Santé: ['medecin', 'dentiste', 'optique', 'mutuelle', 'hopital', 'kine', 'laboratoire', 'doctolib'],
  Pharmacie: ['pharmacie'],
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
const recurringAuto = ref(true)
const dateMode = ref<'yesterday' | 'today' | 'custom'>('today')
const recurringSearch = ref('')

function sanitizeAmount(raw: string): string {
  // keep only digits and one comma, max 2 decimals
  let cleaned = raw.replace(/\./g, ',').replace(/[^\d,]/g, '')
  const firstComma = cleaned.indexOf(',')
  if (firstComma !== -1) {
    cleaned = cleaned.slice(0, firstComma + 1) + cleaned.slice(firstComma + 1).replace(/,/g, '')
  }
  const parts = cleaned.split(',')
  if (parts.length === 2 && (parts[1]?.length ?? 0) > 2) {
    cleaned = parts[0] + ',' + parts[1]!.slice(0, 2)
  }
  return cleaned
}

function onAmountInput(e: Event) {
  const el = e.target as HTMLInputElement
  const next = sanitizeAmount(el.value)
  if (next !== el.value) el.value = next
  amountStr.value = next
}

watch(() => props.transaction, (tx) => {
  if (tx) {
    amountStr.value = tx.amount > 0 ? tx.amount.toFixed(2).replace('.', ',') : ''
    showNotes.value = !!tx.notes
    recurringAuto.value = false
    const today = new Date().toISOString().slice(0, 10)
    dateMode.value = tx.date === today ? 'today' : 'custom'
  } else {
    amountStr.value = ''
    showNotes.value = false
    recurringAuto.value = true
    dateMode.value = 'today'
  }
}, { immediate: true })

watch(amountStr, (v) => {
  const num = parseFloat(v.replace(',', '.'))
  state.amount = Number.isFinite(num) ? num : undefined
})

// auto-detect category from label, then pick the first active recurring entry of that category
watch(() => state.label, (label) => {
  if (!recurringAuto.value || !label) return
  const detected = detectCategoryFromLabel(label)
  if (!detected) return
  const matchedCategory = categories.value.find(c => c.name.toLowerCase() === detected.toLowerCase())
  if (!matchedCategory) return
  const match = filteredRecurringOptions.value.find(o => o.categoryId === matchedCategory.id)
  if (match) state.recurringEntryId = match.value
})

const numAmount = computed(() => parseFloat(amountStr.value.replace(',', '.')) || 0)
const valid = computed(() => numAmount.value > 0 && (state.label?.trim().length ?? 0) > 0)

const visibleRecurringOptions = computed<RecurringEntryOption[]>(() => {
  const q = recurringSearch.value.trim().toLowerCase()
  if (!q) return filteredRecurringOptions.value
  return filteredRecurringOptions.value.filter(o =>
    o.label.toLowerCase().includes(q)
    || (o.categoryName?.toLowerCase().includes(q) ?? false)
  )
})

watch(() => state.type, () => {
  recurringSearch.value = ''
})

const currentOption = computed<RecurringEntryOption | null>(() => {
  return filteredRecurringOptions.value.find(o => o.value === state.recurringEntryId) ?? null
})

const currentCategory = computed<Category | null>(() => {
  if (currentOption.value?.categoryId) return categoriesById.value.get(currentOption.value.categoryId) ?? null
  return null
})

const detectedCategoryName = computed(() => {
  if (!state.label || !recurringAuto.value) return null
  return detectCategoryFromLabel(state.label)
})

const detectedCategory = computed<Category | null>(() => {
  if (!detectedCategoryName.value) return null
  return categories.value.find(c => c.name.toLowerCase() === detectedCategoryName.value!.toLowerCase()) ?? null
})

const displayCategory = computed<Category | null>(() => currentCategory.value ?? detectedCategory.value)

const previewIcon = computed(() => displayCategory.value?.icon ?? 'i-lucide-tag')
const previewColor = computed(() => displayCategory.value?.color ?? '#6B7489')

const previewLabel = computed(() => state.label?.trim() || (state.type === 'income' ? 'Nouveau revenu' : 'Nouvelle dépense'))
const previewMeta = computed(() => {
  const cat = displayCategory.value?.name ?? 'Non catégorisé'
  const dateLabel = dateMode.value === 'today' ? 'Aujourd\'hui' : dateMode.value === 'yesterday' ? 'Hier' : new Date(state.date ?? '').toLocaleDateString('fr-FR')
  return `${cat} · ${dateLabel}`
})

const recents = computed(() => {
  return (existingLabels.value ?? []).slice(0, 4).map((label) => {
    const detected = detectCategoryFromLabel(label)
    const cat = detected ? categories.value.find(c => c.name.toLowerCase() === detected.toLowerCase()) ?? null : null
    return {
      label,
      cat: detected,
      style: { color: cat?.color ?? '#6B7489', icon: cat?.icon ?? 'i-lucide-tag' }
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
  amountStr.value = sanitizeAmount(amountStr.value + k)
}

function pickRecent(label: string) {
  state.label = label
  recurringAuto.value = true
}

function pickRecurring(value: number) {
  state.recurringEntryId = value
  recurringAuto.value = false
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

        <label class="tf-tx-amount-display">
          <div class="tf-tx-sign">
            {{ state.type === 'income' ? '+' : '−' }}
          </div>
          <input
            :value="amountStr"
            type="text"
            inputmode="decimal"
            pattern="[0-9,]*"
            class="tf-tx-amount-num"
            :class="{ 'is-empty': !amountStr }"
            placeholder="0,00"
            aria-label="Montant"
            @input="onAmountInput"
          >
          <div class="tf-tx-currency">
            €
          </div>
        </label>

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
            <span v-if="detectedCategory && recurringAuto" class="tf-tx-detected">
              <span class="dot" :style="{ background: detectedCategory.color }" />
              détecté : {{ detectedCategory.name }}
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

        <!-- Recurring entry selector -->
        <div v-if="filteredRecurringOptions.length > 0" class="tf-tx-section">
          <div class="tf-tx-label">
            <span>Entrée récurrente</span>
            <button
              v-if="!recurringAuto"
              type="button"
              class="tf-tx-mini-link"
              @click="recurringAuto = true; state.recurringEntryId = null"
            >
              <UIcon name="i-lucide-refresh-cw" class="size-2.5" />
              auto
            </button>
          </div>
          <div class="tf-tx-recurring-search">
            <UIcon name="i-lucide-search" class="size-3.5" />
            <input
              v-model="recurringSearch"
              type="text"
              :placeholder="`Rechercher parmi ${filteredRecurringOptions.length} entrée${filteredRecurringOptions.length > 1 ? 's' : ''}…`"
            >
            <button
              v-if="recurringSearch"
              type="button"
              class="tf-tx-recurring-search-clear"
              aria-label="Effacer la recherche"
              @click="recurringSearch = ''"
            >
              <UIcon name="i-lucide-x" class="size-3" />
            </button>
          </div>
          <div v-if="visibleRecurringOptions.length > 0" class="tf-tx-cat-grid">
            <button
              v-for="o in visibleRecurringOptions"
              :key="o.value"
              type="button"
              class="tf-tx-cat"
              :class="state.recurringEntryId === o.value ? 'active' : ''"
              :style="state.recurringEntryId === o.value && o.categoryId ? {
                color: categoriesById.get(o.categoryId)?.color,
                borderColor: `${categoriesById.get(o.categoryId)?.color}60`,
                background: `${categoriesById.get(o.categoryId)?.color}14`
              } : {}"
              :title="o.categoryName ? `${o.label} — ${o.categoryName}` : o.label"
              @click="pickRecurring(o.value)"
            >
              <span class="cat-ico" :style="state.recurringEntryId === o.value ? {} : { color: o.categoryId ? categoriesById.get(o.categoryId)?.color : '#6B7489' }">
                <UIcon :name="o.categoryId ? (categoriesById.get(o.categoryId)?.icon ?? 'i-lucide-tag') : 'i-lucide-tag'" class="size-3.5" />
              </span>
              <span>{{ o.label }}</span>
            </button>
          </div>
          <div v-else class="tf-tx-empty">
            Aucune entrée ne correspond à « {{ recurringSearch }} »
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
              :style="{ color: previewColor, background: `${previewColor}14`, borderColor: `${previewColor}33` }"
            >
              <UIcon :name="previewIcon" class="size-3.5" />
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
    </template>
  </UModal>
</template>
