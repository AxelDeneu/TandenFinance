<script setup lang="ts">
const props = withDefaults(defineProps<{
  data: { month: string, income: number, expense: number }[]
  height?: number
  accent?: string
}>(), {
  height: 220,
  accent: '#1FB578'
})

const w = 720
const padX = 36
const padY = 24

const max = computed(() => {
  const m = Math.max(...props.data.map(d => Math.max(d.income || 0, d.expense || 0)))
  return m * 1.1 || 1
})

const xs = (i: number) => padX + (i / Math.max(1, props.data.length - 1)) * (w - padX * 2)
const ys = (v: number) => props.height - padY - (v / max.value) * (props.height - padY * 2)

const incomeLine = computed(() =>
  props.data.map((d, i) => `${i ? 'L' : 'M'}${xs(i)},${ys(d.income)}`).join(' ')
)
const expenseLine = computed(() =>
  props.data.map((d, i) => `${i ? 'L' : 'M'}${xs(i)},${ys(d.expense)}`).join(' ')
)
const expenseArea = computed(() => {
  const last = props.data.length - 1
  return `${expenseLine.value} L${xs(last)},${props.height - padY} L${xs(0)},${props.height - padY} Z`
})

const yLines = computed(() =>
  [0.25, 0.5, 0.75, 1].map(f => ({
    f,
    y: props.height - padY - f * (props.height - padY * 2),
    label: Math.round(max.value * f / 1000) + 'k'
  }))
)
</script>

<template>
  <div style="padding: 8px 18px 18px; position: relative;">
    <div class="flex items-center gap-4 mb-2">
      <div class="flex items-center gap-1.5 tf-num" style="font-size: 11px; color: var(--fg-muted);">
        <span style="width: 8px; height: 8px; border-radius: 2px; background: #4ADE80;" />
        Revenus
      </div>
      <div class="flex items-center gap-1.5 tf-num" style="font-size: 11px; color: var(--fg-muted);">
        <span style="width: 8px; height: 8px; border-radius: 2px;" :style="{ background: accent }" />
        Dépenses
      </div>
    </div>
    <svg :viewBox="`0 0 ${w} ${height}`" width="100%" style="display: block; overflow: visible;">
      <defs>
        <linearGradient
          id="tf-exp-fade"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0" :stop-color="accent" stop-opacity="0.32" />
          <stop offset="1" :stop-color="accent" stop-opacity="0" />
        </linearGradient>
      </defs>
      <g v-for="line in yLines" :key="line.f">
        <line
          :x1="padX"
          :x2="w - padX"
          :y1="line.y"
          :y2="line.y"
          stroke="rgba(255,255,255,0.04)"
        />
        <text
          :x="padX - 8"
          :y="line.y + 3"
          font-family="Geist Mono"
          font-size="9"
          fill="#6B7489"
          text-anchor="end"
        >
          {{ line.label }}
        </text>
      </g>
      <path :d="expenseArea" fill="url(#tf-exp-fade)" />
      <path
        :d="expenseLine"
        fill="none"
        :stroke="accent"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <path
        :d="incomeLine"
        fill="none"
        stroke="#4ADE80"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-dasharray="4 4"
      />
      <circle
        v-for="(d, i) in data"
        :key="`exp-${i}`"
        :cx="xs(i)"
        :cy="ys(d.expense)"
        :r="i === data.length - 1 ? 4 : 2.5"
        :fill="accent"
      />
      <circle
        v-for="(d, i) in data"
        :key="`inc-${i}`"
        :cx="xs(i)"
        :cy="ys(d.income)"
        r="2.5"
        fill="#4ADE80"
      />
      <text
        v-for="(d, i) in data"
        :key="`txt-${i}`"
        :x="xs(i)"
        :y="height - 6"
        font-family="Geist Mono"
        font-size="10"
        fill="#6B7489"
        text-anchor="middle"
      >
        {{ d.month }}
      </text>
    </svg>
  </div>
</template>
