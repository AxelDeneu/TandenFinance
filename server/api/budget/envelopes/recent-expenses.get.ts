import { desc, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async () => {
  try {
    const expenses = await db
      .select({
        id: schema.envelopeExpenses.id,
        label: schema.envelopeExpenses.label,
        envelopeLabel: schema.recurringEntries.label,
        amount: schema.envelopeExpenses.amount,
        year: schema.envelopeExpenses.year,
        month: schema.envelopeExpenses.month,
        createdAt: schema.envelopeExpenses.createdAt
      })
      .from(schema.envelopeExpenses)
      .innerJoin(schema.recurringEntries, eq(schema.envelopeExpenses.recurringEntryId, schema.recurringEntries.id))
      .orderBy(desc(schema.envelopeExpenses.createdAt))
      .limit(10)

    return expenses
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({ statusCode: 500, message: 'Erreur serveur' })
  }
})
