import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await db
    .insert(schema.budgetSettings)
    .values({
      key: 'salaryReferenceDay',
      value: String(body.salaryReferenceDay)
    })
    .onConflictDoUpdate({
      target: schema.budgetSettings.key,
      set: {
        value: String(body.salaryReferenceDay)
      }
    })

  return {
    salaryReferenceDay: Number(body.salaryReferenceDay)
  }
})
