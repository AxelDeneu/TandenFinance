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

export interface Mail {
  id: number
  unread?: boolean
  from: User
  subject: string
  body: string
  date: string
}

export interface Member {
  name: string
  username: string
  role: 'member' | 'owner'
  avatar: AvatarProps
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
export type EntryType = 'income' | 'expense'

export interface RecurringEntry {
  id: number
  type: EntryType
  label: string
  amount: number
  category: string
  dayOfMonth: number
  active: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface BudgetSummary {
  totalIncome: number
  totalExpenses: number
  balance: number
  incomeCount: number
  expenseCount: number
}

export interface BudgetSettings {
  salaryReferenceDay: number
}
