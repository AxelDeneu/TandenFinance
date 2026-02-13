interface BudgetEnvelopeExpenseCellContext {
  props: {
    plannedAmount: number
    actualAmount: number | null
    entryId: number
    year: number
    month: number
    entryLabel: string
  }
  emit: (event: 'updated') => void
}

export function initBudgetEnvelopeExpenseCell(ctx: BudgetEnvelopeExpenseCellContext) {
  const modalOpen = ref(false)

  const hasExpenses = computed(() => ctx.props.actualAmount !== null && ctx.props.actualAmount > 0)

  const percentage = computed(() => {
    if (!hasExpenses.value || ctx.props.plannedAmount === 0) return 0
    return Math.round((ctx.props.actualAmount! / ctx.props.plannedAmount) * 100)
  })

  const isOverBudget = computed(() => {
    return hasExpenses.value && ctx.props.actualAmount! > ctx.props.plannedAmount
  })

  function openModal() {
    modalOpen.value = true
  }

  function onModalUpdated() {
    ctx.emit('updated')
  }

  return {
    modalOpen,
    hasExpenses,
    percentage,
    isOverBudget,
    openModal,
    onModalUpdated
  }
}
