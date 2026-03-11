interface UseCrudModalsOptions {
  onRefresh: () => void | Promise<void>
  onNotify?: () => void
}

export function useCrudModals<T>(options: UseCrudModalsOptions) {
  const editingEntry = ref<T | undefined>()
  const editModalOpen = ref(false)
  const deletingEntry = ref<T | undefined>()
  const deleteModalOpen = ref(false)
  const addModalOpen = ref(false)

  function openEditModal(entry: T) {
    editingEntry.value = entry as T
    editModalOpen.value = true
  }

  function openDeleteModal(entry: T) {
    deletingEntry.value = entry as T
    deleteModalOpen.value = true
  }

  function onSaved() {
    options.onRefresh()
    options.onNotify?.()
  }

  function onDeleted() {
    options.onRefresh()
    options.onNotify?.()
  }

  return {
    editingEntry,
    editModalOpen,
    deletingEntry,
    deleteModalOpen,
    addModalOpen,
    openEditModal,
    openDeleteModal,
    onSaved,
    onDeleted
  }
}
