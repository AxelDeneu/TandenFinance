import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { UBadge, UButton, USwitch } from '#components'
import type { BudgetRule } from '~/types'

export function initBudgetRulesTable() {
  const toast = useToast()

  const { data: rules, status, refresh } = useFetch<BudgetRule[]>('/api/budget/rules', {
    lazy: true,
    default: () => []
  })

  const modalOpen = ref(false)
  const editingRule = ref<BudgetRule | null>(null)

  function openCreateModal() {
    editingRule.value = null
    modalOpen.value = true
  }

  function openEditModal(rule: BudgetRule) {
    editingRule.value = rule
    modalOpen.value = true
  }

  async function deleteRule(rule: BudgetRule) {
    try {
      await $fetch(`/api/budget/rules/${rule.id}`, { method: 'DELETE' })
      toast.add({ title: 'Succès', description: `Règle "${rule.label}" supprimée`, color: 'success' })
      refresh()
    } catch {
      toast.add({ title: 'Erreur', description: 'Une erreur est survenue', color: 'error' })
    }
  }

  async function toggleRule(rule: BudgetRule) {
    try {
      await $fetch(`/api/budget/rules/${rule.id}/toggle`, { method: 'PATCH' })
      refresh()
    } catch {
      toast.add({ title: 'Erreur', description: 'Une erreur est survenue', color: 'error' })
    }
  }

  async function evaluateRules() {
    try {
      const result = await $fetch<{ created: number }>('/api/budget/rules/evaluate', { method: 'POST' })
      if (result.created > 0) {
        toast.add({ title: 'Évaluation terminée', description: `${result.created} notification(s) créée(s)`, color: 'success' })
      } else {
        toast.add({ title: 'Évaluation terminée', description: 'Aucune alerte déclenchée', color: 'info' })
      }
    } catch {
      toast.add({ title: 'Erreur', description: 'Erreur lors de l\'évaluation', color: 'error' })
    }
  }

  function onRuleSaved() {
    refresh()
  }

  const typeLabels: Record<string, string> = {
    remaining_low: 'Reste à vivre',
    envelope_exceeded: 'Enveloppe dépassée',
    category_threshold: 'Seuil catégorie'
  }

  const typeColors: Record<string, 'warning' | 'error' | 'info'> = {
    remaining_low: 'warning',
    envelope_exceeded: 'error',
    category_threshold: 'info'
  }

  const columns: TableColumn<BudgetRule>[] = [
    {
      accessorKey: 'label',
      header: 'Libellé',
      cell: ({ row }) => h('span', { class: 'font-medium text-highlighted' }, row.original.label)
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => h(UBadge, {
        variant: 'subtle',
        color: typeColors[row.original.type] ?? 'neutral'
      }, () => typeLabels[row.original.type] ?? row.original.type)
    },
    {
      id: 'active',
      header: 'Actif',
      cell: ({ row }) => h(USwitch, {
        'modelValue': row.original.active,
        'onUpdate:modelValue': () => toggleRule(row.original)
      })
    },
    {
      id: 'actions',
      cell: ({ row }) => h('div', { class: 'flex items-center gap-1 justify-end' }, [
        h(UButton, {
          icon: 'i-lucide-pencil',
          color: 'neutral',
          variant: 'ghost',
          size: 'xs',
          onClick: () => openEditModal(row.original)
        }),
        h(UButton, {
          icon: 'i-lucide-trash-2',
          color: 'error',
          variant: 'ghost',
          size: 'xs',
          onClick: () => deleteRule(row.original)
        })
      ])
    }
  ]

  return {
    rules,
    status,
    refresh,
    columns,
    modalOpen,
    editingRule,
    openCreateModal,
    onRuleSaved,
    evaluateRules
  }
}
