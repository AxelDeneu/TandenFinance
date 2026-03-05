import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineApiHandler(async (event) => {
  const id = requireRouteId(event)

  const [existing] = await db
    .select()
    .from(schema.budgetRules)
    .where(eq(schema.budgetRules.id, id))

  if (!existing) throw createError({ statusCode: 404, message: 'Règle non trouvée' })

  const [result] = await db
    .update(schema.budgetRules)
    .set({ active: !existing.active, updatedAt: new Date() })
    .where(eq(schema.budgetRules.id, id))
    .returning()

  return result
})
