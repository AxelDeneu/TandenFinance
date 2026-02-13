import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async () => {
  try {
    return await db
      .select()
      .from(schema.recurringEntries)
      .where(eq(schema.recurringEntries.type, 'expense'))
      .orderBy(schema.recurringEntries.dayOfMonth)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({ statusCode: 500, message: 'Erreur serveur' })
  }
})
