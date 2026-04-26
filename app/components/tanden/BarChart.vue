<script setup lang="ts">
const props = withDefaults(defineProps<{
  data: { label: string, value: number, color?: string }[]
  height?: number
}>(), {
  height: 180
})

const w = 640
const padX = 32
const padY = 28

const max = computed(() => Math.max(...props.data.map(d => d.value)) * 1.1 || 1)
const bw = computed(() => (w - padX * 2) / props.data.length - 8)

const bars = computed(() =>
  props.data.map((d, i) => {
    const x = padX + i * ((w - padX * 2) / props.data.length) + 4
    const bh = (d.value / max.value) * (props.height - padY * 2)
    const y = props.height - padY - bh
    return { ...d, x, y, bh }
  })
)
</script>

<template>
  <svg :viewBox="`0 0 ${w} ${height}`" width="100%" style="display: block;">
    <line
      v-for="f in [0.25, 0.5, 0.75, 1]"
      :key="f"
      :x1="padX"
      :x2="w - padX"
      :y1="height - padY - f * (height - padY * 2)"
      :y2="height - padY - f * (height - padY * 2)"
      stroke="rgba(255,255,255,0.04)"
    />
    <g v-for="(b, i) in bars" :key="i">
      <rect
        :x="b.x"
        :y="b.y"
        :width="bw"
        :height="b.bh"
        rx="3"
        :fill="b.color || '#1FB578'"
        opacity="0.9"
      />
      <text
        :x="b.x + bw / 2"
        :y="height - 8"
        font-family="Geist Mono"
        font-size="10"
        fill="#6B7489"
        text-anchor="middle"
      >
        {{ b.label }}
      </text>
      <text
        :x="b.x + bw / 2"
        :y="b.y - 6"
        font-family="Geist Mono"
        font-size="10"
        fill="#A5ADBE"
        text-anchor="middle"
      >
        {{ Math.round(b.value) }}
      </text>
    </g>
  </svg>
</template>
