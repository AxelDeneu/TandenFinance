<script setup lang="ts">
defineProps<{
  title: string
  lede?: string
}>()
</script>

<template>
  <div class="tf-page-head">
    <div>
      <h1>{{ title }}</h1>
      <div v-if="lede" class="tf-lede">
        {{ lede }}
      </div>
    </div>
    <div class="tf-spacer" />
    <slot />
  </div>
</template>
