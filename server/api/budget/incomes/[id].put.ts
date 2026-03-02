import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineApiHandler(async (event) => {
  const id = requireRouteId(event)
  const body = updateEntrySchema.parse(await readBody(event))
  const existing = await requireRecurringEntry(id, 'income')

  const [result] = await db
    .update(schema.recurringEntries)
    .set({
      label: body.label ?? existing.label,
      amount: body.amount ?? existing.amount,
      category: body.category ?? existing.category,
      dayOfMonth: body.dayOfMonth ?? existing.dayOfMonth,
      active: body.active ?? existing.active,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      updatedAt: new Date()
    })
    .where(eq(schema.recurringEntries.id, id))
    .returning()

  return result
})
