import * as z from 'zod'
import { db, schema } from 'hub:db'

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hex attendue (#RRGGBB)'),
  type: z.enum(['income', 'expense']),
  sortOrder: z.number().int().min(0).optional()
})

export default defineApiHandler(async (event) => {
  const body = createCategorySchema.parse(await readBody(event))
  const now = new Date()

  const [result] = await db
    .insert(schema.categories)
    .values({
      name: body.name,
      icon: body.icon,
      color: body.color,
      type: body.type,
      sortOrder: body.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now
    })
    .returning()

  return result
})
