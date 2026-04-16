import { db, schema } from 'hub:db'
import { buildTransactionFingerprint, buildTransactionFingerprintSet } from '../../../utils/transactions'

export default defineApiHandler(async (event) => {
  const body = confirmImportSchema.parse(await readBody(event))
  const now = new Date()

  // Calculate fingerprints for all incoming transactions
  const fingerprints = body.transactions.map(tx =>
    buildTransactionFingerprint(tx)
  )

  // Check for existing duplicates using date + label + amount fingerprints
  const existingTransactions = fingerprints.length > 0
    ? await db
      .select({
        date: schema.transactions.date,
        label: schema.transactions.label,
        amount: schema.transactions.amount
      })
      .from(schema.transactions)
    : []

  const duplicateSet = buildTransactionFingerprintSet(existingTransactions)

  // Only keep new (non-duplicate) transactions
  const newTransactions = body.transactions.filter((_tx, i) =>
    !duplicateSet.has(fingerprints[i]!)
  )

  const skipped = body.transactions.length - newTransactions.length

  // Create import batch
  const batchRows = await db
    .insert(schema.importBatches)
    .values({
      filename: body.filename,
      rowCount: body.transactions.length,
      importedCount: newTransactions.length,
      skippedCount: skipped,
      createdAt: now
    })
    .returning()

  const batch = batchRows[0]!

  // Create transactions in batch (only non-duplicates)
  if (newTransactions.length > 0) {
    const values = newTransactions.map(tx => ({
      label: tx.label,
      amount: String(tx.amount),
      type: tx.type as 'income' | 'expense',
      date: tx.date,
      recurringEntryId: tx.recurringEntryId ?? null,
      importBatchId: batch.id,
      notes: tx.notes ?? null,
      createdAt: now,
      updatedAt: now
    }))

    await db.insert(schema.transactions).values(values)
  }

  return {
    batchId: batch.id,
    imported: newTransactions.length,
    skipped
  }
})
