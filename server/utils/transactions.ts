import { schema } from 'hub:db'
import { buildFingerprint } from './fingerprint'

export const transactionListSelect = {
  id: schema.transactions.id,
  label: schema.transactions.label,
  amount: schema.transactions.amount,
  type: schema.transactions.type,
  date: schema.transactions.date,
  recurringEntryId: schema.transactions.recurringEntryId,
  notes: schema.transactions.notes
} as const

export const transactionAnalyticsSelect = {
  id: schema.transactions.id,
  amount: schema.transactions.amount,
  type: schema.transactions.type,
  date: schema.transactions.date,
  recurringEntryId: schema.transactions.recurringEntryId
} as const

export interface TransactionFingerprintSource {
  date: string
  label: string
  amount: number | string
}

export function buildTransactionFingerprint(source: TransactionFingerprintSource): string {
  return buildFingerprint(source.date, source.label, source.amount)
}

export function buildTransactionFingerprintSet(rows: TransactionFingerprintSource[]): Set<string> {
  return new Set(rows.map(row => buildTransactionFingerprint(row)))
}
