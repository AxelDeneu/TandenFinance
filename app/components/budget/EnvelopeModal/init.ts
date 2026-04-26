import * as z from 'zod'
import type { Ref } from 'vue'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { RecurringEntry, Category } from '~/types'

export const budgetEnvelopeSchema = z.object({
  label: z.string().min(2, 'Minimum 2 caractères'),
  amount: z.coerce.number().positive('Le montant doit être positif'),
  categoryId: z.coerce.number().int().positive('Catégorie requise'),
  active: z.boolean().default(true),
  notes: z.string().optional()
})

export type BudgetEnvelopeSchema = z.output<typeof budgetEnvelopeSchema>

interface BudgetEnvelopeModalContext {
  props: { entry?: RecurringEntry }
  emit: (event: 'saved') => void
  open: Ref<boolean>
}

export function initBudgetEnvelopeModal(ctx: BudgetEnvelopeModalContext) {
  const toast = useToast()
  const { showErrorToast } = useErrorToast()

  const state = reactive<Partial<BudgetEnvelopeSchema>>({
    label: '',
    amount: undefined,
    categoryId: undefined,
    active: true,
    notes: ''
  })

  const isEdit = computed(() => !!ctx.props.entry)

  const modalTitle = computed(() => {
    return isEdit.value ? 'Modifier l\'enveloppe' : 'Nouvelle enveloppe'
  })

  const { data: allCategories } = useFetch<Category[]>('/api/budget/categories', {
    lazy: true,
    default: () => []
  })

  const categories = computed(() => {
    return allCategories.value
      .filter(c => c.type === 'expense')
      .map(c => ({ label: c.name, value: c.id }))
  })

  watch(() => ctx.props.entry, (entry) => {
    if (entry) {
      state.label = entry.label
      state.amount = entry.amount
      state.categoryId = entry.categoryId ?? undefined
      state.active = entry.active
      state.notes = entry.notes || ''
    } else {
      state.label = ''
      state.amount = undefined
      state.categoryId = undefined
      state.active = true
      state.notes = ''
    }
  }, { immediate: true })

  async function onSubmit(event: FormSubmitEvent<BudgetEnvelopeSchema>) {
    try {
      if (isEdit.value && ctx.props.entry) {
        await $fetch(`/api/budget/envelopes/${ctx.props.entry.id}`, {
          method: 'PUT',
          body: event.data
        })
        toast.add({
          title: 'Succès',
          description: `L'enveloppe "${event.data.label}" a été modifiée`,
          color: 'success'
        })
      } else {
        await $fetch('/api/budget/envelopes', {
          method: 'POST',
          body: event.data
        })
        toast.add({
          title: 'Succès',
          description: `L'enveloppe "${event.data.label}" a été ajoutée`,
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
    schema: budgetEnvelopeSchema,
    state,
    isEdit,
    modalTitle,
    categories,
    onSubmit
  }
}
