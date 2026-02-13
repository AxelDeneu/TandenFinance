import type { Ref } from 'vue'
import type { EnvelopeExpense } from '~/types'

interface BudgetEnvelopeExpenseModalContext {
  props: {
    entryId: number
    entryLabel: string
    plannedAmount: number
    year: number
    month: number
  }
  emit: (event: 'updated') => void
  open: Ref<boolean>
}

export function initBudgetEnvelopeExpenseModal(ctx: BudgetEnvelopeExpenseModalContext) {
  const toast = useToast()

  const expenses = ref<EnvelopeExpense[]>([])
  const loading = ref(false)
  const adding = ref(false)

  const newLabel = ref('')
  const newAmount = ref<number | undefined>()

  const total = computed(() => {
    return expenses.value.reduce((sum, e) => sum + e.amount, 0)
  })

  const remaining = computed(() => {
    return ctx.props.plannedAmount - total.value
  })

  async function fetchExpenses() {
    loading.value = true
    try {
      expenses.value = await $fetch<EnvelopeExpense[]>(
        `/api/budget/envelopes/${ctx.props.entryId}/expenses`,
        { query: { year: ctx.props.year, month: ctx.props.month } }
      )
    } catch {
      toast.add({ title: 'Erreur', description: 'Impossible de charger les dépenses', color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function addExpense() {
    if (!newLabel.value.trim() || !newAmount.value || newAmount.value <= 0) {
      toast.add({ title: 'Erreur', description: 'Libellé et montant requis', color: 'error' })
      return
    }

    adding.value = true
    try {
      await $fetch(`/api/budget/envelopes/${ctx.props.entryId}/expenses`, {
        method: 'POST',
        body: {
          year: ctx.props.year,
          month: ctx.props.month,
          label: newLabel.value.trim(),
          amount: newAmount.value
        }
      })
      newLabel.value = ''
      newAmount.value = undefined
      await fetchExpenses()
      ctx.emit('updated')
    } catch {
      toast.add({ title: 'Erreur', description: 'Impossible d\'ajouter la dépense', color: 'error' })
    } finally {
      adding.value = false
    }
  }

  async function deleteExpense(expenseId: number) {
    try {
      await $fetch(`/api/budget/envelopes/${ctx.props.entryId}/expenses/${expenseId}`, {
        method: 'DELETE'
      })
      await fetchExpenses()
      ctx.emit('updated')
    } catch {
      toast.add({ title: 'Erreur', description: 'Impossible de supprimer', color: 'error' })
    }
  }

  // Fetch when modal opens
  watch(() => ctx.open.value, (isOpen) => {
    if (isOpen) {
      fetchExpenses()
    }
  })

  return {
    expenses,
    loading,
    adding,
    newLabel,
    newAmount,
    total,
    remaining,
    addExpense,
    deleteExpense
  }
}
