import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineApiHandler(async () => {
  return db
    .select()
    .from(schema.recurringEntries)
    .where(eq(schema.recurringEntries.type, 'envelope'))
    .orderBy(schema.recurringEntries.label)
})
