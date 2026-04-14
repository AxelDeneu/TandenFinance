<script setup lang="ts">
const { selectedMonth, selectedMonthLabel, setMonth } = useSelectedMonth()

const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

const displayYear = ref(new Date().getFullYear())

// Sync displayYear when selectedMonth changes
watch(selectedMonth, (val) => {
  const [year] = val.split('-').map(Number)
  if (year) displayYear.value = year
}, { immediate: true })

function prevYear() {
  displayYear.value--
}

function nextYear() {
  displayYear.value++
}

function isSelected(year: number, month: number) {
  return selectedMonth.value === `${year}-${String(month).padStart(2, '0')}`
}

function selectMonth(year: number, month: number) {
  setMonth(`${year}-${String(month).padStart(2, '0')}`)
}
</script>

<template>
  <UPopover>
    <UButton
      variant="ghost"
      color="neutral"
      :label="selectedMonthLabel"
      trailing-icon="i-lucide-chevron-down"
      class="capitalize min-w-32 text-sm font-medium"
    />
    <template #content>
      <div class="p-3 w-64">
        <!-- Year navigation -->
        <div class="flex items-center justify-between mb-3">
          <UButton
            icon="i-lucide-chevron-left"
            variant="ghost"
            color="neutral"
            size="xs"
            @click="prevYear"
          />
          <span class="font-semibold text-sm">{{ displayYear }}</span>
          <UButton
            icon="i-lucide-chevron-right"
            variant="ghost"
            color="neutral"
            size="xs"
            @click="nextYear"
          />
        </div>
        <!-- Month grid -->
        <div class="grid grid-cols-3 gap-1">
          <UButton
            v-for="(month, idx) in MONTHS_SHORT"
            :key="idx"
            :label="month"
            :variant="isSelected(displayYear, idx + 1) ? 'solid' : 'ghost'"
            color="neutral"
            size="xs"
            class="justify-center"
            @click="selectMonth(displayYear, idx + 1)"
          />
        </div>
      </div>
    </template>
  </UPopover>
</template>
