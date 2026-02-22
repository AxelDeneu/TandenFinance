import { test, expect } from '@playwright/test'
import { cleanupAllTestData } from './helpers'

/** After creating/editing, the toast contains the entry name — scope assertions to the table */
async function expectInTable(page: import('@playwright/test').Page, text: string) {
  await expect(page.locator('table').getByText(text, { exact: true })).toBeVisible({ timeout: 10000 })
}

async function expectNotInTable(page: import('@playwright/test').Page, text: string) {
  await expect(page.locator('table').getByText(text, { exact: true })).not.toBeVisible()
}

test.describe('Budget — Revenus', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/budget')
    await page.waitForLoadState('networkidle')
  })

  test.afterEach(async ({ request }) => {
    await cleanupAllTestData(request)
  })

  test('affiche le tableau des revenus', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Revenus' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Libellé' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Montant' })).toBeVisible()
    await expect(page.getByText('Catégorie', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Jour' })).toBeVisible()
    await expect(page.getByText('Actif', { exact: true })).toBeVisible()
  })

  test('créer un revenu', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter un revenu' }).first().click()

    await page.getByLabel('Libellé').fill('Salaire Test')
    await page.getByLabel('Montant').fill('3500')
    await page.getByLabel('Catégorie').click()
    await page.getByRole('option', { name: 'Salaire' }).click()
    await page.getByLabel('Jour du mois').fill('25')

    await page.getByRole('button', { name: 'Créer' }).click()

    await expectInTable(page, 'Salaire Test')
  })

  test('recherche fonctionne', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter un revenu' }).first().click()
    await page.getByLabel('Libellé').fill('Salaire Test')
    await page.getByLabel('Montant').fill('3500')
    await page.getByLabel('Catégorie').click()
    await page.getByRole('option', { name: 'Salaire' }).click()
    await page.getByLabel('Jour du mois').fill('25')
    await page.getByRole('button', { name: 'Créer' }).click()
    await expectInTable(page, 'Salaire Test')

    await page.getByPlaceholder('Rechercher...').fill('Salaire Test')
    await expectInTable(page, 'Salaire Test')

    await page.getByPlaceholder('Rechercher...').fill('Inexistant')
    await expectNotInTable(page, 'Salaire Test')
  })

  test('modifier un revenu', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter un revenu' }).first().click()
    await page.getByLabel('Libellé').fill('Salaire Test')
    await page.getByLabel('Montant').fill('3500')
    await page.getByLabel('Catégorie').click()
    await page.getByRole('option', { name: 'Salaire' }).click()
    await page.getByLabel('Jour du mois').fill('25')
    await page.getByRole('button', { name: 'Créer' }).click()
    await expectInTable(page, 'Salaire Test')

    await page.getByRole('row').filter({ hasText: 'Salaire Test' }).getByRole('button').last().click()
    await page.getByText('Modifier').click()

    await page.getByLabel('Montant').fill('4000')
    await page.getByRole('button', { name: 'Enregistrer' }).click()

    await expect(page.locator('table').getByText('4 000,00')).toBeVisible({ timeout: 10000 })
  })

  test('supprimer un revenu', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter un revenu' }).first().click()
    await page.getByLabel('Libellé').fill('Salaire Test')
    await page.getByLabel('Montant').fill('3500')
    await page.getByLabel('Catégorie').click()
    await page.getByRole('option', { name: 'Salaire' }).click()
    await page.getByLabel('Jour du mois').fill('25')
    await page.getByRole('button', { name: 'Créer' }).click()
    await expectInTable(page, 'Salaire Test')

    await page.getByRole('row').filter({ hasText: 'Salaire Test' }).getByRole('button').last().click()
    await page.getByText('Supprimer').click()

    await page.getByRole('button', { name: 'Supprimer' }).click()

    await expectNotInTable(page, 'Salaire Test')
  })
})
