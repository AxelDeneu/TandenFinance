import { eq, like } from 'drizzle-orm'
import { db, schema } from 'hub:db'

interface RuleConfig {
  threshold?: number
  category?: string
  envelopeId?: number
}

export default defineApiHandler(async () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const datePrefix = `${year}-${String(month).padStart(2, '0')}`
  const formatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
  const monthLabel = formatter.format(now)

  // Fetch active rules
  const rules = await db
    .select()
    .from(schema.budgetRules)
    .where(eq(schema.budgetRules.active, true))

  if (rules.length === 0) return { created: 0 }

  // Fetch current month transactions
  const transactions = await db
    .select()
    .from(schema.transactions)
    .where(like(schema.transactions.date, `${datePrefix}%`))

  // Fetch active recurring entries for planned amounts
  const entries = await db
    .select()
    .from(schema.recurringEntries)
    .where(eq(schema.recurringEntries.active, true))

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  const remaining = totalIncome - totalExpense

  // Category totals
  const categoryTotals = new Map<string, number>()
  for (const tx of transactions) {
    const entry = entries.find(e => e.id === tx.recurringEntryId)
    const cat = entry?.category ?? 'Non catégorisé'
    categoryTotals.set(cat, (categoryTotals.get(cat) ?? 0) + parseFloat(tx.amount))
  }

  // Envelope totals (transactions linked to envelope entries)
  const envelopeEntries = entries.filter(e => e.type === 'envelope')
  const envelopeTotals = new Map<number, number>()
  for (const tx of transactions) {
    if (tx.recurringEntryId && envelopeEntries.some(e => e.id === tx.recurringEntryId)) {
      envelopeTotals.set(tx.recurringEntryId, (envelopeTotals.get(tx.recurringEntryId) ?? 0) + parseFloat(tx.amount))
    }
  }

  const newNotifications: typeof schema.notifications.$inferInsert[] = []

  for (const rule of rules) {
    let config: RuleConfig
    try {
      config = JSON.parse(rule.config)
    } catch {
      continue
    }

    if (rule.type === 'remaining_low') {
      const threshold = config.threshold ?? 0
      if (remaining <= threshold) {
        newNotifications.push({
          ruleId: rule.id,
          title: `Reste à vivre faible`,
          body: `Il ne reste que ${remaining.toFixed(2)} € ce mois (${monthLabel}). Seuil: ${threshold} €.`,
          icon: 'i-lucide-alert-triangle',
          color: remaining < 0 ? 'error' : 'warning',
          read: false,
          actionUrl: '/budget/comptabilite',
          createdAt: now
        })
      }
    }

    if (rule.type === 'envelope_exceeded') {
      const envelopeId = config.envelopeId
      if (!envelopeId) continue
      const envelope = envelopeEntries.find(e => e.id === envelopeId)
      if (!envelope) continue
      const spent = envelopeTotals.get(envelopeId) ?? 0
      if (spent > parseFloat(envelope.amount)) {
        newNotifications.push({
          ruleId: rule.id,
          title: `Enveloppe "${envelope.label}" dépassée`,
          body: `Dépensé ${spent.toFixed(2)} € sur ${parseFloat(envelope.amount).toFixed(2)} € prévus (${monthLabel}).`,
          icon: 'i-lucide-wallet',
          color: 'error',
          read: false,
          actionUrl: '/budget/previsionnel',
          createdAt: now
        })
      }
    }

    if (rule.type === 'category_threshold') {
      const category = config.category
      const threshold = config.threshold ?? 0
      if (!category) continue
      const spent = categoryTotals.get(category) ?? 0
      if (spent > threshold) {
        newNotifications.push({
          ruleId: rule.id,
          title: `Seuil catégorie "${category}" dépassé`,
          body: `${spent.toFixed(2)} € dépensés en ${category} (${monthLabel}). Seuil: ${threshold} €.`,
          icon: 'i-lucide-tag',
          color: 'warning',
          read: false,
          actionUrl: '/budget/comptabilite',
          createdAt: now
        })
      }
    }
  }

  if (newNotifications.length > 0) {
    await db.insert(schema.notifications).values(newNotifications)
  }

  return { created: newNotifications.length }
})
