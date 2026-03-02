import { like, desc } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const year = Number(query.year)
    const month = Number(query.month)

    if (!year || !month || month < 1 || month > 12) {
      throw createError({ statusCode: 400, message: 'Paramètres year et month requis' })
    }

    const datePrefix = `${year}-${String(month).padStart(2, '0')}`

    const rows = await db
      .select()
      .from(schema.transactions)
      .where(like(schema.transactions.date, `${datePrefix}%`))
      .orderBy(desc(schema.transactions.date))

    // Join recurring entries
    const entryIds = [...new Set(rows.filter(r => r.recurringEntryId != null).map(r => r.recurringEntryId!))]
    let entriesMap = new Map<number, typeof schema.recurringEntries.$inferSelect>()

    if (entryIds.length > 0) {
      const entries = await db
        .select()
        .from(schema.recurringEntries)

      entriesMap = new Map(entries.map(e => [e.id, e]))
    }

    return rows.map(row => ({
      ...row,
      recurringEntry: row.recurringEntryId ? entriesMap.get(row.recurringEntryId) ?? null : null
    }))
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({ statusCode: 500, message: 'Erreur serveur' })
  }
})
