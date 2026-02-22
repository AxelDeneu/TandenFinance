import { test } from '@playwright/test'
import { seedTestData, cleanupAllTestData } from './helpers'

test('debug history - direct load', async ({ page, request }) => {
  await seedTestData(request)

  const apiRequests: string[] = []
  page.on('request', req => {
    if (req.url().includes('/api/budget')) apiRequests.push(`${req.method()} ${req.url()}`)
  })

  await page.goto('/budget/historique')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(5000)

  const info = await page.evaluate(() => {
    const tables = document.querySelectorAll('table')
    return {
      tableCount: tables.length,
      rows: Array.from(tables).map(t => t.querySelector('tbody')?.querySelectorAll('tr').length)
    }
  })

  console.log('=== DIRECT LOAD ===')
  console.log('API requests:', apiRequests.length, apiRequests)
  console.log('Table info:', JSON.stringify(info))

  await cleanupAllTestData(request)
})

test('debug history - client navigation', async ({ page, request }) => {
  await seedTestData(request)

  const apiRequests: string[] = []
  page.on('request', req => {
    if (req.url().includes('/api/budget')) apiRequests.push(`${req.method()} ${req.url()}`)
  })

  // Go to home first, then navigate client-side
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // Clear collected requests from home page
  apiRequests.length = 0

  // Navigate to historique via client-side navigation
  await page.getByRole('link', { name: 'Historique' }).first().click()
  await page.waitForURL('/budget/historique')
  await page.waitForTimeout(5000)

  const info = await page.evaluate(() => {
    const tables = document.querySelectorAll('table')
    return {
      tableCount: tables.length,
      rows: Array.from(tables).map(t => t.querySelector('tbody')?.querySelectorAll('tr').length)
    }
  })

  console.log('=== CLIENT NAVIGATION ===')
  console.log('API requests:', apiRequests.length, apiRequests)
  console.log('Table info:', JSON.stringify(info))

  await cleanupAllTestData(request)
})
