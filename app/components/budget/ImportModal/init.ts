import type { Ref } from 'vue'
import type { ImportParsedRow } from '~/types'

interface ImportModalContext {
  emit: (event: 'imported') => void
  open: Ref<boolean>
}

interface ParsedRow extends ImportParsedRow {
  included: boolean
  editedLabel: string
  editedType: 'income' | 'expense'
  editedRecurringEntryId: number | null
}

export function initImportModal(ctx: ImportModalContext) {
  const toast = useToast()
  const { showErrorToast } = useErrorToast()

  const step = ref<1 | 2 | 3>(1)
  const loading = ref(false)
  const filename = ref('')
  const rows = ref<ParsedRow[]>([])

  function reset() {
    step.value = 1
    rows.value = []
    filename.value = ''
    loading.value = false
  }

  watch(() => ctx.open.value, (val) => {
    if (!val) reset()
  })

  async function onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    loading.value = true
    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await $fetch<{ rows: ImportParsedRow[], filename: string, totalRows: number }>('/api/budget/import/parse', {
        method: 'POST',
        body: formData
      })

      filename.value = result.filename
      rows.value = result.rows.map(r => ({
        ...r,
        included: true,
        editedLabel: r.suggestedMatch?.label ?? r.rawLabel,
        editedType: r.type,
        editedRecurringEntryId: r.suggestedMatch?.recurringEntryId ?? null
      }))

      step.value = 2
    } catch (error) {
      showErrorToast('Erreur lors du parsing du CSV', error)
    } finally {
      loading.value = false
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault()
    const file = event.dataTransfer?.files?.[0]
    if (!file) return

    // Create a synthetic event
    const input = document.createElement('input')
    input.type = 'file'
    const dt = new DataTransfer()
    dt.items.add(file)
    input.files = dt.files
    onFileSelected({ target: input } as unknown as Event)
  }

  const includedRows = computed(() => rows.value.filter(r => r.included))

  const totalIncome = computed(() =>
    includedRows.value
      .filter(r => r.editedType === 'income')
      .reduce((s, r) => s + r.amount, 0)
  )

  const totalExpense = computed(() =>
    includedRows.value
      .filter(r => r.editedType === 'expense')
      .reduce((s, r) => s + r.amount, 0)
  )

  function goToSummary() {
    step.value = 3
  }

  function goBackToPreview() {
    step.value = 2
  }

  async function confirmImport() {
    loading.value = true
    try {
      const transactions = includedRows.value.map(r => ({
        label: r.editedLabel,
        amount: r.amount,
        type: r.editedType,
        date: r.date,
        recurringEntryId: r.editedRecurringEntryId && r.editedRecurringEntryId > 0
          ? r.editedRecurringEntryId
          : null,
        notes: null
      }))

      const result = await $fetch<{ imported: number }>('/api/budget/import/confirm', {
        method: 'POST',
        body: { filename: filename.value, transactions }
      })

      toast.add({
        title: 'Import réussi',
        description: `${result.imported} transaction(s) importée(s)`,
        color: 'success'
      })

      ctx.open.value = false
      ctx.emit('imported')
    } catch (error) {
      showErrorToast('Erreur lors de l\'import', error)
    } finally {
      loading.value = false
    }
  }

  function confidenceBadge(confidence: number | undefined): { label: string, color: 'success' | 'warning' | 'neutral' } {
    if (!confidence) return { label: 'Aucun', color: 'neutral' }
    if (confidence >= 0.8) return { label: 'Élevé', color: 'success' }
    if (confidence >= 0.5) return { label: 'Moyen', color: 'warning' }
    return { label: 'Faible', color: 'neutral' }
  }

  return {
    step,
    loading,
    filename,
    rows,
    includedRows,
    totalIncome,
    totalExpense,
    onFileSelected,
    onDrop,
    goToSummary,
    goBackToPreview,
    confirmImport,
    confidenceBadge
  }
}
