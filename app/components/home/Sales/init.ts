import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { UBadge } from '#components'
import type { Transaction } from '~/types'

export async function initHomeSales() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const { data } = await useAsyncData<Transaction[]>(
    'recent-transactions',
    () => $fetch('/api/budget/transactions', { query: { year, month } }),
    { default: () => [] }
  )

  const recentTransactions = computed(() => data.value.slice(0, 10))

  const columns: TableColumn<Transaction>[] = [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => {
        const d = new Date(row.original.date)
        return d.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short'
        })
      }
    },
    {
      accessorKey: 'label',
      header: 'Libellé',
      cell: ({ row }) => {
        return h('span', { class: 'font-medium text-highlighted' }, row.getValue('label'))
      }
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const isIncome = row.original.type === 'income'
        return h(UBadge, {
          variant: 'subtle',
          color: (isIncome ? 'success' : 'error') as 'success' | 'error'
        }, () => isIncome ? 'Revenu' : 'Dépense')
      }
    },
    {
      accessorKey: 'amount',
      header: () => h('div', { class: 'text-right' }, 'Montant'),
      cell: ({ row }) => {
        const amount = Number(row.getValue('amount'))
        const isIncome = row.original.type === 'income'
        const colorClass = isIncome ? 'text-success' : 'text-error'
        const sign = isIncome ? '+' : '-'
        return h('div', { class: `text-right font-medium tabular-nums ${colorClass}` }, `${sign}${formatEuro(amount)}`)
      }
    }
  ]

  return { data: recentTransactions, columns }
}
