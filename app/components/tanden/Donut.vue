<script setup lang="ts">
const props = withDefaults(defineProps<{
  data: { label: string, value: number, color: string }[]
  size?: number
  stroke?: number
  centerLabel?: string
}>(), {
  size: 180,
  stroke: 22,
  centerLabel: 'Total'
})

const total = computed(() => props.data.reduce((s, d) => s + d.value, 0))
const r = computed(() => props.size / 2 - props.stroke / 2)
const C = computed(() => 2 * Math.PI * r.value)

const segments = computed(() => {
  let off = 0
  const t = total.value || 1
  return props.data.map((d) => {
    const len = (d.value / t) * C.value
    const seg = { ...d, len, off }
    off += len
    return seg
  })
})

const totalFormatted = computed(() => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(total.value) + ' €'
})
</script>

<template>
  <div :style="{ position: 'relative', width: size + 'px', height: size + 'px' }">
    <svg :width="size" :height="size" style="transform: rotate(-90deg);">
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="r"
        fill="none"
        stroke="var(--bg-inset)"
        :stroke-width="stroke"
      />
      <circle
        v-for="(seg, i) in segments"
        :key="i"
        :cx="size / 2"
        :cy="size / 2"
        :r="r"
        fill="none"
        :stroke="seg.color"
        :stroke-width="stroke"
        :stroke-dasharray="`${seg.len} ${C - seg.len}`"
        :stroke-dashoffset="-seg.off"
        stroke-linecap="butt"
      />
    </svg>
    <div style="position: absolute; inset: 0; display: grid; place-items: center; text-align: center;">
      <div>
        <div class="tf-caps" style="margin-bottom: 4px;">
          {{ centerLabel }}
        </div>
        <div class="tf-num" style="font-size: 22px; font-weight: 500; letter-spacing: -0.02em;">
          {{ totalFormatted }}
        </div>
      </div>
    </div>
  </div>
</template>
