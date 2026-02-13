export const INCOME_CATEGORIES = [
  'Salaire',
  'Freelance',
  'Aide',
  'Investissements',
  'Autre'
] as const

export const EXPENSE_CATEGORIES = [
  'Logement',
  'Abonnements',
  'Dettes',
  'Frais bancaires',
  'Assurances',
  'Transport',
  'Alimentation',
  'Loisirs',
  'Sante',
  'Education',
  'Divers'
] as const

export const EXPENSE_CATEGORY_COLORS: Record<string, string> = {
  'Logement': 'warning',
  'Abonnements': 'info',
  'Dettes': 'error',
  'Frais bancaires': 'neutral',
  'Assurances': 'primary',
  'Transport': 'info',
  'Alimentation': 'success',
  'Loisirs': 'primary',
  'Sante': 'error',
  'Education': 'warning',
  'Divers': 'neutral'
}

export const INCOME_CATEGORY_COLORS: Record<string, string> = {
  Salaire: 'success',
  Freelance: 'info',
  Aide: 'warning',
  Investissements: 'primary',
  Autre: 'neutral'
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
