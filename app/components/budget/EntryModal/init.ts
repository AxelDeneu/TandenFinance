import * as z from 'zod'
import type { Ref } from 'vue'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { RecurringEntry, EntryType, Category } from '~/types'

export const budgetEntrySchema = z.object({
  label: z.string().min(2, 'Minimum 2 caractères'),
  amount: z.coerce.number().positive('Le montant doit être positif'),
  categoryId: z.coerce.number().int().positive('Catégorie requise'),
  dayOfMonth: z.coerce.number().int().min(1, 'Minimum 1').max(31, 'Maximum 31'),
  active: z.boolean().default(true),
  notes: z.string().optional()
})

export type BudgetEntrySchema = z.output<typeof budgetEntrySchema>

interface BudgetEntryModalContext {
  props: { type: EntryType, entry?: RecurringEntry }
  emit: (event: 'saved') => void
  open: Ref<boolean>
}

export function initBudgetEntryModal(ctx: BudgetEntryModalContext) {
  const toast = useToast()
  const { showErrorToast } = useErrorToast()

  const state = reactive<Partial<BudgetEntrySchema>>({
    label: '',
    amount: undefined,
    categoryId: undefined,
    dayOfMonth: 1,
    active: true,
    notes: ''
  })

  const isEdit = computed(() => !!ctx.props.entry)

  const modalTitle = computed(() => {
    if (isEdit.value) {
      return ctx.props.type === 'income' ? 'Modifier le revenu' : 'Modifier la dépense'
    }
    return ctx.props.type === 'income' ? 'Nouveau revenu' : 'Nouvelle dépense'
  })

  const { data: allCategories } = useFetch<Category[]>('/api/budget/categories', {
    lazy: true,
    default: () => []
  })

  // Envelopes are expense-side budgets, so they pick from expense categories.
  const categoryFilterType = computed(() => ctx.props.type === 'income' ? 'income' : 'expense')

  const categories = computed(() => {
    return allCategories.value
      .filter(c => c.type === categoryFilterType.value)
      .map(c => ({ label: c.name, value: c.id }))
  })

  watch(() => ctx.props.entry, (entry) => {
    if (entry) {
      state.label = entry.label
      state.amount = entry.amount
      state.categoryId = entry.categoryId ?? undefined
      state.dayOfMonth = entry.dayOfMonth ?? 1
      state.active = entry.active
      state.notes = entry.notes || ''
    } else {
      state.label = ''
      state.amount = undefined
      state.categoryId = undefined
      state.dayOfMonth = 1
      state.active = true
      state.notes = ''
    }
  }, { immediate: true })

  async function onSubmit(event: FormSubmitEvent<BudgetEntrySchema>) {
    try {
      if (isEdit.value && ctx.props.entry) {
        await $fetch(`/api/budget/${ctx.props.type}s/${ctx.props.entry.id}`, {
          method: 'PUT',
          body: event.data
        })
        toast.add({
          title: 'Succès',
          description: `L'entrée "${event.data.label}" a été modifiée`,
          color: 'success'
        })
      } else {
        await $fetch(`/api/budget/${ctx.props.type}s`, {
          method: 'POST',
          body: event.data
        })
        toast.add({
          title: 'Succès',
          description: `L'entrée "${event.data.label}" a été ajoutée`,
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
    schema: budgetEntrySchema,
    state,
    isEdit,
    modalTitle,
    categories,
    onSubmit
  }
}
