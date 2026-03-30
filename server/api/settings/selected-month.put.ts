import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import * as z from 'zod'

const bodySchema = z.object({
  value: z.string().regex(/^\d{4}-\d{2}$/)
})

export default defineApiHandler(async (event) => {
  const { value } = bodySchema.parse(await readBody(event))
  const now = new Date()

  const [existing] = await db
    .select()
    .from(schema.appSettings)
    .where(eq(schema.appSettings.key, 'selected-month'))

  if (existing) {
    await db
      .update(schema.appSettings)
      .set({ value, updatedAt: now })
      .where(eq(schema.appSettings.key, 'selected-month'))
  } else {
    await db
      .insert(schema.appSettings)
      .values({ key: 'selected-month', value, updatedAt: now })
  }

  return { value }
})
