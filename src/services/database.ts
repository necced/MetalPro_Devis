import { db } from '../db';
import type {
  Client,
  Materiau,
  Devis,
  DevisLigne,
  DevisTotaux,
  TvaDetail,
  DevisCounter,
  PdfCacheEntry,
} from '../types';
import { D, calculerTVA, calculerTTC, calculerLigneHT } from '../shared/utils/decimal';
import { useAppStore } from '../stores/appStore';
import { generateDevisPDFBlob } from './pdf';

/**
 * Database Service Layer
 * Provides CRUD operations for all entities using Dexie
 * All monetary values are stored as Decimal strings for precision
 */

// ============================================================================
// Client Service
// ============================================================================

export async function getAllClients(): Promise<Client[]> {
  return db.clients.orderBy('nom').toArray();
}

export async function getClientById(id: number): Promise<Client | undefined> {
  return db.clients.get(id);
}

export async function createClient(
  client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
): Promise<number> {
  const now = new Date().toISOString();
  const newClient: Client = {
    ...client,
    createdAt: now,
    updatedAt: now,
  };
  return db.clients.add(newClient);
}

export async function updateClient(
  id: number,
  changes: Partial<Omit<Client, 'id' | 'createdAt'>>
): Promise<number> {
  return db.clients.update(id, {
    ...changes,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteClient(id: number): Promise<void> {
  // Check if client is referenced in any devis
  const devisCount = await db.devis.where('clientId').equals(id).count();
  if (devisCount > 0) {
    throw new Error('Impossible de supprimer : ce client est référencé dans un ou plusieurs devis');
  }
  await db.clients.delete(id);
}

export async function searchClients(query: string): Promise<Client[]> {
  const lowerQuery = query.toLowerCase();
  return db.clients
    .filter(
      (client) =>
        client.nom.toLowerCase().includes(lowerQuery) ||
        client.telephone.includes(query) ||
        client.email?.toLowerCase().includes(lowerQuery)
    )
    .toArray();
}

// ============================================================================
// Materiau Service
// ============================================================================

export async function getAllMateriaux(): Promise<Materiau[]> {
  return db.materiaux.orderBy('nom').toArray();
}

export async function getMateriauById(id: number): Promise<Materiau | undefined> {
  return db.materiaux.get(id);
}

export async function createMateriau(
  materiau: Omit<Materiau, 'id' | 'createdAt' | 'updatedAt'>
): Promise<number> {
  const now = new Date().toISOString();
  const newMateriau: Materiau = {
    ...materiau,
    createdAt: now,
    updatedAt: now,
  };
  return db.materiaux.add(newMateriau);
}

export async function updateMateriau(
  id: number,
  changes: Partial<Omit<Materiau, 'id' | 'createdAt'>>
): Promise<number> {
  return db.materiaux.update(id, {
    ...changes,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteMateriau(id: number): Promise<void> {
  // Check if materiau is referenced in any devis lignes
  const allDevis = await db.devis.toArray();
  const isReferenced = allDevis.some((devis) =>
    devis.lignes.some((ligne) => ligne.materiauId === id)
  );
  if (isReferenced) {
    throw new Error(
      'Impossible de supprimer : ce matériau est référencé dans un ou plusieurs devis'
    );
  }
  await db.materiaux.delete(id);
}

export async function searchMateriaux(query: string): Promise<Materiau[]> {
  const lowerQuery = query.toLowerCase();
  return db.materiaux
    .filter(
      (m) =>
        m.nom.toLowerCase().includes(lowerQuery) ||
        m.unite.toLowerCase().includes(lowerQuery) ||
        m.description?.toLowerCase().includes(lowerQuery)
    )
    .toArray();
}

// ============================================================================
// Devis Numbering Service (Atomic Counter)
// ============================================================================

export async function getNextDevisNumber(): Promise<string> {
  const settings = useAppStore.getState().settings;
  const prefix = settings.numeroDevisPrefix || 'DEV';
  const year = new Date().getFullYear();

  // Use atomic counter transaction to prevent race conditions
  return await db.transaction('rw', db._devisCounter, async () => {
    // Try to find existing counter for this prefix/year
    const existingCounter = await db._devisCounter
      .where('[prefix+year]')
      .equals([prefix, year])
      .first();

    if (existingCounter) {
      // Atomic increment using modify
      const newSeq = existingCounter.lastSeq + 1;
      await db._devisCounter.where('id').equals(existingCounter.id).modify({ lastSeq: newSeq });
      return `${prefix}-${year}-${String(newSeq).padStart(3, '0')}`;
    } else {
      // Create new counter starting at 1
      await db._devisCounter.add({ prefix, year, lastSeq: 1 });
      return `${prefix}-${year}-001`;
    }
  });
}

/**
 * Returns the next devis number WITHOUT incrementing the counter.
 * Use for UI preview (e.g., showing the next number before user submits).
 */
export async function peekNextDevisNumber(): Promise<string> {
  const settings = useAppStore.getState().settings;
  const prefix = settings.numeroDevisPrefix || 'DEV';
  const year = new Date().getFullYear();

  return await db.transaction('r', db._devisCounter, async () => {
    const existingCounter = await db._devisCounter
      .where('[prefix+year]')
      .equals([prefix, year])
      .first();

    if (existingCounter) {
      // Next sequence would be lastSeq + 1
      const nextSeq = existingCounter.lastSeq + 1;
      return `${prefix}-${year}-${String(nextSeq).padStart(3, '0')}`;
    } else {
      // No counter yet, first would be 001
      return `${prefix}-${year}-001`;
    }
  });
}

// ============================================================================
// Devis Service
// ============================================================================

function calculateDevisTotaux(
  lignes: DevisLigne[],
  tvaMode: TvaMode
): {
  totaux: DevisTotaux;
  tvaDetails: TvaDetail[];
} {
  const tvaGroups = new Map<number, { baseHT: Decimal; montantTva: Decimal }>();

  let totalHT = D(0);
  let totalTVA = D(0);

  for (const ligne of lignes) {
    const qte = D(ligne.quantite);
    const pu = D(ligne.prixUnitaire);
    const ligneHT = calculerLigneHT(qte, pu);

    if (tvaMode === 'avec') {
      const ligneTVA = calculerTVA(ligneHT, ligne.tvaTaux);
      const ligneTTC = calculerTTC(ligneHT, ligne.tvaTaux);

      totalHT = totalHT.add(ligneHT);
      totalTVA = totalTVA.add(ligneTVA);

      // Group by TVA rate for breakdown
      const existing = tvaGroups.get(ligne.tvaTaux) || { baseHT: D(0), montantTva: D(0) };
      existing.baseHT = existing.baseHT.add(ligneHT);
      existing.montantTva = existing.montantTva.add(ligneTVA);
      tvaGroups.set(ligne.tvaTaux, existing);
    } else {
      // Mode 'sans' TVA: totalHT = totalTTC, no TVA
      totalHT = totalHT.add(ligneHT);
      // totalTVA stays 0
    }
  }

  const totalTTC = totalHT.add(totalTVA);

  const totaux: DevisTotaux = {
    totalHT: totalHT.toString(),
    totalTva: totalTVA.toString(),
    totalTTC: totalTTC.toString(),
  };

  const tvaDetails: TvaDetail[] = Array.from(tvaGroups.entries()).map(([taux, data]) => ({
    taux,
    baseHT: data.baseHT.toString(),
    montantTva: data.montantTva.toString(),
  }));

  return { totaux, tvaDetails };
}

function buildDevisLigneFromForm(
  materiauId: number,
  materiauNom: string,
  unite: string,
  quantite: string,
  prixUnitaire: string,
  tvaTaux: number
): DevisLigne {
  const qte = D(quantite);
  const pu = D(prixUnitaire);
  const montantHT = calculerLigneHT(qte, pu);
  const montantTTC = calculerTTC(montantHT, tvaTaux);

  return {
    materiauId,
    materiauNom,
    unite,
    quantite: qte.toString(),
    prixUnitaire: pu.toString(),
    tvaTaux,
    montantHT: montantHT.toString(),
    montantTTC: montantTTC.toString(),
  };
}

export async function createDevis(data: {
  clientId: number;
  lignes: Array<{
    materiauId: number;
    materiauNom: string;
    unite: string;
    quantite: string;
    prixUnitaire: string;
    tvaTaux: number;
  }>;
  dateValidite: string;
  notes?: string;
  statut?: 'brouillon' | 'envoye';
  tvaMode?: TvaMode;
}): Promise<number> {
  // Validation: at least one line required
  if (!data.lignes || data.lignes.length === 0) {
    throw new Error('Un devis doit contenir au moins une ligne');
  }

  const client = await db.clients.get(data.clientId);
  if (!client) {
    throw new Error('Client introuvable');
  }

  const numero = await getNextDevisNumber();
  const now = new Date().toISOString();
  const tvaMode = data.tvaMode || 'avec';

  const lignes: DevisLigne[] = data.lignes.map((l) =>
    buildDevisLigneFromForm(
      l.materiauId,
      l.materiauNom,
      l.unite,
      l.quantite,
      l.prixUnitaire,
      l.tvaTaux
    )
  );

  const { totaux, tvaDetails } = calculateDevisTotaux(lignes, tvaMode);

  const newDevis: Devis = {
    clientId: data.clientId,
    clientNom: client.nom,
    lignes,
    totaux,
    tvaDetails,
    tvaMode,
    statut: data.statut || 'brouillon',
    numero,
    dateCreation: now.split('T')[0],
    dateValidite: data.dateValidite,
    notes: data.notes,
    createdAt: now,
    updatedAt: now,
  };

  const devisId = await db.devis.add(newDevis);

  // Generate and cache PDF asynchronously (non-blocking)
  generateAndCacheDevisPdf(devisId).catch(console.warn);

  return devisId;
}

export async function getDevisById(id: number): Promise<Devis | undefined> {
  return db.devis.get(id);
}

export async function getAllDevis(): Promise<Devis[]> {
  return db.devis.orderBy('dateCreation').reverse().toArray();
}

export async function updateDevis(
  id: number,
  data: {
    clientId: number;
    lignes: Array<{
      materiauId: number;
      materiauNom: string;
      unite: string;
      quantite: string;
      prixUnitaire: string;
      tvaTaux: number;
    }>;
    dateValidite: string;
    notes?: string;
    statut?: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire';
    tvaMode?: TvaMode;
  }
): Promise<number> {
  // Validation: at least one line required
  if (!data.lignes || data.lignes.length === 0) {
    throw new Error('Un devis doit contenir au moins une ligne');
  }

  const client = await db.clients.get(data.clientId);
  if (!client) {
    throw new Error('Client introuvable');
  }

  // Get existing devis to preserve tvaMode if not provided
  const existingDevis = await db.devis.get(id);
  const tvaMode = data.tvaMode || existingDevis?.tvaMode || 'avec';

  const lignes: DevisLigne[] = data.lignes.map((l) =>
    buildDevisLigneFromForm(
      l.materiauId,
      l.materiauNom,
      l.unite,
      l.quantite,
      l.prixUnitaire,
      l.tvaTaux
    )
  );

  const { totaux, tvaDetails } = calculateDevisTotaux(lignes, tvaMode);

  return db.devis.update(id, {
    clientId: data.clientId,
    clientNom: client.nom,
    lignes,
    totaux,
    tvaDetails,
    tvaMode,
    statut: data.statut || 'brouillon',
    dateValidite: data.dateValidite,
    notes: data.notes,
    updatedAt: new Date().toISOString(),
  });

  // Invalidate cache and regenerate PDF asynchronously
  invalidatePdfCache(id)
    .then(() => generateAndCacheDevisPdf(id))
    .catch(console.warn);

  return id;
}

export async function deleteDevis(id: number): Promise<void> {
  await db.devis.delete(id);
  await invalidatePdfCache(id);
}

export async function getDevisByClientId(clientId: number): Promise<Devis[]> {
  return db.devis.where('clientId').equals(clientId).reverse().sortBy('dateCreation');
}

export async function searchDevis(query: string, statut?: string): Promise<Devis[]> {
  const lowerQuery = query.toLowerCase();
  let results = await db.devis
    .filter(
      (d) =>
        d.numero.toLowerCase().includes(lowerQuery) ||
        d.clientNom.toLowerCase().includes(lowerQuery)
    )
    .toArray();

  if (statut) {
    results = results.filter((d) => d.statut === statut);
  }

  return results.sort((a, b) => b.dateCreation.localeCompare(a.dateCreation));
}

// ============================================================================
// PDF Cache Service
// ============================================================================

/**
 * Get cached PDF blob for a devis
 */
export async function getCachedPdfBlob(devisId: number): Promise<Blob | null> {
  const entry = await db._pdfCache.where('devisId').equals(devisId).first();
  return entry?.blob || null;
}

/**
 * Cache a PDF blob for a devis
 */
export async function setCachedPdfBlob(devisId: number, blob: Blob): Promise<void> {
  await db._pdfCache.put({ devisId, blob, createdAt: new Date().toISOString() });
}

/**
 * Generate and cache PDF for a devis (async, non-blocking)
 */
export async function generateAndCacheDevisPdf(
  devisId: number,
  settings?: AppSettings
): Promise<void> {
  try {
    const devis = await getDevisById(devisId);
    if (!devis) return;

    const effectiveSettings = settings || useAppStore.getState().settings;
    const blob = await generateDevisPDFBlob(devis, effectiveSettings);
    await setCachedPdfBlob(devisId, blob);
  } catch (err) {
    console.warn('PDF generation and caching failed:', err);
  }
}

/**
 * Invalidate PDF cache for a devis (call when devis is updated/deleted)
 */
export async function invalidatePdfCache(devisId: number): Promise<void> {
  await db._pdfCache.where('devisId').equals(devisId).delete();
}

// Re-export Decimal for advanced usage
export { Decimal } from 'decimal.js';
