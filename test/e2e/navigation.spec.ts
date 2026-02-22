import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('la sidebar affiche les liens principaux', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('link', { name: 'Accueil' })).toBeVisible()
    // "Budget" est un trigger (pas un lien) dans le navigation menu
    await expect(page.getByText('Budget').first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Paramètres' })).toBeVisible()
  })

  test('clic sur Accueil navigue vers /', async ({ page }) => {
    await page.goto('/budget')
    await page.waitForLoadState('networkidle')

    await page.getByRole('link', { name: 'Accueil' }).click()
    await expect(page).toHaveURL('/')
  })

  test('clic sur Budget > Configuration navigue vers /budget', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.getByRole('link', { name: 'Configuration' }).first().click()
    await expect(page).toHaveURL('/budget')
  })

  test('clic sur Budget > Prévisionnel navigue vers /budget/previsionnel', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.getByRole('link', { name: 'Prévisionnel' }).first().click()
    await expect(page).toHaveURL('/budget/previsionnel')
  })

  test('clic sur Budget > Historique navigue vers /budget/historique', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.getByRole('link', { name: 'Historique' }).first().click()
    await expect(page).toHaveURL('/budget/historique')
  })

  test('clic sur Paramètres navigue vers /settings', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.getByRole('link', { name: 'Paramètres' }).click()
    await expect(page).toHaveURL('/settings')
  })

  test('les tabs budget fonctionnent', async ({ page }) => {
    await page.goto('/budget')
    await page.waitForLoadState('networkidle')

    // Les tabs dans le panel budget (toolbar) — scope au panel pour éviter les doublons sidebar
    const panel = page.locator('#dashboard-panel-budget')
    await expect(panel.getByRole('link', { name: 'Configuration' })).toBeVisible()
    await expect(panel.getByRole('link', { name: 'Prévisionnel' })).toBeVisible()
    await expect(panel.getByRole('link', { name: 'Historique' })).toBeVisible()

    // Clic Prévisionnel
    await panel.getByRole('link', { name: 'Prévisionnel' }).click()
    await expect(page).toHaveURL('/budget/previsionnel')

    // Clic Historique
    await panel.getByRole('link', { name: 'Historique' }).click()
    await expect(page).toHaveURL('/budget/historique')

    // Clic Configuration
    await panel.getByRole('link', { name: 'Configuration' }).click()
    await expect(page).toHaveURL('/budget')
  })

  test('le titre "Budget" s\'affiche sur les pages budget', async ({ page }) => {
    await page.goto('/budget')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Budget', { exact: true }).first()).toBeVisible()
  })
})
