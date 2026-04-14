import { inArray } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineApiHandler(async (event) => {
  const body = confirmImportSchema.parse(await readBody(event))
  const now = new Date()

  // Calculate fingerprints for all incoming transactions
  const fingerprints = body.transactions.map(tx =>
    buildFingerprint(tx.date, tx.label, tx.amount)
  )

  // Check for existing duplicates
  const existingFingerprints = fingerprints.length > 0
    ? await db
      .select({ fingerprint: schema.transactions.fingerprint })
      .from(schema.transactions)
      .where(inArray(schema.transactions.fingerprint, fingerprints))
    : []

  const duplicateSet = new Set(existingFingerprints.map(r => r.fingerprint).filter(Boolean))

  // Only keep new (non-duplicate) transactions
  const newTransactions = body.transactions.filter((_tx, i) =>
    !duplicateSet.has(fingerprints[i]!)
  )
  const newFingerprints = fingerprints.filter((_fp, i) =>
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
    const values = newTransactions.map((tx, i) => ({
      label: tx.label,
      amount: String(tx.amount),
      type: tx.type as 'income' | 'expense',
      date: tx.date,
      recurringEntryId: tx.recurringEntryId ?? null,
      importBatchId: batch.id,
      notes: tx.notes ?? null,
      fingerprint: newFingerprints[i],
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
