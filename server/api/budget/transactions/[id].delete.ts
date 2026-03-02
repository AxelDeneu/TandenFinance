import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineApiHandler(async (event) => {
  const id = requireRouteId(event)
  await requireTransaction(id)

  await db
    .delete(schema.transactions)
    .where(eq(schema.transactions.id, id))

  return { success: true, id }
})
