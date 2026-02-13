import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { initNotificationsSlideover } from './init'

vi.mock('@vueuse/core', () => ({
  formatTimeAgo: vi.fn((_date: Date) => '2 hours ago')
}))

const mockIsNotificationsSlideoverOpen = ref(false)

vi.mock('~/composables/useDashboard', () => ({
  useDashboard: () => ({
    isNotificationsSlideoverOpen: mockIsNotificationsSlideoverOpen
  })
}))

const mockNotifications = ref([
  {
    id: 1,
    unread: true,
    sender: { name: 'John', avatar: { src: '/john.png' } },
    body: 'Test notification',
    date: '2024-01-01'
  }
])

vi.mock('#app', () => ({
  useFetch: vi.fn(() => ({ data: mockNotifications }))
}))

// Stub Nuxt auto-imports
vi.stubGlobal('useDashboard', () => ({
  isNotificationsSlideoverOpen: mockIsNotificationsSlideoverOpen
}))

vi.stubGlobal('useFetch', vi.fn(() => ({ data: mockNotifications })))

describe('initNotificationsSlideover', () => {
  beforeEach(() => {
    mockIsNotificationsSlideoverOpen.value = false
    mockNotifications.value = [
      {
        id: 1,
        unread: true,
        sender: { name: 'John', avatar: { src: '/john.png' } },
        body: 'Test notification',
        date: '2024-01-01'
      }
    ]
  })

  it('should return isNotificationsSlideoverOpen ref', () => {
    const result = initNotificationsSlideover()
    expect(result.isNotificationsSlideoverOpen).toBeDefined()
    expect(result.isNotificationsSlideoverOpen.value).toBe(false)
  })

  it('should return notifications data', () => {
    const result = initNotificationsSlideover()
    expect(result.notifications).toBeDefined()
    expect(result.notifications.value).toHaveLength(1)
    expect(result.notifications.value![0].sender.name).toBe('John')
  })

  it('should return formatTimeAgo function', () => {
    const result = initNotificationsSlideover()
    expect(typeof result.formatTimeAgo).toBe('function')
  })

  it('should toggle slideover open state', () => {
    const result = initNotificationsSlideover()
    result.isNotificationsSlideoverOpen.value = true
    expect(result.isNotificationsSlideoverOpen.value).toBe(true)
  })
})
