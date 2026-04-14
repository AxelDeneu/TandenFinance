import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { stubNuxtAutoImports } from '../../../../test/helpers/nuxt-stubs'
import type { Transaction, RecurringEntry } from '~/types'

const mockTransactions: Transaction[] = [
  { id: 1, label: 'Médecin', amount: 30, type: 'expense', date: '2026-03-05', recurringEntryId: 10, notes: null, createdAt: '', updatedAt: '' },
  { id: 2, label: 'Remb. Sécu', amount: 20, type: 'income', date: '2026-03-10', recurringEntryId: 10, notes: null, createdAt: '', updatedAt: '' },
  { id: 3, label: 'Remb. Mutuelle', amount: 10, type: 'income', date: '2026-03-12', recurringEntryId: 10, notes: null, createdAt: '', updatedAt: '' }
]

stubNuxtAutoImports({
  useFetch: () => ({
    data: ref(mockTransactions),
    status: ref('idle')
  })
})

const { initRecurringEntryDetail } = await import('./init')

describe('initRecurringEntryDetail', () => {
  it('totalSpent sums all amounts for non-envelope entry', () => {
    const entry = ref<RecurringEntry>({ id: 10, type: 'expense', label: 'Test', amount: 30, category: null, dayOfMonth: null, active: true, notes: null, createdAt: '', updatedAt: '' })
    const { totalSpent } = initRecurringEntryDetail({
      entry: entry,
      year: ref(2026),
      month: ref(3)
    })

    // For non-envelope: 30 + 20 + 10 = 60
    expect(totalSpent.value).toBe(60)
  })

  it('totalSpent subtracts income transactions for envelope entry', () => {
    const entry = ref<RecurringEntry>({ id: 10, type: 'envelope', label: 'Santé', amount: 30, category: null, dayOfMonth: null, active: true, notes: null, createdAt: '', updatedAt: '' })
    const { totalSpent } = initRecurringEntryDetail({
      entry: entry,
      year: ref(2026),
      month: ref(3)
    })

    // For envelope: 30 (expense) - 20 (income) - 10 (income) = 0
    expect(totalSpent.value).toBe(0)
  })

  it('budgetRemaining accounts for income reimbursements in envelope', () => {
    const entry = ref<RecurringEntry>({ id: 10, type: 'envelope', label: 'Santé', amount: 30, category: null, dayOfMonth: null, active: true, notes: null, createdAt: '', updatedAt: '' })
    const { budgetRemaining } = initRecurringEntryDetail({
      entry: entry,
      year: ref(2026),
      month: ref(3)
    })

    // budgetRemaining = 30 - 0 = 30
    expect(budgetRemaining.value).toBe(30)
  })

  it('progressPercent is 0 when envelope fully reimbursed', () => {
    const entry = ref<RecurringEntry>({ id: 10, type: 'envelope', label: 'Santé', amount: 30, category: null, dayOfMonth: null, active: true, notes: null, createdAt: '', updatedAt: '' })
    const { progressPercent } = initRecurringEntryDetail({
      entry: entry,
      year: ref(2026),
      month: ref(3)
    })

    // totalSpent = 0, so progress = 0%
    expect(progressPercent.value).toBe(0)
  })

  it('filters transactions by entry id', () => {
    const entry = ref<RecurringEntry>({ id: 999, type: 'envelope', label: 'Other', amount: 100, category: null, dayOfMonth: null, active: true, notes: null, createdAt: '', updatedAt: '' })
    const { filteredTransactions } = initRecurringEntryDetail({
      entry: entry,
      year: ref(2026),
      month: ref(3)
    })

    // No transactions with recurringEntryId=999
    expect(filteredTransactions.value).toHaveLength(0)
  })
})
