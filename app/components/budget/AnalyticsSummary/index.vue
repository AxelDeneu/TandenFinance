<script setup lang="ts">
import { initAnalyticsSummary } from './init'

const { status, cards } = initAnalyticsSummary()

const leadingClasses = {
  success: 'p-2.5 rounded-full bg-success/10 ring ring-inset ring-success/25 flex-col',
  error: 'p-2.5 rounded-full bg-error/10 ring ring-inset ring-error/25 flex-col',
  warning: 'p-2.5 rounded-full bg-warning/10 ring ring-inset ring-warning/25 flex-col',
  info: 'p-2.5 rounded-full bg-info/10 ring ring-inset ring-info/25 flex-col'
} as const
</script>

<template>
  <div>
    <div v-if="status === 'pending'" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-muted" />
    </div>

    <UPageGrid v-else class="lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-px">
      <UPageCard
        v-for="(card, index) in cards"
        :key="index"
        :icon="card.icon"
        :title="card.title"
        variant="subtle"
        :ui="{
          container: 'gap-y-1.5',
          wrapper: 'items-start',
          leading: leadingClasses[card.color] ?? leadingClasses.info,
          title: 'font-normal text-muted text-xs uppercase'
        }"
        class="lg:rounded-none first:rounded-tl-lg [&:nth-child(3)]:rounded-tr-lg [&:nth-child(4)]:rounded-bl-lg last:rounded-br-lg hover:z-1"
      >
        <span class="text-2xl font-semibold text-highlighted">{{ card.value }}</span>
        <span v-if="card.subtitle" class="text-sm text-muted block mt-0.5">{{ card.subtitle }}</span>
      </UPageCard>
    </UPageGrid>
  </div>
</template>
