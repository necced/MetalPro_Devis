/**
 * PDF Generation E2E Tests
 * Tests PDF generation, download, and content verification
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

test.describe('PDF Generation', () => {
  test.beforeEach(async ({ testPage }) => {
    // Create prerequisite data
    await createClientUI(testPage, TEST_CLIENT);
    for (const materiau of TEST_MATERIAUX) {
      await createMateriauUI(testPage, materiau);
    }
    await navigateAndWait(testPage, '/devis');
  });

  test('should generate and open PDF in new tab', async ({ testPage }) => {
    const devisNumber = await createDevisUI(testPage, {
      clientNom: TEST_CLIENT.nom,
      lignes: TEST_DEVIS_LIGNES,
    });

    await testPage.click(`text=${devisNumber}`);
    await testPage.waitForURL(/\/devis\/\d+/);

    // Click generate PDF button
    const [popup] = await Promise.all([
      testPage.waitForEvent('popup', { timeout: 15000 }),
      testPage.click('button:has-text("Générer PDF")'),
    ]);

    // Verify PDF opened
    await popup.waitForLoadState();
    expect(popup.url()).toContain('blob:');

    // Verify PDF title or content
    const pdfTitle = await popup.title();
    expect(pdfTitle).toContain(devisNumber.replace('DEV-', ''));

    await popup.close();
  });

  test('should generate PDF with correct header information', async ({ testPage }) => {
    const devisNumber = await createDevisUI(testPage, {
      clientNom: TEST_CLIENT.nom,
      lignes: TEST_DEVIS_LIGNES,
    });

    await testPage.click(`text=${devisNumber}`);
    await testPage.waitForURL(/\/devis\/\d+/);

    const [popup] = await Promise.all([
      testPage.waitForEvent('popup', { timeout: 15000 }),
      testPage.click('button:has-text("Générer PDF")'),
    ]);

    await popup.waitForLoadState();

    // PDF should contain company name
    const content = await popup.evaluate(() => document.body.innerText);
    expect(content).toContain('MetalPro SARL');
    expect(content).toContain(devisNumber);
    expect(content).toContain('Entreprise Test CI');

    await popup.close();
  });

  test('should generate PDF with line items and totals', async ({ testPage }) => {
    const devisNumber = await createDevisUI(testPage, {
      clientNom: TEST_CLIENT.nom,
      lignes: TEST_DEVIS_LIGNES,
    });

    await testPage.click(`text=${devisNumber}`);
    await testPage.waitForURL(/\/devis\/\d+/);

    const [popup] = await Promise.all([
      testPage.waitForEvent('popup', { timeout: 15000 }),
      testPage.click('button:has-text("Générer PDF")'),
    ]);

    await popup.waitForLoadState();

    const content = await popup.evaluate(() => document.body.innerText);
    expect(content).toContain('Profilé acier UPN 80');
    expect(content).toContain('Tôle ondulée 0.5mm');
    expect(content).toContain('Total HT');
    expect(content).toContain('Total TVA');
    expect(content).toContain('Total TTC');

    await popup.close();
  });

  test('should generate PDF with TVA breakdown', async ({ testPage }) => {
    const devisNumber = await createDevisUI(testPage, {
      clientNom: TEST_CLIENT.nom,
      lignes: [
        { ...TEST_DEVIS_LIGNES[0], tvaTaux: 0.1925 },
        { ...TEST_DEVIS_LIGNES[1], tvaTaux: 0 },
      ],
    });

    await testPage.click(`text=${devisNumber}`);
    await testPage.waitForURL(/\/devis\/\d+/);

    const [popup] = await Promise.all([
      testPage.waitForEvent('popup', { timeout: 15000 }),
      testPage.click('button:has-text("Générer PDF")'),
    ]);

    await popup.waitForLoadState();

    const content = await popup.evaluate(() => document.body.innerText);
    expect(content).toContain('Détail TVA');
    expect(content).toContain('19.25%');
    expect(content).toContain('0.00%');

    await popup.close();
  });

  test('should generate PDF with notes', async ({ testPage }) => {
    const devisNumber = await createDevisUI(testPage, {
      clientNom: TEST_CLIENT.nom,
      lignes: TEST_DEVIS_LIGNES,
      notes: 'Conditions particulières: Paiement à 30 jours',
    });

    await testPage.click(`text=${devisNumber}`);
    await testPage.waitForURL(/\/devis\/\d+/);

    const [popup] = await Promise.all([
      testPage.waitForEvent('popup', { timeout: 15000 }),
      testPage.click('button:has-text("Générer PDF")'),
    ]);

    await popup.waitForLoadState();

    const content = await popup.evaluate(() => document.body.innerText);
    expect(content).toContain('Conditions particulières');
    expect(content).toContain('Paiement à 30 jours');

    await popup.close();
  });

  test('should include signature blocks in PDF', async ({ testPage }) => {
    const devisNumber = await createDevisUI(testPage, {
      clientNom: TEST_CLIENT.nom,
      lignes: [TEST_DEVIS_LIGNES[0]],
    });

    await testPage.click(`text=${devisNumber}`);
    await testPage.waitForURL(/\/devis\/\d+/);

    const [popup] = await Promise.all([
      testPage.waitForEvent('popup', { timeout: 15000 }),
      testPage.click('button:has-text("Générer PDF")'),
    ]);

    await popup.waitForLoadState();

    const content = await popup.evaluate(() => document.body.innerText);
    expect(content).toContain('Signature client');
    expect(content).toContain('Signature MetalPro');

    await popup.close();
  });

  test('should include pagination in PDF footer', async ({ testPage }) => {
    // Create a devis with many lines to force pagination
    const manyLines = Array.from({ length: 20 }, (_, i) => ({
      materiauNom: `Article ${i + 1}`,
      unite: 'unité',
      quantite: '1',
      prixUnitaire: '1000',
      tvaTaux: 0.1925,
    }));

    // Create materials for each line
    for (let i = 0; i < 20; i++) {
      await createMateriauUI(testPage, {
        nom: `Article ${i + 1}`,
        unite: 'unité',
        prixUnitaire: '1000',
        tvaTaux: 0.1925,
      });
    }

    const devisNumber = await createDevisUI(testPage, {
      clientNom: TEST_CLIENT.nom,
      lignes: manyLines,
    });

    await testPage.click(`text=${devisNumber}`);
    await testPage.waitForURL(/\/devis\/\d+/);

    const [popup] = await Promise.all([
      testPage.waitForEvent('popup', { timeout: 15000 }),
      testPage.click('button:has-text("Générer PDF")'),
    ]);

    await popup.waitForLoadState();

    const content = await popup.evaluate(() => document.body.innerText);
    // Check for page numbers
    expect(content).toMatch(/Page \d+ \/ \d+/);

    await popup.close();
  });

  test('should handle PDF generation error gracefully', async ({ testPage }) => {
    // Create a devis
    const devisNumber = await createDevisUI(testPage, {
      clientNom: TEST_CLIENT.nom,
      lignes: [TEST_DEVIS_LIGNES[0]],
    });

    await testPage.click(`text=${devisNumber}`);
    await testPage.waitForURL(/\/devis\/\d+/);

    // Mock a failure by blocking blob URLs
    await testPage.route('blob:**', (route) => route.abort());

    await testPage.click('button:has-text("Générer PDF")');

    // Should show error message
    await expect(testPage.locator('text=Popup bloqué')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('PDF Download', () => {
  test.beforeEach(async ({ testPage }) => {
    await createClientUI(testPage, TEST_CLIENT);
    for (const materiau of TEST_MATERIAUX) {
      await createMateriauUI(testPage, materiau);
    }
    await navigateAndWait(testPage, '/devis');
  });

  test('should download PDF when popup is blocked', async ({ testPage }) => {
    const devisNumber = await createDevisUI(testPage, {
      clientNom: TEST_CLIENT.nom,
      lignes: TEST_DEVIS_LIGNES,
    });

    await testPage.click(`text=${devisNumber}`);
    await testPage.waitForURL(/\/devis\/\d+/);

    // Block popups
    testPage.on('popup', (popup) => popup.close());

    // Click generate PDF
    const downloadPromise = testPage.waitForEvent('download', { timeout: 10000 });
    await testPage.click('button:has-text("Générer PDF")');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain(devisNumber);
    expect(download.suggestedFilename()).toContain('.pdf');
  });
});
