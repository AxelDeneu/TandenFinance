import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

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

export const transactions = sqliteTable('transactions', {
  id: integer().primaryKey({ autoIncrement: true }),
  label: text().notNull(),
  amount: real().notNull(),
  type: text({ enum: ['income', 'expense'] }).notNull(),
  date: text().notNull(),
  recurringEntryId: integer('recurring_entry_id').references(() => recurringEntries.id, { onDelete: 'set null' }),
  notes: text(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})
