import type { H3Event } from 'h3'
import type { ZodType } from 'zod'
import { eq, and, inArray } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import type { EntryType } from '~/types'

interface RecurringEntryBody {
  label: string
  amount: number
  category?: string | null
  categoryId?: number | null
  dayOfMonth?: number | null
  active?: boolean
  notes?: string | null
}

export function defineApiHandler<T>(handler: (event: H3Event) => Promise<T>) {
  return defineEventHandler(async (event) => {
    try {
      return await handler(event)
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) throw error
      if (error instanceof Error && error.name === 'ZodError') {
        throw createError({ statusCode: 400, message: 'Données invalides' })
      }
      console.error(`[api] ${event.method} ${event.path} failed:`, error)
      throw createError({ statusCode: 500, message: 'Erreur serveur' })
    }
  })
}

export function requireRouteId(event: H3Event): number {
  const id = Number(getRouterParam(event, 'id'))
  if (Number.isNaN(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'ID invalide' })
  }
  return id
}

export async function requireRecurringEntry(id: number, type: EntryType) {
  const [existing] = await db
    .select()
    .from(schema.recurringEntries)
    .where(and(eq(schema.recurringEntries.id, id), eq(schema.recurringEntries.type, type)))
  if (!existing) throw createError({ statusCode: 404, message: 'Entrée non trouvée' })
  return existing
}

export async function requireRecurringEntryExists(id: number) {
  const [existing] = await db
    .select({ id: schema.recurringEntries.id })
    .from(schema.recurringEntries)
    .where(eq(schema.recurringEntries.id, id))
  if (!existing) throw createError({ statusCode: 400, message: 'Entrée récurrente introuvable' })
  return existing
}

export async function requireTransaction(id: number) {
  const [existing] = await db
    .select({
      id: schema.transactions.id,
      label: schema.transactions.label,
      amount: schema.transactions.amount,
      type: schema.transactions.type,
      date: schema.transactions.date,
      recurringEntryId: schema.transactions.recurringEntryId,
      notes: schema.transactions.notes
    })
    .from(schema.transactions)
    .where(eq(schema.transactions.id, id))
  if (!existing) throw createError({ statusCode: 404, message: 'Transaction non trouvée' })
  return existing
}

export async function joinRecurringEntries<T extends { recurringEntryId: number | null }>(rows: T[]) {
  const entryIds = [...new Set(rows.filter(r => r.recurringEntryId != null).map(r => r.recurringEntryId!))]
  if (entryIds.length === 0) return rows.map(row => ({ ...row, recurringEntry: null }))

  const entries = await db.select().from(schema.recurringEntries).where(inArray(schema.recurringEntries.id, entryIds))
  const map = new Map(entries.map(e => [e.id, { ...e, amount: parseFloat(e.amount) }]))
  return rows.map(row => ({
    ...row,
    recurringEntry: row.recurringEntryId ? map.get(row.recurringEntryId) ?? null : null
  }))
}

async function resolveCategoryName(categoryId?: number | null, fallback?: string | null): Promise<string | null> {
  if (categoryId == null) return fallback ?? null
  const [cat] = await db.select({ name: schema.categories.name }).from(schema.categories).where(eq(schema.categories.id, categoryId))
  return cat?.name ?? fallback ?? null
}

export async function createRecurringEntry(event: H3Event, type: EntryType, validationSchema: ZodType<RecurringEntryBody>) {
  const body = validationSchema.parse(await readBody(event))
  const now = new Date()

  const categoryName = await resolveCategoryName(body.categoryId, body.category)

  const [result] = await db
    .insert(schema.recurringEntries)
    .values({
      type,
      label: body.label,
      amount: String(body.amount),
      category: categoryName,
      categoryId: body.categoryId ?? null,
      dayOfMonth: body.dayOfMonth ?? null,
      active: body.active ?? true,
      notes: body.notes ?? null,
      createdAt: now,
      updatedAt: now
    })
    .returning()

  return result ? { ...result, amount: parseFloat(result.amount) } : result
}

export async function updateRecurringEntry(event: H3Event, type: EntryType, validationSchema: ZodType<Partial<RecurringEntryBody>>) {
  const id = requireRouteId(event)
  const body = validationSchema.parse(await readBody(event))
  const existing = await requireRecurringEntry(id, type)

  const nextCategoryId = body.categoryId !== undefined ? (body.categoryId ?? null) : existing.categoryId
  const nextCategoryName = body.categoryId !== undefined
    ? await resolveCategoryName(nextCategoryId, body.category)
    : (body.category !== undefined ? (body.category ?? null) : existing.category)

  const [result] = await db
    .update(schema.recurringEntries)
    .set({
      label: body.label ?? existing.label,
      amount: body.amount !== undefined ? String(body.amount) : existing.amount,
      category: nextCategoryName,
      categoryId: nextCategoryId,
      dayOfMonth: body.dayOfMonth !== undefined ? (body.dayOfMonth ?? null) : existing.dayOfMonth,
      active: body.active ?? existing.active,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      updatedAt: new Date()
    })
    .where(eq(schema.recurringEntries.id, id))
    .returning()

  return result ? { ...result, amount: parseFloat(result.amount) } : result
}

export async function deleteRecurringEntry(event: H3Event, type: EntryType) {
  const id = requireRouteId(event)
  await requireRecurringEntry(id, type)
  await db.delete(schema.recurringEntries).where(eq(schema.recurringEntries.id, id))
  return { success: true, id }
}

export async function toggleRecurringEntry(event: H3Event, type: EntryType) {
  const id = requireRouteId(event)
  const existing = await requireRecurringEntry(id, type)
  const [result] = await db
    .update(schema.recurringEntries)
    .set({ active: !existing.active, updatedAt: new Date() })
    .where(eq(schema.recurringEntries.id, id))
    .returning()
  return result ? { ...result, amount: parseFloat(result.amount) } : result
}
