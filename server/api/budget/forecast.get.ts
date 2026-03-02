import { eq, like } from 'drizzle-orm'
import { db, schema } from 'hub:db'

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

  // Fetch all transactions for the month range and aggregate by recurringEntryId + month
  const actualsByEntry = new Map<number, Map<string, number>>()
  // Also track uncategorized transactions per month
  const uncategorizedByMonth = new Map<string, { income: number, expense: number }>()

  for (const m of months) {
    const datePrefix = `${m.year}-${String(m.month).padStart(2, '0')}`

    const monthTransactions = await db
      .select()
      .from(schema.transactions)
      .where(like(schema.transactions.date, `${datePrefix}%`))

    for (const tx of monthTransactions) {
      const key = `${m.year}-${m.month}`

      if (tx.recurringEntryId) {
        if (!actualsByEntry.has(tx.recurringEntryId)) {
          actualsByEntry.set(tx.recurringEntryId, new Map())
        }
        const entryMap = actualsByEntry.get(tx.recurringEntryId)!
        entryMap.set(key, (entryMap.get(key) ?? 0) + tx.amount)
      } else {
        if (!uncategorizedByMonth.has(key)) {
          uncategorizedByMonth.set(key, { income: 0, expense: 0 })
        }
        const uncat = uncategorizedByMonth.get(key)!
        if (tx.type === 'income') {
          uncat.income += tx.amount
        } else {
          uncat.expense += tx.amount
        }
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
      return { entry, actuals: entryActuals }
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
