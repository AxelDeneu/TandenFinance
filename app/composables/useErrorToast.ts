export function useErrorToast() {
  const toast = useToast()

  function showErrorToast(description: string, error?: unknown) {
    if (error !== undefined) {
      console.error(description, error)
    }
    toast.add({
      title: 'Erreur',
      description,
      color: 'error'
    })
  }

  return { showErrorToast }
}
