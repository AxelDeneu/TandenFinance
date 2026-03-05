import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { stubNuxtAutoImports } from '../../../../test/helpers/nuxt-stubs'

const mockToastAdd = vi.fn()

stubNuxtAutoImports({
  useToast: () => ({ add: mockToastAdd })
})

const { initImportModal } = await import('./init')

function createContext() {
  const emit = vi.fn()
  const open = ref(true)
  return { emit, open }
}

describe('initImportModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all expected properties', () => {
    const result = initImportModal(createContext())

    expect(result).toHaveProperty('step')
    expect(result).toHaveProperty('loading')
    expect(result).toHaveProperty('filename')
    expect(result).toHaveProperty('rows')
    expect(result).toHaveProperty('includedRows')
    expect(result).toHaveProperty('totalIncome')
    expect(result).toHaveProperty('totalExpense')
    expect(result).toHaveProperty('onFileSelected')
    expect(result).toHaveProperty('onDrop')
    expect(result).toHaveProperty('goToSummary')
    expect(result).toHaveProperty('goBackToPreview')
    expect(result).toHaveProperty('confirmImport')
    expect(result).toHaveProperty('confidenceBadge')
  })

  it('starts at step 1', () => {
    const { step } = initImportModal(createContext())
    expect(step.value).toBe(1)
  })

  it('starts with empty rows', () => {
    const { rows, includedRows } = initImportModal(createContext())
    expect(rows.value).toHaveLength(0)
    expect(includedRows.value).toHaveLength(0)
  })

  it('goToSummary moves to step 3', () => {
    const { goToSummary, step } = initImportModal(createContext())
    goToSummary()
    expect(step.value).toBe(3)
  })

  it('goBackToPreview moves to step 2', () => {
    const { goToSummary, goBackToPreview, step } = initImportModal(createContext())
    goToSummary()
    goBackToPreview()
    expect(step.value).toBe(2)
  })

  it('confidenceBadge returns correct badge for high confidence', () => {
    const { confidenceBadge } = initImportModal(createContext())
    expect(confidenceBadge(0.9)).toEqual({ label: 'Élevé', color: 'success' })
  })

  it('confidenceBadge returns correct badge for medium confidence', () => {
    const { confidenceBadge } = initImportModal(createContext())
    expect(confidenceBadge(0.6)).toEqual({ label: 'Moyen', color: 'warning' })
  })

  it('confidenceBadge returns correct badge for low confidence', () => {
    const { confidenceBadge } = initImportModal(createContext())
    expect(confidenceBadge(0.3)).toEqual({ label: 'Faible', color: 'neutral' })
  })

  it('confidenceBadge returns "Aucun" for undefined', () => {
    const { confidenceBadge } = initImportModal(createContext())
    expect(confidenceBadge(undefined)).toEqual({ label: 'Aucun', color: 'neutral' })
  })

  it('totalIncome and totalExpense are 0 with empty rows', () => {
    const { totalIncome, totalExpense } = initImportModal(createContext())
    expect(totalIncome.value).toBe(0)
    expect(totalExpense.value).toBe(0)
  })

  it('computes totalIncome and totalExpense from included rows', () => {
    const ctx = createContext()
    const { rows, totalIncome, totalExpense } = initImportModal(ctx)

    rows.value = [
      { rawLabel: 'Salaire', date: '2026-03-01', amount: 3000, type: 'income', suggestedMatch: null, included: true, editedLabel: 'Salaire', editedType: 'income', editedRecurringEntryId: null },
      { rawLabel: 'Loyer', date: '2026-03-05', amount: 800, type: 'expense', suggestedMatch: null, included: true, editedLabel: 'Loyer', editedType: 'expense', editedRecurringEntryId: null },
      { rawLabel: 'Courses', date: '2026-03-10', amount: 200, type: 'expense', suggestedMatch: null, included: false, editedLabel: 'Courses', editedType: 'expense', editedRecurringEntryId: null }
    ] as never[]

    expect(totalIncome.value).toBe(3000)
    expect(totalExpense.value).toBe(800) // Courses excluded
  })

  it('confirmImport calls API and emits imported on success', async () => {
    const ctx = createContext()
    const { rows, filename, confirmImport } = initImportModal(ctx)

    filename.value = 'test.csv'
    rows.value = [
      { rawLabel: 'Loyer', date: '2026-03-05', amount: 800, type: 'expense', suggestedMatch: null, included: true, editedLabel: 'Loyer', editedType: 'expense', editedRecurringEntryId: null }
    ] as never[]

    vi.mocked($fetch).mockResolvedValueOnce({ imported: 1 })

    await confirmImport()

    expect($fetch).toHaveBeenCalledWith('/api/budget/import/confirm', {
      method: 'POST',
      body: expect.objectContaining({
        filename: 'test.csv',
        transactions: expect.arrayContaining([
          expect.objectContaining({ label: 'Loyer', amount: 800 })
        ])
      })
    })
    expect(ctx.open.value).toBe(false)
    expect(ctx.emit).toHaveBeenCalledWith('imported')
    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ color: 'success' }))
  })

  it('confirmImport shows error toast on failure', async () => {
    const ctx = createContext()
    const { rows, filename, confirmImport } = initImportModal(ctx)

    filename.value = 'test.csv'
    rows.value = [
      { rawLabel: 'Loyer', date: '2026-03-05', amount: 800, type: 'expense', suggestedMatch: null, included: true, editedLabel: 'Loyer', editedType: 'expense', editedRecurringEntryId: null }
    ] as never[]

    vi.mocked($fetch).mockRejectedValueOnce(new Error('fail'))

    await confirmImport()

    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ color: 'error' }))
    expect(ctx.emit).not.toHaveBeenCalled()
  })
})
