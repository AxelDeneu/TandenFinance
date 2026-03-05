import { desc } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineApiHandler(async () => {
  return await db
    .select()
    .from(schema.notifications)
    .orderBy(schema.notifications.read, desc(schema.notifications.createdAt))
})
