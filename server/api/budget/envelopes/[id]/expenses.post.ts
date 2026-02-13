import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))
    if (Number.isNaN(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'ID invalide' })
    }

    const body = createEnvelopeExpenseSchema.parse(await readBody(event))

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

    const now = new Date()

    const [result] = await db
      .insert(schema.envelopeExpenses)
      .values({
        recurringEntryId: id,
        year: body.year,
        month: body.month,
        label: body.label,
        amount: body.amount,
        createdAt: now,
        updatedAt: now
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
