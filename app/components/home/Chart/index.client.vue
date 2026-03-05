<script setup lang="ts">
import { VisXYContainer, VisLine, VisAxis, VisArea, VisCrosshair, VisTooltip } from '@unovis/vue'
import { initHomeChart } from './init'

const cardRef = useTemplateRef<HTMLElement | null>('cardRef')

const { width, chartData, currentMonthRemaining, x, yIncome, yExpenses, xTicks, template } = initHomeChart({ cardRef })
</script>

<template>
  <UCard ref="cardRef" :ui="{ root: 'overflow-visible', body: '!px-0 !pt-0 !pb-3' }">
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-muted uppercase mb-1.5">
            Tendance budgetaire
          </p>
          <p class="text-3xl text-highlighted font-semibold">
            {{ formatEuro(currentMonthRemaining) }}
          </p>
          <p class="text-xs text-muted mt-0.5">
            Reste a vivre ce mois
          </p>
        </div>

        <div class="flex items-center gap-4 text-xs text-muted">
          <div class="flex items-center gap-1.5">
            <span class="inline-block size-2.5 rounded-full bg-success" />
            Revenus
          </div>
          <div class="flex items-center gap-1.5">
            <span class="inline-block size-2.5 rounded-full bg-error" />
            Depenses
          </div>
        </div>
      </div>
    </template>

    <VisXYContainer
      :data="chartData"
      :padding="{ top: 40 }"
      class="h-96"
      :width="width"
    >
      <VisLine
        :x="x"
        :y="yIncome"
        color="var(--ui-success)"
      />
      <VisArea
        :x="x"
        :y="yIncome"
        color="var(--ui-success)"
        :opacity="0.07"
      />

      <VisLine
        :x="x"
        :y="yExpenses"
        color="var(--ui-error)"
      />
      <VisArea
        :x="x"
        :y="yExpenses"
        color="var(--ui-error)"
        :opacity="0.07"
      />

      <VisAxis
        type="x"
        :x="x"
        :tick-format="xTicks"
      />

      <VisCrosshair
        color="var(--ui-text-muted)"
        :template="template"
      />

      <VisTooltip />
    </VisXYContainer>
  </UCard>
</template>

<style scoped>
.unovis-xy-container {
  --vis-crosshair-line-stroke-color: var(--ui-border-accented);
  --vis-crosshair-circle-stroke-color: var(--ui-bg);

  --vis-axis-grid-color: var(--ui-border);
  --vis-axis-tick-color: var(--ui-border);
  --vis-axis-tick-label-color: var(--ui-text-dimmed);

  --vis-tooltip-background-color: var(--ui-bg);
  --vis-tooltip-border-color: var(--ui-border);
  --vis-tooltip-text-color: var(--ui-text-highlighted);
}
</style>
