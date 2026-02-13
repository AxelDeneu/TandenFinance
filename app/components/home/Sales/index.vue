<script setup lang="ts">
import { initHomeSales } from './init'

const { data, columns } = await initHomeSales()
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-highlighted">
            Dernieres depenses
          </p>
          <p class="text-xs text-muted mt-0.5">
            Les 10 dernieres depenses d'enveloppes
          </p>
        </div>

        <UButton
          label="Voir tout"
          variant="ghost"
          color="neutral"
          trailing-icon="i-lucide-arrow-right"
          to="/budget/previsionnel"
          size="sm"
        />
      </div>
    </template>

    <UTable
      v-if="data && data.length > 0"
      :data="data"
      :columns="columns"
      class="shrink-0"
      :ui="{
        base: 'table-fixed border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        th: 'first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'border-b border-default'
      }"
    />

    <div v-else class="py-8 text-center text-muted text-sm">
      Aucune depense d'enveloppe enregistree
    </div>
  </UCard>
</template>
