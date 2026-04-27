import { db, schema } from 'hub:db'
import { transactionListSelect } from '../../../utils/transactions'

export default defineApiHandler(async (event) => {
  const body = createTransactionSchema.parse(await readBody(event))
  const now = new Date()

  if (body.recurringEntryId != null) {
    await requireRecurringEntryExists(body.recurringEntryId)
  }

  const [result] = await db
    .insert(schema.transactions)
    .values({
      label: body.label,
      amount: String(body.amount),
      type: body.type,
      date: body.date,
      recurringEntryId: body.recurringEntryId ?? null,
      notes: body.notes ?? null,
      createdAt: now,
      updatedAt: now
    })
    .returning(transactionListSelect)

  return result
})
