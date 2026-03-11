import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { stubNuxtAutoImports } from '../../../../test/helpers/nuxt-stubs'
import type { CategoryTrendItem } from '~/types'

const mockCategories = ref<{ categories: CategoryTrendItem[] }>({
  categories: [
    {
      category: 'Alimentation',
      type: 'expense',
      monthlyAmounts: [
        { month: '2026-01', amount: 300 },
        { month: '2026-02', amount: 350 },
        { month: '2026-03', amount: 400 }
      ],
      average: 350,
      trend: 'rising'
    },
    {
      category: 'Transport',
      type: 'expense',
      monthlyAmounts: [
        { month: '2026-01', amount: 100 },
        { month: '2026-02', amount: 80 },
        { month: '2026-03', amount: 60 }
      ],
      average: 80,
      trend: 'falling'
    },
    {
      category: 'Salaire',
      type: 'income',
      monthlyAmounts: [
        { month: '2026-01', amount: 3000 },
        { month: '2026-02', amount: 3000 },
        { month: '2026-03', amount: 3000 }
      ],
      average: 3000,
      trend: 'stable'
    }
  ]
})

stubNuxtAutoImports({
  useFetch: () => ({
    data: mockCategories,
    status: ref('success')
  }),
  useElementSize: () => ({ width: ref(800), height: ref(400) })
})

const { initCategoryTrends } = await import('./init')

function createContext() {
  return { cardRef: ref(null) }
}

describe('initCategoryTrends', () => {
  it('returns all expected properties', () => {
    const result = initCategoryTrends(createContext())

    expect(result).toHaveProperty('width')
    expect(result).toHaveProperty('status')
    expect(result).toHaveProperty('monthCount')
    expect(result).toHaveProperty('selectedType')
    expect(result).toHaveProperty('activeCategories')
    expect(result).toHaveProperty('selectedCategories')
    expect(result).toHaveProperty('displayedCategories')
    expect(result).toHaveProperty('chartData')
    expect(result).toHaveProperty('x')
    expect(result).toHaveProperty('yAccessors')
    expect(result).toHaveProperty('colors')
    expect(result).toHaveProperty('xTicks')
    expect(result).toHaveProperty('trendIcon')
    expect(result).toHaveProperty('trendColor')
  })

  it('defaults to expense type', () => {
    const { selectedType } = initCategoryTrends(createContext())
    expect(selectedType.value).toBe('expense')
  })

  it('filters expense categories when type is expense', () => {
    const { activeCategories } = initCategoryTrends(createContext())
    expect(activeCategories.value).toHaveLength(2)
    expect(activeCategories.value.every(c => c.type === 'expense')).toBe(true)
  })

  it('auto-selects categories on load', () => {
    const { selectedCategories } = initCategoryTrends(createContext())
    expect(selectedCategories.value.length).toBeGreaterThan(0)
  })

  it('trendIcon returns correct icons', () => {
    const { trendIcon } = initCategoryTrends(createContext())

    expect(trendIcon('rising')).toBe('i-lucide-trending-up')
    expect(trendIcon('falling')).toBe('i-lucide-trending-down')
    expect(trendIcon('stable')).toBe('i-lucide-minus')
  })

  it('trendColor returns correct colors for expense', () => {
    const { trendColor } = initCategoryTrends(createContext())

    expect(trendColor('rising', 'expense')).toBe('error')
    expect(trendColor('falling', 'expense')).toBe('success')
    expect(trendColor('stable', 'expense')).toBe('neutral')
  })

  it('trendColor returns correct colors for income', () => {
    const { trendColor } = initCategoryTrends(createContext())

    expect(trendColor('rising', 'income')).toBe('success')
    expect(trendColor('falling', 'income')).toBe('error')
    expect(trendColor('stable', 'income')).toBe('neutral')
  })

  it('x accessor returns index', () => {
    const { x } = initCategoryTrends(createContext())
    expect(x({ month: '2026-01' }, 3)).toBe(3)
  })

  it('generates chartData from displayed categories', () => {
    const { chartData } = initCategoryTrends(createContext())

    expect(chartData.value.length).toBeGreaterThan(0)
    expect(chartData.value[0]).toHaveProperty('month')
  })

  it('yAccessors has one entry per displayed category', () => {
    const { yAccessors, displayedCategories } = initCategoryTrends(createContext())
    expect(yAccessors.value).toHaveLength(displayedCategories.value.length)
  })

  it('filters income categories when type is income', () => {
    const result = initCategoryTrends(createContext())
    result.selectedType.value = 'income'
    expect(result.activeCategories.value).toHaveLength(1)
    expect(result.activeCategories.value[0].type).toBe('income')
  })

  it('colors maps category colors to CSS vars', () => {
    const result = initCategoryTrends(createContext())
    expect(result.colors.value.length).toBeGreaterThan(0)
    for (const color of result.colors.value) {
      expect(color).toMatch(/^var\(--ui-/)
    }
  })

  it('xTicks formats month label in French', () => {
    const result = initCategoryTrends(createContext())
    const tick = result.xTicks(0)
    expect(tick).toBeTruthy()
    expect(typeof tick).toBe('string')
  })

  it('xTicks returns empty string for invalid index', () => {
    const result = initCategoryTrends(createContext())
    expect(result.xTicks(999)).toBe('')
  })

  it('displayedCategories filters by selectedCategories', () => {
    const result = initCategoryTrends(createContext())
    result.selectedCategories.value = ['Alimentation']
    expect(result.displayedCategories.value).toHaveLength(1)
    expect(result.displayedCategories.value[0].category).toBe('Alimentation')
  })
})
