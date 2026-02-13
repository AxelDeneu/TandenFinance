import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { UBadge } from '#components'

export interface RecentEnvelopeExpense {
  id: number
  label: string
  envelopeLabel: string
  amount: number
  year: number
  month: number
  createdAt: string
}

export async function initHomeSales() {
  const { data } = await useAsyncData<RecentEnvelopeExpense[]>('recent-envelope-expenses', () =>
    $fetch('/api/budget/envelopes/recent-expenses')
  , {
    default: () => []
  })

  const columns: TableColumn<RecentEnvelopeExpense>[] = [
    {
      accessorKey: 'envelopeLabel',
      header: 'Enveloppe',
      cell: ({ row }) => {
        return h(UBadge, {
          variant: 'subtle',
          color: 'warning' as const
        }, () => row.getValue('envelopeLabel'))
      }
    },
    {
      accessorKey: 'label',
      header: 'Libelle',
      cell: ({ row }) => {
        return h('span', { class: 'font-medium text-highlighted' }, row.getValue('label'))
      }
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => {
        const dateValue = row.getValue('createdAt')
        if (!dateValue) return '-'

        const date = new Date(dateValue as string | number)
        return date.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      }
    },
    {
      accessorKey: 'amount',
      header: () => h('div', { class: 'text-right' }, 'Montant'),
      cell: ({ row }) => {
        const amount = Number(row.getValue('amount'))
        return h('div', { class: 'text-right font-medium tabular-nums' }, formatEuro(amount))
      }
    }
  ]

  return { data, columns }
}
