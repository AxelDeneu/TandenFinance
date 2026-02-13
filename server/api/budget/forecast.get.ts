import { eq, and, gte, lte, inArray } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const monthCount = Math.min(Number(query.months) || 6, 12)

    const queryYear = Number(query.year) || 0
    const queryMonth = Number(query.month) || 0
    const hasSingleMonthParams = queryYear > 0 && queryMonth >= 1 && queryMonth <= 12

    const startDate = hasSingleMonthParams
      ? new Date(queryYear, queryMonth - 1, 1)
      : new Date()

    const months: { year: number, month: number, label: string }[] = []
    const formatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })

    for (let i = 0; i < monthCount; i++) {
      const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1)
      months.push({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        label: formatter.format(date)
      })
    }

    const activeEntries = await db
      .select()
      .from(schema.recurringEntries)
      .where(eq(schema.recurringEntries.active, true))

    const nonEnvelopeEntryIds = activeEntries.filter(e => e.type !== 'envelope').map(e => e.id)
    const envelopeEntryIds = activeEntries.filter(e => e.type === 'envelope').map(e => e.id)

    let actuals: { id: number, recurringEntryId: number, year: number, month: number, actualAmount: number, createdAt: Date, updatedAt: Date }[] = []

    const startYear = months.length > 0 ? months[0]!.year : 0
    const startMonth = months.length > 0 ? months[0]!.month : 0
    const endYear = months.length > 0 ? months[months.length - 1]!.year : 0
    const endMonth = months.length > 0 ? months[months.length - 1]!.month : 0

    if (nonEnvelopeEntryIds.length > 0 && months.length > 0) {
      actuals = await db
        .select()
        .from(schema.monthlyActuals)
        .where(and(
          inArray(schema.monthlyActuals.recurringEntryId, nonEnvelopeEntryIds),
          gte(schema.monthlyActuals.year, startYear),
          lte(schema.monthlyActuals.year, endYear)
        ))

      actuals = actuals.filter((a) => {
        if (a.year === startYear && a.month < startMonth) return false
        if (a.year === endYear && a.month > endMonth) return false
        return true
      })
    }

    const actualsByEntry = new Map<number, Map<string, number>>()
    for (const actual of actuals) {
      const key = `${actual.year}-${actual.month}`
      if (!actualsByEntry.has(actual.recurringEntryId)) {
        actualsByEntry.set(actual.recurringEntryId, new Map())
      }
      actualsByEntry.get(actual.recurringEntryId)!.set(key, actual.actualAmount)
    }

    // Compute envelope actuals from envelope_expenses
    if (envelopeEntryIds.length > 0 && months.length > 0) {
      const envelopeExpensesRaw = await db
        .select()
        .from(schema.envelopeExpenses)
        .where(and(
          inArray(schema.envelopeExpenses.recurringEntryId, envelopeEntryIds),
          gte(schema.envelopeExpenses.year, startYear),
          lte(schema.envelopeExpenses.year, endYear)
        ))

      // Filter to exact month range (same as actuals)
      const filteredEnvExpenses = envelopeExpensesRaw.filter((e) => {
        if (e.year === startYear && e.month < startMonth) return false
        if (e.year === endYear && e.month > endMonth) return false
        return true
      })

      // Sum by entry+year+month
      for (const exp of filteredEnvExpenses) {
        const key = `${exp.year}-${exp.month}`
        if (!actualsByEntry.has(exp.recurringEntryId)) {
          actualsByEntry.set(exp.recurringEntryId, new Map())
        }
        const entryMap = actualsByEntry.get(exp.recurringEntryId)!
        entryMap.set(key, (entryMap.get(key) ?? 0) + exp.amount)
      }
    }

    function buildForecastEntries(entries: typeof activeEntries) {
      return entries.map((entry) => {
        const entryActuals: Record<string, number | null> = {}
        for (const m of months) {
          const key = `${m.year}-${m.month}`
          entryActuals[key] = actualsByEntry.get(entry.id)?.get(key) ?? null
        }
        return { entry, actuals: entryActuals }
      })
    }

    return {
      months,
      incomes: buildForecastEntries(activeEntries.filter(e => e.type === 'income')),
      expenses: buildForecastEntries(activeEntries.filter(e => e.type === 'expense')),
      envelopes: buildForecastEntries(activeEntries.filter(e => e.type === 'envelope'))
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({ statusCode: 500, message: 'Erreur serveur' })
  }
})
