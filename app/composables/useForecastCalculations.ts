import type { ForecastEntry } from '~/types'

export function computeEffectiveTotal(entries: ForecastEntry[], monthKey: string): number {
  let total = 0
  for (const fe of entries) {
    const actual = fe.actuals[monthKey]
    if (actual !== null && actual !== undefined) {
      total += actual
    } else {
      total += fe.entry.amount
    }
  }
  return total
}

export function computeEnvelopeEffectiveTotal(entries: ForecastEntry[], monthKey: string): number {
  let total = 0
  for (const fe of entries) {
    const actual = fe.actuals[monthKey]
    if (actual !== null && actual !== undefined) {
      total += Math.max(actual, fe.entry.amount)
    } else {
      total += fe.entry.amount
    }
  }
  return total
}
