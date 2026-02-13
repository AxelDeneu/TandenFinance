import { eq, and } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))
    if (Number.isNaN(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'ID invalide' })
    }

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
        active: !existing.active,
        updatedAt: new Date()
      })
      .where(eq(schema.recurringEntries.id, id))
      .returning()

    return result
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({ statusCode: 500, message: 'Erreur serveur' })
  }
})
