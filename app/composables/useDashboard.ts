import { createSharedComposable } from '@vueuse/core'

const _useDashboard = () => {
  const router = useRouter()

  defineShortcuts({
    'g-h': () => router.push('/'),
    'g-b': () => router.push('/budget'),
    'g-c': () => router.push('/budget/comptabilite'),
    'g-p': () => router.push('/budget/previsionnel'),
    'g-t': () => router.push('/budget/historique'),
    'g-n': () => router.push('/budget/analyse'),
    'g-s': () => router.push('/configuration')
  })
}

export const useDashboard = createSharedComposable(_useDashboard)
