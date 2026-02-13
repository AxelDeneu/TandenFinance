import type { AvatarProps } from '@nuxt/ui'

export type UserStatus = 'subscribed' | 'unsubscribed' | 'bounced'
export type SaleStatus = 'paid' | 'failed' | 'refunded'

export interface User {
  id: number
  name: string
  email: string
  avatar?: AvatarProps
  status: UserStatus
  location: string
}

export interface Stat {
  title: string
  icon: string
  value: number | string
  variation: number
  formatter?: (value: number) => string
}

export interface Sale {
  id: string
  date: string
  status: SaleStatus
  email: string
  amount: number
}

export interface Notification {
  id: number
  unread?: boolean
  sender: User
  body: string
  date: string
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

export interface MonthlyActual {
  id: number
  recurringEntryId: number
  year: number
  month: number
  actualAmount: number
  createdAt: string
  updatedAt: string
}

export interface EnvelopeExpense {
  id: number
  recurringEntryId: number
  year: number
  month: number
  label: string
  amount: number
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