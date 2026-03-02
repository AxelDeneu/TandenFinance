export const INCOME_CATEGORIES = [
  'Salaire',
  'Freelance',
  'Aides sociales',
  'Investissements',
  'Primes',
  'Remboursements',
  'Vente',
  'Autre'
] as const

export const EXPENSE_CATEGORIES = [
  'Loyer',
  'Charges',
  'Énergie',
  'Eau',
  'Télécom',
  'Abonnements',
  'Transport',
  'Alimentation',
  'Restaurant',
  'Santé',
  'Enfants',
  'Habillement',
  'Loisirs',
  'Éducation',
  'Cadeaux',
  'Épargne',
  'Impôts',
  'Dettes',
  'Assurances',
  'Frais bancaires',
  'Divers'
] as const

export type UiColor = 'neutral' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'

export function getCategoryColor(category: string, type: 'income' | 'expense'): UiColor {
  if (type === 'income') return INCOME_CATEGORY_COLORS[category] ?? 'neutral'
  return EXPENSE_CATEGORY_COLORS[category] ?? 'neutral'
}

export const EXPENSE_CATEGORY_COLORS: Record<string, UiColor> = {
  'Loyer': 'warning',
  'Charges': 'warning',
  'Énergie': 'warning',
  'Eau': 'info',
  'Télécom': 'info',
  'Abonnements': 'info',
  'Transport': 'primary',
  'Alimentation': 'success',
  'Restaurant': 'success',
  'Santé': 'error',
  'Enfants': 'primary',
  'Habillement': 'neutral',
  'Loisirs': 'primary',
  'Éducation': 'warning',
  'Cadeaux': 'primary',
  'Épargne': 'success',
  'Impôts': 'error',
  'Dettes': 'error',
  'Assurances': 'neutral',
  'Frais bancaires': 'neutral',
  'Divers': 'neutral'
}

export const INCOME_CATEGORY_COLORS: Record<string, UiColor> = {
  'Salaire': 'success',
  'Freelance': 'info',
  'Aides sociales': 'warning',
  'Investissements': 'primary',
  'Primes': 'success',
  'Remboursements': 'info',
  'Vente': 'warning',
  'Autre': 'neutral'
}

export const ENVELOPE_COLOR = 'warning'

export function formatEuro(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

export function getNextMonths(count = 6): { year: number, month: number, label: string }[] {
  const now = new Date()
  const months: { year: number, month: number, label: string }[] = []
  const formatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })

  for (let i = 0; i < count; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
    months.push({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      label: formatter.format(date)
    })
  }

  return months
}
