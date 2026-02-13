import * as z from 'zod'

export const createEntrySchema = z.object({
  label: z.string().min(2).max(255),
  amount: z.number().positive(),
  category: z.string().min(1),
  dayOfMonth: z.number().int().min(1).max(31),
  active: z.boolean().optional().default(true),
  notes: z.string().nullable().optional()
})

export const updateEntrySchema = createEntrySchema.partial()

export const createEnvelopeSchema = z.object({
  label: z.string().min(2).max(255),
  amount: z.number().positive(),
  active: z.boolean().optional().default(true),
  notes: z.string().nullable().optional()
})

export const updateEnvelopeSchema = createEnvelopeSchema.partial()

export const upsertActualSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  actualAmount: z.number().nonnegative()
})

export const deleteActualSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12)
})

export const createEnvelopeExpenseSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  label: z.string().min(1).max(255),
  amount: z.number().positive()
})
