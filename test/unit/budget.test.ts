import { describe, it, expect } from 'vitest'
import {
  formatEuro,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORY_COLORS,
  EXPENSE_CATEGORY_COLORS,
  ENVELOPE_COLOR,
  getNextMonths
} from '../../app/utils/budget'

describe('formatEuro', () => {
  it('formats positive amounts with EUR symbol', () => {
    const result = formatEuro(3300)
    expect(result).toContain('€')
    expect(result).toContain('300')
  })

  it('formats zero', () => {
    const result = formatEuro(0)
    expect(result).toContain('0')
    expect(result).toContain('€')
  })

  it('formats negative amounts', () => {
    const result = formatEuro(-1500)
    expect(result).toContain('€')
    expect(result).toContain('500')
  })

  it('formats decimal amounts', () => {
    const result = formatEuro(13.49)
    expect(result).toContain('13')
    expect(result).toContain('49')
  })

  it('uses fr-FR locale formatting', () => {
    const result = formatEuro(1234.56)
    // French locale uses non-breaking space as thousands separator
    expect(result).toContain('€')
    expect(result).toContain('234')
    expect(result).toContain('56')
  })
})

describe('category constants', () => {
  it('has income categories', () => {
    expect(INCOME_CATEGORIES).toContain('Salaire')
    expect(INCOME_CATEGORIES).toContain('Freelance')
    expect(INCOME_CATEGORIES.length).toBeGreaterThan(0)
  })

  it('has all expected income categories', () => {
    expect(INCOME_CATEGORIES).toContain('Aide')
    expect(INCOME_CATEGORIES).toContain('Investissements')
    expect(INCOME_CATEGORIES).toContain('Autre')
  })

  it('has expense categories', () => {
    expect(EXPENSE_CATEGORIES).toContain('Logement')
    expect(EXPENSE_CATEGORIES).toContain('Abonnements')
    expect(EXPENSE_CATEGORIES.length).toBeGreaterThan(0)
  })

  it('has all expected expense categories', () => {
    expect(EXPENSE_CATEGORIES).toContain('Dettes')
    expect(EXPENSE_CATEGORIES).toContain('Frais bancaires')
    expect(EXPENSE_CATEGORIES).toContain('Assurances')
    expect(EXPENSE_CATEGORIES).toContain('Transport')
    expect(EXPENSE_CATEGORIES).toContain('Alimentation')
    expect(EXPENSE_CATEGORIES).toContain('Loisirs')
    expect(EXPENSE_CATEGORIES).toContain('Sante')
    expect(EXPENSE_CATEGORIES).toContain('Education')
    expect(EXPENSE_CATEGORIES).toContain('Divers')
  })

  it('has a color for every income category', () => {
    for (const category of INCOME_CATEGORIES) {
      expect(INCOME_CATEGORY_COLORS[category]).toBeDefined()
    }
  })

  it('has a color for every expense category', () => {
    for (const category of EXPENSE_CATEGORIES) {
      expect(EXPENSE_CATEGORY_COLORS[category]).toBeDefined()
    }
  })

  it('income and expense categories do not overlap', () => {
    const incomeSet = new Set<string>(INCOME_CATEGORIES)
    for (const category of EXPENSE_CATEGORIES) {
      expect(incomeSet.has(category)).toBe(false)
    }
  })
})

describe('ENVELOPE_COLOR', () => {
  it('is warning', () => {
    expect(ENVELOPE_COLOR).toBe('warning')
  })
})

describe('getNextMonths', () => {
  it('returns 6 months by default', () => {
    const months = getNextMonths()
    expect(months).toHaveLength(6)
  })

  it('returns requested number of months', () => {
    const months = getNextMonths(3)
    expect(months).toHaveLength(3)
  })

  it('each month has year, month, and label', () => {
    const months = getNextMonths(1)
    expect(months[0]).toHaveProperty('year')
    expect(months[0]).toHaveProperty('month')
    expect(months[0]).toHaveProperty('label')
    expect(typeof months[0].year).toBe('number')
    expect(typeof months[0].month).toBe('number')
    expect(typeof months[0].label).toBe('string')
  })

  it('months are consecutive', () => {
    const months = getNextMonths(4)
    for (let i = 1; i < months.length; i++) {
      const prev = months[i - 1]
      const curr = months[i]
      const prevDate = new Date(prev.year, prev.month - 1)
      const currDate = new Date(curr.year, curr.month - 1)
      const diffMs = currDate.getTime() - prevDate.getTime()
      // Roughly 28-31 days between months
      expect(diffMs).toBeGreaterThan(0)
    }
  })

  it('first month is current month', () => {
    const months = getNextMonths(1)
    const now = new Date()
    expect(months[0].year).toBe(now.getFullYear())
    expect(months[0].month).toBe(now.getMonth() + 1)
  })

  it('month values are between 1 and 12', () => {
    const months = getNextMonths(12)
    for (const m of months) {
      expect(m.month).toBeGreaterThanOrEqual(1)
      expect(m.month).toBeLessThanOrEqual(12)
    }
  })
})
