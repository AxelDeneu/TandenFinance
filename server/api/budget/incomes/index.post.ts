import { db, schema } from 'hub:db'

export default defineApiHandler(async (event) => {
  const body = createEntrySchema.parse(await readBody(event))
  const now = new Date()

  const [result] = await db
    .insert(schema.recurringEntries)
    .values({
      type: 'income',
      label: body.label,
      amount: body.amount,
      category: body.category,
      dayOfMonth: body.dayOfMonth,
      active: body.active ?? true,
      notes: body.notes ?? null,
      createdAt: now,
      updatedAt: now
    })
    .returning()

  return result
})
