import { db, schema } from 'hub:db'

export default defineEventHandler(async () => {
  try {
    const rows = await db
      .selectDistinct({ label: schema.transactions.label })
      .from(schema.transactions)
      .orderBy(schema.transactions.label)

    return rows.map(r => r.label)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({ statusCode: 500, message: 'Erreur serveur' })
  }
})
