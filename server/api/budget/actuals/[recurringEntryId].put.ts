import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  try {
    const recurringEntryId = Number(getRouterParam(event, 'recurringEntryId'))
    if (Number.isNaN(recurringEntryId) || recurringEntryId <= 0) {
      throw createError({ statusCode: 400, message: 'ID invalide' })
    }

    const body = upsertActualSchema.parse(await readBody(event))

    const [entry] = await db
      .select()
      .from(schema.recurringEntries)
      .where(eq(schema.recurringEntries.id, recurringEntryId))

    if (!entry) {
      throw createError({ statusCode: 404, message: 'Entrée récurrente non trouvée' })
    }

    const now = new Date()

    const [result] = await db
      .insert(schema.monthlyActuals)
      .values({
        recurringEntryId,
        year: body.year,
        month: body.month,
        actualAmount: body.actualAmount,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: [schema.monthlyActuals.recurringEntryId, schema.monthlyActuals.year, schema.monthlyActuals.month],
        set: {
          actualAmount: body.actualAmount,
          updatedAt: now
        }
      })
      .returning()

    return result
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
