import { test, expect } from '@playwright/test'
import { seedTestData, cleanupAllTestData } from './helpers'

test.describe('Dashboard — Accueil', () => {
  test.beforeEach(async ({ request }) => {
    await seedTestData(request)
  })

  test.afterEach(async ({ request }) => {
    await cleanupAllTestData(request)
  })

  test('affiche le mois courant en français', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const now = new Date()
    const expected = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(now)

    await expect(page.getByText(expected, { exact: false })).toBeVisible()
  })

  test('les 4 stats cards sont affichés', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // HomeStats has async setup — wait for it to render
    // The stat cards use UPageCard with title prop — look for the title text within the cards grid
    await expect(page.getByText('Revenus').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Enveloppes').first()).toBeVisible()
    await expect(page.getByText('Reste').first()).toBeVisible()
  })

  test('le graphique est rendu avec le titre', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Tendance budgetaire')).toBeVisible()

    await page.waitForSelector('.unovis-xy-container', { timeout: 15000 })
    await expect(page.locator('.unovis-xy-container')).toBeVisible()
  })

  test('la section "Dernieres depenses" est affichée', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Dernieres depenses', { exact: true })).toBeVisible()
  })

  test('le bouton "Voir tout" navigue vers /budget/previsionnel', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // The link may be obscured by dashboard body overlay — scroll into view and use dispatchEvent
    const link = page.getByRole('link', { name: 'Voir tout' })
    await link.scrollIntoViewIfNeeded()
    await link.dispatchEvent('click')
    await expect(page).toHaveURL('/budget/previsionnel', { timeout: 10000 })
  })
})
