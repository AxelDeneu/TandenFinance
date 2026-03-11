import { h, type Component } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { UButton, UDropdownMenu } from '#components'

export const TABLE_UI = {
  base: 'table-fixed border-separate border-spacing-0',
  thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
  tbody: '[&>tr]:last:[&>td]:border-b-0',
  th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
  td: 'border-b border-default',
  separator: 'h-0'
} as const

interface RowActions<T> {
  onEdit: (entry: T) => void
  onDelete: (entry: T) => void
}

export function dropdownRowItems<T>(row: { original: T }, actions: RowActions<T>) {
  return [
    { type: 'label' as const, label: 'Actions' },
    { label: 'Modifier', icon: 'i-lucide-pencil', onSelect: () => actions.onEdit(row.original) },
    { type: 'separator' as const },
    { label: 'Supprimer', icon: 'i-lucide-trash', color: 'error' as const, onSelect: () => actions.onDelete(row.original) }
  ]
}

export function actionsColumn<T>(actions: RowActions<T>): TableColumn<T> {
  return {
    id: 'actions',
    cell: ({ row }) => h('div', { class: 'text-right' },
      h(UDropdownMenu as Component, {
        content: { align: 'end' },
        items: dropdownRowItems(row, actions)
      }, () => h(UButton, {
        icon: 'i-lucide-ellipsis-vertical',
        color: 'neutral',
        variant: 'ghost',
        class: 'ml-auto'
      }))
    )
  }
}

export function sortableHeader(label: string) {
  return ({ column }: { column: { getIsSorted: () => false | 'asc' | 'desc', toggleSorting: (asc: boolean) => void } }) => {
    const isSorted = column.getIsSorted()
    return h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      label,
      icon: isSorted
        ? isSorted === 'asc'
          ? 'i-lucide-arrow-up-narrow-wide'
          : 'i-lucide-arrow-down-wide-narrow'
        : 'i-lucide-arrow-up-down',
      class: '-mx-2.5',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
    })
  }
}
