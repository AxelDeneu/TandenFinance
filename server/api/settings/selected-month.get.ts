import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineApiHandler(async () => {
  const [row] = await db
    .select()
    .from(schema.appSettings)
    .where(eq(schema.appSettings.key, 'selected-month'))

  if (row) {
    return { value: row.value }
  }

  const now = new Date()
  const defaultValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return { value: defaultValue }
})
