import { db, schema } from 'hub:db'

export default defineApiHandler(async (event) => {
  const body = createRuleSchema.parse(await readBody(event))
  const now = new Date()

  const [result] = await db
    .insert(schema.budgetRules)
    .values({
      label: body.label,
      type: body.type,
      config: body.config,
      active: body.active ?? true,
      createdAt: now,
      updatedAt: now
    })
    .returning()

  return result
})
