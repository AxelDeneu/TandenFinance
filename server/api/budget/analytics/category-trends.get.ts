import { eq, gte } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { transactionAnalyticsSelect } from '../../../utils/transactions'

export default defineApiHandler(async (event) => {
  const query = getQuery(event)
  const monthCount = Math.min(Number(query.months) || 6, 24)

  // Lire le mois sélectionné en DB (fallback = mois courant)
  const setting = await db
    .select()
    .from(schema.appSettings)
    .where(eq(schema.appSettings.key, 'selected_month'))
    .limit(1)

  const now = new Date()
  const selectedMonthStr = setting[0]?.value ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [refYear, refMonth] = selectedMonthStr.split('-').map(Number)
  const refDate = new Date(refYear!, refMonth! - 1, 1)

  const startDate = new Date(refDate.getFullYear(), refDate.getMonth() - monthCount + 1, 1)
  const endDate = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1)

  const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-01`
  const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-01`

  const transactions = await db
    .select(transactionAnalyticsSelect)
    .from(schema.transactions)
    .where(gte(schema.transactions.date, startStr))

  const filtered = transactions.filter(t => t.date < endStr)

  const entries = await db.select().from(schema.recurringEntries)
  const entryMap = new Map(entries.map(e => [e.id, e]))

  // Generate month keys
  const monthKeys: string[] = []
  for (let i = 0; i < monthCount; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1)
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  // Group by category + type + month
  const categoryData = new Map<string, { type: 'income' | 'expense', months: Map<string, number> }>()

  for (const tx of filtered) {
    const entry = tx.recurringEntryId ? entryMap.get(tx.recurringEntryId) : null
    const cat = entry?.category ?? 'Divers'
    const type = tx.type as 'income' | 'expense'
    const key = `${type}:${cat}`
    const monthKey = tx.date.slice(0, 7)

    if (!categoryData.has(key)) {
      categoryData.set(key, { type, months: new Map() })
    }
    const data = categoryData.get(key)!
    data.months.set(monthKey, (data.months.get(monthKey) ?? 0) + tx.amount)
  }

  const categories = [...categoryData.entries()].map(([key, data]) => {
    const category = key.split(':').slice(1).join(':')
    const monthlyAmounts = monthKeys.map(m => ({
      month: m,
      amount: Math.round((data.months.get(m) ?? 0) * 100) / 100
    }))

    const total = monthlyAmounts.reduce((s, m) => s + m.amount, 0)
    const average = Math.round((total / monthCount) * 100) / 100

    // Trend: compare first 3 vs last 3 months averages
    const half = Math.floor(monthlyAmounts.length / 2)
    const firstHalf = monthlyAmounts.slice(0, half)
    const secondHalf = monthlyAmounts.slice(half)
    const firstAvg = firstHalf.length > 0
      ? firstHalf.reduce((s, m) => s + m.amount, 0) / firstHalf.length
      : 0
    const secondAvg = secondHalf.length > 0
      ? secondHalf.reduce((s, m) => s + m.amount, 0) / secondHalf.length
      : 0

    let trend: 'rising' | 'stable' | 'falling' = 'stable'
    if (firstAvg > 0) {
      const change = ((secondAvg - firstAvg) / firstAvg) * 100
      if (change > 15) trend = 'rising'
      else if (change < -15) trend = 'falling'
    }

    return {
      category,
      type: data.type,
      monthlyAmounts,
      average,
      trend
    }
  })

  // Sort by average amount descending
  categories.sort((a, b) => b.average - a.average)

  return { categories }
})
