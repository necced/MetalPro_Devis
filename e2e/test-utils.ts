/**
 * Test Utilities for MetalPro Devis E2E Tests
 * Provides data isolation using fake-indexeddb and common test helpers
 */
import { test as base, Page, BrowserContext } from '@playwright/test';
import { IDBPDatabase, openDB } from 'idb';

// Extend test with custom fixtures
type TestFixtures = {
  // Isolated IndexedDB for each test
  testDb: IDBPDatabase<unknown>;
  // Page with test setup
  testPage: Page;
  // Clean up function
  cleanup: () => Promise<void>;
};

// Global database name for tests
const TEST_DB_NAME = 'MetalProDevisDB-Test';

/**
 * Creates a completely isolated IndexedDB instance using fake-indexeddb
 * This ensures tests don't interfere with each other
 */
async function createIsolatedDB(): Promise<IDBPDatabase<unknown>> {
  // Use fake-indexeddb for complete isolation
  // The default export is already an instance (FDBFactory), not a constructor
  const fdbModule = await import('fake-indexeddb');
  const {
    indexedDB: fdb,
    IDBKeyRange,
    IDBRequest,
    IDBTransaction,
    IDBDatabase,
    IDBObjectStore,
    IDBIndex,
    IDBCursor,
    IDBCursorWithValue,
    IDBOpenDBRequest,
    IDBVersionChangeEvent,
  } = fdbModule;

  // Set all IndexedDB globals for idb to use fake-indexeddb
  // @ts-expect-error - monkey patching global for test isolation
  global.indexedDB = fdb;
  // @ts-expect-error - monkey patching global for test isolation
  global.IDBKeyRange = IDBKeyRange;
  // @ts-expect-error - monkey patching global for test isolation
  global.IDBRequest = IDBRequest;
  // @ts-expect-error - monkey patching global for test isolation
  global.IDBTransaction = IDBTransaction;
  // @ts-expect-error - monkey patching global for test isolation
  global.IDBDatabase = IDBDatabase;
  // @ts-expect-error - monkey patching global for test isolation
  global.IDBObjectStore = IDBObjectStore;
  // @ts-expect-error - monkey patching global for test isolation
  global.IDBIndex = IDBIndex;
  // @ts-expect-error - monkey patching global for test isolation
  global.IDBCursor = IDBCursor;
  // @ts-expect-error - monkey patching global for test isolation
  global.IDBCursorWithValue = IDBCursorWithValue;
  // @ts-expect-error - monkey patching global for test isolation
  global.IDBOpenDBRequest = IDBOpenDBRequest;
  // @ts-expect-error - monkey patching global for test isolation
  global.IDBVersionChangeEvent = IDBVersionChangeEvent;

  // Open database with the same schema as the app
  const db = await openDB(TEST_DB_NAME, 3, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Version 1 stores
      if (oldVersion < 1) {
        // Clients store
        const clientsStore = db.createObjectStore('clients', {
          keyPath: 'id',
          autoIncrement: true,
        });
        clientsStore.createIndex('nom', 'nom');
        clientsStore.createIndex('telephone', 'telephone');
        clientsStore.createIndex('email', 'email');
        clientsStore.createIndex('nif', 'nif');
        clientsStore.createIndex('rc', 'rc');
        clientsStore.createIndex('regimeTva', 'regimeTva');
        clientsStore.createIndex('createdAt', 'createdAt');
        clientsStore.createIndex('updatedAt', 'updatedAt');

        // Materiaux store
        const materiauxStore = db.createObjectStore('materiaux', {
          keyPath: 'id',
          autoIncrement: true,
        });
        materiauxStore.createIndex('nom', 'nom');
        materiauxStore.createIndex('unite', 'unite');
        materiauxStore.createIndex('prixUnitaire', 'prixUnitaire');
        materiauxStore.createIndex('tvaTaux', 'tvaTaux');
        materiauxStore.createIndex('createdAt', 'createdAt');
        materiauxStore.createIndex('updatedAt', 'updatedAt');

        // Devis store
        const devisStore = db.createObjectStore('devis', { keyPath: 'id', autoIncrement: true });
        devisStore.createIndex('clientId', 'clientId');
        devisStore.createIndex('statut', 'statut');
        devisStore.createIndex('numero', 'numero');
        devisStore.createIndex('dateCreation', 'dateCreation');
        devisStore.createIndex('dateValidite', 'dateValidite');
        devisStore.createIndex('createdAt', 'createdAt');
        devisStore.createIndex('updatedAt', 'updatedAt');

        // Sync queue
        const syncStore = db.createObjectStore('_syncQueue', {
          keyPath: 'id',
          autoIncrement: true,
        });
        syncStore.createIndex('entityType', 'entityType');
        syncStore.createIndex('entityId', 'entityId');
        syncStore.createIndex('operation', 'operation');
        syncStore.createIndex('timestamp', 'timestamp');
        syncStore.createIndex('retryCount', 'retryCount');
        syncStore.createIndex('status', 'status');

        // Backup records
        const backupStore = db.createObjectStore('_backup', { keyPath: 'id', autoIncrement: true });
        backupStore.createIndex('filename', 'filename');
        backupStore.createIndex('checksum', 'checksum');
        backupStore.createIndex('size', 'size');
        backupStore.createIndex('createdAt', 'createdAt');
      }

      // Version 2: Devis counter store
      if (oldVersion < 2) {
        const counterStore = db.createObjectStore('_devisCounter', {
          keyPath: 'id',
          autoIncrement: true,
        });
        counterStore.createIndex('prefix+year', ['prefix', 'year'], { unique: true });
        counterStore.createIndex('prefix', 'prefix');
        counterStore.createIndex('year', 'year');
        counterStore.createIndex('lastSeq', 'lastSeq');
      }

      // Version 3: PDF cache store
      if (oldVersion < 3) {
        const pdfCacheStore = db.createObjectStore('_pdfCache', {
          keyPath: 'id',
          autoIncrement: true,
        });
        pdfCacheStore.createIndex('devisId', 'devisId', { unique: true });
        pdfCacheStore.createIndex('createdAt', 'createdAt');
      }
    },
  });

  // Replace the global indexedDB with fake one for this test
  // @ts-expect-error - fake-indexeddb monkey patches global
  global.indexedDB = fdb;
  // @ts-expect-error - IDBKeyRange
  global.IDBKeyRange = fdb.IDBKeyRange;

  return db;
}

/**
 * Clears all data from the test database
 */
async function clearTestDB(db: IDBPDatabase<unknown>): Promise<void> {
  const storeNames = ['clients', 'materiaux', 'devis', '_syncQueue', '_backup', '_devisCounter'];
  const tx = db.transaction(storeNames, 'readwrite');
  await Promise.all(storeNames.map((name) => tx.objectStore(name).clear()));
  await tx.done;
}

/**
 * Seeds the database with minimal test data
 */
async function seedTestDB(db: IDBPDatabase<unknown>): Promise<void> {
  const now = new Date().toISOString();

  // Add a test client
  await db.add('clients', {
    nom: 'Client Test SARL',
    telephone: '+237 6 99 99 99 99',
    email: 'test@client.cm',
    adresse: 'BP 1000, Douala',
    nif: 'P123456789',
    rc: 'RC/DLA/2020/B/0001',
    regimeTva: 'normal',
    createdAt: now,
    updatedAt: now,
  });

  // Add test materials
  await db.add('materiaux', {
    nom: 'Tube acier galvanisé Ø 48mm',
    unite: 'm',
    prixUnitaire: '25000',
    tvaTaux: 0.1925,
    description: 'Tube acier pour structures métalliques',
    createdAt: now,
    updatedAt: now,
  });

  await db.add('materiaux', {
    nom: 'Plaque acier 10mm',
    unite: 'm²',
    prixUnitaire: '150000',
    tvaTaux: 0.1925,
    description: 'Plaque acier pour fabrication',
    createdAt: now,
    updatedAt: now,
  });

  await db.add('materiaux', {
    nom: 'Boulons M12 x 50',
    unite: 'unité',
    prixUnitaire: '500',
    tvaTaux: 0.1925,
    description: 'Boulons haute résistance',
    createdAt: now,
    updatedAt: now,
  });

  // Initialize devis counter
  await db.add('_devisCounter', {
    prefix: 'DEV',
    year: new Date().getFullYear(),
    lastSeq: 0,
  });
}

/**
 * Custom test fixture with isolated database
 * Uses the app's basename from environment variable, default to / for testing against preview server
 * In production, the basename is /metalpro-devis-mvp
 */
const BASENAME = process.env.TEST_BASENAME || '/';

export const test = base.extend<TestFixtures>({
  testDb: async ({}, use) => {
    const db = await createIsolatedDB();
    await seedTestDB(db);
    await use(db);
    await clearTestDB(db);
    await db.close();
  },

  testPage: async ({ testDb, page, context }, use) => {
    // Navigate to app with basename and wait for DOM content loaded
    // Use 'domcontentloaded' instead of 'networkidle' because dev server HMR WebSocket keeps network busy
    const url = BASENAME === '/' ? '/' : `${BASENAME}/`;
    await page.goto(url);
    await page.waitForLoadState('domcontentloaded');

    // Wait for a visible element that indicates the app is loaded (Dashboard title)
    // This is more reliable than waiting for a non-existent flag
    await page.waitForSelector(
      'h1:has-text("Tableau de bord"), h1:has-text("Dashboard"), [data-testid="page-title"]',
      {
        state: 'visible',
        timeout: 15000,
      }
    );

    await use(page);
  },

  cleanup: async ({ testDb }, use) => {
    await use(async () => {
      await clearTestDB(testDb);
      await seedTestDB(testDb);
    });
  },
});

/**
 * Helper to clear real IndexedDB in browser for test isolation
 * Call this in test.beforeEach if needed
 */
export async function clearBrowserIndexedDB(page: Page): Promise<void> {
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      const dbName = 'MetalProDevisDB';
      const request = indexedDB.deleteDatabase(dbName);
      request.onsuccess = () => {
        console.log('[Test] Cleared real IndexedDB:', dbName);
        resolve();
      };
      request.onerror = () => {
        console.error('[Test] Failed to clear IndexedDB:', request.error);
        resolve(); // Don't fail the test if DB clear fails
      };
      request.onblocked = () => {
        console.warn('[Test] IndexedDB delete blocked');
        resolve();
      };
    });
  });
  // Reload to apply the cleared database
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector(
    'h1:has-text("Tableau de bord"), h1:has-text("Dashboard"), [data-testid="page-title"]',
    {
      state: 'visible',
      timeout: 15000,
    }
  );
}

export { expect } from '@playwright/test';

/**
 * Helper to fill a form field by label
 */
export async function fillByLabel(page: Page, label: string, value: string): Promise<void> {
  await page.fill(`label:has-text("${label}") + input, label:has-text("${label}") >> input`, value);
}

/**
 * Helper to select an option by label
 */
export async function selectByLabel(page: Page, label: string, value: string): Promise<void> {
  await page.selectOption(
    `label:has-text("${label}") + select, label:has-text("${label}") >> select`,
    value
  );
}

/**
 * Helper to click a button by text
 */
export async function clickButton(page: Page, text: string): Promise<void> {
  await page.click(`button:has-text("${text}"), a:has-text("${text}") >> visible=true`);
}

/**
 * Helper to wait for toast/notification
 */
export async function waitForToast(page: Page, text: string): Promise<void> {
  await page.waitForSelector(`[role="alert"]:has-text("${text}"), .toast:has-text("${text}")`, {
    state: 'visible',
  });
}

/**
 * Helper to get devis number from UI
 */
export async function getDevisNumber(page: Page): Promise<string> {
  const element = page.locator('text=/DEV-\\d{4}-\\d{3}/').first();
  return (await element.textContent())?.trim() || '';
}

/**
 * Helper to navigate and wait for route (includes basename)
 */
export async function navigateAndWait(page: Page, path: string): Promise<void> {
  // BASENAME is '/' for testing, so don't double-slash
  const fullPath = BASENAME === '/' ? path : `${BASENAME}${path}`;
  await Promise.all([page.waitForURL(`**${fullPath}`), page.goto(fullPath)]);
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Helper to create a client via UI
 */
export async function createClientUI(
  page: Page,
  data: {
    nom: string;
    telephone: string;
    email?: string;
    adresse?: string;
    nif?: string;
    rc?: string;
    regimeTva?: string;
  }
): Promise<string> {
  await navigateAndWait(page, '/clients/nouveau');

  await page.fill('#nom', data.nom);
  await page.fill('#telephone', data.telephone);
  if (data.email) await page.fill('#email', data.email);
  if (data.adresse) await page.fill('#adresse', data.adresse);
  if (data.nif) await page.fill('#nif', data.nif);
  if (data.rc) await page.fill('#rc', data.rc);
  if (data.regimeTva) await page.selectOption('#regimeTva', data.regimeTva);

  await clickButton(page, 'Créer le client');
  await page.waitForURL(BASENAME === '/' ? '/clients' : `${BASENAME}/clients`);

  // Return the created client name for verification
  return data.nom;
}

/**
 * Helper to create a material via UI
 */
export async function createMateriauUI(
  page: Page,
  data: {
    nom: string;
    unite: string;
    prixUnitaire: string;
    tvaTaux: number;
    description?: string;
  }
): Promise<void> {
  await navigateAndWait(page, '/materiaux/nouveau');

  await page.fill('#nom', data.nom);
  await page.fill('#unite', data.unite);
  await page.fill('#prixUnitaire', data.prixUnitaire);
  await page.selectOption('#tvaTaux', String(data.tvaTaux));
  if (data.description) await page.fill('#description', data.description);

  await clickButton(page, 'Créer le matériau');
  await page.waitForURL(BASENAME === '/' ? '/materiaux' : `${BASENAME}/materiaux`);
}

/**
 * Helper to create a devis via UI
 */
export async function createDevisUI(
  page: Page,
  data: {
    clientNom: string;
    lignes: Array<{
      materiauNom: string;
      unite: string;
      quantite: string;
      prixUnitaire: string;
      tvaTaux: number;
    }>;
    dateValidite?: string;
    notes?: string;
  }
): Promise<string> {
  await navigateAndWait(page, '/devis/nouveau');

  // Select client - wait for client options to load using data-testid
  await page.waitForSelector('[data-testid="devis-create-client-select"]', { state: 'visible' });
  // Wait for the select to be enabled (not loading)
  await page.waitForSelector('[data-testid="devis-create-client-select"]:not([disabled])', {
    state: 'attached',
  });
  // Select the client by label
  await page.selectOption('[data-testid="devis-create-client-select"]', { label: data.clientNom });
  // Trigger blur to ensure react-hook-form registers the change
  await page.locator('[data-testid="devis-create-client-select"]').press('Tab');

  // Fill lines
  for (let i = 0; i < data.lignes.length; i++) {
    const ligne = data.lignes[i];

    if (i > 0) {
      await clickButton(page, 'Ajouter une ligne');
      // Wait for new line to be added and inputs to be registered
      await page.waitForSelector(`input[list="materiaux-${i}"]`, { state: 'visible' });
    }

    // Fill material name (using datalist)
    const materiauInput = page.locator(`input[list="materiaux-${i}"]`).first();
    await materiauInput.fill(ligne.materiauNom);
    await materiauInput.press('Tab'); // Trigger change/blur for react-hook-form
    await page.waitForTimeout(100); // Wait for datalist

    // Fill other fields - use fill() and press Tab to trigger react-hook-form events
    const uniteInput = page.locator(`input[placeholder="m, m², kg..."]`).nth(i);
    await uniteInput.fill(ligne.unite);
    await uniteInput.press('Tab');

    const quantiteInput = page.locator(`input[placeholder="0"]`).nth(i * 2);
    await quantiteInput.fill(ligne.quantite);
    await quantiteInput.press('Tab');

    const prixInput = page.locator(`input[placeholder="0"]`).nth(i * 2 + 1);
    await prixInput.fill(ligne.prixUnitaire);
    await prixInput.press('Tab');

    // Select TVA
    await page
      .locator(`[data-testid="devis-create-line-${i}-tvaTaux"]`)
      .selectOption(String(ligne.tvaTaux));
    await page.locator(`[data-testid="devis-create-line-${i}-tvaTaux"]`).press('Tab');
  }

  if (data.dateValidite) {
    await page.fill('#dateValidite', data.dateValidite);
    await page.locator('#dateValidite').press('Tab');
  }
  if (data.notes) {
    await page.fill('#notes', data.notes);
    await page.locator('#notes').press('Tab');
  }

  await clickButton(page, 'Enregistrer');
  await page.waitForURL(BASENAME === '/' ? '/devis' : `${BASENAME}/devis`);

  // Get the created devis number
  return await getDevisNumber(page);
}

/**
 * Helper to generate PDF and verify download
 */
export async function generateAndVerifyPDF(page: Page): Promise<void> {
  // Click generate PDF button
  await clickButton(page, 'Générer PDF');

  // Wait for either new tab or download
  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout: 10000 }).catch(() => null),
    page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
  ]);

  if (popup) {
    // PDF opened in new tab - verify it's a PDF
    await popup.waitForLoadState();
    expect(popup.url()).toContain('blob:');
    await popup.close();
  }
  // If download happened, it's handled by the download event
}

/**
 * Test data constants
 */
export const TEST_CLIENT = {
  nom: 'Entreprise Test CI',
  telephone: '+237 6 77 77 77 77',
  email: 'ci@test.cm',
  adresse: 'BP 999, Yaoundé',
  nif: 'P987654321',
  rc: 'RC/YAO/2021/B/9999',
  regimeTva: 'normal',
};

export const TEST_MATERIAUX = [
  {
    nom: 'Profilé acier UPN 80',
    unite: 'm',
    prixUnitaire: '35000',
    tvaTaux: 0.1925,
    description: 'Profilé en U pour charpentes',
  },
  {
    nom: 'Tôle ondulée 0.5mm',
    unite: 'm²',
    prixUnitaire: '8500',
    tvaTaux: 0.1925,
    description: 'Couverture toiture',
  },
  {
    nom: 'Peinture antirouille 4L',
    unite: 'unité',
    prixUnitaire: '45000',
    tvaTaux: 0.1925,
    description: 'Protection métallique',
  },
];

export const TEST_DEVIS_LIGNES = [
  {
    materiauNom: 'Profilé acier UPN 80',
    unite: 'm',
    quantite: '10',
    prixUnitaire: '35000',
    tvaTaux: 0.1925,
  },
  {
    materiauNom: 'Tôle ondulée 0.5mm',
    unite: 'm²',
    quantite: '50',
    prixUnitaire: '8500',
    tvaTaux: 0.1925,
  },
];
