/**
 * Devis CRUD E2E Tests
 * Tests devis creation, editing, and HT/TVA/TTC calculations
 */
import { test, expect, navigateAndWait } from './test-utils';
import {
  createClientUI,
  createMateriauUI,
  createDevisUI,
  TEST_CLIENT,
  TEST_MATERIAUX,
  TEST_DEVIS_LIGNES,
} from './test-utils';

test.describe('Devis CRUD', () => {
  test.beforeEach(async ({ testPage }) => {
    test.setTimeout(60000); // Increase timeout for setup
    // Create prerequisite data: client and materials
    await createClientUI(testPage, TEST_CLIENT);
    for (const materiau of TEST_MATERIAUX) {
      await createMateriauUI(testPage, materiau);
    }
    await navigateAndWait(testPage, '/devis');
  });

  test.setTimeout(60000); // Increase timeout for all tests in this describe

  test('should create a new devis with calculations', async ({ testPage }) => {
    const devisNumber = await createDevisUI(testPage, {
      clientNom: TEST_CLIENT.nom,
      lignes: TEST_DEVIS_LIGNES,
      notes: 'Test devis for calculations',
    });

    // Verify devis was created
    await expect(testPage.locator(`text=${devisNumber}`)).toBeVisible();

    // Click to view details
    await testPage.click(`text=${devisNumber}`);
    await testPage.waitForURL(/\/devis\/\d+/);

    // Verify calculations are displayed
    // Line 1: 10 * 35000 = 350000 HT, TVA = 350000 * 0.1925 = 67375, TTC = 417375
    // Line 2: 50 * 8500 = 425000 HT, TVA = 425000 * 0.1925 = 81812.5, TTC = 506812.5
    // Total HT = 775000, Total TVA = 149187.5, Total TTC = 924187.5
    await expect(testPage.locator('text=775 000 FCFA')).toBeVisible(); // Total HT
    await expect(testPage.locator('text=149 188 FCFA')).toBeVisible(); // Total TVA (rounded)
    await expect(testPage.locator('text=924 188 FCFA')).toBeVisible(); // Total TTC (rounded)
  });

  test('should display devis details with correct line items', async ({ testPage }) => {
    const devisNumber = await createDevisUI(testPage, {
      clientNom: TEST_CLIENT.nom,
      lignes: TEST_DEVIS_LIGNES,
    });

    await testPage.click(`text=${devisNumber}`);
    await testPage.waitForURL(/\/devis\/\d+/);

    // Verify line items
    await expect(testPage.locator('text=Profilé acier UPN 80')).toBeVisible();
    await expect(testPage.locator('text=Tôle ondulée 0.5mm')).toBeVisible();
    // Use more specific locators for quantities to avoid strict mode violations
    await expect(testPage.locator('td:has-text("10")').first()).toBeVisible(); // Quantité line 1
    await expect(testPage.locator('td:has-text("50")').first()).toBeVisible(); // Quantité line 2
  });

  test('should calculate TVA breakdown by rate', async ({ testPage }) => {
    // Create devis with different TVA rates
    await createDevisUI(testPage, {
      clientNom: TEST_CLIENT.nom,
      lignes: [
        { ...TEST_DEVIS_LIGNES[0], tvaTaux: 0.1925 }, // Normal
        { ...TEST_DEVIS_LIGNES[1], tvaTaux: 0 }, // Exonéré
      ],
    });

    const devisNumber = await testPage.locator('text=/DEV-\\d{4}-\\d{3}/').first().textContent();
    await testPage.click(`text=${devisNumber}`);
    await testPage.waitForURL(/\/devis\/\d+/);

    // Verify TVA breakdown shows both rates
    await expect(testPage.locator('text=TVA 19.25%')).toBeVisible();
    await expect(testPage.locator('text=TVA 0.00%')).toBeVisible();
  });

  test('should edit an existing devis', async ({ testPage }) => {
    const devisNumber = await createDevisUI(testPage, {
      clientNom: TEST_CLIENT.nom,
      lignes: [TEST_DEVIS_LIGNES[0]],
    });

    // Navigate to edit
    await testPage.click(`text=${devisNumber}`);
    await testPage.click('text=Modifier');
    await testPage.waitForURL(/\/devis\/\d+\/modifier/);

    // Add a second line
    await testPage.click('button:has-text("Ajouter une ligne")');
    await testPage.waitForTimeout(200);

    // Fill second line - select material from datalist
    await testPage.locator('input[list="materiaux-1"]').first().fill('Tôle ondulée 0.5mm');
    await testPage.locator('input[list="materiaux-1"]').first().press('Tab');
    await testPage.waitForTimeout(100);

    // Fill other fields
    const inputs = testPage.locator('input[placeholder="m, m², kg..."]');
    await inputs.nth(1).fill('m²');
    await inputs.nth(1).press('Tab');
    const qtyInputs = testPage.locator('input[placeholder="0"]');
    await qtyInputs.nth(2).fill('20'); // Quantité for line 2
    await qtyInputs.nth(2).press('Tab');
    await qtyInputs.nth(3).fill('8500'); // Prix for line 2
    await qtyInputs.nth(3).press('Tab');

    // Select TVA rate for the new line
    await testPage.locator('[data-testid="devis-edit-line-1-tvaTaux"]').selectOption('0.1925');
    await testPage.locator('[data-testid="devis-edit-line-1-tvaTaux"]').press('Tab');

    await testPage.click('button:has-text("Enregistrer")');
    // Form navigates to detail page (/devis/:id), not list
    await testPage.waitForURL(/\/devis\/\d+/);

    // Verify update - check the detail page for the added material
    // The detail page shows material names in table rows
    await expect(testPage.locator('table tbody tr:has-text("Tôle ondulée 0.5mm")')).toBeVisible();
  });

  test('should delete a devis', async ({ testPage }) => {
    const devisNumber = await createDevisUI(testPage, {
      clientNom: TEST_CLIENT.nom,
      lignes: [TEST_DEVIS_LIGNES[0]],
    });

    await testPage.click(`text=${devisNumber}`);
    // Set up dialog handler BEFORE clicking delete
    testPage.on('dialog', (dialog) => dialog.accept());
    await testPage.click('button:has-text("Supprimer")');

    await testPage.waitForURL('/devis');
    await expect(testPage.locator(`text=${devisNumber}`)).not.toBeVisible();
  });

  test('should prevent submission when no lines', async ({ testPage }) => {
    await navigateAndWait(testPage, '/devis/nouveau');

    // Wait for client options to load using data-testid
    await testPage.waitForSelector('[data-testid="devis-create-client-select"]', {
      state: 'visible',
    });
    // Wait for the select to be enabled (not loading)
    await testPage.waitForSelector('[data-testid="devis-create-client-select"]:not([disabled])', {
      state: 'attached',
    });
    // Select the client by label
    await testPage.selectOption('[data-testid="devis-create-client-select"]', {
      label: TEST_CLIENT.nom,
    });
    // Trigger blur to ensure react-hook-form registers the change
    await testPage.locator('[data-testid="devis-create-client-select"]').press('Tab');

    await testPage.click('button:has-text("Enregistrer")');

    // Form should not submit - stay on create page
    await expect(testPage).toHaveURL(/\/devis\/nouveau/);
  });

  test('should show devis number preview before creation', async ({ testPage }) => {
    await navigateAndWait(testPage, '/devis/nouveau');

    // Check that next number is displayed
    await expect(testPage.locator('text=/DEV-\\d{4}-\\d{3}/')).toBeVisible();
  });

  test('should increment devis number sequentially', async ({ testPage }) => {
    // Create first devis
    const num1 = await createDevisUI(testPage, {
      clientNom: TEST_CLIENT.nom,
      lignes: [TEST_DEVIS_LIGNES[0]],
    });

    // Create second devis
    const num2 = await createDevisUI(testPage, {
      clientNom: TEST_CLIENT.nom,
      lignes: [TEST_DEVIS_LIGNES[1]],
    });

    // Extract sequence numbers
    const seq1 = parseInt(num1.split('-')[2], 10);
    const seq2 = parseInt(num2.split('-')[2], 10);

    expect(seq2).toBe(seq1 + 1);
  });

  test('should calculate line totals correctly', async ({ testPage }) => {
    await navigateAndWait(testPage, '/devis/nouveau');

    // Wait for client options to load
    await testPage.waitForSelector('[data-testid="devis-create-client-select"]', {
      state: 'visible',
    });
    await testPage.waitForSelector('[data-testid="devis-create-client-select"]:not([disabled])', {
      state: 'attached',
    });
    await testPage.selectOption('[data-testid="devis-create-client-select"]', {
      label: TEST_CLIENT.nom,
    });
    await testPage.locator('[data-testid="devis-create-client-select"]').press('Tab');

    // Fill first line: 5 * 10000 = 50000 HT
    await testPage.locator('input[list="materiaux-0"]').first().fill('Profilé acier UPN 80');
    await testPage.waitForTimeout(100);
    await testPage.locator('input[list="materiaux-0"]').first().press('Tab');
    await testPage.locator('input[placeholder="m, m², kg..."]').first().fill('m');
    await testPage.locator('input[placeholder="m, m², kg..."]').first().press('Tab');
    await testPage.locator('input[placeholder="0"]').first().fill('5');
    await testPage.locator('input[placeholder="0"]').first().press('Tab');
    await testPage.locator('input[placeholder="0"]').nth(1).fill('10000');
    await testPage.locator('input[placeholder="0"]').nth(1).press('Tab');

    // Check line total HT displays 50 000 FCFA - target by label "Total HT ligne"
    const totalHTLabel = testPage.locator('label:has-text("Total HT ligne")').first();
    await expect(totalHTLabel.locator('..').locator('div.bg-gray-100')).toContainText(
      '50 000 FCFA'
    );

    // Check line total TTC displays 59 625 FCFA (50000 * 1.1925) - target by label "Total TTC ligne"
    const totalTTCLabel = testPage.locator('label:has-text("Total TTC ligne")').first();
    await expect(totalTTCLabel.locator('..').locator('div.bg-gray-100')).toContainText(
      '59 625 FCFA'
    );
  });
});

test.describe('Devis status workflow', () => {
  test.beforeEach(async ({ testPage }) => {
    test.setTimeout(60000);
    // Create prerequisite data: client and materials
    await createClientUI(testPage, TEST_CLIENT);
    for (const materiau of TEST_MATERIAUX) {
      await createMateriauUI(testPage, materiau);
    }
    await navigateAndWait(testPage, '/devis');
  });

  test.setTimeout(60000); // Increase timeout for all tests in this describe
  test('should create devis with brouillon status', async ({ testPage }) => {
    const devisNumber = await createDevisUI(testPage, {
      clientNom: TEST_CLIENT.nom,
      lignes: [TEST_DEVIS_LIGNES[0]],
    });

    await testPage.click(`text=${devisNumber}`);
    await testPage.waitForURL(/\/devis\/\d+/);
    // Wait for the status badge to be visible - use first() to avoid strict mode violation
    // There are two badges with "Brouillon" text: one in header, one in info section
    await expect(testPage.locator('.bg-gray-100:has-text("Brouillon")').first()).toBeVisible();
  });

  test('should allow changing status to envoyé', async ({ testPage }) => {
    const devisNumber = await createDevisUI(testPage, {
      clientNom: TEST_CLIENT.nom,
      lignes: [TEST_DEVIS_LIGNES[0]],
    });

    await testPage.click(`text=${devisNumber}`);
    await testPage.click('text=Modifier');
    await testPage.waitForURL(/\/devis\/\d+\/modifier/);

    // Change status
    await testPage.selectOption('select[name="statut"]', 'envoye');
    await testPage.click('button:has-text("Enregistrer")');

    // Form navigates to detail page after edit
    await testPage.waitForURL(/\/devis\/\d+/);
    // Target the status badge (blue badge for Envoyé), not the select option - use first() to avoid strict mode violation
    await expect(testPage.locator('.bg-blue-100:has-text("Envoyé")').first()).toBeVisible();
  });
});
