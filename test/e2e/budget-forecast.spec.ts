import { test, expect } from '@playwright/test'
import { seedTestData, cleanupAllTestData } from './helpers'

test.describe('Budget — Prévisionnel', () => {
  test.beforeEach(async ({ request }) => {
    await seedTestData(request)
  })

  test.afterEach(async ({ request }) => {
    await cleanupAllTestData(request)
  })

  test('affiche le mois courant', async ({ page }) => {
    await page.goto('/budget/previsionnel')
    await page.waitForLoadState('networkidle')

    const now = new Date()
    const expected = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(now)

    await expect(page.getByText(expected, { exact: false })).toBeVisible()
  })

  test('navigation mois fonctionne', async ({ page }) => {
    await page.goto('/budget/previsionnel')
    await page.waitForLoadState('networkidle')

    const now = new Date()
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(prevDate)

    // Le label du mois est dans un span.capitalize avec chevron buttons de chaque côté
    // Le bouton gauche est le premier bouton à côté du label
    const monthNav = page.locator('.flex.items-center.gap-2').filter({ hasText: new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(now) })
    await monthNav.getByRole('button').first().click()
    await expect(page.getByText(prevLabel, { exact: false })).toBeVisible()

    // Revenir au mois courant (clic droite)
    const monthNav2 = page.locator('.flex.items-center.gap-2').filter({ hasText: prevLabel })
    await monthNav2.getByRole('button').last().click()

    const currentLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(now)
    await expect(page.getByText(currentLabel, { exact: false })).toBeVisible()
  })

  test('affiche les 4 stat cards', async ({ page }) => {
    await page.goto('/budget/previsionnel')
    await page.waitForLoadState('networkidle')

    // Attendre la fin du chargement des données
    await page.waitForSelector('text=Total Revenus', { timeout: 10000 })

    // Les stats cards titles
    const cards = page.locator('[data-slot="title"]')
    await expect(cards.filter({ hasText: 'Revenus' })).toBeVisible()
    await expect(cards.filter({ hasText: 'Dépenses' })).toBeVisible()
    await expect(cards.filter({ hasText: 'Enveloppes' })).toBeVisible()
    await expect(cards.filter({ hasText: 'Reste' })).toBeVisible()
  })

  test('affiche les 3 sections de tableau', async ({ page }) => {
    await page.goto('/budget/previsionnel')
    await page.waitForLoadState('networkidle')

    await page.waitForSelector('h3', { timeout: 10000 })

    await expect(page.locator('h3').filter({ hasText: 'Revenus' })).toBeVisible()
    await expect(page.locator('h3').filter({ hasText: 'Dépenses' })).toBeVisible()
    await expect(page.locator('h3').filter({ hasText: 'Enveloppes' })).toBeVisible()
  })

  test('affiche les totaux par section', async ({ page }) => {
    await page.goto('/budget/previsionnel')
    await page.waitForLoadState('networkidle')

    await page.waitForSelector('text=Total Revenus', { timeout: 10000 })

    await expect(page.getByText('Total Revenus')).toBeVisible()
    await expect(page.getByText('Total Dépenses')).toBeVisible()
    await expect(page.getByText('Total Enveloppes')).toBeVisible()
  })

  test('affiche le "Reste" sticky en bas', async ({ page }) => {
    await page.goto('/budget/previsionnel')
    await page.waitForLoadState('networkidle')

    await page.waitForSelector('.sticky', { timeout: 10000 })

    const stickyBar = page.locator('.sticky')
    await expect(stickyBar.getByText('Reste')).toBeVisible()
  })

  test('deep-link avec query params', async ({ page }) => {
    await page.goto('/budget/previsionnel?year=2025&month=6')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('juin 2025', { exact: false })).toBeVisible()
  })
})
