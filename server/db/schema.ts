import { pgTable, serial, text, real, integer, boolean, timestamp } from 'drizzle-orm/pg-core'

export const recurringEntries = pgTable('recurring_entries', {
  id: serial().primaryKey(),
  type: text({ enum: ['income', 'expense', 'envelope'] }).notNull(),
  label: text().notNull(),
  amount: real().notNull(),
  category: text(),
  dayOfMonth: integer('day_of_month'),
  active: boolean().notNull().default(true),
  notes: text(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
})

export const transactions = pgTable('transactions', {
  id: serial().primaryKey(),
  label: text().notNull(),
  amount: real().notNull(),
  type: text({ enum: ['income', 'expense'] }).notNull(),
  date: text().notNull(),
  recurringEntryId: integer('recurring_entry_id').references(() => recurringEntries.id, { onDelete: 'set null' }),
  notes: text(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
})
