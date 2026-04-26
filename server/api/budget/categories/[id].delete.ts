import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineApiHandler(async (event) => {
  const id = requireRouteId(event)

  const [existing] = await db.select().from(schema.categories).where(eq(schema.categories.id, id))
  if (!existing) throw createError({ statusCode: 404, message: 'Catégorie non trouvée' })

  const [usage] = await db
    .select({ id: schema.recurringEntries.id })
    .from(schema.recurringEntries)
    .where(eq(schema.recurringEntries.categoryId, id))
    .limit(1)

  if (usage) {
    throw createError({
      statusCode: 409,
      message: 'Cette catégorie est utilisée par une ou plusieurs entrées récurrentes. Réaffectez-les avant de supprimer.'
    })
  }

  await db.delete(schema.categories).where(eq(schema.categories.id, id))
  return { success: true, id }
})
