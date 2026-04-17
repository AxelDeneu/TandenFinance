import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { transactionListSelect } from '../../../utils/transactions'

export default defineApiHandler(async (event) => {
  const id = requireRouteId(event)
  const body = updateTransactionSchema.parse(await readBody(event))
  const existing = await requireTransaction(id)

  if (body.recurringEntryId != null) {
    await requireRecurringEntryExists(body.recurringEntryId)
  }

  const [result] = await db
    .update(schema.transactions)
    .set({
      label: body.label ?? existing.label,
      amount: String(body.amount ?? existing.amount),
      type: body.type ?? existing.type,
      date: body.date ?? existing.date,
      recurringEntryId: body.recurringEntryId !== undefined ? (body.recurringEntryId ?? null) : existing.recurringEntryId,
      notes: body.notes !== undefined ? (body.notes ?? null) : existing.notes,
      updatedAt: new Date()
    })
    .where(eq(schema.transactions.id, id))
    .returning(transactionListSelect)

  return result
})
