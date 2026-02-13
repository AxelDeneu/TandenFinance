import { eq, and } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const year = Number(query.year)

    if (Number.isNaN(year) || year < 2000 || year > 2100) {
      throw createError({ statusCode: 400, message: 'Année invalide' })
    }

    const conditions = [eq(schema.monthlyActuals.year, year)]

    if (query.month) {
      const month = Number(query.month)
      if (Number.isNaN(month) || month < 1 || month > 12) {
        throw createError({ statusCode: 400, message: 'Mois invalide' })
      }
      conditions.push(eq(schema.monthlyActuals.month, month))
    }

    return await db
      .select()
      .from(schema.monthlyActuals)
      .where(and(...conditions))
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({ statusCode: 500, message: 'Erreur serveur' })
  }
})
