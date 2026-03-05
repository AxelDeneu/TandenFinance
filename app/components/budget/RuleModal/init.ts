import * as z from 'zod'
import type { Ref } from 'vue'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { BudgetRule, RecurringEntry } from '~/types'

export const budgetRuleSchema = z.object({
  label: z.string().min(2, 'Minimum 2 caractères'),
  type: z.enum(['envelope_exceeded', 'remaining_low', 'category_threshold']),
  threshold: z.coerce.number().min(0, 'Le seuil doit être positif').optional(),
  category: z.string().optional(),
  envelopeId: z.coerce.number().int().positive().optional()
})

export type BudgetRuleSchema = z.output<typeof budgetRuleSchema>

interface RuleModalContext {
  props: { rule?: BudgetRule | null }
  emit: (event: 'saved') => void
  open: Ref<boolean>
}

export function initBudgetRuleModal(ctx: RuleModalContext) {
  const toast = useToast()

  const state = reactive<Partial<BudgetRuleSchema>>({
    label: '',
    type: 'remaining_low',
    threshold: undefined,
    category: '',
    envelopeId: undefined
  })

  const isEdit = computed(() => !!ctx.props.rule)

  const modalTitle = computed(() => isEdit.value ? 'Modifier la règle' : 'Nouvelle règle')

  const { data: envelopes } = useFetch<RecurringEntry[]>('/api/budget/envelopes', {
    default: () => []
  })

  const envelopeOptions = computed(() =>
    (envelopes.value ?? []).map(e => ({ label: e.label, value: e.id }))
  )

  const categoryOptions = computed(() =>
    EXPENSE_CATEGORIES.map(c => ({ label: c, value: c as string }))
  )

  const typeOptions = [
    { label: 'Reste à vivre faible', value: 'remaining_low' as const },
    { label: 'Enveloppe dépassée', value: 'envelope_exceeded' as const },
    { label: 'Seuil catégorie', value: 'category_threshold' as const }
  ]

  watch(() => ctx.props.rule, (rule) => {
    if (rule) {
      state.label = rule.label
      state.type = rule.type
      try {
        const config = JSON.parse(rule.config)
        state.threshold = config.threshold
        state.category = config.category ?? ''
        state.envelopeId = config.envelopeId
      } catch {
        state.threshold = undefined
        state.category = ''
        state.envelopeId = undefined
      }
    } else {
      state.label = ''
      state.type = 'remaining_low'
      state.threshold = undefined
      state.category = ''
      state.envelopeId = undefined
    }
  }, { immediate: true })

  function buildConfig(): string {
    if (state.type === 'remaining_low') {
      return JSON.stringify({ threshold: state.threshold ?? 0 })
    }
    if (state.type === 'envelope_exceeded') {
      return JSON.stringify({ envelopeId: state.envelopeId })
    }
    if (state.type === 'category_threshold') {
      return JSON.stringify({ category: state.category, threshold: state.threshold ?? 0 })
    }
    return '{}'
  }

  async function onSubmit(event: FormSubmitEvent<BudgetRuleSchema>) {
    try {
      const payload = {
        label: event.data.label,
        type: event.data.type,
        config: buildConfig()
      }

      if (isEdit.value && ctx.props.rule) {
        await $fetch(`/api/budget/rules/${ctx.props.rule.id}`, {
          method: 'PUT',
          body: payload
        })
        toast.add({ title: 'Succès', description: 'Règle modifiée', color: 'success' })
      } else {
        await $fetch('/api/budget/rules', {
          method: 'POST',
          body: payload
        })
        toast.add({ title: 'Succès', description: 'Règle créée', color: 'success' })
      }
      ctx.open.value = false
      ctx.emit('saved')
    } catch {
      toast.add({ title: 'Erreur', description: 'Une erreur est survenue', color: 'error' })
    }
  }

  return {
    schema: budgetRuleSchema,
    state,
    isEdit,
    modalTitle,
    typeOptions,
    categoryOptions,
    envelopeOptions,
    onSubmit
  }
}
