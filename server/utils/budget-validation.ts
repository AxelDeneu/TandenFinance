import * as z from 'zod'

export const createEntrySchema = z.object({
  label: z.string().min(2).max(255),
  amount: z.number().positive(),
  category: z.string().min(1).optional(),
  categoryId: z.number().int().positive(),
  dayOfMonth: z.number().int().min(1).max(31),
  active: z.boolean().optional().default(true),
  notes: z.string().nullable().optional()
})

export const updateEntrySchema = createEntrySchema.partial()

export const createEnvelopeSchema = z.object({
  label: z.string().min(2).max(255),
  amount: z.number().positive(),
  categoryId: z.number().int().positive(),
  active: z.boolean().optional().default(true),
  notes: z.string().nullable().optional()
})

export const updateEnvelopeSchema = createEnvelopeSchema.partial()

export const createTransactionSchema = z.object({
  label: z.string().min(1).max(255),
  amount: z.number().positive(),
  type: z.enum(['income', 'expense']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date ISO attendu (YYYY-MM-DD)'),
  recurringEntryId: z.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional()
})

export const updateTransactionSchema = createTransactionSchema.partial()

export const createRuleSchema = z.object({
  label: z.string().min(2).max(255),
  type: z.enum(['envelope_exceeded', 'remaining_low', 'category_threshold']),
  config: z.string().min(2),
  active: z.boolean().optional().default(true)
})

export const updateRuleSchema = createRuleSchema.partial()

export const confirmImportSchema = z.object({
  filename: z.string().min(1),
  transactions: z.array(z.object({
    label: z.string().min(1).max(255),
    amount: z.number().positive(),
    type: z.enum(['income', 'expense']),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    recurringEntryId: z.number().int().positive().nullable().optional(),
    notes: z.string().nullable().optional()
  })).min(1)
})
