import { test, expect } from '@playwright/test'

test.describe('Paramètres — Profil', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
  })

  test('affiche le formulaire profil', async ({ page }) => {
    await expect(page.getByText('Profil', { exact: true })).toBeVisible()

    await expect(page.getByRole('textbox', { name: /^Nom\*?$/ })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByRole('textbox', { name: /Nom d'utilisateur/ })).toBeVisible()
    await expect(page.getByText('Avatar')).toBeVisible()
    await expect(page.getByLabel('Bio')).toBeVisible()
  })

  test('les valeurs par défaut sont affichées', async ({ page }) => {
    await expect(page.getByRole('textbox', { name: /^Nom\*?$/ })).toHaveValue('Benjamin Canac')
    await expect(page.getByLabel('Email')).toHaveValue('ben@nuxtlabs.com')
    await expect(page.getByRole('textbox', { name: /Nom d'utilisateur/ })).toHaveValue('benjamincanac')
  })

  test('modifier un champ et sauvegarder', async ({ page }) => {
    await page.getByRole('textbox', { name: /^Nom\*?$/ }).fill('Nouveau Nom Test')
    await page.getByRole('button', { name: 'Enregistrer' }).click()

    // The toast renders both an aria alert span and visible div — scope to data-slot
    await expect(page.locator('[data-slot="title"]').filter({ hasText: 'Succès' })).toBeVisible()
    await expect(page.locator('[data-slot="description"]').filter({ hasText: 'Vos paramètres ont été mis à jour.' })).toBeVisible()
  })

  test('validation fonctionne', async ({ page }) => {
    await page.getByRole('textbox', { name: /^Nom\*?$/ }).fill('A')
    await page.getByRole('button', { name: 'Enregistrer' }).click()

    await expect(page.getByText('Trop court')).toBeVisible()
  })
})
