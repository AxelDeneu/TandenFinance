<script setup lang="ts">
const { isNotificationsSlideoverOpen } = useDashboard()
const { previousMonth, nextMonth } = useSelectedMonth()
</script>

<template>
  <div class="flex items-center gap-1">
    <UButton
      color="neutral"
      variant="ghost"
      icon="i-lucide-chevron-left"
      square
      size="sm"
      @click="previousMonth"
    />
    <BudgetMonthPicker />
    <UButton
      color="neutral"
      variant="ghost"
      icon="i-lucide-chevron-right"
      square
      size="sm"
      @click="nextMonth"
    />

    <UTooltip text="Notifications" :shortcuts="['N']">
      <UButton
        color="neutral"
        variant="ghost"
        square
        @click="isNotificationsSlideoverOpen = true"
      >
        <UChip color="error" inset>
          <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
        </UChip>
      </UButton>
    </UTooltip>
  </div>
</template>
