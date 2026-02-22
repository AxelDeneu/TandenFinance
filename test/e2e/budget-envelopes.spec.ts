import { test, expect } from '@playwright/test'
import { cleanupAllTestData } from './helpers'

async function expectInTable(page: import('@playwright/test').Page, text: string) {
  await expect(page.locator('table').getByText(text, { exact: true })).toBeVisible({ timeout: 10000 })
}

async function expectNotInTable(page: import('@playwright/test').Page, text: string) {
  await expect(page.locator('table').getByText(text, { exact: true })).not.toBeVisible()
}

test.describe('Budget — Enveloppes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/budget')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Enveloppes' }).click()
  })

  test.afterEach(async ({ request }) => {
    await cleanupAllTestData(request)
  })

  test('affiche le tableau des enveloppes', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Libellé' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Montant' })).toBeVisible()
    await expect(page.getByText('Actif', { exact: true })).toBeVisible()
  })

  test('créer une enveloppe', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter une enveloppe' }).first().click()

    await page.getByLabel('Libellé').fill('Courses Test')
    await page.getByLabel('Montant mensuel').fill('500')

    await page.getByRole('button', { name: 'Créer' }).click()

    await expectInTable(page, 'Courses Test')
  })

  test('recherche fonctionne', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter une enveloppe' }).first().click()
    await page.getByLabel('Libellé').fill('Courses Test')
    await page.getByLabel('Montant mensuel').fill('500')
    await page.getByRole('button', { name: 'Créer' }).click()
    await expectInTable(page, 'Courses Test')

    await page.getByPlaceholder('Rechercher...').fill('Courses Test')
    await expectInTable(page, 'Courses Test')

    await page.getByPlaceholder('Rechercher...').fill('Inexistant')
    await expectNotInTable(page, 'Courses Test')
  })

  test('modifier une enveloppe', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter une enveloppe' }).first().click()
    await page.getByLabel('Libellé').fill('Courses Test')
    await page.getByLabel('Montant mensuel').fill('500')
    await page.getByRole('button', { name: 'Créer' }).click()
    await expectInTable(page, 'Courses Test')

    await page.getByRole('row').filter({ hasText: 'Courses Test' }).getByRole('button').last().click()
    await page.getByText('Modifier').click()

    await page.getByLabel('Montant mensuel').fill('600')
    await page.getByRole('button', { name: 'Enregistrer' }).click()

    await expect(page.locator('table').getByText('600,00')).toBeVisible({ timeout: 10000 })
  })

  test('supprimer une enveloppe', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter une enveloppe' }).first().click()
    await page.getByLabel('Libellé').fill('Courses Test')
    await page.getByLabel('Montant mensuel').fill('500')
    await page.getByRole('button', { name: 'Créer' }).click()
    await expectInTable(page, 'Courses Test')

    await page.getByRole('row').filter({ hasText: 'Courses Test' }).getByRole('button').last().click()
    await page.getByText('Supprimer').click()

    await page.getByRole('button', { name: 'Supprimer' }).click()

    await expectNotInTable(page, 'Courses Test')
  })
})
