import { vi } from 'vitest'
import { ref, computed, watch, reactive } from 'vue'

export function stubNuxtAutoImports(overrides?: Record<string, unknown>) {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('watch', watch)
  vi.stubGlobal('reactive', reactive)
  vi.stubGlobal('formatEuro', (v: number) => `${v.toFixed(2)} \u20AC`)
  vi.stubGlobal('INCOME_CATEGORY_COLORS', { Salaire: 'success', Freelance: 'info', Aide: 'warning', Investissements: 'primary', Autre: 'neutral' })
  vi.stubGlobal('EXPENSE_CATEGORY_COLORS', { Logement: 'warning', Abonnements: 'info', Dettes: 'error' })
  vi.stubGlobal('ENVELOPE_COLOR', 'warning')
  vi.stubGlobal('INCOME_CATEGORIES', ['Salaire', 'Freelance', 'Aide', 'Investissements', 'Autre'])
  vi.stubGlobal('EXPENSE_CATEGORIES', ['Logement', 'Abonnements', 'Dettes', 'Frais bancaires', 'Assurances', 'Transport', 'Alimentation', 'Loisirs', 'Sante', 'Education', 'Divers'])
  vi.stubGlobal('getCategoryColor', (category: string, type: string) => {
    if (type === 'income') return ({ Salaire: 'success', Freelance: 'info' } as Record<string, string>)[category] ?? 'neutral'
    return ({ Logement: 'warning', Abonnements: 'info' } as Record<string, string>)[category] ?? 'neutral'
  })
  vi.stubGlobal('TABLE_UI', {
    base: 'table-fixed border-separate border-spacing-0',
    thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
    tbody: '[&>tr]:last:[&>td]:border-b-0',
    th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
    td: 'border-b border-default',
    separator: 'h-0'
  })
  vi.stubGlobal('useRoute', () => ({ query: {} }))
  vi.stubGlobal('useSelectedMonth', () => {
    const month = ref('2026-04')
    return {
      selectedMonth: computed(() => month.value),
      selectedMonthLabel: computed(() => 'avril 2026'),
      setMonth: vi.fn((v: string) => { month.value = v }),
      previousMonth: vi.fn(),
      nextMonth: vi.fn()
    }
  })
  vi.stubGlobal('useColorMode', () => {
    const mode = { value: 'light', preference: 'light' }
    return mode
  })
  vi.stubGlobal('useToast', () => ({ add: vi.fn() }))
  vi.stubGlobal('useErrorToast', () => ({ showErrorToast: vi.fn() }))
  vi.stubGlobal('$fetch', vi.fn())
  vi.stubGlobal('useTemplateRef', () => ref(null))

  vi.stubGlobal('computeEffectiveTotal', (entries: { entry: { amount: number }, actuals: Record<string, number | null> }[], monthKey: string) => {
    let total = 0
    for (const fe of entries) {
      const actual = fe.actuals[monthKey]
      total += (actual !== null && actual !== undefined) ? actual : fe.entry.amount
    }
    return total
  })

  vi.stubGlobal('computeEnvelopeEffectiveTotal', (entries: { entry: { amount: number }, actuals: Record<string, number | null> }[], monthKey: string) => {
    let total = 0
    for (const fe of entries) {
      const actual = fe.actuals[monthKey]
      total += (actual !== null && actual !== undefined) ? Math.max(actual, fe.entry.amount) : fe.entry.amount
    }
    return total
  })

  vi.stubGlobal('useMonthNavigation', () => {
    const yr = ref(new Date().getFullYear())
    const mo = ref(new Date().getMonth() + 1)
    const label = computed(() => {
      const date = new Date(yr.value, mo.value - 1, 1)
      return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date)
    })
    const key = computed(() => `${yr.value}-${mo.value}`)
    function previousMonth() {
      if (mo.value === 1) {
        mo.value = 12
        yr.value--
      } else {
        mo.value--
      }
    }
    function nextMonth() {
      if (mo.value === 12) {
        mo.value = 1
        yr.value++
      } else {
        mo.value++
      }
    }
    return { selectedYear: yr, selectedMonth: mo, selectedMonthLabel: label, monthKey: key, previousMonth, nextMonth }
  })

  if (overrides) {
    for (const [key, value] of Object.entries(overrides)) {
      vi.stubGlobal(key, value)
    }
  }
}
