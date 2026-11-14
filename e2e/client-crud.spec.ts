/**
 * Client CRUD E2E Tests
 * Tests the complete client lifecycle: create, read, update, delete
 */
import { test, expect, navigateAndWait } from './test-utils';
import { createClientUI, TEST_CLIENT } from './test-utils';

test.describe('Client CRUD', () => {
  test.beforeEach(async ({ testPage }) => {
    // Navigate to clients list (with basename)
    await navigateAndWait(testPage, '/clients');
  });

  test('should create a new client', async ({ testPage }) => {
    // Create a new client
    await createClientUI(testPage, TEST_CLIENT);

    // Verify client appears in list
    await expect(testPage.locator('text=Entreprise Test CI')).toBeVisible();
    await expect(testPage.locator('text=+237 6 77 77 77 77')).toBeVisible();
  });

  test('should display client details', async ({ testPage }) => {
    // First create a client
    await createClientUI(testPage, TEST_CLIENT);

    // Click on the client to view details
    await testPage.click('text=Entreprise Test CI');

    // Verify detail view
    await expect(testPage).toHaveURL(/\/clients\/\d+/);
    await expect(testPage.locator('h1:has-text("Entreprise Test CI")')).toBeVisible();
    await expect(testPage.locator('text=+237 6 77 77 77 77')).toBeVisible();
    await expect(testPage.locator('text=ci@test.cm')).toBeVisible();
    await expect(testPage.locator('text=BP 999, Yaoundé')).toBeVisible();
  });

  test('should edit an existing client', async ({ testPage }) => {
    // Create a client first
    await createClientUI(testPage, TEST_CLIENT);

    // Navigate to detail and click edit
    await testPage.click('text=Entreprise Test CI');
    await testPage.click('text=Modifier');

    // Update the client name
    await testPage.fill('#nom', 'Entreprise Test CI Modifié');
    await testPage.click('button:has-text("Enregistrer")');

    // Verify update - navigates to detail page after edit
    await testPage.waitForURL(/\/clients\/\d+/);
    await expect(testPage.locator('text=Entreprise Test CI Modifié')).toBeVisible();
  });

  test('should delete a client', async ({ testPage }) => {
    // Create a client first
    await createClientUI(testPage, TEST_CLIENT);

    // Navigate to detail and delete
    await testPage.click('text=Entreprise Test CI');

    // Set up dialog handler BEFORE clicking delete
    testPage.on('dialog', (dialog) => dialog.accept());
    await testPage.click('button:has-text("Supprimer")');

    // Verify deletion - navigates to /clients list
    await testPage.waitForURL('/clients');
    await expect(testPage.locator('text=Entreprise Test CI')).not.toBeVisible();
  });

  test('should show validation errors for required fields', async ({ testPage }) => {
    await navigateAndWait(testPage, '/clients/nouveau');

    // Try to submit without required fields
    await testPage.click('button:has-text("Créer le client")');

    // Check for validation errors (matching actual validation messages)
    await expect(testPage.locator('text=Nom du client requis')).toBeVisible();
    await expect(testPage.locator('text=Téléphone requis')).toBeVisible();
  });

  test('should search clients', async ({ testPage }) => {
    // Create a client first
    await createClientUI(testPage, TEST_CLIENT);

    // Search for the client
    await testPage.fill('input[placeholder*="Rechercher"]', 'Entreprise Test');
    await testPage.waitForTimeout(300); // Debounce

    // Verify filtered results
    await expect(testPage.locator('text=Entreprise Test CI')).toBeVisible();
  });
});

test.describe('Client validation', () => {
  test('should reject invalid email format', async ({ testPage }) => {
    await navigateAndWait(testPage, '/clients/nouveau');

    await testPage.fill('#nom', 'Test Client');
    await testPage.fill('#telephone', '+237 6 11 11 11 11');
    await testPage.fill('#email', 'invalid-email');
    await testPage.click('button:has-text("Créer le client")');

    await expect(testPage.locator('text=Email invalide')).toBeVisible();
  });

  test('should accept valid TVA regimes', async ({ testPage }) => {
    await navigateAndWait(testPage, '/clients/nouveau');

    await testPage.fill('#nom', 'Test Client');
    await testPage.fill('#telephone', '+237 6 11 11 11 11');

    // Test each TVA regime
    for (const regime of ['normal', 'simplifie', 'exonere']) {
      await testPage.selectOption('#regimeTva', regime);
      await expect(testPage.locator('#regimeTva')).toHaveValue(regime);
    }
  });
});
