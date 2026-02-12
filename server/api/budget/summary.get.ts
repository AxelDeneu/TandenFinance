import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async () => {
  const activeEntries = await db
    .select()
    .from(schema.recurringEntries)
    .where(eq(schema.recurringEntries.active, true))

  const incomes = activeEntries.filter(e => e.type === 'income')
  const expenses = activeEntries.filter(e => e.type === 'expense')

  const totalIncome = incomes.reduce((sum, e) => sum + e.amount, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    incomeCount: incomes.length,
    expenseCount: expenses.length
  }
})
