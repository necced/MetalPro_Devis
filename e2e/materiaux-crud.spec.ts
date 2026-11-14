/**
 * Matériaux CRUD E2E Tests
 * Tests the complete material lifecycle: create, read, update, delete
 */
import { test, expect, navigateAndWait } from './test-utils';
import { createMateriauUI, TEST_MATERIAUX } from './test-utils';

test.describe('Matériaux CRUD', () => {
  test.beforeEach(async ({ testPage }) => {
    await navigateAndWait(testPage, '/materiaux');
  });

  test('should create a new matériau', async ({ testPage }) => {
    await createMateriauUI(testPage, TEST_MATERIAUX[0]);

    // Verify material appears in list
    await expect(testPage.locator('text=Profilé acier UPN 80')).toBeVisible();
    await expect(testPage.locator('text=35 000 FCFA')).toBeVisible();
  });

  test('should display matériau details', async ({ testPage }) => {
    await createMateriauUI(testPage, TEST_MATERIAUX[0]);

    // Click on the material to view details
    await testPage.click('text=Profilé acier UPN 80');

    // Verify detail view
    await expect(testPage).toHaveURL(/\/materiaux\/\d+/);
    await expect(testPage.locator('h1:has-text("Profilé acier UPN 80")')).toBeVisible();
    await expect(testPage.locator('text=Unité: m')).toBeVisible();
    await expect(testPage.locator('text=Prix: 35 000 FCFA')).toBeVisible();
  });

  test('should edit an existing matériau', async ({ testPage }) => {
    await createMateriauUI(testPage, TEST_MATERIAUX[0]);

    // Navigate to detail and click edit
    await testPage.click('text=Profilé acier UPN 80');
    await testPage.click('text=Modifier');

    // Update the material
    await testPage.fill('#nom', 'Profilé acier UPN 80 Modifié');
    await testPage.fill('#prixUnitaire', '40000');
    await testPage.click('button:has-text("Enregistrer")');

    // Verify update
    await testPage.waitForURL('/materiaux');
    await expect(testPage.locator('text=Profilé acier UPN 80 Modifié')).toBeVisible();
  });

  test('should delete a matériau', async ({ testPage }) => {
    await createMateriauUI(testPage, TEST_MATERIAUX[0]);

    // Navigate to detail and delete
    await testPage.click('text=Profilé acier UPN 80');
    await testPage.click('button:has-text("Supprimer")');

    // Confirm deletion
    testPage.on('dialog', (dialog) => dialog.accept());

    // Verify deletion
    await testPage.waitForURL('/materiaux');
    await expect(testPage.locator('text=Profilé acier UPN 80')).not.toBeVisible();
  });

  test('should show validation errors for required fields', async ({ testPage }) => {
    await navigateAndWait(testPage, '/materiaux/nouveau');

    await testPage.click('button:has-text("Créer le matériau")');

    await expect(testPage.locator('text=Nom est requis')).toBeVisible();
    await expect(testPage.locator('text=Unité est requise')).toBeVisible();
    await expect(testPage.locator('text=Prix unitaire est requis')).toBeVisible();
  });

  test('should search matériaux', async ({ testPage }) => {
    await createMateriauUI(testPage, TEST_MATERIAUX[0]);
    await createMateriauUI(testPage, TEST_MATERIAUX[1]);

    // Search for specific material
    await testPage.fill('input[placeholder*="Rechercher"]', 'Profilé');
    await testPage.waitForTimeout(300);

    await expect(testPage.locator('text=Profilé acier UPN 80')).toBeVisible();
    await expect(testPage.locator('text=Tôle ondulée 0.5mm')).not.toBeVisible();
  });

  test('should create multiple matériaux', async ({ testPage }) => {
    for (const materiau of TEST_MATERIAUX) {
      await createMateriauUI(testPage, materiau);
    }

    // Verify all materials exist
    await expect(testPage.locator('text=Profilé acier UPN 80')).toBeVisible();
    await expect(testPage.locator('text=Tôle ondulée 0.5mm')).toBeVisible();
    await expect(testPage.locator('text=Peinture antirouille 4L')).toBeVisible();
  });
});

test.describe('Matériaux validation', () => {
  test('should reject negative price', async ({ testPage }) => {
    await navigateAndWait(testPage, '/materiaux/nouveau');

    await testPage.fill('#nom', 'Test');
    await testPage.fill('#unite', 'm');
    await testPage.fill('#prixUnitaire', '-100');
    await testPage.click('button:has-text("Créer le matériau")');

    await expect(testPage.locator('text=Prix doit être positif')).toBeVisible();
  });

  test('should accept all TVA rates', async ({ testPage }) => {
    await navigateAndWait(testPage, '/materiaux/nouveau');

    await testPage.fill('#nom', 'Test');
    await testPage.fill('#unite', 'm');
    await testPage.fill('#prixUnitaire', '1000');

    for (const rate of ['0', '0.1925']) {
      await testPage.selectOption('#tvaTaux', rate);
      await expect(testPage.locator('#tvaTaux')).toHaveValue(rate);
    }
  });
});
