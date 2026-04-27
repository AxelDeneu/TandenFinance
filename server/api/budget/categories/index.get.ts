import { db, schema } from 'hub:db'

export default defineApiHandler(async () => {
  return await db
    .select()
    .from(schema.categories)
    .orderBy(schema.categories.sortOrder, schema.categories.name)
})
