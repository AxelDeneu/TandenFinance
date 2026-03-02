import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineApiHandler(async (event) => {
  const id = requireRouteId(event)
  const body = updateEnvelopeSchema.parse(await readBody(event))
  const existing = await requireRecurringEntry(id, 'envelope')

  const [result] = await db
    .update(schema.recurringEntries)
    .set({
      label: body.label ?? existing.label,
      amount: body.amount ?? existing.amount,
      active: body.active ?? existing.active,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      updatedAt: new Date()
    })
    .where(eq(schema.recurringEntries.id, id))
    .returning()

  return result
})
