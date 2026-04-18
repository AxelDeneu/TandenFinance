import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('error: DATABASE_URL is not set')
  process.exit(1)
}

const migrationsFolder = process.env.MIGRATIONS_DIR || './migrations'

const sql = postgres(url, { max: 1, onnotice: () => {} })
const db = drizzle(sql)

try {
  console.log(`applying migrations from ${migrationsFolder}`)
  await migrate(db, { migrationsFolder })
  console.log('migrations done')
} catch (err) {
  console.error('migration failed:', err)
  process.exitCode = 1
} finally {
  await sql.end()
}
