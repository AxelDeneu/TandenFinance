import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineApiHandler(async (event) => {
  const id = requireRouteId(event)

  const [existing] = await db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.id, id))

  if (!existing) throw createError({ statusCode: 404, message: 'Notification non trouvée' })

  const [result] = await db
    .update(schema.notifications)
    .set({ read: true })
    .where(eq(schema.notifications.id, id))
    .returning()

  return result
})
