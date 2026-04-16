import { like, desc } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { transactionListSelect } from '../../../utils/transactions'

export default defineApiHandler(async (event) => {
  const query = getQuery(event)
  const year = Number(query.year)
  const month = Number(query.month)

  if (!year || !month || month < 1 || month > 12) {
    throw createError({ statusCode: 400, message: 'Paramètres year et month requis' })
  }

  const datePrefix = `${year}-${String(month).padStart(2, '0')}`

  const rows = await db
    .select(transactionListSelect)
    .from(schema.transactions)
    .where(like(schema.transactions.date, `${datePrefix}%`))
    .orderBy(desc(schema.transactions.date))

  return joinRecurringEntries(rows)
})
