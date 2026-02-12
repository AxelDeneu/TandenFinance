import { db, schema } from 'hub:db'

export default defineEventHandler(async () => {
  const rows = await db
    .select()
    .from(schema.budgetSettings)

  const settings: Record<string, string> = {
    salaryReferenceDay: '1'
  }

  for (const row of rows) {
    settings[row.key] = row.value
  }

  return {
    salaryReferenceDay: Number(settings.salaryReferenceDay)
  }
})
