import { db, schema } from 'hub:db'

export default defineApiHandler(async () => {
  const rows = await db
    .selectDistinct({ label: schema.transactions.label })
    .from(schema.transactions)
    .orderBy(schema.transactions.label)

  return rows.map(r => r.label)
})
