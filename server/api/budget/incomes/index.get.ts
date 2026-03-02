import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineApiHandler(async () => {
  return await db
    .select()
    .from(schema.recurringEntries)
    .where(eq(schema.recurringEntries.type, 'income'))
    .orderBy(schema.recurringEntries.dayOfMonth)
})
