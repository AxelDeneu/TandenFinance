interface BudgetForecastCellContext {
  props: {
    plannedAmount: number
    actualAmount: number | null
    entryId: number
    year: number
    month: number
  }
  emit: (event: 'saved' | 'cleared') => void
}

export function initBudgetForecastCell(ctx: BudgetForecastCellContext) {
  const toast = useToast()

  const editing = ref(false)
  const inputValue = ref<string>('')
  const saving = ref(false)

  const hasActual = computed(() => ctx.props.actualAmount !== null)

  const effectiveAmount = computed(() => {
    return ctx.props.actualAmount ?? ctx.props.plannedAmount
  })

  const variance = computed(() => {
    if (ctx.props.actualAmount === null) return null
    return ctx.props.actualAmount - ctx.props.plannedAmount
  })

  function startEditing() {
    inputValue.value = hasActual.value
      ? String(ctx.props.actualAmount)
      : String(ctx.props.plannedAmount)
    editing.value = true
  }

  function cancelEditing() {
    editing.value = false
    inputValue.value = ''
  }

  async function save() {
    const numValue = parseFloat(inputValue.value)
    if (Number.isNaN(numValue) || numValue < 0) {
      toast.add({
        title: 'Erreur',
        description: 'Montant invalide',
        color: 'error'
      })
      return
    }

    saving.value = true
    try {
      await $fetch(`/api/budget/actuals/${ctx.props.entryId}`, {
        method: 'PUT',
        body: {
          year: ctx.props.year,
          month: ctx.props.month,
          actualAmount: numValue
        }
      })
      editing.value = false
      ctx.emit('saved')
    } catch {
      toast.add({
        title: 'Erreur',
        description: 'Impossible de sauvegarder',
        color: 'error'
      })
    } finally {
      saving.value = false
    }
  }

  async function clear() {
    saving.value = true
    try {
      await $fetch(`/api/budget/actuals/${ctx.props.entryId}`, {
        method: 'DELETE',
        body: {
          year: ctx.props.year,
          month: ctx.props.month
        }
      })
      ctx.emit('cleared')
    } catch {
      toast.add({
        title: 'Erreur',
        description: 'Impossible de supprimer',
        color: 'error'
      })
    } finally {
      saving.value = false
    }
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      save()
    } else if (event.key === 'Escape') {
      cancelEditing()
    }
  }

  return {
    editing,
    inputValue,
    saving,
    hasActual,
    effectiveAmount,
    variance,
    startEditing,
    cancelEditing,
    save,
    clear,
    onKeydown
  }
}
