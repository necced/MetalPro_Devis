import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { db } from '../db';
import {
  createDevis,
  getDevisById,
  getAllDevis,
  updateDevis,
  deleteDevis,
  getNextDevisNumber,
  peekNextDevisNumber,
  getAllClients,
  createClient,
  getAllMateriaux,
  createMateriau,
} from '../services/database';
import { useAppStore } from '../stores/appStore';

// Helper to clean all tables including counter
async function cleanDatabase() {
  await db.devis.clear();
  await db.clients.clear();
  await db.materiaux.clear();
  await db._syncQueue.clear();
  await db._backup.clear();
  await db._devisCounter.clear();
}

// Mock the app store for settings
vi.mock('../stores/appStore', () => ({
  useAppStore: {
    getState: vi.fn(() => ({
      settings: {
        entrepriseNom: 'MetalPro SARL',
        numeroDevisPrefix: 'DEV',
        tvaDefaultRate: 0.1925,
      },
    })),
  },
}));

describe('Devis Service — Persistence, Numbering, History', () => {
  beforeEach(async () => {
    // Ensure database is open
    await db.open();
    await cleanDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
    await db.close();
  });

  describe('1. Persistance des devis', () => {
    it('enregistre un devis dans Dexie et le rend récupérable', async () => {
      // Arrange
      const clientId = await createClient({
        nom: 'Client Test',
        telephone: '+237 6 00 00 00 00',
        email: 'test@example.com',
        regimeTva: 'normal',
      });

      const materiauId = await createMateriau({
        nom: 'Tube acier',
        unite: 'm',
        prixUnitaire: '25000',
        tvaTaux: 0.1925,
      });

      // Act
      const devisId = await createDevis({
        clientId,
        lignes: [
          {
            materiauId,
            materiauNom: 'Tube acier',
            unite: 'm',
            quantite: '10',
            prixUnitaire: '25000',
            tvaTaux: 0.1925,
          },
        ],
        dateValidite: '2026-11-28',
        notes: 'Test notes',
        statut: 'brouillon',
      });

      // Assert - devis created with ID
      expect(devisId).toBeGreaterThan(0);

      // Assert - devis retrievable by ID
      const devis = await getDevisById(devisId);
      expect(devis).toBeDefined();
      expect(devis?.id).toBe(devisId);
      expect(devis?.clientId).toBe(clientId);
      expect(devis?.clientNom).toBe('Client Test');
      expect(devis?.lignes).toHaveLength(1);
      expect(devis?.lignes[0].materiauNom).toBe('Tube acier');
      expect(devis?.lignes[0].quantite).toBe('10');
      expect(devis?.lignes[0].prixUnitaire).toBe('25000');
      expect(devis?.totaux).toBeDefined();
      expect(devis?.tvaDetails).toBeDefined();
      expect(devis?.numero).toMatch(/^DEV-\d{4}-\d{3}$/);
    });

    it('le devis persiste après réouverture de la base', async () => {
      // Arrange
      const clientId = await createClient({
        nom: 'Client Persistant',
        telephone: '+237 6 11 11 11 11',
        regimeTva: 'normal',
      });

      const devisId = await createDevis({
        clientId,
        lignes: [
          {
            materiauId: 0,
            materiauNom: 'Produit test',
            unite: 'unité',
            quantite: '5',
            prixUnitaire: '10000',
            tvaTaux: 0.1925,
          },
        ],
        dateValidite: '2026-11-28',
        statut: 'brouillon',
      });

      // Act - close and reopen database (simulating app restart)
      await db.close();

      await db.open();

      // Assert - devis still exists after reopen
      const devis = await getDevisById(devisId);
      expect(devis).toBeDefined();
      expect(devis?.id).toBe(devisId);
      expect(devis?.clientNom).toBe('Client Persistant');
      expect(devis?.lignes[0].materiauNom).toBe('Produit test');
    });

    it("signale les erreurs d'enregistrement (client introuvable)", async () => {
      // Act & Assert
      await expect(
        createDevis({
          clientId: 99999, // Non-existent client
          lignes: [
            {
              materiauId: 0,
              materiauNom: 'Test',
              unite: 'unité',
              quantite: '1',
              prixUnitaire: '1000',
              tvaTaux: 0.1925,
            },
          ],
          dateValidite: '2026-11-28',
          statut: 'brouillon',
        })
      ).rejects.toThrow('Client introuvable');
    });

    it('créer un devis sans lignes est rejeté par la validation', async () => {
      const clientId = await createClient({
        nom: 'Client',
        telephone: '+237 6 00 00 00 00',
        regimeTva: 'normal',
      });

      // Service now validates empty lignes and throws
      await expect(
        createDevis({
          clientId,
          lignes: [], // Empty lignes - should be rejected
          dateValidite: '2026-11-28',
          statut: 'brouillon',
        })
      ).rejects.toThrow('Un devis doit contenir au moins une ligne');
    });

    it('mettre à jour un devis sans lignes est rejeté par la validation', async () => {
      const clientId = await createClient({
        nom: 'Client Update',
        telephone: '+237 6 00 00 00 00',
        regimeTva: 'normal',
      });

      // Create a valid devis first
      const devisId = await createDevis({
        clientId,
        lignes: [
          {
            materiauId: 0,
            materiauNom: 'Produit',
            unite: 'unité',
            quantite: '1',
            prixUnitaire: '1000',
            tvaTaux: 0.1925,
          },
        ],
        dateValidite: '2026-11-28',
        statut: 'brouillon',
      });

      // Try to update with empty lignes - should be rejected
      await expect(
        updateDevis(devisId, {
          clientId,
          lignes: [], // Empty lignes - should be rejected
          dateValidite: '2026-11-28',
          statut: 'brouillon',
        })
      ).rejects.toThrow('Un devis doit contenir au moins une ligne');
    });
  });

  describe('2. Numérotation', () => {
    it('utilise le préfixe configuré et une séquence persistante', async () => {
      // Clean to ensure fresh start
      await cleanDatabase();

      const clientId = await createClient({
        nom: 'Client Num',
        telephone: '+237 6 00 00 00 00',
        regimeTva: 'normal',
      });

      // getNextDevisNumber increments counter, so first call returns 001
      const numero1 = await getNextDevisNumber();
      expect(numero1).toMatch(/^DEV-\d{4}-001$/);

      // createDevis calls getNextDevisNumber internally, so it gets 002
      await createDevis({
        clientId,
        lignes: [
          {
            materiauId: 0,
            materiauNom: 'A',
            unite: 'unité',
            quantite: '1',
            prixUnitaire: '1000',
            tvaTaux: 0.1925,
          },
        ],
        dateValidite: '2026-11-28',
        statut: 'brouillon',
      });

      // Next getNextDevisNumber returns 003 (after 001 from first call, 002 from createDevis)
      const numero2 = await getNextDevisNumber();
      expect(numero2).toMatch(/^DEV-\d{4}-003$/);
    });

    it('deux devis créés séquentiellement ne peuvent pas recevoir le même numéro', async () => {
      await cleanDatabase();

      const clientId = await createClient({
        nom: 'Client Unique',
        telephone: '+237 6 00 00 00 00',
        regimeTva: 'normal',
      });

      // Create multiple devis sequentially (normal usage)
      await createDevis({
        clientId,
        lignes: [
          {
            materiauId: 0,
            materiauNom: 'A',
            unite: 'unité',
            quantite: '1',
            prixUnitaire: '1000',
            tvaTaux: 0.1925,
          },
        ],
        dateValidite: '2026-11-28',
        statut: 'brouillon',
      });
      await createDevis({
        clientId,
        lignes: [
          {
            materiauId: 0,
            materiauNom: 'B',
            unite: 'unité',
            quantite: '1',
            prixUnitaire: '1000',
            tvaTaux: 0.1925,
          },
        ],
        dateValidite: '2026-11-28',
        statut: 'brouillon',
      });
      await createDevis({
        clientId,
        lignes: [
          {
            materiauId: 0,
            materiauNom: 'C',
            unite: 'unité',
            quantite: '1',
            prixUnitaire: '1000',
            tvaTaux: 0.1925,
          },
        ],
        dateValidite: '2026-11-28',
        statut: 'brouillon',
      });

      const devisList = await getAllDevis();
      const numeros = devisList.map((d) => d.numero).sort();

      // All numbers should be unique
      const uniqueNumeros = [...new Set(numeros)];
      expect(uniqueNumeros.length).toBe(numeros.length);
      expect(numeros.length).toBe(3);
    });

    it("garantit l'unicité des numéros même en création concurrente (compteur atomique)", async () => {
      await cleanDatabase();

      const clientId = await createClient({
        nom: 'Client Race',
        telephone: '+237 6 00 00 00 00',
        regimeTva: 'normal',
      });

      // Create multiple devis in parallel - atomic counter ensures uniqueness
      const ids = await Promise.all([
        createDevis({
          clientId,
          lignes: [
            {
              materiauId: 0,
              materiauNom: 'A',
              unite: 'unité',
              quantite: '1',
              prixUnitaire: '1000',
              tvaTaux: 0.1925,
            },
          ],
          dateValidite: '2026-11-28',
          statut: 'brouillon',
        }),
        createDevis({
          clientId,
          lignes: [
            {
              materiauId: 0,
              materiauNom: 'B',
              unite: 'unité',
              quantite: '1',
              prixUnitaire: '1000',
              tvaTaux: 0.1925,
            },
          ],
          dateValidite: '2026-11-28',
          statut: 'brouillon',
        }),
        createDevis({
          clientId,
          lignes: [
            {
              materiauId: 0,
              materiauNom: 'C',
              unite: 'unité',
              quantite: '1',
              prixUnitaire: '1000',
              tvaTaux: 0.1925,
            },
          ],
          dateValidite: '2026-11-28',
          statut: 'brouillon',
        }),
      ]);

      const devisList = await getAllDevis();
      const numeros = devisList.map((d) => d.numero).sort();

      // Atomic counter: all parallel creates get unique numbers
      const uniqueNumeros = [...new Set(numeros)];
      expect(uniqueNumeros.length).toBe(numeros.length);
      expect(numeros.length).toBe(3);

      // Verify sequences are consecutive: 001, 002, 003
      expect(numeros[0]).toMatch(/^DEV-\d{4}-001$/);
      expect(numeros[1]).toMatch(/^DEV-\d{4}-002$/);
      expect(numeros[2]).toMatch(/^DEV-\d{4}-003$/);
    });

    it("la suppression d'un devis ne réutilise pas son numéro", async () => {
      await cleanDatabase();

      const clientId = await createClient({
        nom: 'Client Delete',
        telephone: '+237 6 00 00 00 00',
        regimeTva: 'normal',
      });

      const devisId1 = await createDevis({
        clientId,
        lignes: [
          {
            materiauId: 0,
            materiauNom: 'A',
            unite: 'unité',
            quantite: '1',
            prixUnitaire: '1000',
            tvaTaux: 0.1925,
          },
        ],
        dateValidite: '2026-11-28',
        statut: 'brouillon',
      });

      const devisId2 = await createDevis({
        clientId,
        lignes: [
          {
            materiauId: 0,
            materiauNom: 'B',
            unite: 'unité',
            quantite: '1',
            prixUnitaire: '1000',
            tvaTaux: 0.1925,
          },
        ],
        dateValidite: '2026-11-28',
        statut: 'brouillon',
      });

      const devis1 = await getDevisById(devisId1);
      const devis2 = await getDevisById(devisId2);
      const numero1 = devis1?.numero;
      const numero2 = devis2?.numero;

      // Delete the first devis
      await deleteDevis(devisId1);

      // Create a new devis - should get next sequence, not reuse deleted number
      const devisId3 = await createDevis({
        clientId,
        lignes: [
          {
            materiauId: 0,
            materiauNom: 'C',
            unite: 'unité',
            quantite: '1',
            prixUnitaire: '1000',
            tvaTaux: 0.1925,
          },
        ],
        dateValidite: '2026-11-28',
        statut: 'brouillon',
      });

      const devis3 = await getDevisById(devisId3);

      // The new devis should have a higher sequence number
      expect(devis3?.numero).not.toBe(numero1);
      expect(devis3?.numero).not.toBe(numero2);

      // Extract sequence numbers
      const seq1 = parseInt(numero1?.split('-')[2] || '0', 10);
      const seq2 = parseInt(numero2?.split('-')[2] || '0', 10);
      const seq3 = parseInt(devis3?.numero.split('-')[2] || '0', 10);

      expect(seq3).toBeGreaterThan(seq2);
      expect(seq3).toBeGreaterThan(seq1);
    });

    it('le compteur persiste après fermeture et réouverture', async () => {
      await cleanDatabase();

      const clientId = await createClient({
        nom: 'Client Counter',
        telephone: '+237 6 00 00 00 00',
        regimeTva: 'normal',
      });

      // Create 2 devis - each createDevis calls getNextDevisNumber internally
      await createDevis({
        clientId,
        lignes: [
          {
            materiauId: 0,
            materiauNom: 'A',
            unite: 'unité',
            quantite: '1',
            prixUnitaire: '1000',
            tvaTaux: 0.1925,
          },
        ],
        dateValidite: '2026-11-28',
        statut: 'brouillon',
      });
      await createDevis({
        clientId,
        lignes: [
          {
            materiauId: 0,
            materiauNom: 'B',
            unite: 'unité',
            quantite: '1',
            prixUnitaire: '1000',
            tvaTaux: 0.1925,
          },
        ],
        dateValidite: '2026-11-28',
        statut: 'brouillon',
      });

      // Get next number before close (this increments counter to 3)
      const nextNumberBeforeClose = await getNextDevisNumber();

      // Close and reopen
      await db.close();
      await db.open();

      // Get next number after reopen (this increments counter to 4)
      const nextNumberAfterReopen = await getNextDevisNumber();

      // Counter state persisted - after reopen we get 004 (continuing from 003)
      expect(nextNumberAfterReopen).toMatch(/^DEV-\d{4}-004$/);
      // The difference should be 1 (each call increments)
      const seqBefore = parseInt(nextNumberBeforeClose.split('-')[2], 10);
      const seqAfter = parseInt(nextNumberAfterReopen.split('-')[2], 10);
      expect(seqAfter).toBe(seqBefore + 1);
    });

    it('le compteur atomique isole par préfixe et année', async () => {
      await cleanDatabase();

      const clientId = await createClient({
        nom: 'Client Prefix',
        telephone: '+237 6 00 00 00 00',
        regimeTva: 'normal',
      });

      // Create devis with default prefix (DEV) - gets 001
      await createDevis({
        clientId,
        lignes: [
          {
            materiauId: 0,
            materiauNom: 'A',
            unite: 'unité',
            quantite: '1',
            prixUnitaire: '1000',
            tvaTaux: 0.1925,
          },
        ],
        dateValidite: '2026-11-28',
        statut: 'brouillon',
      });

      // Change prefix via mock
      vi.mocked(useAppStore.getState).mockReturnValue({
        settings: {
          entrepriseNom: 'MetalPro SARL',
          numeroDevisPrefix: 'FAC',
          tvaDefaultRate: 0.1925,
        },
      });

      // Create devis with new prefix (FAC) - should start at 001
      // getNextDevisNumber for FAC returns 001
      const numeroFAC = await getNextDevisNumber();
      expect(numeroFAC).toMatch(/^FAC-\d{4}-001$/);

      // createDevis with FAC calls getNextDevisNumber internally - gets 002
      await createDevis({
        clientId,
        lignes: [
          {
            materiauId: 0,
            materiauNom: 'B',
            unite: 'unité',
            quantite: '1',
            prixUnitaire: '1000',
            tvaTaux: 0.1925,
          },
        ],
        dateValidite: '2026-11-28',
        statut: 'brouillon',
      });

      // Next FAC getNextDevisNumber returns 003 (after 001 from first call, 002 from createDevis)
      const numeroFAC2 = await getNextDevisNumber();
      expect(numeroFAC2).toMatch(/^FAC-\d{4}-003$/);

      // Switch back to DEV - should continue from where DEV left off (001 used, so next is 002)
      vi.mocked(useAppStore.getState).mockReturnValue({
        settings: {
          entrepriseNom: 'MetalPro SARL',
          numeroDevisPrefix: 'DEV',
          tvaDefaultRate: 0.1925,
        },
      });

      const numeroDEV = await getNextDevisNumber();
      expect(numeroDEV).toMatch(/^DEV-\d{4}-002$/);
    });

    it("peekNextDevisNumber n'incrémente pas le compteur", async () => {
      await cleanDatabase();

      const clientId = await createClient({
        nom: 'Client Peek',
        telephone: '+237 6 00 00 00 00',
        regimeTva: 'normal',
      });

      // Initial peek - should show 001
      const peek1 = await peekNextDevisNumber();
      expect(peek1).toMatch(/^DEV-\d{4}-001$/);

      // Multiple peeks should return same number
      const peek2 = await peekNextDevisNumber();
      expect(peek2).toBe(peek1);

      const peek3 = await peekNextDevisNumber();
      expect(peek3).toBe(peek1);

      // Now create a devis - should get 001 (since peek didn't increment)
      await createDevis({
        clientId,
        lignes: [
          {
            materiauId: 0,
            materiauNom: 'A',
            unite: 'unité',
            quantite: '1',
            prixUnitaire: '1000',
            tvaTaux: 0.1925,
          },
        ],
        dateValidite: '2026-11-28',
        statut: 'brouillon',
      });

      // Next peek should show 002 (after createDevis consumed 001)
      const peekAfterCreate = await peekNextDevisNumber();
      expect(peekAfterCreate).toMatch(/^DEV-\d{4}-002$/);
    });
  });

  describe("3. Conservation de l'historique", () => {
    it('chaque devis conserve les désignations, unités, prix et taux TVA utilisés à la création', async () => {
      await cleanDatabase();

      const clientId = await createClient({
        nom: 'Client Historique',
        telephone: '+237 6 00 00 00 00',
        regimeTva: 'normal',
      });

      const devisId = await createDevis({
        clientId,
        lignes: [
          {
            materiauId: 1,
            materiauNom: 'Tube acier Ø48',
            unite: 'm',
            quantite: '15',
            prixUnitaire: '25000',
            tvaTaux: 0.1925,
          },
        ],
        dateValidite: '2026-11-28',
        statut: 'brouillon',
      });

      const devis = await getDevisById(devisId);

      // Verify all fields are denormalized and stored
      expect(devis?.lignes[0].materiauNom).toBe('Tube acier Ø48');
      expect(devis?.lignes[0].unite).toBe('m');
      expect(devis?.lignes[0].quantite).toBe('15');
      expect(devis?.lignes[0].prixUnitaire).toBe('25000');
      expect(devis?.lignes[0].tvaTaux).toBe(0.1925);
      expect(devis?.lignes[0].montantHT).toBeDefined();
      expect(devis?.lignes[0].montantTTC).toBeDefined();
    });

    it("la modification d'un matériau dans le catalogue ne modifie pas les anciens devis", async () => {
      await cleanDatabase();

      const clientId = await createClient({
        nom: 'Client Isolation',
        telephone: '+237 6 00 00 00 00',
        regimeTva: 'normal',
      });

      // Create a material
      const materiauId = await createMateriau({
        nom: 'Tube acier',
        unite: 'm',
        prixUnitaire: '25000',
        tvaTaux: 0.1925,
      });

      // Create devis using that material
      const devisId = await createDevis({
        clientId,
        lignes: [
          {
            materiauId,
            materiauNom: 'Tube acier',
            unite: 'm',
            quantite: '10',
            prixUnitaire: '25000',
            tvaTaux: 0.1925,
          },
        ],
        dateValidite: '2026-11-28',
        statut: 'brouillon',
      });

      // Modify the material in catalog (price change)
      await db.materiaux.update(materiauId, {
        prixUnitaire: '30000', // Price increased
        nom: 'Tube acier galvanisé', // Name changed
        updatedAt: new Date().toISOString(),
      });

      // Retrieve the devis - should still have original values
      const devis = await getDevisById(devisId);

      expect(devis?.lignes[0].materiauNom).toBe('Tube acier'); // Original name preserved
      expect(devis?.lignes[0].prixUnitaire).toBe('25000'); // Original price preserved
      expect(devis?.lignes[0].unite).toBe('m'); // Original unit preserved
      expect(devis?.lignes[0].tvaTaux).toBe(0.1925); // Original TVA preserved
    });

    it("la modification d'un devis enregistre correctement ses lignes, totaux et détails TVA", async () => {
      await cleanDatabase();

      const clientId = await createClient({
        nom: 'Client Edit',
        telephone: '+237 6 00 00 00 00',
        regimeTva: 'normal',
      });

      const materiauId = await createMateriau({
        nom: 'Produit A',
        unite: 'unité',
        prixUnitaire: '10000',
        tvaTaux: 0.1925,
      });

      // Create initial devis
      const devisId = await createDevis({
        clientId,
        lignes: [
          {
            materiauId,
            materiauNom: 'Produit A',
            unite: 'unité',
            quantite: '5',
            prixUnitaire: '10000',
            tvaTaux: 0.1925,
          },
        ],
        dateValidite: '2026-11-28',
        statut: 'brouillon',
      });

      // Update the devis - change quantity, add a line
      await updateDevis(devisId, {
        clientId,
        lignes: [
          {
            materiauId,
            materiauNom: 'Produit A',
            unite: 'unité',
            quantite: '10', // Changed from 5 to 10
            prixUnitaire: '10000',
            tvaTaux: 0.1925,
          },
          {
            materiauId: 0,
            materiauNom: 'Produit B',
            unite: 'kg',
            quantite: '20',
            prixUnitaire: '5000',
            tvaTaux: 0,
          },
        ],
        dateValidite: '2026-12-15',
        notes: 'Modified',
        statut: 'envoye',
      });

      // Retrieve and verify
      const devis = await getDevisById(devisId);

      expect(devis?.lignes).toHaveLength(2);
      expect(devis?.lignes[0].quantite).toBe('10');
      expect(devis?.lignes[1].materiauNom).toBe('Produit B');
      expect(devis?.lignes[1].tvaTaux).toBe(0);
      expect(devis?.statut).toBe('envoye');
      expect(devis?.dateValidite).toBe('2026-12-15');
      expect(devis?.notes).toBe('Modified');

      // Verify totals recalculated
      expect(devis?.totaux.totalHT).toBeDefined();
      expect(devis?.totaux.totalTTC).toBeDefined();
      expect(devis?.tvaDetails).toHaveLength(2); // Two different TVA rates
      const tva19 = devis?.tvaDetails.find((d) => d.taux === 0.1925);
      const tva0 = devis?.tvaDetails.find((d) => d.taux === 0);
      expect(tva19).toBeDefined();
      expect(tva0).toBeDefined();
    });

    it('conserve les totaux et détails TVA cohérents après modification', async () => {
      await cleanDatabase();

      const clientId = await createClient({
        nom: 'Client Totaux',
        telephone: '+237 6 00 00 00 00',
        regimeTva: 'normal',
      });

      const devisId = await createDevis({
        clientId,
        lignes: [
          {
            materiauId: 0,
            materiauNom: 'A',
            unite: 'unité',
            quantite: '2',
            prixUnitaire: '10000',
            tvaTaux: 0.1925,
          },
        ],
        dateValidite: '2026-11-28',
        statut: 'brouillon',
      });

      let devis = await getDevisById(devisId);
      const totalHTBefore = devis?.totaux.totalHT;
      const totalTTCBefore = devis?.totaux.totalTTC;

      // Update with different lines
      await updateDevis(devisId, {
        clientId,
        lignes: [
          {
            materiauId: 0,
            materiauNom: 'A',
            unite: 'unité',
            quantite: '3',
            prixUnitaire: '10000',
            tvaTaux: 0.1925,
          },
          {
            materiauId: 0,
            materiauNom: 'B',
            unite: 'unité',
            quantite: '1',
            prixUnitaire: '5000',
            tvaTaux: 0,
          },
        ],
        dateValidite: '2026-11-28',
        statut: 'brouillon',
      });

      devis = await getDevisById(devisId);

      // Totals should be recalculated
      expect(devis?.totaux.totalHT).not.toBe(totalHTBefore);
      expect(devis?.totaux.totalTTC).not.toBe(totalTTCBefore);

      // Verify calculation: (3*10000) + (1*5000) = 35000 HT
      // TVA: (3*10000*0.1925) + (1*5000*0) = 5775
      // TTC: 35000 + 5775 = 40775
      expect(parseFloat(devis?.totaux.totalHT || '0')).toBe(35000);
      expect(parseFloat(devis?.totaux.totalTva || '0')).toBe(5775);
      expect(parseFloat(devis?.totaux.totalTTC || '0')).toBe(40775);
    });
  });
});
