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

  await db
    .delete(schema.recurringEntries)
    .where(eq(schema.recurringEntries.id, id))

  return { success: true, id }
})
