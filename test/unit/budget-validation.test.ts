import { describe, it, expect } from 'vitest'
import { createEntrySchema, updateEntrySchema, createEnvelopeSchema, updateEnvelopeSchema, upsertActualSchema, deleteActualSchema } from '../../server/utils/budget-validation'

describe('createEntrySchema', () => {
  it('accepts valid entry data', () => {
    const result = createEntrySchema.safeParse({
      label: 'Loyer',
      amount: 1200,
      category: 'Logement',
      dayOfMonth: 5
    })
    expect(result.success).toBe(true)
  })

  it('applies default value for active field', () => {
    const result = createEntrySchema.safeParse({
      label: 'Loyer',
      amount: 1200,
      category: 'Logement',
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
      category: 'Logement',
      dayOfMonth: 1
    })
    expect(result1.success).toBe(true)

    const result31 = createEntrySchema.safeParse({
      label: 'Test',
      amount: 100,
      category: 'Logement',
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
      category: 'Logement',
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
      category: 'Logement',
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
      amount: 500
    })
    expect(result.success).toBe(true)
  })

  it('applies default value for active field', () => {
    const result = createEnvelopeSchema.safeParse({
      label: 'Courses',
      amount: 500
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

  it('does not require category or dayOfMonth', () => {
    const result = createEnvelopeSchema.safeParse({
      label: 'Courses',
      amount: 500,
      active: true,
      notes: null
    })
    expect(result.success).toBe(true)
  })

  it('accepts optional notes', () => {
    const result = createEnvelopeSchema.safeParse({
      label: 'Courses',
      amount: 500,
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

describe('upsertActualSchema', () => {
  it('accepts valid actual data', () => {
    const result = upsertActualSchema.safeParse({
      year: 2025,
      month: 3,
      actualAmount: 480
    })
    expect(result.success).toBe(true)
  })

  it('accepts zero amount', () => {
    const result = upsertActualSchema.safeParse({
      year: 2025,
      month: 1,
      actualAmount: 0
    })
    expect(result.success).toBe(true)
  })

  it('rejects negative amount', () => {
    const result = upsertActualSchema.safeParse({
      year: 2025,
      month: 1,
      actualAmount: -10
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid month', () => {
    const result = upsertActualSchema.safeParse({
      year: 2025,
      month: 13,
      actualAmount: 100
    })
    expect(result.success).toBe(false)
  })

  it('rejects month 0', () => {
    const result = upsertActualSchema.safeParse({
      year: 2025,
      month: 0,
      actualAmount: 100
    })
    expect(result.success).toBe(false)
  })

  it('rejects year below 2000', () => {
    const result = upsertActualSchema.safeParse({
      year: 1999,
      month: 1,
      actualAmount: 100
    })
    expect(result.success).toBe(false)
  })

  it('rejects year above 2100', () => {
    const result = upsertActualSchema.safeParse({
      year: 2101,
      month: 1,
      actualAmount: 100
    })
    expect(result.success).toBe(false)
  })
})

describe('deleteActualSchema', () => {
  it('accepts valid delete data', () => {
    const result = deleteActualSchema.safeParse({
      year: 2025,
      month: 3
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid month', () => {
    const result = deleteActualSchema.safeParse({
      year: 2025,
      month: 0
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing year', () => {
    const result = deleteActualSchema.safeParse({
      month: 3
    })
    expect(result.success).toBe(false)
  })
})
