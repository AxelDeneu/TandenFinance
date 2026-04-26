import type { Category } from '~/types'

interface CategoryStyle {
  color: string
  icon: string
}

const FALLBACK: CategoryStyle = { color: '#6B7489', icon: 'i-lucide-tag' }

const STATIC_STYLES: Record<string, CategoryStyle> = {
  // Revenus
  'Salaire': { color: '#4ADE80', icon: 'i-lucide-briefcase' },
  'Freelance': { color: '#22D3EE', icon: 'i-lucide-laptop' },
  'Aides sociales': { color: '#FBBF24', icon: 'i-lucide-hand-helping' },
  'Investissements': { color: '#1FB578', icon: 'i-lucide-trending-up' },
  'Primes': { color: '#4ADE80', icon: 'i-lucide-sparkles' },
  'Remboursements': { color: '#22D3EE', icon: 'i-lucide-undo-2' },
  'Vente': { color: '#FBBF24', icon: 'i-lucide-tag' },

  // Dépenses
  'Loyer': { color: '#60A5FA', icon: 'i-lucide-home' },
  'Logement': { color: '#60A5FA', icon: 'i-lucide-home' },
  'Charges': { color: '#FBBF24', icon: 'i-lucide-receipt' },
  'Énergie': { color: '#FBBF24', icon: 'i-lucide-zap' },
  'Eau': { color: '#22D3EE', icon: 'i-lucide-droplets' },
  'Télécom': { color: '#A78BFA', icon: 'i-lucide-wifi' },
  'Abonnements': { color: '#A78BFA', icon: 'i-lucide-credit-card' },
  'Transport': { color: '#22D3EE', icon: 'i-lucide-fuel' },
  'Alimentation': { color: '#1FB578', icon: 'i-lucide-shopping-cart' },
  'Courses': { color: '#1FB578', icon: 'i-lucide-shopping-cart' },
  'Restaurant': { color: '#F87171', icon: 'i-lucide-coffee' },
  'Restaurants': { color: '#F87171', icon: 'i-lucide-coffee' },
  'Santé': { color: '#F472B6', icon: 'i-lucide-heart' },
  'Pharmacie': { color: '#F472B6', icon: 'i-lucide-heart' },
  'Enfants': { color: '#FB923C', icon: 'i-lucide-baby' },
  'Bébé': { color: '#FB923C', icon: 'i-lucide-baby' },
  'Habillement': { color: '#A78BFA', icon: 'i-lucide-shirt' },
  'Loisirs': { color: '#F6946A', icon: 'i-lucide-play' },
  'Éducation': { color: '#FBBF24', icon: 'i-lucide-graduation-cap' },
  'Cadeaux': { color: '#FB923C', icon: 'i-lucide-gift' },
  'Épargne': { color: '#1FB578', icon: 'i-lucide-piggy-bank' },
  'Impôts': { color: '#F87171', icon: 'i-lucide-landmark' },
  'Dettes': { color: '#F87171', icon: 'i-lucide-credit-card' },
  'Assurances': { color: '#A5ADBE', icon: 'i-lucide-shield' },
  'Frais bancaires': { color: '#A5ADBE', icon: 'i-lucide-banknote' },
  'Animaux': { color: '#FB923C', icon: 'i-lucide-dog' },
  'Imprévus': { color: '#A78BFA', icon: 'i-lucide-sparkles' },
  'Carburant': { color: '#22D3EE', icon: 'i-lucide-fuel' },
  'Divers': { color: '#A5ADBE', icon: 'i-lucide-tag' },
  'Autre': { color: '#A5ADBE', icon: 'i-lucide-tag' }
}

export function getCategoryStyle(category: Category | string | null | undefined): CategoryStyle {
  if (!category) return FALLBACK
  if (typeof category === 'object') return { color: category.color, icon: category.icon }
  return STATIC_STYLES[category] ?? FALLBACK
}

export function withAlpha(hex: string, alpha: string): string {
  return `${hex}${alpha}`
}
