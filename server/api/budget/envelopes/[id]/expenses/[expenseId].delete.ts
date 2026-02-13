import { eq, and } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))
    if (Number.isNaN(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'ID invalide' })
    }

    const expenseId = Number(getRouterParam(event, 'expenseId'))
    if (Number.isNaN(expenseId) || expenseId <= 0) {
      throw createError({ statusCode: 400, message: 'ID de dépense invalide' })
    }

    const deleted = await db
      .delete(schema.envelopeExpenses)
      .where(and(
        eq(schema.envelopeExpenses.id, expenseId),
        eq(schema.envelopeExpenses.recurringEntryId, id)
      ))
      .returning()

    if (deleted.length === 0) {
      throw createError({ statusCode: 404, message: 'Dépense d\'enveloppe non trouvée' })
    }

    return { success: true }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({ statusCode: 500, message: 'Erreur serveur' })
  }
})
