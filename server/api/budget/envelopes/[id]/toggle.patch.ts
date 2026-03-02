import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineApiHandler(async (event) => {
  const id = requireRouteId(event)
  const existing = await requireRecurringEntry(id, 'envelope')

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
