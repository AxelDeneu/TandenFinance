import { db, schema } from 'hub:db'

export default defineApiHandler(async (event) => {
  const body = createTransactionSchema.parse(await readBody(event))
  const now = new Date()

  const [result] = await db
    .insert(schema.transactions)
    .values({
      label: body.label,
      amount: body.amount,
      type: body.type,
      date: body.date,
      recurringEntryId: body.recurringEntryId ?? null,
      notes: body.notes ?? null,
      createdAt: now,
      updatedAt: now
    })
    .returning()

  return result
})
