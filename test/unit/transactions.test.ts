import { describe, expect, it, vi } from 'vitest'
import {
  buildTransactionFingerprint,
  buildTransactionFingerprintSet
} from '../../server/utils/transactions'

vi.mock('hub:db', () => ({
  schema: {
    transactions: {
      id: 'id',
      label: 'label',
      amount: 'amount',
      type: 'type',
      date: 'date',
      recurringEntryId: 'recurringEntryId',
      notes: 'notes'
    }
  }
}))

describe('buildTransactionFingerprint', () => {
  it('normalizes label casing, whitespace, and amount formatting', () => {
    const a = buildTransactionFingerprint({
      date: '2026-04-01',
      label: '  Carrefour  ',
      amount: 12.3
    })
    const b = buildTransactionFingerprint({
      date: '2026-04-01',
      label: 'carrefour',
      amount: 12.30
    })

    expect(a).toBe(b)
  })
})

describe('buildTransactionFingerprintSet', () => {
  it('deduplicates transactions using date + label + amount only', () => {
    const fingerprints = buildTransactionFingerprintSet([
      { date: '2026-04-01', label: 'Salaire', amount: 2500 },
      { date: '2026-04-01', label: ' salaire ', amount: 2500.00 },
      { date: '2026-04-02', label: 'Salaire', amount: 2500 }
    ])

    expect(fingerprints.size).toBe(2)
    expect(fingerprints.has(buildTransactionFingerprint({
      date: '2026-04-01',
      label: 'Salaire',
      amount: 2500
    }))).toBe(true)
    expect(fingerprints.has(buildTransactionFingerprint({
      date: '2026-04-02',
      label: 'Salaire',
      amount: 2500
    }))).toBe(true)
  })
})
