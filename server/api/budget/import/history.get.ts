import { desc } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineApiHandler(async () => {
  return await db
    .select()
    .from(schema.importBatches)
    .orderBy(desc(schema.importBatches.createdAt))
})
