<script setup lang="ts">
import { initNotificationsSlideover } from './init'

const router = useRouter()
const {
  isNotificationsSlideoverOpen,
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
  formatTimeAgo
} = initNotificationsSlideover()

function onNotificationClick(notification: typeof notifications.value[number]) {
  markAsRead(notification)
  if (notification.actionUrl) {
    router.push(notification.actionUrl)
    isNotificationsSlideoverOpen.value = false
  }
}

const colorMap: Record<string, string> = {
  error: 'text-error',
  warning: 'text-warning',
  success: 'text-success',
  info: 'text-info'
}
</script>

<template>
  <USlideover
    v-model:open="isNotificationsSlideoverOpen"
    title="Notifications"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-2">
          <span class="text-lg font-semibold">Notifications</span>
          <UBadge
            v-if="unreadCount > 0"
            color="error"
            variant="subtle"
            size="xs"
          >
            {{ unreadCount }}
          </UBadge>
        </div>
        <UButton
          v-if="unreadCount > 0"
          label="Tout marquer lu"
          variant="ghost"
          color="neutral"
          size="xs"
          icon="i-lucide-check-check"
          @click="markAllAsRead"
        />
      </div>
    </template>

    <template #body>
      <div v-if="!notifications?.length" class="text-center text-muted py-8">
        Aucune notification.
      </div>

      <button
        v-for="notification in notifications"
        :key="notification.id"
        class="w-full text-left px-3 py-2.5 rounded-md hover:bg-elevated/50 flex items-center gap-3 relative -mx-3 first:-mt-3 last:-mb-3"
        @click="onNotificationClick(notification)"
      >
        <div class="relative">
          <UIcon
            :name="notification.icon ?? 'i-lucide-bell'"
            :class="[colorMap[notification.color ?? ''] ?? 'text-muted', 'text-lg']"
          />
          <span
            v-if="!notification.read"
            class="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-error"
          />
        </div>

        <div class="text-sm flex-1 min-w-0">
          <p class="flex items-center justify-between gap-2">
            <span class="text-highlighted font-medium truncate">{{ notification.title }}</span>
            <time
              :datetime="notification.createdAt"
              class="text-muted text-xs shrink-0"
              v-text="formatTimeAgo(new Date(notification.createdAt))"
            />
          </p>
          <p class="text-dimmed truncate">
            {{ notification.body }}
          </p>
        </div>
      </button>
    </template>
  </USlideover>
</template>
