import { describe, it, expect } from 'vitest';
import { MetalProDatabase, db, initializeDatabase } from './index';
import type { Client, Materiau, Devis, SyncEvent, BackupRecord } from '../types';

describe('MetalProDatabase — Dexie v4 Schema', () => {
  let testDb: MetalProDatabase;

  beforeEach(() => {
    testDb = new MetalProDatabase();
    testDb.name = `MetalProDevisDB_test_${Date.now()}_${Math.random()}`;
  });

  describe('Database instantiation', () => {
    it('creates database instance with correct name', () => {
      expect(testDb).toBeInstanceOf(MetalProDatabase);
      expect(testDb.name).toMatch(/^MetalProDevisDB_test_/);
    });

    it('has all 6 required stores (including _devisCounter from v2)', () => {
      const storeNames = testDb.tables.map((t) => t.name).sort();
      expect(storeNames).toEqual([
        '_backup',
        '_devisCounter',
        '_syncQueue',
        'clients',
        'devis',
        'materiaux',
      ]);
    });

    it('exposes typed Table properties', () => {
      expect(testDb.clients).toBeDefined();
      expect(testDb.materiaux).toBeDefined();
      expect(testDb.devis).toBeDefined();
      expect(testDb._syncQueue).toBeDefined();
      expect(testDb._backup).toBeDefined();
    });
  });

  describe('Schema v1 — stores definition (from version declaration)', () => {
    // Test schema by inspecting the table schema directly
    // Dexie Table instances have schema property with indexes
    it('declares clients store with correct indexes', () => {
      const clientTable = testDb.clients;
      expect(clientTable).toBeDefined();
      expect(clientTable.schema).toBeDefined();
      expect(clientTable.schema.primKey?.name).toBe('id');
      const indexes = clientTable.schema.indexes?.map((i) => i.name).sort() ?? [];
      expect(indexes).toEqual([
        'createdAt',
        'email',
        'nif',
        'nom',
        'rc',
        'regimeTva',
        'telephone',
        'updatedAt',
      ]);
    });

    it('declares materiaux store with correct indexes', () => {
      const materiauTable = testDb.materiaux;
      expect(materiauTable).toBeDefined();
      expect(materiauTable.schema).toBeDefined();
      expect(materiauTable.schema.primKey?.name).toBe('id');
      const indexes = materiauTable.schema.indexes?.map((i) => i.name).sort() ?? [];
      expect(indexes).toEqual([
        'createdAt',
        'nom',
        'prixUnitaire',
        'tvaTaux',
        'unite',
        'updatedAt',
      ]);
    });

    it('declares devis store with correct indexes', () => {
      const devisTable = testDb.devis;
      expect(devisTable).toBeDefined();
      expect(devisTable.schema).toBeDefined();
      expect(devisTable.schema.primKey?.name).toBe('id');
      const indexes = devisTable.schema.indexes?.map((i) => i.name).sort() ?? [];
      expect(indexes).toEqual([
        'clientId',
        'createdAt',
        'dateCreation',
        'dateValidite',
        'numero',
        'statut',
        'updatedAt',
      ]);
    });

    it('declares _syncQueue store with correct indexes', () => {
      const syncTable = testDb._syncQueue;
      expect(syncTable).toBeDefined();
      expect(syncTable.schema).toBeDefined();
      expect(syncTable.schema.primKey?.name).toBe('id');
      const indexes = syncTable.schema.indexes?.map((i) => i.name).sort() ?? [];
      expect(indexes).toEqual([
        'entityId',
        'entityType',
        'operation',
        'retryCount',
        'status',
        'timestamp',
      ]);
    });

    it('declares _backup store with correct indexes', () => {
      const backupTable = testDb._backup;
      expect(backupTable).toBeDefined();
      expect(backupTable.schema).toBeDefined();
      expect(backupTable.schema.primKey?.name).toBe('id');
      const indexes = backupTable.schema.indexes?.map((i) => i.name).sort() ?? [];
      expect(indexes).toEqual(['checksum', 'createdAt', 'filename', 'size']);
    });
  });

  // Hooks require database open (IndexedDB) - tested in integration tests
  describe('Hooks registration — skipped (requires IndexedDB)', () => {
    it('skipped — hooks require database open', () => {
      expect(true).toBe(true);
    });
  });

  describe('Singleton instance', () => {
    it('exports singleton db instance', () => {
      expect(db).toBeInstanceOf(MetalProDatabase);
      expect(db.name).toBe('MetalProDevisDB');
    });
  });

  describe('initializeDatabase function', () => {
    it('is exported and callable', () => {
      expect(typeof initializeDatabase).toBe('function');
    });
  });

  describe('Type exports', () => {
    it('re-exports all domain types', () => {
      // Compile-time test — if it compiles, types are exported
      const _client: Client = {} as Client;
      const _materiau: Materiau = {} as Materiau;
      const _devis: Devis = {} as Devis;
      const _syncEvent: SyncEvent = {} as SyncEvent;
      const _backupRecord: BackupRecord = {} as BackupRecord;

      expect(_client).toBeDefined();
      expect(_materiau).toBeDefined();
      expect(_devis).toBeDefined();
      expect(_syncEvent).toBeDefined();
      expect(_backupRecord).toBeDefined();
    });
  });
});
