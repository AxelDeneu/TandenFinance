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

export function formatEuro(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}
