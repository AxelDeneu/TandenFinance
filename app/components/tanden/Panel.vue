<script setup lang="ts">
defineProps<{
  title?: string
  meta?: string
  tag?: string
}>()
</script>

<template>
  <div class="tf-panel">
    <div v-if="$slots.head || title || tag || meta || $slots.headRight" class="tf-panel-head">
      <slot name="head">
        <h2 v-if="title">
          {{ title }}
        </h2>
        <span v-if="tag" class="tf-tag">{{ tag }}</span>
      </slot>
      <div class="tf-spacer" />
      <slot name="headRight">
        <span v-if="meta" class="tf-meta">{{ meta }}</span>
      </slot>
    </div>
    <slot />
    <div v-if="$slots.foot" class="tf-panel-foot">
      <slot name="foot" />
    </div>
  </div>
</template>
