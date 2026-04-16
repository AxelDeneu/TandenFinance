import { eq, and, gte, lt } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { transactionAnalyticsSelect } from '~/server/utils/transactions'

export default defineApiHandler(async (event) => {
  const query = getQuery(event)
  const monthCount = Math.min(Number(query.months) || 6, 12)

  const queryYear = Number(query.year) || 0
  const queryMonth = Number(query.month) || 0
  const hasSingleMonthParams = queryYear > 0 && queryMonth >= 1 && queryMonth <= 12

  const startDate = hasSingleMonthParams
    ? new Date(queryYear, queryMonth - 1, 1)
    : new Date()

  const months: { year: number, month: number, label: string }[] = []
  const formatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })

  for (let i = 0; i < monthCount; i++) {
    const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1)
    months.push({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      label: formatter.format(date)
    })
  }

  const activeEntries = await db
    .select()
    .from(schema.recurringEntries)
    .where(eq(schema.recurringEntries.active, true))

  // Fetch all transactions for the entire month range in a single query
  const firstMonth = months[0]!
  const lastMonth = months[months.length - 1]!
  const startDateStr = `${firstMonth.year}-${String(firstMonth.month).padStart(2, '0')}-01`
  const endDate = new Date(lastMonth.year, lastMonth.month, 1)
  const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-01`

  const allTransactions = await db
    .select(transactionAnalyticsSelect)
    .from(schema.transactions)
    .where(and(gte(schema.transactions.date, startDateStr), lt(schema.transactions.date, endDateStr)))

  // Aggregate by recurringEntryId + month
  const actualsByEntry = new Map<number, Map<string, number>>()
  const uncategorizedByMonth = new Map<string, { income: number, expense: number }>()
  const envelopeIds = new Set(activeEntries.filter(e => e.type === 'envelope').map(e => e.id))

  for (const tx of allTransactions) {
    const [txYear, txMonthStr] = tx.date.slice(0, 7).split('-')
    const key = `${txYear}-${Number(txMonthStr)}`

    if (tx.recurringEntryId) {
      if (!actualsByEntry.has(tx.recurringEntryId)) {
        actualsByEntry.set(tx.recurringEntryId, new Map())
      }
      const entryMap = actualsByEntry.get(tx.recurringEntryId)!
      const amount = (envelopeIds.has(tx.recurringEntryId) && tx.type === 'income')
        ? -parseFloat(tx.amount)
        : parseFloat(tx.amount)
      entryMap.set(key, (entryMap.get(key) ?? 0) + amount)
    } else {
      if (!uncategorizedByMonth.has(key)) {
        uncategorizedByMonth.set(key, { income: 0, expense: 0 })
      }
      const uncat = uncategorizedByMonth.get(key)!
      if (tx.type === 'income') {
        uncat.income += parseFloat(tx.amount)
      } else {
        uncat.expense += parseFloat(tx.amount)
      }
    }
  }

  function buildForecastEntries(entries: typeof activeEntries) {
    return entries.map((entry) => {
      const entryActuals: Record<string, number | null> = {}
      for (const m of months) {
        const key = `${m.year}-${m.month}`
        entryActuals[key] = actualsByEntry.get(entry.id)?.get(key) ?? null
      }
      return { entry: { ...entry, amount: parseFloat(entry.amount) }, actuals: entryActuals }
    })
  }

  // Build uncategorized forecast entries
  const uncategorizedIncomeActuals: Record<string, number | null> = {}
  const uncategorizedExpenseActuals: Record<string, number | null> = {}
  let hasUncategorizedIncome = false
  let hasUncategorizedExpense = false

  for (const m of months) {
    const key = `${m.year}-${m.month}`
    const uncat = uncategorizedByMonth.get(key)
    if (uncat && uncat.income > 0) {
      uncategorizedIncomeActuals[key] = uncat.income
      hasUncategorizedIncome = true
    } else {
      uncategorizedIncomeActuals[key] = null
    }
    if (uncat && uncat.expense > 0) {
      uncategorizedExpenseActuals[key] = uncat.expense
      hasUncategorizedExpense = true
    } else {
      uncategorizedExpenseActuals[key] = null
    }
  }

  const incomes = buildForecastEntries(activeEntries.filter(e => e.type === 'income'))
  const expenses = buildForecastEntries(activeEntries.filter(e => e.type === 'expense'))
  const envelopes = buildForecastEntries(activeEntries.filter(e => e.type === 'envelope'))

  // Add uncategorized rows if there are any
  if (hasUncategorizedIncome) {
    incomes.push({
      entry: {
        id: -1,
        type: 'income',
        label: 'Non catégorisé',
        amount: 0,
        category: null,
        dayOfMonth: null,
        active: true,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      actuals: uncategorizedIncomeActuals
    })
  }

  if (hasUncategorizedExpense) {
    expenses.push({
      entry: {
        id: -2,
        type: 'expense',
        label: 'Non catégorisé',
        amount: 0,
        category: null,
        dayOfMonth: null,
        active: true,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      actuals: uncategorizedExpenseActuals
    })
  }

  return {
    months,
    incomes,
    expenses,
    envelopes
  }
})
