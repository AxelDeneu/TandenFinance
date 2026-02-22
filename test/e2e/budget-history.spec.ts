import { test, expect } from '@playwright/test'
import { seedTestData, cleanupAllTestData } from './helpers'

test.describe('Budget — Historique', () => {
  test.beforeEach(async ({ request }) => {
    await seedTestData(request)
  })

  test.afterEach(async ({ request }) => {
    await cleanupAllTestData(request)
  })

  test('la page charge et affiche le titre', async ({ page }) => {
    await page.goto('/budget/historique')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Historique budgetaire — 12 derniers mois')).toBeVisible()
  })

  test('le graphique Unovis est rendu', async ({ page }) => {
    await page.goto('/budget/historique')
    await page.waitForLoadState('networkidle')

    await page.waitForSelector('.unovis-xy-container', { timeout: 15000 })
    await expect(page.locator('.unovis-xy-container')).toBeVisible()
  })

  test('le tableau récapitulatif est affiché', async ({ page }) => {
    await page.goto('/budget/historique')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Recapitulatif mensuel')).toBeVisible()
    await expect(page.getByText('Mois', { exact: true })).toBeVisible()
  })

  test('cliquer sur un mois navigue vers le prévisionnel', async ({ page }) => {
    await page.goto('/budget/historique')
    await page.waitForLoadState('networkidle')

    // Client-only component with lazy fetch — wait for data rows to appear
    // The table shows "No data" while loading, then shows 12 month rows
    // Wait for "No data" to disappear and real data rows to appear
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll('table tbody tr')
      // More than 1 row means data loaded (1 row is "No data")
      return rows.length > 1
    }, { timeout: 15000 })

    // Click the first month name in the table — it's a button in the first cell
    const firstDataRow = page.locator('table tbody tr').first()
    const monthButton = firstDataRow.locator('td').first().locator('button')
    await monthButton.click()

    await expect(page).toHaveURL(/\/budget\/previsionnel\?year=\d+&month=\d+/)
  })

  test('la légende du graphique est visible', async ({ page }) => {
    await page.goto('/budget/historique')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Revenus').first()).toBeVisible()
    await expect(page.getByText('Depenses').first()).toBeVisible()
  })
})
