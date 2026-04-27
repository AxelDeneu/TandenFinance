import { pgTable, serial, text, numeric, integer, boolean, timestamp } from 'drizzle-orm/pg-core'

export const categories = pgTable('categories', {
  id: serial().primaryKey(),
  name: text().notNull(),
  icon: text().notNull(),
  color: text().notNull(),
  type: text({ enum: ['income', 'expense'] }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
})

export const recurringEntries = pgTable('recurring_entries', {
  id: serial().primaryKey(),
  type: text({ enum: ['income', 'expense', 'envelope'] }).notNull(),
  label: text().notNull(),
  amount: numeric({ precision: 12, scale: 2 }).notNull(),
  category: text(),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
  dayOfMonth: integer('day_of_month'),
  active: boolean().notNull().default(true),
  notes: text(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
})

export const importBatches = pgTable('import_batches', {
  id: serial().primaryKey(),
  filename: text().notNull(),
  rowCount: integer('row_count').notNull(),
  importedCount: integer('imported_count').notNull().default(0),
  skippedCount: integer('skipped_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull()
})

export const transactions = pgTable('transactions', {
  id: serial().primaryKey(),
  label: text().notNull(),
  amount: numeric({ precision: 12, scale: 2 }).notNull(),
  type: text({ enum: ['income', 'expense'] }).notNull(),
  date: text().notNull(),
  recurringEntryId: integer('recurring_entry_id').references(() => recurringEntries.id, { onDelete: 'set null' }),
  importBatchId: integer('import_batch_id').references(() => importBatches.id, { onDelete: 'set null' }),
  notes: text(),
  fingerprint: text('fingerprint'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
})

export const appSettings = pgTable('app_settings', {
  key: text().primaryKey(),
  value: text().notNull(),
  updatedAt: timestamp('updated_at').notNull()
})
