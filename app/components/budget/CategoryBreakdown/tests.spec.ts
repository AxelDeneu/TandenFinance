import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { stubNuxtAutoImports } from '../../../../test/helpers/nuxt-stubs'
import type { CategoryBreakdownItem } from '~/types'

const mockData = ref<{ expenses: CategoryBreakdownItem[], incomes: CategoryBreakdownItem[] }>({
  expenses: [
    { category: 'Alimentation', amount: 500, percent: 50, color: '#22c55e' },
    { category: 'Loyer', amount: 300, percent: 30, color: '#f59e0b' },
    { category: 'Transport', amount: 200, percent: 20, color: '#06b6d4' }
  ],
  incomes: [
    { category: 'Salaire', amount: 3000, percent: 85.7, color: '#22c55e' },
    { category: 'Freelance', amount: 500, percent: 14.3, color: '#3b82f6' }
  ]
})

stubNuxtAutoImports({
  useFetch: () => ({
    data: mockData,
    status: ref('success')
  })
})

const { initCategoryBreakdown } = await import('./init')

describe('initCategoryBreakdown', () => {
  it('returns all expected properties', () => {
    const result = initCategoryBreakdown()

    expect(result).toHaveProperty('selectedYear')
    expect(result).toHaveProperty('selectedMonth')
    expect(result).toHaveProperty('selectedMonthLabel')
    expect(result).toHaveProperty('previousMonth')
    expect(result).toHaveProperty('nextMonth')
    expect(result).toHaveProperty('selectedType')
    expect(result).toHaveProperty('breakdown')
    expect(result).toHaveProperty('total')
    expect(result).toHaveProperty('status')
  })

  it('defaults to expenses type', () => {
    const { selectedType } = initCategoryBreakdown()
    expect(selectedType.value).toBe('expenses')
  })

  it('shows expense breakdown by default', () => {
    const { breakdown } = initCategoryBreakdown()

    expect(breakdown.value).toHaveLength(3)
    expect(breakdown.value[0].category).toBe('Alimentation')
  })

  it('calculates total correctly for expenses', () => {
    const { total } = initCategoryBreakdown()
    expect(total.value).toBe(1000)
  })

  it('switches to income breakdown when type changes', () => {
    const { selectedType, breakdown } = initCategoryBreakdown()
    selectedType.value = 'incomes'

    expect(breakdown.value).toHaveLength(2)
    expect(breakdown.value[0].category).toBe('Salaire')
  })

  it('calculates total correctly for incomes', () => {
    const { selectedType, total } = initCategoryBreakdown()
    selectedType.value = 'incomes'
    expect(total.value).toBe(3500)
  })

  it('selectedMonthLabel is defined and non-empty', () => {
    const { selectedMonthLabel } = initCategoryBreakdown()
    expect(selectedMonthLabel.value).toBeTruthy()
  })

  it('previousMonth and nextMonth are functions', () => {
    const { previousMonth, nextMonth } = initCategoryBreakdown()
    expect(typeof previousMonth).toBe('function')
    expect(typeof nextMonth).toBe('function')
  })

  it('handles empty data gracefully', () => {
    mockData.value = { expenses: [], incomes: [] }
    const { breakdown, total } = initCategoryBreakdown()

    expect(breakdown.value).toHaveLength(0)
    expect(total.value).toBe(0)
  })
})
