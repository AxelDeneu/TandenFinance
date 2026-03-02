import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineApiHandler(async (event) => {
  const id = requireRouteId(event)
  await requireRecurringEntry(id, 'income')

  await db
    .delete(schema.recurringEntries)
    .where(eq(schema.recurringEntries.id, id))

  return { success: true, id }
})
