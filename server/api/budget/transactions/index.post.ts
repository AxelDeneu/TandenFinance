import { db, schema } from 'hub:db'
import { evaluateBudgetRules } from '~~/server/utils/evaluate-rules'

export default defineApiHandler(async (event) => {
  const body = createTransactionSchema.parse(await readBody(event))
  const now = new Date()

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
    .returning()

  // Déclencher l'évaluation des règles en arrière-plan (fire-and-forget)
  evaluateBudgetRules().catch(console.error)

  return result
})
