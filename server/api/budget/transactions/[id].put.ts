import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))
    if (Number.isNaN(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'ID invalide' })
    }

    const body = updateTransactionSchema.parse(await readBody(event))

    const [existing] = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.id, id))

    if (!existing) {
      throw createError({ statusCode: 404, message: 'Transaction non trouvée' })
    }

    const [result] = await db
      .update(schema.transactions)
      .set({
        label: body.label ?? existing.label,
        amount: body.amount ?? existing.amount,
        type: body.type ?? existing.type,
        date: body.date ?? existing.date,
        recurringEntryId: body.recurringEntryId !== undefined ? (body.recurringEntryId ?? null) : existing.recurringEntryId,
        notes: body.notes !== undefined ? (body.notes ?? null) : existing.notes,
        updatedAt: new Date()
      })
      .where(eq(schema.transactions.id, id))
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
