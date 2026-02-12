import { eq, and } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

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
})
