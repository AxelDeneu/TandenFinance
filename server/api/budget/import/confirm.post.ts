import { db, schema } from 'hub:db'

export default defineApiHandler(async (event) => {
  const body = confirmImportSchema.parse(await readBody(event))
  const now = new Date()

  // Create import batch
  const batchRows = await db
    .insert(schema.importBatches)
    .values({
      filename: body.filename,
      rowCount: body.transactions.length,
      importedCount: body.transactions.length,
      skippedCount: 0,
      createdAt: now
    })
    .returning()

  const batch = batchRows[0]!

  // Create transactions in batch
  const values = body.transactions.map(tx => ({
    label: tx.label,
    amount: tx.amount,
    type: tx.type as 'income' | 'expense',
    date: tx.date,
    recurringEntryId: tx.recurringEntryId ?? null,
    importBatchId: batch.id,
    notes: tx.notes ?? null,
    createdAt: now,
    updatedAt: now
  }))

  await db.insert(schema.transactions).values(values)

  return {
    batchId: batch.id,
    imported: body.transactions.length
  }
})
