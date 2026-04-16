import { like } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { transactionAnalyticsSelect } from '~/server/utils/transactions'

const CHART_COLORS: Record<string, string> = {
  'Loyer': '#f59e0b',
  'Charges': '#f97316',
  'Énergie': '#ef4444',
  'Eau': '#3b82f6',
  'Télécom': '#6366f1',
  'Abonnements': '#8b5cf6',
  'Transport': '#06b6d4',
  'Alimentation': '#22c55e',
  'Restaurant': '#10b981',
  'Santé': '#ec4899',
  'Enfants': '#14b8a6',
  'Habillement': '#64748b',
  'Loisirs': '#a855f7',
  'Éducation': '#eab308',
  'Cadeaux': '#f472b6',
  'Épargne': '#84cc16',
  'Impôts': '#dc2626',
  'Dettes': '#b91c1c',
  'Assurances': '#78716c',
  'Frais bancaires': '#94a3b8',
  'Divers': '#a1a1aa',
  'Salaire': '#22c55e',
  'Freelance': '#3b82f6',
  'Aides sociales': '#f59e0b',
  'Investissements': '#6366f1',
  'Primes': '#10b981',
  'Remboursements': '#06b6d4',
  'Vente': '#f97316',
  'Autre': '#94a3b8'
}

export default defineApiHandler(async (event) => {
  const query = getQuery(event)
  const year = Number(query.year)
  const month = Number(query.month)

  if (!year || !month || month < 1 || month > 12) {
    throw createError({ statusCode: 400, message: 'Paramètres year et month requis' })
  }

  const datePrefix = `${year}-${String(month).padStart(2, '0')}`

  const transactions = await db
    .select(transactionAnalyticsSelect)
    .from(schema.transactions)
    .where(like(schema.transactions.date, `${datePrefix}%`))

  const entries = await db.select().from(schema.recurringEntries)
  const entryMap = new Map(entries.map(e => [e.id, e]))

  const expensesByCategory = new Map<string, number>()
  const incomesByCategory = new Map<string, number>()

  for (const tx of transactions) {
    const entry = tx.recurringEntryId ? entryMap.get(tx.recurringEntryId) : null
    const cat = entry?.category ?? 'Divers'
    const map = tx.type === 'income' ? incomesByCategory : expensesByCategory
    map.set(cat, (map.get(cat) ?? 0) + parseFloat(tx.amount))
  }

  function buildBreakdown(map: Map<string, number>) {
    const total = [...map.values()].reduce((s, v) => s + v, 0) || 1
    return [...map.entries()]
      .map(([category, amount]) => ({
        category,
        amount: Math.round(amount * 100) / 100,
        percent: Math.round((amount / total) * 1000) / 10,
        color: CHART_COLORS[category] ?? '#a1a1aa'
      }))
      .sort((a, b) => b.amount - a.amount)
  }

  return {
    expenses: buildBreakdown(expensesByCategory),
    incomes: buildBreakdown(incomesByCategory)
  }
})
