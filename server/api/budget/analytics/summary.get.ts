import { eq, gte } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineApiHandler(async (event) => {
  const query = getQuery(event)
  const monthCount = Math.min(Number(query.months) || 12, 24)

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
    .select()
    .from(schema.transactions)
    .where(gte(schema.transactions.date, startStr))

  // Filter out transactions beyond endDate
  const filtered = transactions.filter(t => t.date < endStr)

  // Group by month
  const monthlyData = new Map<string, { income: number, expense: number }>()
  const formatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })

  for (const tx of filtered) {
    const monthKey = tx.date.slice(0, 7) // YYYY-MM
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { income: 0, expense: 0 })
    }
    const m = monthlyData.get(monthKey)!
    if (tx.type === 'income') m.income += parseFloat(tx.amount)
    else m.expense += parseFloat(tx.amount)
  }

  const months = [...monthlyData.entries()].sort(([a], [b]) => a.localeCompare(b))
  const numMonths = months.length || 1

  const totalIncome = months.reduce((s, [, d]) => s + d.income, 0)
  const totalExpense = months.reduce((s, [, d]) => s + d.expense, 0)
  const totalSavings = totalIncome - totalExpense

  const averageMonthlyIncome = totalIncome / numMonths
  const averageMonthlyExpense = totalExpense / numMonths
  const averageMonthlySavings = totalSavings / numMonths
  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0

  // Category trends (expenses)
  const entries = await db.select().from(schema.recurringEntries)
  const entryMap = new Map(entries.map(e => [e.id, e]))

  const categoryByMonth = new Map<string, Map<string, number>>()
  for (const tx of filtered) {
    if (tx.type !== 'expense') continue
    const entry = tx.recurringEntryId ? entryMap.get(tx.recurringEntryId) : null
    const cat = entry?.category ?? 'Divers'
    const monthKey = tx.date.slice(0, 7)
    if (!categoryByMonth.has(cat)) categoryByMonth.set(cat, new Map())
    const catMap = categoryByMonth.get(cat)!
    catMap.set(monthKey, (catMap.get(monthKey) ?? 0) + parseFloat(tx.amount))
  }

  // Growth calculation: compare first half vs second half averages
  const halfPoint = Math.floor(months.length / 2)
  const firstHalfMonths = new Set(months.slice(0, halfPoint).map(([k]) => k))
  const secondHalfMonths = new Set(months.slice(halfPoint).map(([k]) => k))

  const categoryGrowth: { category: string, growthPercent: number }[] = []
  for (const [cat, monthMap] of categoryByMonth) {
    let firstTotal = 0
    let firstCount = 0
    let secondTotal = 0
    let secondCount = 0
    for (const [m, amt] of monthMap) {
      if (firstHalfMonths.has(m)) {
        firstTotal += amt
        firstCount++
      }
      if (secondHalfMonths.has(m)) {
        secondTotal += amt
        secondCount++
      }
    }
    const firstAvg = firstCount > 0 ? firstTotal / firstCount : 0
    const secondAvg = secondCount > 0 ? secondTotal / secondCount : 0
    if (firstAvg > 0) {
      const growth = ((secondAvg - firstAvg) / firstAvg) * 100
      categoryGrowth.push({ category: cat, growthPercent: Math.round(growth) })
    }
  }

  categoryGrowth.sort((a, b) => b.growthPercent - a.growthPercent)
  const topGrowingCategories = categoryGrowth.filter(c => c.growthPercent > 0).slice(0, 3)
  const topShrinkingCategories = categoryGrowth
    .filter(c => c.growthPercent < 0)
    .sort((a, b) => a.growthPercent - b.growthPercent)
    .slice(0, 3)
    .map(c => ({ category: c.category, shrinkPercent: Math.abs(c.growthPercent) }))

  // Best/worst month
  let bestMonth = { label: '-', savings: 0 }
  let worstMonth = { label: '-', savings: Infinity }
  for (const [monthKey, data] of months) {
    const savings = data.income - data.expense
    const parts = monthKey.split('-').map(Number)
    const y = parts[0]!
    const m = parts[1]!
    const label = formatter.format(new Date(y, m - 1, 1))
    if (savings > bestMonth.savings) bestMonth = { label, savings }
    if (savings < worstMonth.savings) worstMonth = { label, savings }
  }
  if (worstMonth.savings === Infinity) worstMonth = { label: '-', savings: 0 }

  return {
    averageMonthlyIncome: Math.round(averageMonthlyIncome * 100) / 100,
    averageMonthlyExpense: Math.round(averageMonthlyExpense * 100) / 100,
    averageMonthlySavings: Math.round(averageMonthlySavings * 100) / 100,
    savingsRate: Math.round(savingsRate * 10) / 10,
    topGrowingCategories,
    topShrinkingCategories,
    bestMonth,
    worstMonth
  }
})
