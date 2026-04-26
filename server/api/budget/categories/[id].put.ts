import * as z from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hex attendue (#RRGGBB)').optional(),
  type: z.enum(['income', 'expense']).optional(),
  sortOrder: z.number().int().min(0).optional()
})

export default defineApiHandler(async (event) => {
  const id = requireRouteId(event)
  const body = updateCategorySchema.parse(await readBody(event))

  const [existing] = await db.select().from(schema.categories).where(eq(schema.categories.id, id))
  if (!existing) throw createError({ statusCode: 404, message: 'Catégorie non trouvée' })

  const [result] = await db
    .update(schema.categories)
    .set({
      name: body.name ?? existing.name,
      icon: body.icon ?? existing.icon,
      color: body.color ?? existing.color,
      type: body.type ?? existing.type,
      sortOrder: body.sortOrder ?? existing.sortOrder,
      updatedAt: new Date()
    })
    .where(eq(schema.categories.id, id))
    .returning()

  return result
})
