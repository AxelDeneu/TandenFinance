<script setup lang="ts">
import { VisXYContainer, VisLine, VisAxis } from '@unovis/vue'
import { initCategoryTrends } from './init'

const cardRef = useTemplateRef<HTMLElement | null>('cardRef')

const {
  width,
  status,
  selectedType,
  activeCategories,
  selectedCategories,
  displayedCategories,
  chartData,
  x,
  yAccessors,
  colors,
  xTicks,
  trendIcon,
  trendColor
} = initCategoryTrends({ cardRef })

const typeOptions = [
  { label: 'Dépenses', value: 'expense' },
  { label: 'Revenus', value: 'income' }
]

function toggleCategory(cat: string) {
  const idx = selectedCategories.value.indexOf(cat)
  if (idx >= 0) {
    selectedCategories.value.splice(idx, 1)
  } else {
    selectedCategories.value.push(cat)
  }
}
</script>

<template>
  <UCard ref="cardRef" :ui="{ root: 'overflow-visible', body: '!px-0 !pt-0 !pb-3' }">
    <template #header>
      <div class="flex items-center justify-between">
        <p class="text-xs text-muted uppercase">
          Tendances par catégorie
        </p>
        <USelect
          v-model="selectedType"
          :items="typeOptions"
          size="xs"
          class="w-32"
        />
      </div>

      <!-- Category chips -->
      <div class="flex flex-wrap gap-1.5 mt-3">
        <UBadge
          v-for="cat in activeCategories"
          :key="cat.category"
          :color="selectedCategories.includes(cat.category) ? 'primary' : 'neutral'"
          variant="subtle"
          size="xs"
          class="cursor-pointer"
          @click="toggleCategory(cat.category)"
        >
          {{ cat.category }}
          <UIcon :name="trendIcon(cat.trend)" class="ml-0.5 size-3" />
        </UBadge>
      </div>
    </template>

    <div v-if="status === 'pending'" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-muted" />
    </div>

    <template v-else>
      <VisXYContainer
        v-if="chartData.length > 0 && yAccessors.length > 0"
        :data="chartData"
        :padding="{ top: 20 }"
        class="h-80"
        :width="width"
      >
        <VisLine
          v-for="(yFn, i) in yAccessors"
          :key="displayedCategories[i]?.category"
          :x="x"
          :y="yFn"
          :color="colors[i]"
        />

        <VisAxis
          type="x"
          :x="x"
          :tick-format="xTicks"
        />
      </VisXYContainer>

      <div v-else class="text-center text-muted py-8">
        Sélectionnez des catégories pour afficher les tendances.
      </div>

      <!-- Legend + stats -->
      <div class="px-4 mt-4 flex flex-wrap gap-3">
        <div v-for="cat in displayedCategories" :key="cat.category" class="flex items-center gap-1.5 text-xs text-muted">
          <span class="inline-block size-2.5 rounded-full" :style="{ backgroundColor: colors[displayedCategories.indexOf(cat)] }" />
          {{ cat.category }} — {{ formatEuro(cat.average) }}/mois
          <UBadge :color="trendColor(cat.trend, cat.type)" variant="subtle" size="xs">
            <UIcon :name="trendIcon(cat.trend)" class="size-3" />
          </UBadge>
        </div>
      </div>
    </template>
  </UCard>
</template>

<style scoped>
.unovis-xy-container {
  --vis-axis-grid-color: var(--ui-border);
  --vis-axis-tick-color: var(--ui-border);
  --vis-axis-tick-label-color: var(--ui-text-dimmed);
}
</style>
