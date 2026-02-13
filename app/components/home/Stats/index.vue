<script setup lang="ts">
import { initHomeStats } from './init'

const { stats, leadingClasses } = await initHomeStats()
</script>

<template>
  <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px">
    <UPageCard
      v-for="(stat, index) in stats"
      :key="index"
      :icon="stat.icon"
      :title="stat.title"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: leadingClasses[stat.color],
        title: 'font-normal text-muted text-xs uppercase'
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ stat.value }}
        </span>

        <UBadge
          :color="stat.color"
          variant="subtle"
          class="text-xs"
        >
          {{ stat.count }} {{ stat.count > 1 ? 'entrees' : 'entree' }}
        </UBadge>
      </div>
    </UPageCard>
  </UPageGrid>
</template>
