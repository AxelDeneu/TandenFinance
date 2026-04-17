import { readdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { sql } from 'drizzle-orm'
import { db } from 'hub:db'

export default defineEventHandler(async (event) => {
  const secret = process.env.MIGRATION_SECRET
  if (!secret) {
    throw createError({ statusCode: 503, message: 'MIGRATION_SECRET not configured' })
  }

  const auth = getHeader(event, 'authorization')
  if (auth !== `Bearer ${secret}`) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const migrationsDir = resolve(process.cwd(), '.output/server/db/migrations/postgresql')

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS _hub_migrations (
      id serial PRIMARY KEY,
      name text NOT NULL UNIQUE,
      applied_at timestamp NOT NULL DEFAULT now()
    )
  `))

  const appliedResult = await db.execute(sql`SELECT name FROM _hub_migrations`) as unknown
  const appliedRows = (Array.isArray(appliedResult)
    ? appliedResult
    : ((appliedResult as { rows?: unknown[] })?.rows ?? [])) as { name: string }[]
  const appliedNames = new Set(appliedRows.map(r => r.name))

  let files: string[]
  try {
    files = (await readdir(migrationsDir)).filter(f => f.endsWith('.sql')).sort()
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: `Cannot read migrations dir at ${migrationsDir}: ${error instanceof Error ? error.message : String(error)}`
    })
  }

  const applied: string[] = []
  const skipped: string[] = []

  for (const file of files) {
    const name = file.replace(/\.sql$/, '')
    if (appliedNames.has(name)) {
      skipped.push(name)
      continue
    }

    const content = await readFile(join(migrationsDir, file), 'utf-8')
    const statements = content.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean)

    try {
      for (const stmt of statements) {
        await db.execute(sql.raw(stmt))
      }
      await db.execute(sql`INSERT INTO _hub_migrations (name) VALUES (${name})`)
      applied.push(name)
    } catch (error) {
      throw createError({
        statusCode: 500,
        message: `Migration ${name} failed: ${error instanceof Error ? error.message : String(error)}`,
        data: { applied, failed: name }
      })
    }
  }

  return { applied, skipped, total: files.length }
})
