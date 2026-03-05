import { formatTimeAgo } from '@vueuse/core'
import type { Notification } from '~/types'

export function initNotificationsSlideover() {
  const { isNotificationsSlideoverOpen } = useDashboard()

  const { data: notifications, refresh } = useFetch<Notification[]>('/api/notifications', {
    default: () => []
  })

  const unreadCount = computed(() =>
    (notifications.value ?? []).filter(n => !n.read).length
  )

  async function markAsRead(notification: Notification) {
    if (notification.read) return
    await $fetch(`/api/notifications/${notification.id}/read`, { method: 'PATCH' })
    refresh()
  }

  async function markAllAsRead() {
    await $fetch('/api/notifications/read-all', { method: 'POST' })
    refresh()
  }

  return {
    isNotificationsSlideoverOpen,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh,
    formatTimeAgo
  }
}
