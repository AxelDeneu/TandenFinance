import { eq, and } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  const [existing] = await db
    .select()
    .from(schema.recurringEntries)
    .where(and(
      eq(schema.recurringEntries.id, id),
      eq(schema.recurringEntries.type, 'expense')
    ))

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Depense non trouvee' })
  }

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
