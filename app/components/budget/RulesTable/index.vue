<script setup lang="ts">
import { initBudgetRulesTable } from './init'

const {
  rules,
  status,
  columns,
  modalOpen,
  editingRule,
  openCreateModal,
  onRuleSaved,
  evaluateRules
} = initBudgetRulesTable()

const tableUi = {
  base: 'table-fixed border-separate border-spacing-0',
  thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
  tbody: '[&>tr]:last:[&>td]:border-b-0',
  th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
  td: 'border-b border-default',
  separator: 'h-0'
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">
        Règles d'alerte
      </h2>
      <div class="flex items-center gap-2">
        <UButton
          label="Évaluer"
          icon="i-lucide-play"
          color="neutral"
          variant="subtle"
          @click="evaluateRules"
        />
        <UButton
          label="Nouvelle règle"
          icon="i-lucide-plus"
          color="primary"
          @click="openCreateModal"
        />
      </div>
    </div>

    <div v-if="status === 'pending'" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-muted" />
    </div>

    <template v-else>
      <UTable
        :data="rules"
        :columns="columns"
        :ui="tableUi"
      />

      <div v-if="rules.length === 0" class="text-center py-8 text-muted">
        Aucune règle configurée. Créez votre première règle d'alerte.
      </div>
    </template>

    <BudgetRuleModal
      v-model:open="modalOpen"
      :rule="editingRule"
      @saved="onRuleSaved"
    />
  </div>
</template>
