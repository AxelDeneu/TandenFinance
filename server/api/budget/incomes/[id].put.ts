import { eq, and } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))
    if (Number.isNaN(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'ID invalide' })
    }

    const body = updateEntrySchema.parse(await readBody(event))

    const [existing] = await db
      .select()
      .from(schema.recurringEntries)
      .where(and(
        eq(schema.recurringEntries.id, id),
        eq(schema.recurringEntries.type, 'income')
      ))

    if (!existing) {
      throw createError({ statusCode: 404, message: 'Revenu non trouve' })
    }

    const [result] = await db
      .update(schema.recurringEntries)
      .set({
        label: body.label ?? existing.label,
        amount: body.amount ?? existing.amount,
        category: body.category ?? existing.category,
        dayOfMonth: body.dayOfMonth ?? existing.dayOfMonth,
        active: body.active ?? existing.active,
        notes: body.notes !== undefined ? body.notes : existing.notes,
        updatedAt: new Date()
      })
      .where(eq(schema.recurringEntries.id, id))
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
