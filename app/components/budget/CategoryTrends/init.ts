import type { Ref } from 'vue'
import type { CategoryTrendItem } from '~/types'

export type TrendChartRecord = {
  month: string
  [category: string]: number | string
}

interface Context {
  cardRef: Ref<HTMLElement | null>
}

export function initCategoryTrends(ctx: Context) {
  const { width } = useElementSize(ctx.cardRef)

  const monthCount = ref(6)

  const { data, status } = useFetch<{ categories: CategoryTrendItem[] }>('/api/budget/analytics/category-trends', {
    lazy: true,
    query: computed(() => ({ months: monthCount.value })),
    default: () => ({ categories: [] })
  })

  const expenseCategories = computed(() =>
    (data.value?.categories ?? []).filter(c => c.type === 'expense')
  )

  const incomeCategories = computed(() =>
    (data.value?.categories ?? []).filter(c => c.type === 'income')
  )

  const selectedType = ref<'expense' | 'income'>('expense')

  const activeCategories = computed(() =>
    selectedType.value === 'expense' ? expenseCategories.value : incomeCategories.value
  )

  const selectedCategories = ref<string[]>([])

  // Auto-select top 5 categories when data loads
  watch(activeCategories, (cats) => {
    selectedCategories.value = cats.slice(0, 5).map(c => c.category)
  }, { immediate: true })

  const displayedCategories = computed(() =>
    activeCategories.value.filter(c => selectedCategories.value.includes(c.category))
  )

  const chartData = computed<TrendChartRecord[]>(() => {
    const cats = displayedCategories.value
    if (!cats.length) return []

    const monthKeys = cats[0]!.monthlyAmounts.map(m => m.month)
    return monthKeys.map((month) => {
      const record: TrendChartRecord = { month }
      for (const cat of cats) {
        const monthData = cat.monthlyAmounts.find(m => m.month === month)
        record[cat.category] = monthData?.amount ?? 0
      }
      return record
    })
  })

  const x = (_: TrendChartRecord, i: number) => i

  const yAccessors = computed(() =>
    displayedCategories.value.map(cat => (d: TrendChartRecord) => (d[cat.category] as number) ?? 0)
  )

  const colors = computed(() =>
    displayedCategories.value.map((cat) => {
      const color = getCategoryColor(cat.category, cat.type)
      const colorMap: Record<string, string> = {
        success: 'var(--ui-success)',
        error: 'var(--ui-error)',
        warning: 'var(--ui-warning)',
        info: 'var(--ui-info)',
        primary: 'var(--ui-primary)',
        secondary: 'var(--ui-secondary)',
        neutral: 'var(--ui-text-muted)'
      }
      return colorMap[color] ?? 'var(--ui-text-muted)'
    })
  )

  const xTicks = (i: number) => {
    if (!chartData.value[i]) return ''
    const parts = chartData.value[i]!.month.split('-').map(Number)
    const y = parts[0]!
    const m = parts[1]!
    const formatter = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
    return formatter.format(new Date(y, m - 1, 1))
  }

  const trendIcon = (trend: string) => {
    if (trend === 'rising') return 'i-lucide-trending-up'
    if (trend === 'falling') return 'i-lucide-trending-down'
    return 'i-lucide-minus'
  }

  const trendColor = (trend: string, type: string) => {
    if (type === 'expense') {
      return trend === 'rising' ? 'error' : trend === 'falling' ? 'success' : 'neutral'
    }
    return trend === 'rising' ? 'success' : trend === 'falling' ? 'error' : 'neutral'
  }

  return {
    width,
    status,
    monthCount,
    selectedType,
    activeCategories,
    selectedCategories,
    displayedCategories,
    chartData,
    x,
    yAccessors,
    colors,
    xTicks,
    trendIcon,
    trendColor
  }
}
