import type { Ref } from 'vue'
import type { RecurringEntry, EntryType } from '~/types'

interface BudgetDeleteModalContext {
  props: { type: EntryType, entry?: RecurringEntry }
  emit: (event: 'deleted') => void
  open: Ref<boolean>
}

export function initBudgetDeleteModal(ctx: BudgetDeleteModalContext) {
  const toast = useToast()
  const { showErrorToast } = useErrorToast()

  async function onConfirm() {
    if (!ctx.props.entry) return

    try {
      await $fetch(`/api/budget/${ctx.props.type}s/${ctx.props.entry.id}`, {
        method: 'DELETE'
      })
      toast.add({
        title: 'Succès',
        description: `L'entrée "${ctx.props.entry.label}" a été supprimée`,
        color: 'success'
      })
      ctx.open.value = false
      ctx.emit('deleted')
    } catch (error) {
      showErrorToast('Une erreur est survenue lors de la suppression', error)
    }
  }

  return { onConfirm }
}
