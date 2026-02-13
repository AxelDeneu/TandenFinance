import { eq, and } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  try {
    const recurringEntryId = Number(getRouterParam(event, 'recurringEntryId'))
    if (Number.isNaN(recurringEntryId) || recurringEntryId <= 0) {
      throw createError({ statusCode: 400, message: 'ID invalide' })
    }

    const body = deleteActualSchema.parse(await readBody(event))

    const deleted = await db
      .delete(schema.monthlyActuals)
      .where(and(
        eq(schema.monthlyActuals.recurringEntryId, recurringEntryId),
        eq(schema.monthlyActuals.year, body.year),
        eq(schema.monthlyActuals.month, body.month)
      ))
      .returning()

    if (deleted.length === 0) {
      throw createError({ statusCode: 404, message: 'Montant réel non trouvé' })
    }

    return { success: true }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    if (error instanceof Error && error.name === 'ZodError') {
      throw createError({ statusCode: 400, message: 'Données invalides' })
    }
    throw createError({ statusCode: 500, message: 'Erreur serveur' })
  }
})
