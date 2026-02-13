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

    await db
      .delete(schema.recurringEntries)
      .where(eq(schema.recurringEntries.id, id))

    return { success: true, id }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({ statusCode: 500, message: 'Erreur serveur' })
  }
})
