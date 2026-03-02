import type { H3Event } from 'h3'
import { eq, and, inArray } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import type { EntryType } from '~/types'

export function defineApiHandler<T>(handler: (event: H3Event) => Promise<T>) {
  return defineEventHandler(async (event) => {
    try {
      return await handler(event)
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) throw error
      if (error instanceof Error && error.name === 'ZodError') {
        throw createError({ statusCode: 400, message: 'Données invalides' })
      }
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

export async function requireTransaction(id: number) {
  const [existing] = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.id, id))
  if (!existing) throw createError({ statusCode: 404, message: 'Transaction non trouvée' })
  return existing
}

export async function joinRecurringEntries<T extends { recurringEntryId: number | null }>(rows: T[]) {
  const entryIds = [...new Set(rows.filter(r => r.recurringEntryId != null).map(r => r.recurringEntryId!))]
  if (entryIds.length === 0) return rows.map(row => ({ ...row, recurringEntry: null }))

  const entries = await db.select().from(schema.recurringEntries).where(inArray(schema.recurringEntries.id, entryIds))
  const map = new Map(entries.map(e => [e.id, e]))
  return rows.map(row => ({
    ...row,
    recurringEntry: row.recurringEntryId ? map.get(row.recurringEntryId) ?? null : null
  }))
}
