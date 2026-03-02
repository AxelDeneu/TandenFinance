import { db, schema } from 'hub:db'

export default defineApiHandler(async (event) => {
  const body = createEnvelopeSchema.parse(await readBody(event))
  const now = new Date()

  const [result] = await db
    .insert(schema.recurringEntries)
    .values({
      type: 'envelope',
      label: body.label,
      amount: body.amount,
      category: null,
      dayOfMonth: null,
      active: body.active ?? true,
      notes: body.notes ?? null,
      createdAt: now,
      updatedAt: now
    })
    .returning()

  return result
})
