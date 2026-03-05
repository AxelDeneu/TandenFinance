import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineApiHandler(async (event) => {
  const id = requireRouteId(event)
  const body = updateRuleSchema.parse(await readBody(event))

  const [existing] = await db
    .select()
    .from(schema.budgetRules)
    .where(eq(schema.budgetRules.id, id))

  if (!existing) throw createError({ statusCode: 404, message: 'Règle non trouvée' })

  const [result] = await db
    .update(schema.budgetRules)
    .set({
      label: body.label ?? existing.label,
      type: body.type ?? existing.type,
      config: body.config ?? existing.config,
      active: body.active ?? existing.active,
      updatedAt: new Date()
    })
    .where(eq(schema.budgetRules.id, id))
    .returning()

  return result
})
