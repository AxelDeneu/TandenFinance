import { like, desc } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { transactionListSelect } from '~/server/utils/transactions'

export default defineApiHandler(async (event) => {
  const query = getQuery(event)
  const q = String(query.q || '').trim().slice(0, 100)

  if (!q) return []

  const rows = await db
    .select(transactionListSelect)
    .from(schema.transactions)
    .where(like(schema.transactions.label, `%${q}%`))
    .orderBy(desc(schema.transactions.date))
    .limit(10)

  return joinRecurringEntries(rows)
})
