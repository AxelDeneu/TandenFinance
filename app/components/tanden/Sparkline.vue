<script setup lang="ts">
const props = withDefaults(defineProps<{
  data: number[]
  color?: string
  w?: number
  h?: number
  fill?: boolean
}>(), {
  color: '#1FB578',
  w: 120,
  h: 32,
  fill: true
})

const id = useId()

const max = computed(() => Math.max(...props.data))
const min = computed(() => Math.min(...props.data))

const xs = (i: number) => (i / Math.max(1, props.data.length - 1)) * props.w
const ys = (d: number) => props.h - ((d - min.value) / (max.value - min.value || 1)) * (props.h - 4) - 2

const line = computed(() =>
  props.data.map((d, i) => `${i ? 'L' : 'M'}${xs(i)},${ys(d)}`).join(' ')
)
const area = computed(() =>
  `${line.value} L${xs(props.data.length - 1)},${props.h} L${xs(0)},${props.h} Z`
)
</script>

<template>
  <svg :width="w" :height="h" style="display: block;">
    <defs>
      <linearGradient
        :id="id"
        x1="0"
        y1="0"
        x2="0"
        y2="1"
      >
        <stop offset="0" :stop-color="color" stop-opacity="0.35" />
        <stop offset="1" :stop-color="color" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path v-if="fill" :d="area" :fill="`url(#${id})`" />
    <path
      :d="line"
      fill="none"
      :stroke="color"
      stroke-width="1.5"
      stroke-linejoin="round"
    />
  </svg>
</template>
