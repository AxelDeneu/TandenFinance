import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const recurringEntries = sqliteTable('recurring_entries', {
  id: integer().primaryKey({ autoIncrement: true }),
  type: text({ enum: ['income', 'expense', 'envelope'] }).notNull(),
  label: text().notNull(),
  amount: real().notNull(),
  category: text(),
  dayOfMonth: integer('day_of_month'),
  active: integer({ mode: 'boolean' }).notNull().default(true),
  notes: text(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

export const monthlyActuals = sqliteTable('monthly_actuals', {
  id: integer().primaryKey({ autoIncrement: true }),
  recurringEntryId: integer('recurring_entry_id').notNull().references(() => recurringEntries.id, { onDelete: 'cascade' }),
  year: integer().notNull(),
  month: integer().notNull(),
  actualAmount: real('actual_amount').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
}, table => [
  uniqueIndex('monthly_actuals_entry_year_month_idx').on(table.recurringEntryId, table.year, table.month)
])

export const envelopeExpenses = sqliteTable('envelope_expenses', {
  id: integer().primaryKey({ autoIncrement: true }),
  recurringEntryId: integer('recurring_entry_id').notNull().references(() => recurringEntries.id, { onDelete: 'cascade' }),
  year: integer().notNull(),
  month: integer().notNull(),
  label: text().notNull(),
  amount: real().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})
