import { describe, it, expect } from 'vitest';
import type {
  TvaRegime,
  DevisStatut,
  SyncOperation,
  SyncEntityType,
  SyncStatus,
  Client,
  Materiau,
  DevisLigne,
  TvaDetail,
  DevisTotaux,
  Devis,
  SyncEvent,
  BackupRecord,
  AppSettings,
} from './index';
import { TVA_STANDARD_RATE } from './index';

describe('Type Definitions — MetalPro Devis Domain', () => {
  describe('Constants', () => {
    it('TVA_STANDARD_RATE equals 19.25%', () => {
      expect(TVA_STANDARD_RATE).toBe(0.1925);
    });
  });

  describe('Type aliases — compile-time validation', () => {
    it('TvaRegime accepts valid regimes', () => {
      const normal: TvaRegime = 'normal';
      const simplifie: TvaRegime = 'simplifie';
      const exonere: TvaRegime = 'exonere';
      expect(normal).toBe('normal');
      expect(simplifie).toBe('simplifie');
      expect(exonere).toBe('exonere');
    });

    it('DevisStatut accepts valid statuses', () => {
      const statuts: DevisStatut[] = ['brouillon', 'envoye', 'accepte', 'refuse', 'expire'];
      expect(statuts).toHaveLength(5);
    });

    it('SyncOperation accepts valid operations', () => {
      const ops: SyncOperation[] = ['create', 'update', 'delete'];
      expect(ops).toHaveLength(3);
    });

    it('SyncEntityType accepts valid entity types', () => {
      const entities: SyncEntityType[] = ['client', 'materiau', 'devis'];
      expect(entities).toHaveLength(3);
    });

    it('SyncStatus accepts valid statuses', () => {
      const statuses: SyncStatus[] = ['pending', 'synced', 'failed', 'conflict'];
      expect(statuses).toHaveLength(4);
    });
  });

  describe('Client interface', () => {
    it('allows valid client with all fields', () => {
      const client: Client = {
        id: 1,
        nom: 'Entreprise Test',
        telephone: '+237 6 12 34 56 78',
        email: 'contact@test.cm',
        adresse: 'Douala, Bonapriso',
        nif: 'P123456789',
        rc: 'RC/DLA/2024/B/1234',
        regimeTva: 'normal',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      };
      expect(client.nom).toBe('Entreprise Test');
      expect(client.regimeTva).toBe('normal');
    });

    it('allows client with minimal required fields', () => {
      const client: Client = {
        nom: 'Client Minimal',
        telephone: '+237 6 00 00 00 00',
        regimeTva: 'exonere',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(client.nom).toBe('Client Minimal');
      expect(client.regimeTva).toBe('exonere');
      expect(client.id).toBeUndefined();
      expect(client.email).toBeUndefined();
      expect(client.nif).toBeUndefined();
      expect(client.rc).toBeUndefined();
    });
  });

  describe('Materiau interface', () => {
    it('allows valid materiau with all fields', () => {
      const materiau: Materiau = {
        id: 1,
        nom: 'Tube acier galvanisé',
        unite: 'm',
        prixUnitaire: '25000',
        tvaTaux: 0.1925,
        description: 'Tube 2 pouces, ép. 3mm',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      };
      expect(materiau.prixUnitaire).toBe('25000');
      expect(materiau.tvaTaux).toBe(0.1925);
    });

    it('allows materiau with minimal fields', () => {
      const materiau: Materiau = {
        nom: 'Plaque tôle',
        unite: 'm2',
        prixUnitaire: '15000',
        tvaTaux: 0.1925,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(materiau.unite).toBe('m2');
    });
  });

  describe('DevisLigne interface', () => {
    it('represents a quote line with denormalized data', () => {
      const ligne: DevisLigne = {
        materiauId: 1,
        materiauNom: 'Tube acier galvanisé',
        unite: 'm',
        quantite: '10',
        prixUnitaire: '25000',
        tvaTaux: 0.1925,
        montantHT: '250000',
        montantTTC: '298125',
      };
      expect(ligne.materiauId).toBe(1);
      expect(ligne.montantHT).toBe('250000');
      expect(ligne.montantTTC).toBe('298125');
    });
  });

  describe('TvaDetail interface', () => {
    it('breaks down TVA by rate', () => {
      const detail: TvaDetail = {
        taux: 0.1925,
        baseHT: '250000',
        montantTva: '48125',
      };
      expect(detail.taux).toBe(0.1925);
      expect(detail.baseHT).toBe('250000');
    });
  });

  describe('DevisTotaux interface', () => {
    it('aggregates quote totals', () => {
      const totaux: DevisTotaux = {
        totalHT: '250000',
        totalTva: '48125',
        totalTTC: '298125',
      };
      expect(totaux.totalHT).toBe('250000');
      expect(totaux.totalTTC).toBe('298125');
    });
  });

  describe('Devis interface', () => {
    it('allows valid devis with all fields', () => {
      const devis: Devis = {
        id: 1,
        clientId: 1,
        clientNom: 'Entreprise Test',
        lignes: [
          {
            materiauId: 1,
            materiauNom: 'Tube acier',
            unite: 'm',
            quantite: '10',
            prixUnitaire: '25000',
            tvaTaux: 0.1925,
            montantHT: '250000',
            montantTTC: '298125',
          },
        ],
        totaux: { totalHT: '250000', totalTva: '48125', totalTTC: '298125' },
        tvaDetails: [{ taux: 0.1925, baseHT: '250000', montantTva: '48125' }],
        statut: 'brouillon',
        numero: 'DEV-2024-001',
        dateCreation: '2024-01-15T10:30:00.000Z',
        dateValidite: '2024-02-14T10:30:00.000Z',
        notes: 'Conditions habituelles',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      };
      expect(devis.numero).toBe('DEV-2024-001');
      expect(devis.statut).toBe('brouillon');
      expect(devis.lignes).toHaveLength(1);
    });

    it('allows devis with minimal fields', () => {
      const devis: Devis = {
        clientId: 1,
        clientNom: 'Client',
        lignes: [],
        totaux: { totalHT: '0', totalTva: '0', totalTTC: '0' },
        tvaDetails: [],
        statut: 'brouillon',
        numero: 'DEV-2024-002',
        dateCreation: new Date().toISOString(),
        dateValidite: new Date(Date.now() + 30 * 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(devis.statut).toBe('brouillon');
      expect(devis.lignes).toHaveLength(0);
    });
  });

  describe('SyncEvent interface', () => {
    it('represents offline-first sync queue entry', () => {
      const event: SyncEvent = {
        id: 1,
        entityType: 'devis',
        entityId: 5,
        operation: 'create',
        payload: JSON.stringify({ numero: 'DEV-2024-001', totalTTC: '298125' }),
        timestamp: '2024-01-15T10:30:00.000Z',
        retryCount: 0,
        status: 'pending',
      };
      expect(event.entityType).toBe('devis');
      expect(event.operation).toBe('create');
      expect(event.status).toBe('pending');
      expect(event.retryCount).toBe(0);
    });
  });

  describe('BackupRecord interface', () => {
    it('stores encrypted backup metadata', () => {
      const backup: BackupRecord = {
        id: 1,
        filename: 'backup-2024-01-15.json.enc',
        data: 'encrypted-json-payload',
        checksum: 'a1b2c3d4e5f6...', // SHA-256 hex
        size: 102400,
        createdAt: '2024-01-15T10:30:00.000Z',
      };
      expect(backup.filename).toContain('.enc');
      expect(backup.checksum).toBeDefined();
      expect(backup.size).toBeGreaterThan(0);
    });
  });

  describe('AppSettings interface', () => {
    it('stores enterprise configuration', () => {
      const settings: AppSettings = {
        entrepriseNom: 'MetalPro SARL',
        entrepriseAdresse: 'Douala, Bonapriso',
        entrepriseTelephone: '+237 6 12 34 56 78',
        entrepriseEmail: 'contact@metalpro.cm',
        entrepriseNif: 'P987654321',
        entrepriseRc: 'RC/DLA/2023/B/5678',
        devise: 'FCFA',
        numeroDevisPrefix: 'DEV',
        tvaDefaultRate: 0.1925,
        theme: 'system',
      };
      expect(settings.devise).toBe('FCFA');
      expect(settings.tvaDefaultRate).toBe(0.1925);
      expect(settings.theme).toBe('system');
    });
  });
});
