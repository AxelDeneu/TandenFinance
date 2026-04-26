import { createSharedComposable } from '@vueuse/core'

const _useDashboard = () => {
  const route = useRoute()
  const router = useRouter()
  const isNotificationsSlideoverOpen = ref(false)

  defineShortcuts({
    'g-h': () => router.push('/'),
    'g-b': () => router.push('/budget'),
    'g-c': () => router.push('/budget/comptabilite'),
    'g-p': () => router.push('/budget/previsionnel'),
    'g-t': () => router.push('/budget/historique'),
    'g-n': () => router.push('/budget/analyse'),
    'g-a': () => router.push('/budget/alertes'),
    'g-s': () => router.push('/configuration'),
    'n': () => isNotificationsSlideoverOpen.value = !isNotificationsSlideoverOpen.value
  })

  watch(() => route.fullPath, () => {
    isNotificationsSlideoverOpen.value = false
  })

  return {
    isNotificationsSlideoverOpen
  }
}

export const useDashboard = createSharedComposable(_useDashboard)
