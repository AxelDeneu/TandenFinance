import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  try {
    const body = createEntrySchema.parse(await readBody(event))
    const now = new Date()

    const [result] = await db
      .insert(schema.recurringEntries)
      .values({
        type: 'income',
        label: body.label,
        amount: body.amount,
        category: body.category,
        dayOfMonth: body.dayOfMonth,
        active: body.active ?? true,
        notes: body.notes ?? null,
        createdAt: now,
        updatedAt: now
      })
      .returning()

    return result
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    if (error instanceof Error && error.name === 'ZodError') {
      throw createError({ statusCode: 400, message: 'Données invalides' })
    }
    throw createError({ statusCode: 500, message: 'Erreur serveur' })
  }
})
