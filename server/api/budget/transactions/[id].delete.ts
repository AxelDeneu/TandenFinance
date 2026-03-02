import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))
    if (Number.isNaN(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'ID invalide' })
    }

    const [existing] = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.id, id))

    if (!existing) {
      throw createError({ statusCode: 404, message: 'Transaction non trouvée' })
    }

    await db
      .delete(schema.transactions)
      .where(eq(schema.transactions.id, id))

    return { success: true, id }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({ statusCode: 500, message: 'Erreur serveur' })
  }
})
