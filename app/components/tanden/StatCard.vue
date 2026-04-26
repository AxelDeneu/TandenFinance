<script setup lang="ts">
type IconKind = 'default' | 'income' | 'expense' | 'envelope' | 'peach' | 'info'
type SubColor = 'up' | 'down' | 'warn' | 'subtle' | 'muted'

defineProps<{
  icon: string
  iconKind?: IconKind
  label: string
  value: string | number
  sub?: string
  subColor?: SubColor
  glow?: boolean
}>()
</script>

<template>
  <div class="tf-stat-card">
    <span v-if="glow" class="glow" />
    <div class="head">
      <span :class="['ico', iconKind ?? 'default']">
        <UIcon :name="icon" class="size-3.5" />
      </span>
      <span class="lbl">{{ label }}</span>
    </div>
    <div class="val">
      {{ value }}
    </div>
    <div v-if="sub" class="sub">
      <span
        :class="{
          'tf-up': subColor === 'up',
          'tf-down': subColor === 'down',
          'tf-warn': subColor === 'warn',
          'tf-text-subtle': subColor === 'subtle' || !subColor,
          'tf-text-muted': subColor === 'muted'
        }"
      >{{ sub }}</span>
    </div>
  </div>
</template>
