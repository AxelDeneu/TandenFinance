import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const recurringEntries = sqliteTable('recurring_entries', {
  id: integer().primaryKey({ autoIncrement: true }),
  type: text({ enum: ['income', 'expense'] }).notNull(),
  label: text().notNull(),
  amount: real().notNull(),
  category: text().notNull(),
  dayOfMonth: integer('day_of_month').notNull(),
  active: integer({ mode: 'boolean' }).notNull().default(true),
  notes: text(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

export const budgetSettings = sqliteTable('budget_settings', {
  id: integer().primaryKey({ autoIncrement: true }),
  key: text().notNull().unique(),
  value: text().notNull()
})
