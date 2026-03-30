import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { stubNuxtAutoImports } from '../../../../test/helpers/nuxt-stubs'
import type { AnalyticsSummary } from '~/types'

const mockSummary = ref<AnalyticsSummary>({
  averageMonthlyIncome: 4000,
  averageMonthlyExpense: 3000,
  averageMonthlySavings: 1000,
  savingsRate: 25,
  topGrowingCategories: [{ category: 'Restaurant', growthPercent: 30 }],
  topShrinkingCategories: [{ category: 'Transport', shrinkPercent: 10 }],
  bestMonth: { label: 'janvier 2026', savings: 2000 },
  worstMonth: { label: 'mars 2026', savings: -500 }
})

stubNuxtAutoImports({
  useFetch: () => ({
    data: mockSummary,
    status: ref('success')
  })
})

const { initAnalyticsSummary } = await import('./init')

describe('initAnalyticsSummary', () => {
  it('returns summary, status, and cards', () => {
    const result = initAnalyticsSummary()

    expect(result).toHaveProperty('summary')
    expect(result).toHaveProperty('status')
    expect(result).toHaveProperty('cards')
  })

  it('generates 6 KPI cards', () => {
    const { cards } = initAnalyticsSummary()

    expect(cards.value).toHaveLength(6)
  })

  it('first card is "Revenu moyen"', () => {
    const { cards } = initAnalyticsSummary()

    expect(cards.value[0].title).toBe('Revenu moyen')
    expect(cards.value[0].color).toBe('success')
  })

  it('second card is "Dépense moyenne"', () => {
    const { cards } = initAnalyticsSummary()

    expect(cards.value[1].title).toBe('Dépense moyenne')
    expect(cards.value[1].color).toBe('error')
  })

  it('épargne moyenne card is success when positive', () => {
    const { cards } = initAnalyticsSummary()

    expect(cards.value[2].title).toBe('Épargne moyenne')
    expect(cards.value[2].color).toBe('success')
  })

  it('taux d\'épargne card shows percentage', () => {
    const { cards } = initAnalyticsSummary()

    expect(cards.value[3].title).toBe('Taux d\'épargne')
    expect(cards.value[3].value).toBe('25%')
  })

  it('meilleur mois card shows label and subtitle', () => {
    const { cards } = initAnalyticsSummary()

    expect(cards.value[4].title).toBe('Meilleur mois')
    expect(cards.value[4].value).toBe('janvier 2026')
    expect(cards.value[4].subtitle).toBeDefined()
  })

  it('pire mois card shows label', () => {
    const { cards } = initAnalyticsSummary()

    expect(cards.value[5].title).toBe('Pire mois')
    expect(cards.value[5].value).toBe('mars 2026')
  })

  it('épargne moyenne card is error when negative', () => {
    mockSummary.value = {
      ...mockSummary.value,
      averageMonthlySavings: -200,
      savingsRate: -5
    }

    const { cards } = initAnalyticsSummary()

    expect(cards.value[2].color).toBe('error')
    expect(cards.value[3].color).toBe('error')
  })
})
