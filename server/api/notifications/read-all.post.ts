import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineApiHandler(async () => {
  await db
    .update(schema.notifications)
    .set({ read: true })
    .where(eq(schema.notifications.read, false))

  return { success: true }
})
