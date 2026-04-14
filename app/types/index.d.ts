export interface Stat {
  title: string
  icon: string
  value: number | string
  variation: number
  formatter?: (value: number) => string
}

export type BudgetRuleType = 'envelope_exceeded' | 'remaining_low' | 'category_threshold'

export interface BudgetRule {
  id: number
  label: string
  type: BudgetRuleType
  config: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Notification {
  id: number
  ruleId: number | null
  title: string
  body: string
  icon: string | null
  color: string | null
  read: boolean
  actionUrl: string | null
  createdAt: string
}

export interface ImportBatch {
  id: number
  filename: string
  rowCount: number
  importedCount: number
  skippedCount: number
  createdAt: string
}

export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}

// Budget types
export type EntryType = 'income' | 'expense' | 'envelope'

export interface RecurringEntry {
  id: number
  type: EntryType
  label: string
  amount: number
  category: string | null
  dayOfMonth: number | null
  active: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: number
  label: string
  amount: number
  type: 'income' | 'expense'
  date: string
  recurringEntryId: number | null
  recurringEntry?: RecurringEntry | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface ForecastEntry {
  entry: RecurringEntry
  actuals: Record<string, number | null>
}

export interface ForecastMonth {
  year: number
  month: number
  label: string
}

export interface ForecastData {
  months: ForecastMonth[]
  incomes: ForecastEntry[]
  expenses: ForecastEntry[]
  envelopes: ForecastEntry[]
}

export interface MonthlySummary {
  year: number
  month: number
  label: string
  incomePlanned: number
  incomeEffective: number
  expensePlanned: number
  expenseEffective: number
  envelopePlanned: number
  envelopeEffective: number
  remaining: number
  remainingPlanned: number
}

// Analytics types
export interface AnalyticsSummary {
  averageMonthlyIncome: number
  averageMonthlyExpense: number
  averageMonthlySavings: number
  savingsRate: number
  topGrowingCategories: { category: string, growthPercent: number }[]
  topShrinkingCategories: { category: string, shrinkPercent: number }[]
  bestMonth: { label: string, savings: number }
  worstMonth: { label: string, savings: number }
}

export interface CategoryTrendItem {
  category: string
  type: 'income' | 'expense'
  monthlyAmounts: { month: string, amount: number }[]
  average: number
  trend: 'rising' | 'stable' | 'falling'
}

export interface CategoryBreakdownItem {
  category: string
  amount: number
  percent: number
  color: string
}

// Import CSV types
export interface ImportParsedRow {
  rawLabel: string
  date: string
  amount: number
  type: 'income' | 'expense'
  suggestedMatch: { recurringEntryId: number, label: string, confidence: number } | null
}
