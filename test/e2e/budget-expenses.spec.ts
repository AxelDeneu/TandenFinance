import { test, expect } from '@playwright/test'
import { cleanupAllTestData } from './helpers'

async function expectInTable(page: import('@playwright/test').Page, text: string) {
  await expect(page.locator('table').getByText(text, { exact: true })).toBeVisible({ timeout: 10000 })
}

async function expectNotInTable(page: import('@playwright/test').Page, text: string) {
  await expect(page.locator('table').getByText(text, { exact: true })).not.toBeVisible()
}

test.describe('Budget — Dépenses', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/budget')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Dépenses' }).click()
  })

  test.afterEach(async ({ request }) => {
    await cleanupAllTestData(request)
  })

  test('affiche le tableau des dépenses', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Libellé' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Montant' })).toBeVisible()
    await expect(page.getByText('Catégorie', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Jour' })).toBeVisible()
    await expect(page.getByText('Actif', { exact: true })).toBeVisible()
  })

  test('créer une dépense', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter une dépense' }).first().click()

    await page.getByLabel('Libellé').fill('Loyer Test')
    await page.getByLabel('Montant').fill('900')
    await page.getByLabel('Catégorie').click()
    await page.getByRole('option', { name: 'Logement' }).click()
    await page.getByLabel('Jour du mois').fill('5')

    await page.getByRole('button', { name: 'Créer' }).click()

    await expectInTable(page, 'Loyer Test')
  })

  test('recherche fonctionne', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter une dépense' }).first().click()
    await page.getByLabel('Libellé').fill('Loyer Test')
    await page.getByLabel('Montant').fill('900')
    await page.getByLabel('Catégorie').click()
    await page.getByRole('option', { name: 'Logement' }).click()
    await page.getByLabel('Jour du mois').fill('5')
    await page.getByRole('button', { name: 'Créer' }).click()
    await expectInTable(page, 'Loyer Test')

    await page.getByPlaceholder('Rechercher...').fill('Loyer Test')
    await expectInTable(page, 'Loyer Test')

    await page.getByPlaceholder('Rechercher...').fill('Inexistant')
    await expectNotInTable(page, 'Loyer Test')
  })

  test('modifier une dépense', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter une dépense' }).first().click()
    await page.getByLabel('Libellé').fill('Loyer Test')
    await page.getByLabel('Montant').fill('900')
    await page.getByLabel('Catégorie').click()
    await page.getByRole('option', { name: 'Logement' }).click()
    await page.getByLabel('Jour du mois').fill('5')
    await page.getByRole('button', { name: 'Créer' }).click()
    await expectInTable(page, 'Loyer Test')

    await page.getByRole('row').filter({ hasText: 'Loyer Test' }).getByRole('button').last().click()
    await page.getByText('Modifier').click()

    await page.getByLabel('Montant').fill('950')
    await page.getByRole('button', { name: 'Enregistrer' }).click()

    await expect(page.locator('table').getByText('950,00')).toBeVisible({ timeout: 10000 })
  })

  test('supprimer une dépense', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter une dépense' }).first().click()
    await page.getByLabel('Libellé').fill('Loyer Test')
    await page.getByLabel('Montant').fill('900')
    await page.getByLabel('Catégorie').click()
    await page.getByRole('option', { name: 'Logement' }).click()
    await page.getByLabel('Jour du mois').fill('5')
    await page.getByRole('button', { name: 'Créer' }).click()
    await expectInTable(page, 'Loyer Test')

    await page.getByRole('row').filter({ hasText: 'Loyer Test' }).getByRole('button').last().click()
    await page.getByText('Supprimer').click()

    await page.getByRole('button', { name: 'Supprimer' }).click()

    await expectNotInTable(page, 'Loyer Test')
  })
})
