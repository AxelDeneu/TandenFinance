import * as z from 'zod'
import type { Ref } from 'vue'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Transaction, RecurringEntry } from '~/types'

export const transactionSchema = z.object({
  label: z.string().min(1, 'Libellé requis').max(255),
  amount: z.coerce.number().positive('Le montant doit être positif'),
  type: z.enum(['income', 'expense']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide'),
  recurringEntryId: z.coerce.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional()
})

export type TransactionSchema = z.output<typeof transactionSchema>

interface TransactionModalContext {
  props: { transaction?: Transaction | null }
  emit: (event: 'saved') => void
  open: Ref<boolean>
}

export function initTransactionModal(ctx: TransactionModalContext) {
  const toast = useToast()
  const { showErrorToast } = useErrorToast()

  const today = new Date().toISOString().slice(0, 10)

  const state = reactive<Partial<TransactionSchema>>({
    label: '',
    amount: undefined,
    type: 'expense',
    date: today,
    recurringEntryId: null,
    notes: ''
  })

  const isEdit = computed(() => !!ctx.props.transaction)

  const modalTitle = computed(() => isEdit.value ? 'Modifier la transaction' : 'Nouvelle transaction')

  // Fetch recurring entries for category selection
  const { data: incomeEntries } = useFetch<RecurringEntry[]>('/api/budget/incomes', {
    lazy: true,
    default: () => []
  })
  const { data: expenseEntries } = useFetch<RecurringEntry[]>('/api/budget/expenses', {
    lazy: true,
    default: () => []
  })
  const { data: envelopeEntries } = useFetch<RecurringEntry[]>('/api/budget/envelopes', {
    lazy: true,
    default: () => []
  })

  // Fetch existing labels for autocomplete
  const { data: existingLabels } = useFetch<string[]>('/api/budget/transactions/labels', {
    lazy: true,
    default: () => []
  })

  const categoryOptions = computed(() => {
    const options: { label: string, value: number | null, type: 'income' | 'expense', group: string }[] = []

    for (const e of incomeEntries.value) {
      options.push({ label: e.label, value: e.id, type: 'income', group: 'Revenus' })
    }
    for (const e of expenseEntries.value) {
      options.push({ label: e.label, value: e.id, type: 'expense', group: 'Dépenses' })
    }
    for (const e of envelopeEntries.value) {
      options.push({ label: e.label, value: e.id, type: 'expense', group: 'Enveloppes' })
    }

    return options
  })

  const filteredCategoryOptions = computed(() => {
    if (state.type === 'expense') {
      return categoryOptions.value.filter(o => o.group === 'Dépenses' || o.group === 'Enveloppes')
    }
    return categoryOptions.value.filter(o => o.group === 'Revenus' || o.group === 'Enveloppes')
  })

  // Auto-select type based on selected recurring entry (sync to run before type watcher)
  watch(() => state.recurringEntryId, (id) => {
    if (!id) return
    const option = categoryOptions.value.find(o => o.value === id)
    if (option) {
      state.type = option.type
    }
  }, { flush: 'sync' })

  // Reset category when type changes and current selection is no longer valid
  watch(() => state.type, () => {
    if (!state.recurringEntryId) return
    const stillValid = filteredCategoryOptions.value.some(o => o.value === state.recurringEntryId)
    if (!stillValid) {
      state.recurringEntryId = null
    }
  })

  // Reset form when transaction changes
  watch(() => ctx.props.transaction, (transaction) => {
    if (transaction) {
      state.label = transaction.label
      state.amount = transaction.amount
      state.type = transaction.type
      state.date = transaction.date
      state.recurringEntryId = transaction.recurringEntryId
      state.notes = transaction.notes || ''
    } else {
      state.label = ''
      state.amount = undefined
      state.type = 'expense'
      state.date = today
      state.recurringEntryId = null
      state.notes = ''
    }
  }, { immediate: true })

  async function onSubmit(event: FormSubmitEvent<TransactionSchema>) {
    try {
      const payload = {
        ...event.data,
        recurringEntryId: event.data.recurringEntryId || null
      }

      if (isEdit.value && ctx.props.transaction) {
        await $fetch(`/api/budget/transactions/${ctx.props.transaction.id}`, {
          method: 'PUT',
          body: payload
        })
        toast.add({
          title: 'Succès',
          description: `La transaction "${event.data.label}" a été modifiée`,
          color: 'success'
        })
      } else {
        await $fetch('/api/budget/transactions', {
          method: 'POST',
          body: payload
        })
        toast.add({
          title: 'Succès',
          description: `La transaction "${event.data.label}" a été ajoutée`,
          color: 'success'
        })
      }
      ctx.open.value = false
      ctx.emit('saved')
    } catch (error) {
      showErrorToast('Une erreur est survenue', error)
    }
  }

  return {
    schema: transactionSchema,
    state,
    isEdit,
    modalTitle,
    categoryOptions,
    filteredCategoryOptions,
    existingLabels,
    onSubmit
  }
}
