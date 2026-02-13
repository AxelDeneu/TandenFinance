import { formatTimeAgo } from '@vueuse/core'
import type { Notification } from '~/types'

export function initNotificationsSlideover() {
  const { isNotificationsSlideoverOpen } = useDashboard()

  const { data: notifications } = useFetch<Notification[]>('/api/notifications')

  return {
    isNotificationsSlideoverOpen,
    notifications,
    formatTimeAgo
  }
}
