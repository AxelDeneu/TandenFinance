import { eq, and, desc } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))
    if (Number.isNaN(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'ID invalide' })
    }

    const query = getQuery(event)
    const year = Number(query.year)
    const month = Number(query.month)

    if (Number.isNaN(year) || year < 2000 || year > 2100) {
      throw createError({ statusCode: 400, message: 'Année invalide' })
    }
    if (Number.isNaN(month) || month < 1 || month > 12) {
      throw createError({ statusCode: 400, message: 'Mois invalide' })
    }

    const [entry] = await db
      .select()
      .from(schema.recurringEntries)
      .where(eq(schema.recurringEntries.id, id))

    if (!entry) {
      throw createError({ statusCode: 404, message: 'Entrée récurrente non trouvée' })
    }
    if (entry.type !== 'envelope') {
      throw createError({ statusCode: 400, message: 'Cette entrée n\'est pas une enveloppe' })
    }

    return await db
      .select()
      .from(schema.envelopeExpenses)
      .where(and(
        eq(schema.envelopeExpenses.recurringEntryId, id),
        eq(schema.envelopeExpenses.year, year),
        eq(schema.envelopeExpenses.month, month)
      ))
      .orderBy(desc(schema.envelopeExpenses.createdAt))
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({ statusCode: 500, message: 'Erreur serveur' })
  }
})
