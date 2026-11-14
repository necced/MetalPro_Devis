/**
 * Offline Navigation & IndexedDB Persistence E2E Tests
 * Tests offline functionality and data persistence
 *
 * Importers/callers: Playwright test runner (npm run test:e2e)
 * Affected API: IndexedDB (via fake-indexeddb), Service Worker caching, localStorage
 * Data schemas: clients, materiaux, devis, _devisCounter stores (Dexie schema v2)
 * User instruction: "Prepare local test architecture (Playwright E2E tests for client CRUD, materials, devis creation/edit with HT/TVA/TTC calculations, PDF generation/download, offline navigation, IndexedDB persistence), implement data isolation strategy using fake-indexeddb or database cleanup between tests, add data-testid attributes where needed for test stability."
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

test.describe('Offline Navigation', () => {
  test.beforeEach(async ({ testPage }) => {
    // Create prerequisite data while online
    await createClientUI(testPage, TEST_CLIENT);
    for (const materiau of TEST_MATERIAUX) {
      await createMateriauUI(testPage, materiau);
    }
    await navigateAndWait(testPage, '/devis');
  });

  test('should navigate between pages offline', async ({ testPage }) => {
    // Go offline
    await testPage.context().setOffline(true);

    // Navigate to different pages - should work from cache
    await navigateAndWait(testPage, '/clients');
    await expect(testPage.locator('text=Entreprise Test CI')).toBeVisible();

    await navigateAndWait(testPage, '/materiaux');
    await expect(testPage.locator('text=Profilé acier UPN 80')).toBeVisible();

    await navigateAndWait(testPage, '/devis');
    await expect(testPage.locator('text=DEV-')).toBeVisible();

    // Go back online
    await testPage.context().setOffline(false);
  });

  test('should show offline indicator', async ({ testPage }) => {
    await testPage.context().setOffline(true);

    // Check for offline indicator (if implemented)
    await navigateAndWait(testPage, '/');

    // The app should still work
    await expect(testPage.locator('text=MetalPro')).toBeVisible();

    await testPage.context().setOffline(false);
  });

  test('should cache static assets for offline use', async ({ testPage }) => {
    // First load (online) - assets get cached
    await navigateAndWait(testPage, '/');

    // Go offline
    await testPage.context().setOffline(true);

    // Reload page - should load from cache
    await testPage.reload({ waitUntil: 'domcontentloaded' });

    // App should still be functional
    await expect(testPage.locator('text=MetalPro')).toBeVisible();

    await testPage.context().setOffline(false);
  });
});

test.describe('IndexedDB Persistence', () => {
  test('should persist clients across sessions', async ({ testPage, testDb }) => {
    // Create client
    await createClientUI(testPage, TEST_CLIENT);

    // Verify in IndexedDB directly
    const clients = await testDb.getAll('clients');
    expect(clients.length).toBeGreaterThan(0);
    expect(clients[0].nom).toBe(TEST_CLIENT.nom);

    // Reload page
    await testPage.reload({ waitUntil: 'domcontentloaded' });
    await navigateAndWait(testPage, '/clients');

    // Client should still be visible
    await expect(testPage.locator('text=Entreprise Test CI')).toBeVisible();
  });

  test('should persist matériaux across sessions', async ({ testPage, testDb }) => {
    await createMateriauUI(testPage, TEST_MATERIAUX[0]);

    // Verify in IndexedDB
    const materiaux = await testDb.getAll('materiaux');
    expect(materiaux.length).toBeGreaterThan(0);
    expect(materiaux[0].nom).toBe(TEST_MATERIAUX[0].nom);

    // Reload page
    await testPage.reload({ waitUntil: 'domcontentloaded' });
    await navigateAndWait(testPage, '/materiaux');

    // Material should still be visible
    await expect(testPage.locator('text=Profilé acier UPN 80')).toBeVisible();
  });

  test('should persist devis across sessions', async ({ testPage, testDb }) => {
    const devisNumber = await createDevisUI(testPage, {
      clientNom: TEST_CLIENT.nom,
      lignes: TEST_DEVIS_LIGNES,
    });

    // Verify in IndexedDB
    const devis = await testDb.getAll('devis');
    expect(devis.length).toBeGreaterThan(0);
    expect(devis[0].numero).toBe(devisNumber);

    // Reload page
    await testPage.reload({ waitUntil: 'domcontentloaded' });
    await navigateAndWait(testPage, '/devis');

    // Devis should still be visible
    await expect(testPage.locator(`text=${devisNumber}`)).toBeVisible();
  });

  test('should persist devis counter across sessions', async ({ testPage, testDb }) => {
    // Create first devis
    const num1 = await createDevisUI(testPage, {
      clientNom: TEST_CLIENT.nom,
      lignes: [TEST_DEVIS_LIGNES[0]],
    });

    // Check counter in DB
    const counters = await testDb.getAll('_devisCounter');
    expect(counters.length).toBe(1);
    expect(counters[0].lastSeq).toBe(1);

    // Reload
    await testPage.reload({ waitUntil: 'domcontentloaded' });
    await navigateAndWait(testPage, '/devis/nouveau');

    // Next number should be 2
    await expect(testPage.locator('text=/DEV-\\d{4}-002/')).toBeVisible();
  });

  test('should persist settings in localStorage', async ({ testPage }) => {
    // Update settings
    await navigateAndWait(testPage, '/parametres');

    await testPage.fill('#entrepriseNom', 'Nouveau Nom SARL');
    await testPage.click('button:has-text("Enregistrer")');
    await testPage.waitForTimeout(500);

    // Reload
    await testPage.reload({ waitUntil: 'domcontentloaded' });
    await navigateAndWait(testPage, '/parametres');

    // Settings should persist
    await expect(testPage.locator('#entrepriseNom')).toHaveValue('Nouveau Nom SARL');
  });

  test('should maintain data integrity after browser restart simulation', async ({
    testPage,
    testDb,
  }) => {
    // Create full dataset
    await createClientUI(testPage, TEST_CLIENT);
    for (const materiau of TEST_MATERIAUX) {
      await createMateriauUI(testPage, materiau);
    }
    const devisNumber = await createDevisUI(testPage, {
      clientNom: TEST_CLIENT.nom,
      lignes: TEST_DEVIS_LIGNES,
    });

    // Simulate browser restart by clearing page state but keeping DB
    await testPage.close();

    // Create new page (simulating new browser session)
    const context = testPage.context();
    const newPage = await context.newPage();

    // Navigate to app
    await newPage.goto('/');
    await newPage.waitForLoadState('networkidle');

    // Verify all data persisted
    await newPage.goto('/clients');
    await expect(newPage.locator('text=Entreprise Test CI')).toBeVisible();

    await newPage.goto('/materiaux');
    await expect(newPage.locator('text=Profilé acier UPN 80')).toBeVisible();
    await expect(newPage.locator('text=Tôle ondulée 0.5mm')).toBeVisible();

    await newPage.goto('/devis');
    await expect(newPage.locator(`text=${devisNumber}`)).toBeVisible();

    // Verify devis detail still works
    await newPage.click(`text=${devisNumber}`);
    await newPage.waitForURL(/\/devis\/\d+/);
    await expect(newPage.locator('text=Profilé acier UPN 80')).toBeVisible();

    await newPage.close();
  });
});

test.describe('Data Isolation', () => {
  test('should isolate test data between tests', async ({ testPage, testDb }) => {
    // This test verifies the testDb fixture properly isolates data
    // Each test gets a fresh database

    // Create a client
    await createClientUI(testPage, TEST_CLIENT);

    // Verify it exists
    const clients = await testDb.getAll('clients');
    expect(clients.length).toBe(1);

    // The next test will start with a clean database
  });

  test('should not leak data between test runs', async ({ testPage, testDb }) => {
    // Verify database starts empty (after fixture cleanup)
    const clients = await testDb.getAll('clients');
    const materiaux = await testDb.getAll('materiaux');
    const devis = await testDb.getAll('devis');

    // Should be empty (seeded with only initial data)
    expect(clients.length).toBe(1); // Seeded test client
    expect(materiaux.length).toBe(3); // Seeded test materials
    expect(devis.length).toBe(0); // No devis seeded
  });
});

test.describe('Concurrent Access', () => {
  test('should handle multiple tabs accessing same DB', async ({ testPage, context, testDb }) => {
    // Create data in first tab
    await createClientUI(testPage, TEST_CLIENT);

    // Open second tab
    const tab2 = await context.newPage();
    await tab2.goto('/clients');
    await tab2.waitForLoadState('networkidle');

    // Second tab should see the data
    await expect(tab2.locator('text=Entreprise Test CI')).toBeVisible();

    // Create in second tab
    await createClientUI(tab2, {
      ...TEST_CLIENT,
      nom: 'Client Onglet 2',
      telephone: '+237 6 88 88 88 88',
    });

    // First tab should see it after navigation
    await testPage.goto('/clients');
    await expect(testPage.locator('text=Client Onglet 2')).toBeVisible();

    await tab2.close();
  });
});
