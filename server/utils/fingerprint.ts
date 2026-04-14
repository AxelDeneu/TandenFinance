import { createHash } from 'crypto'

export function buildFingerprint(date: string, label: string, amount: number | string): string {
  return createHash('sha256')
    .update(`${date}|${label.trim().toLowerCase()}|${Number(amount).toFixed(2)}`)
    .digest('hex')
    .slice(0, 16)
}
