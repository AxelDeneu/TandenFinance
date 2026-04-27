import * as z from 'zod'
import type { Ref } from 'vue'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Transaction, RecurringEntry, Category } from '~/types'

export const transactionSchema = z.object({
  label: z.string().min(1, 'Libellé requis').max(255),
  amount: z.coerce.number().positive('Le montant doit être positif'),
  type: z.enum(['income', 'expense']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide'),
  recurringEntryId: z.coerce.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional()
})

export type TransactionSchema = z.output<typeof transactionSchema>

export interface RecurringEntryOption {
  label: string
  value: number
  type: 'income' | 'expense'
  group: string
  categoryId: number | null
  categoryName: string | null
}

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
  const { data: categories } = useFetch<Category[]>('/api/budget/categories', {
    lazy: true,
    default: () => []
  })

  const { data: existingLabels } = useFetch<string[]>('/api/budget/transactions/labels', {
    lazy: true,
    default: () => []
  })

  const categoriesById = computed(() => {
    const map = new Map<number, Category>()
    for (const c of categories.value) map.set(c.id, c)
    return map
  })

  const recurringOptions = computed<RecurringEntryOption[]>(() => {
    const options: RecurringEntryOption[] = []
    const enrich = (e: RecurringEntry, type: 'income' | 'expense', group: string): RecurringEntryOption => {
      const cat = e.categoryId ? categoriesById.value.get(e.categoryId) ?? null : null
      return {
        label: e.label,
        value: e.id,
        type,
        group,
        categoryId: e.categoryId,
        categoryName: cat?.name ?? e.category ?? null
      }
    }
    for (const e of incomeEntries.value) options.push(enrich(e, 'income', 'Revenus'))
    for (const e of expenseEntries.value) options.push(enrich(e, 'expense', 'Dépenses'))
    for (const e of envelopeEntries.value) options.push(enrich(e, 'expense', 'Enveloppes'))
    return options
  })

  const filteredRecurringOptions = computed<RecurringEntryOption[]>(() => {
    if (state.type === 'expense') {
      return recurringOptions.value.filter(o => o.group === 'Dépenses' || o.group === 'Enveloppes')
    }
    return recurringOptions.value.filter(o => o.group === 'Revenus' || o.group === 'Enveloppes')
  })

  watch(() => state.recurringEntryId, (id) => {
    if (!id) return
    const option = recurringOptions.value.find(o => o.value === id)
    if (option) {
      state.type = option.type
    }
  }, { flush: 'sync' })

  watch(() => state.type, () => {
    if (!state.recurringEntryId) return
    const stillValid = filteredRecurringOptions.value.some(o => o.value === state.recurringEntryId)
    if (!stillValid) {
      state.recurringEntryId = null
    }
  })

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
    recurringOptions,
    filteredRecurringOptions,
    categories,
    categoriesById,
    existingLabels,
    onSubmit
  }
}
