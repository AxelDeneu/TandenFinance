import { describe, it, expect } from 'vitest'
import { createEntrySchema, updateEntrySchema, createEnvelopeSchema, updateEnvelopeSchema, createTransactionSchema, updateTransactionSchema, createRuleSchema, updateRuleSchema, confirmImportSchema } from '../../server/utils/budget-validation'

describe('createEntrySchema', () => {
  it('accepts valid entry data', () => {
    const result = createEntrySchema.safeParse({
      label: 'Loyer',
      amount: 1200,
      categoryId: 1,
      dayOfMonth: 5
    })
    expect(result.success).toBe(true)
  })

  it('applies default value for active field', () => {
    const result = createEntrySchema.safeParse({
      label: 'Loyer',
      amount: 1200,
      categoryId: 1,
      dayOfMonth: 5
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.active).toBe(true)
    }
  })

  it('rejects empty label', () => {
    const result = createEntrySchema.safeParse({
      label: '',
      amount: 1200,
      category: 'Logement',
      dayOfMonth: 5
    })
    expect(result.success).toBe(false)
  })

  it('rejects label shorter than 2 characters', () => {
    const result = createEntrySchema.safeParse({
      label: 'A',
      amount: 1200,
      category: 'Logement',
      dayOfMonth: 5
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing label', () => {
    const result = createEntrySchema.safeParse({
      amount: 1200,
      category: 'Logement',
      dayOfMonth: 5
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative amount', () => {
    const result = createEntrySchema.safeParse({
      label: 'Test',
      amount: -100,
      category: 'Logement',
      dayOfMonth: 5
    })
    expect(result.success).toBe(false)
  })

  it('rejects zero amount', () => {
    const result = createEntrySchema.safeParse({
      label: 'Test',
      amount: 0,
      category: 'Logement',
      dayOfMonth: 5
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-numeric amount', () => {
    const result = createEntrySchema.safeParse({
      label: 'Test',
      amount: 'not a number',
      category: 'Logement',
      dayOfMonth: 5
    })
    expect(result.success).toBe(false)
  })

  it('rejects dayOfMonth below 1', () => {
    const result = createEntrySchema.safeParse({
      label: 'Test',
      amount: 100,
      category: 'Logement',
      dayOfMonth: 0
    })
    expect(result.success).toBe(false)
  })

  it('rejects dayOfMonth above 31', () => {
    const result = createEntrySchema.safeParse({
      label: 'Test',
      amount: 100,
      category: 'Logement',
      dayOfMonth: 32
    })
    expect(result.success).toBe(false)
  })

  it('accepts dayOfMonth boundary values', () => {
    const result1 = createEntrySchema.safeParse({
      label: 'Test',
      amount: 100,
      categoryId: 1,
      dayOfMonth: 1
    })
    expect(result1.success).toBe(true)

    const result31 = createEntrySchema.safeParse({
      label: 'Test',
      amount: 100,
      categoryId: 1,
      dayOfMonth: 31
    })
    expect(result31.success).toBe(true)
  })

  it('rejects non-integer dayOfMonth', () => {
    const result = createEntrySchema.safeParse({
      label: 'Test',
      amount: 100,
      category: 'Logement',
      dayOfMonth: 15.5
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty category', () => {
    const result = createEntrySchema.safeParse({
      label: 'Test',
      amount: 100,
      category: '',
      dayOfMonth: 5
    })
    expect(result.success).toBe(false)
  })

  it('accepts optional fields', () => {
    const result = createEntrySchema.safeParse({
      label: 'Test',
      amount: 100,
      categoryId: 1,
      dayOfMonth: 15,
      active: false,
      notes: 'Some note'
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.active).toBe(false)
      expect(result.data.notes).toBe('Some note')
    }
  })

  it('accepts null notes', () => {
    const result = createEntrySchema.safeParse({
      label: 'Test',
      amount: 100,
      categoryId: 1,
      dayOfMonth: 15,
      notes: null
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.notes).toBeNull()
    }
  })

  it('rejects completely empty object', () => {
    const result = createEntrySchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('updateEntrySchema', () => {
  it('accepts partial data with only amount', () => {
    const result = updateEntrySchema.safeParse({
      amount: 1500
    })
    expect(result.success).toBe(true)
  })

  it('accepts partial data with only label', () => {
    const result = updateEntrySchema.safeParse({
      label: 'Updated label'
    })
    expect(result.success).toBe(true)
  })

  it('accepts partial data with only category', () => {
    const result = updateEntrySchema.safeParse({
      category: 'Alimentation'
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty object', () => {
    const result = updateEntrySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('still validates amount when provided', () => {
    const result = updateEntrySchema.safeParse({
      amount: -100
    })
    expect(result.success).toBe(false)
  })

  it('still validates label when provided', () => {
    const result = updateEntrySchema.safeParse({
      label: ''
    })
    expect(result.success).toBe(false)
  })

  it('still validates dayOfMonth when provided', () => {
    const result = updateEntrySchema.safeParse({
      dayOfMonth: 0
    })
    expect(result.success).toBe(false)
  })

  it('accepts full valid data', () => {
    const result = updateEntrySchema.safeParse({
      label: 'Full update',
      amount: 999,
      category: 'Divers',
      dayOfMonth: 28,
      active: true,
      notes: 'Updated note'
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.label).toBe('Full update')
      expect(result.data.amount).toBe(999)
    }
  })
})

describe('createEnvelopeSchema', () => {
  it('accepts valid envelope data', () => {
    const result = createEnvelopeSchema.safeParse({
      label: 'Courses',
      amount: 500,
      categoryId: 1
    })
    expect(result.success).toBe(true)
  })

  it('applies default value for active field', () => {
    const result = createEnvelopeSchema.safeParse({
      label: 'Courses',
      amount: 500,
      categoryId: 1
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.active).toBe(true)
    }
  })

  it('rejects empty label', () => {
    const result = createEnvelopeSchema.safeParse({
      label: '',
      amount: 500
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative amount', () => {
    const result = createEnvelopeSchema.safeParse({
      label: 'Courses',
      amount: -100
    })
    expect(result.success).toBe(false)
  })

  it('does not require dayOfMonth', () => {
    const result = createEnvelopeSchema.safeParse({
      label: 'Courses',
      amount: 500,
      categoryId: 1,
      active: true,
      notes: null
    })
    expect(result.success).toBe(true)
  })

  it('accepts optional notes', () => {
    const result = createEnvelopeSchema.safeParse({
      label: 'Courses',
      amount: 500,
      categoryId: 1,
      notes: 'Budget mensuel courses'
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.notes).toBe('Budget mensuel courses')
    }
  })
})

describe('updateEnvelopeSchema', () => {
  it('accepts partial data', () => {
    const result = updateEnvelopeSchema.safeParse({
      amount: 600
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty object', () => {
    const result = updateEnvelopeSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('still validates amount when provided', () => {
    const result = updateEnvelopeSchema.safeParse({
      amount: -100
    })
    expect(result.success).toBe(false)
  })
})

describe('createTransactionSchema', () => {
  it('accepts valid transaction data', () => {
    const result = createTransactionSchema.safeParse({
      label: 'Courses Carrefour',
      amount: 85.50,
      type: 'expense',
      date: '2026-03-01'
    })
    expect(result.success).toBe(true)
  })

  it('accepts income type', () => {
    const result = createTransactionSchema.safeParse({
      label: 'Salaire',
      amount: 3000,
      type: 'income',
      date: '2026-03-25'
    })
    expect(result.success).toBe(true)
  })

  it('accepts optional recurringEntryId', () => {
    const result = createTransactionSchema.safeParse({
      label: 'Courses',
      amount: 50,
      type: 'expense',
      date: '2026-03-01',
      recurringEntryId: 5
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.recurringEntryId).toBe(5)
    }
  })

  it('accepts null recurringEntryId', () => {
    const result = createTransactionSchema.safeParse({
      label: 'Imprévu',
      amount: 20,
      type: 'expense',
      date: '2026-03-01',
      recurringEntryId: null
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.recurringEntryId).toBeNull()
    }
  })

  it('accepts optional notes', () => {
    const result = createTransactionSchema.safeParse({
      label: 'Test',
      amount: 10,
      type: 'expense',
      date: '2026-03-01',
      notes: 'Une note'
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty label', () => {
    const result = createTransactionSchema.safeParse({
      label: '',
      amount: 50,
      type: 'expense',
      date: '2026-03-01'
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative amount', () => {
    const result = createTransactionSchema.safeParse({
      label: 'Test',
      amount: -10,
      type: 'expense',
      date: '2026-03-01'
    })
    expect(result.success).toBe(false)
  })

  it('rejects zero amount', () => {
    const result = createTransactionSchema.safeParse({
      label: 'Test',
      amount: 0,
      type: 'expense',
      date: '2026-03-01'
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid type', () => {
    const result = createTransactionSchema.safeParse({
      label: 'Test',
      amount: 10,
      type: 'envelope',
      date: '2026-03-01'
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid date format', () => {
    const result = createTransactionSchema.safeParse({
      label: 'Test',
      amount: 10,
      type: 'expense',
      date: '01/03/2026'
    })
    expect(result.success).toBe(false)
  })

  it('rejects date without leading zeros', () => {
    const result = createTransactionSchema.safeParse({
      label: 'Test',
      amount: 10,
      type: 'expense',
      date: '2026-3-1'
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing required fields', () => {
    const result = createTransactionSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('updateTransactionSchema', () => {
  it('accepts partial data with only label', () => {
    const result = updateTransactionSchema.safeParse({
      label: 'Updated'
    })
    expect(result.success).toBe(true)
  })

  it('accepts partial data with only amount', () => {
    const result = updateTransactionSchema.safeParse({
      amount: 100
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty object', () => {
    const result = updateTransactionSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('still validates amount when provided', () => {
    const result = updateTransactionSchema.safeParse({
      amount: -10
    })
    expect(result.success).toBe(false)
  })

  it('still validates date when provided', () => {
    const result = updateTransactionSchema.safeParse({
      date: 'invalid'
    })
    expect(result.success).toBe(false)
  })
})

describe('createRuleSchema', () => {
  it('accepts valid remaining_low rule', () => {
    const result = createRuleSchema.safeParse({
      label: 'Alerte RAV',
      type: 'remaining_low',
      config: '{"threshold":500}'
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid envelope_exceeded rule', () => {
    const result = createRuleSchema.safeParse({
      label: 'Enveloppe courses',
      type: 'envelope_exceeded',
      config: '{"envelopeId":5}'
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid category_threshold rule', () => {
    const result = createRuleSchema.safeParse({
      label: 'Seuil restaurant',
      type: 'category_threshold',
      config: '{"category":"Restaurant","threshold":200}'
    })
    expect(result.success).toBe(true)
  })

  it('applies default active value', () => {
    const result = createRuleSchema.safeParse({
      label: 'Test',
      type: 'remaining_low',
      config: '{"threshold":0}'
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.active).toBe(true)
    }
  })

  it('rejects label shorter than 2 chars', () => {
    const result = createRuleSchema.safeParse({
      label: 'A',
      type: 'remaining_low',
      config: '{}'
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid type', () => {
    const result = createRuleSchema.safeParse({
      label: 'Test',
      type: 'invalid_type',
      config: '{}'
    })
    expect(result.success).toBe(false)
  })

  it('rejects config shorter than 2 chars', () => {
    const result = createRuleSchema.safeParse({
      label: 'Test',
      type: 'remaining_low',
      config: '{'
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing required fields', () => {
    const result = createRuleSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('updateRuleSchema', () => {
  it('accepts partial data with only label', () => {
    const result = updateRuleSchema.safeParse({ label: 'Updated' })
    expect(result.success).toBe(true)
  })

  it('accepts empty object', () => {
    const result = updateRuleSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('still validates type when provided', () => {
    const result = updateRuleSchema.safeParse({ type: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('still validates label length when provided', () => {
    const result = updateRuleSchema.safeParse({ label: 'A' })
    expect(result.success).toBe(false)
  })
})

describe('confirmImportSchema', () => {
  it('accepts valid import data', () => {
    const result = confirmImportSchema.safeParse({
      filename: 'releve.csv',
      transactions: [{
        label: 'Courses',
        amount: 85.50,
        type: 'expense',
        date: '2026-03-01'
      }]
    })
    expect(result.success).toBe(true)
  })

  it('accepts multiple transactions', () => {
    const result = confirmImportSchema.safeParse({
      filename: 'releve.csv',
      transactions: [
        { label: 'Salaire', amount: 3000, type: 'income', date: '2026-03-25' },
        { label: 'Loyer', amount: 800, type: 'expense', date: '2026-03-05' }
      ]
    })
    expect(result.success).toBe(true)
  })

  it('accepts optional recurringEntryId and notes', () => {
    const result = confirmImportSchema.safeParse({
      filename: 'test.csv',
      transactions: [{
        label: 'Courses',
        amount: 50,
        type: 'expense',
        date: '2026-03-01',
        recurringEntryId: 5,
        notes: 'Auto import'
      }]
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty filename', () => {
    const result = confirmImportSchema.safeParse({
      filename: '',
      transactions: [{ label: 'Test', amount: 10, type: 'expense', date: '2026-03-01' }]
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty transactions array', () => {
    const result = confirmImportSchema.safeParse({
      filename: 'test.csv',
      transactions: []
    })
    expect(result.success).toBe(false)
  })

  it('rejects transaction with invalid date', () => {
    const result = confirmImportSchema.safeParse({
      filename: 'test.csv',
      transactions: [{ label: 'Test', amount: 10, type: 'expense', date: '01/03/2026' }]
    })
    expect(result.success).toBe(false)
  })

  it('rejects transaction with invalid type', () => {
    const result = confirmImportSchema.safeParse({
      filename: 'test.csv',
      transactions: [{ label: 'Test', amount: 10, type: 'envelope', date: '2026-03-01' }]
    })
    expect(result.success).toBe(false)
  })

  it('rejects transaction with negative amount', () => {
    const result = confirmImportSchema.safeParse({
      filename: 'test.csv',
      transactions: [{ label: 'Test', amount: -10, type: 'expense', date: '2026-03-01' }]
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing filename', () => {
    const result = confirmImportSchema.safeParse({
      transactions: [{ label: 'Test', amount: 10, type: 'expense', date: '2026-03-01' }]
    })
    expect(result.success).toBe(false)
  })
})
