import type { APIRequestContext } from '@playwright/test'

const BASE = 'http://localhost:3000'

interface EntryData {
  label: string
  amount: number
  category?: string
  dayOfMonth?: number
  active?: boolean
  notes?: string
}

interface CreatedEntry {
  id: number
  type: string
  label: string
  amount: number
  category: string | null
  dayOfMonth: number | null
  active: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export async function createIncome(request: APIRequestContext, data: EntryData): Promise<CreatedEntry> {
  const res = await request.post(`${BASE}/api/budget/incomes`, { data })
  return res.json()
}

export async function createExpense(request: APIRequestContext, data: EntryData): Promise<CreatedEntry> {
  const res = await request.post(`${BASE}/api/budget/expenses`, { data })
  return res.json()
}

export async function createEnvelope(request: APIRequestContext, data: Omit<EntryData, 'category' | 'dayOfMonth'>): Promise<CreatedEntry> {
  const res = await request.post(`${BASE}/api/budget/envelopes`, { data })
  return res.json()
}

export async function deleteIncome(request: APIRequestContext, id: number): Promise<void> {
  await request.delete(`${BASE}/api/budget/incomes/${id}`)
}

export async function deleteExpense(request: APIRequestContext, id: number): Promise<void> {
  await request.delete(`${BASE}/api/budget/expenses/${id}`)
}

export async function deleteEnvelope(request: APIRequestContext, id: number): Promise<void> {
  await request.delete(`${BASE}/api/budget/envelopes/${id}`)
}

export async function getAllIncomes(request: APIRequestContext): Promise<CreatedEntry[]> {
  const res = await request.get(`${BASE}/api/budget/incomes`)
  return res.json()
}

export async function getAllExpenses(request: APIRequestContext): Promise<CreatedEntry[]> {
  const res = await request.get(`${BASE}/api/budget/expenses`)
  return res.json()
}

export async function getAllEnvelopes(request: APIRequestContext): Promise<CreatedEntry[]> {
  const res = await request.get(`${BASE}/api/budget/envelopes`)
  return res.json()
}

export async function cleanupAllTestData(request: APIRequestContext): Promise<void> {
  const [incomes, expenses, envelopes] = await Promise.all([
    getAllIncomes(request),
    getAllExpenses(request),
    getAllEnvelopes(request)
  ])

  await Promise.all([
    ...incomes.filter(e => e.label.includes('Test')).map(e => deleteIncome(request, e.id)),
    ...expenses.filter(e => e.label.includes('Test')).map(e => deleteExpense(request, e.id)),
    ...envelopes.filter(e => e.label.includes('Test')).map(e => deleteEnvelope(request, e.id))
  ])
}

export interface SeededData {
  incomes: CreatedEntry[]
  expenses: CreatedEntry[]
  envelopes: CreatedEntry[]
}

export async function seedTestData(request: APIRequestContext): Promise<SeededData> {
  const incomes = await Promise.all([
    createIncome(request, { label: 'Salaire Test', amount: 3500, category: 'Salaire', dayOfMonth: 25, active: true }),
    createIncome(request, { label: 'Freelance Test', amount: 800, category: 'Freelance', dayOfMonth: 15, active: true })
  ])

  const expenses = await Promise.all([
    createExpense(request, { label: 'Loyer Test', amount: 900, category: 'Logement', dayOfMonth: 5, active: true }),
    createExpense(request, { label: 'Internet Test', amount: 40, category: 'Abonnements', dayOfMonth: 10, active: true }),
    createExpense(request, { label: 'Assurance Test', amount: 120, category: 'Assurances', dayOfMonth: 8, active: true })
  ])

  const envelopes = await Promise.all([
    createEnvelope(request, { label: 'Courses Test', amount: 500, active: true }),
    createEnvelope(request, { label: 'Sorties Test', amount: 200, active: true })
  ])

  return { incomes, expenses, envelopes }
}
