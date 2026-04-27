<script setup lang="ts">
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
  </div>
</template>
