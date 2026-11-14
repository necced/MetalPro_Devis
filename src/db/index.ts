import Dexie, { Table } from 'dexie';

import type { Client, Materiau, Devis, SyncEvent, BackupRecord, DevisCounter } from '../types';

/**
 * MetalPro Devis Database Schema v3
 * Per Cahier des Charges Technique MVP v2.0
 *
 * Stores:
 * - clients: Client records with TVA regime info
 * - materiaux: Material catalog with pricing
 * - devis: Quotes with line items and TVA breakdown
 * - _syncQueue: Offline-first sync queue for background sync
 * - _backup: Encrypted backup records for export/import
 * - _devisCounter: Atomic counter for devis numbering (prefix + year -> lastSeq)
 * - _pdfCache: Cached PDF blobs for instant PDF generation
 */
export class MetalProDatabase extends Dexie {
  clients!: Table<Client>;
  materiaux!: Table<Materiau>;
  devis!: Table<Devis>;
  _syncQueue!: Table<SyncEvent>;
  _backup!: Table<BackupRecord>;
  _devisCounter!: Table<DevisCounter>;
  _pdfCache!: Table<PdfCacheEntry>;

  constructor() {
    super('MetalProDevisDB');

    this.version(1).stores({
      // Client store with indexes for search and TVA regime filtering
      clients: '++id, nom, telephone, email, nif, rc, regimeTva, createdAt, updatedAt',

      // Materiaux store with indexes for catalog browsing
      materiaux: '++id, nom, unite, prixUnitaire, tvaTaux, createdAt, updatedAt',

      // Devis store with indexes for listing and filtering
      devis: '++id, clientId, statut, numero, dateCreation, dateValidite, createdAt, updatedAt',

      // Sync queue for offline-first operations
      _syncQueue: '++id, entityType, entityId, operation, timestamp, retryCount, status',

      // Backup records for export/import functionality
      _backup: '++id, filename, checksum, size, createdAt',
    });

    // Version 2: Add atomic counter store for devis numbering
    this.version(2)
      .stores({
        // Counter store for atomic devis numbering: prefix + year as compound key
        _devisCounter: '++id, [prefix+year], prefix, year, lastSeq',
      })
      .upgrade(async (tx) => {
        // Migration: Initialize counter from existing devis to avoid number conflicts
        // Scan existing devis for each prefix/year combination and set lastSeq to max found
        const devisList = await tx.table('devis').toArray();
        const prefixYearMax = new Map<string, number>();

        for (const devis of devisList) {
          const match = devis.numero?.match(/^([A-Z]+)-(\d{4})-(\d{3})$/);
          if (match) {
            const [, prefix, yearStr, seqStr] = match;
            const year = parseInt(yearStr, 10);
            const seq = parseInt(seqStr, 10);
            const key = `${prefix}:${year}`;
            const currentMax = prefixYearMax.get(key) || 0;
            if (seq > currentMax) {
              prefixYearMax.set(key, seq);
            }
          }
        }

        // Populate _devisCounter with max sequences found
        for (const [key, maxSeq] of prefixYearMax) {
          const [prefix, yearStr] = key.split(':');
          const year = parseInt(yearStr, 10);
          await tx.table('_devisCounter').add({ prefix, year, lastSeq: maxSeq });
        }
      });

    // Version 3: Add PDF cache store for instant PDF generation
    this.version(3).stores({
      // PDF cache: devisId as primary key, blob stored directly
      _pdfCache: '++id, devisId, blob, createdAt',
    });

    // Hooks for automatic timestamps
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Dexie hook signature requires all params
    this.clients.hook('creating', (_primaryKey, object, _transaction) => {
      const now = new Date().toISOString();
      object.createdAt = now;
      object.updatedAt = now;
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Dexie hook signature requires all params
    this.clients.hook('updating', (modifications, _primaryKey, _object, _transaction) => {
      modifications.updatedAt = new Date().toISOString();
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Dexie hook signature requires all params
    this.materiaux.hook('creating', (_primaryKey, object, _transaction) => {
      const now = new Date().toISOString();
      object.createdAt = now;
      object.updatedAt = now;
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Dexie hook signature requires all params
    this.materiaux.hook('updating', (modifications, _primaryKey, _object, _transaction) => {
      modifications.updatedAt = new Date().toISOString();
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Dexie hook signature requires all params
    this.devis.hook('creating', (_primaryKey, object, _transaction) => {
      const now = new Date().toISOString();
      object.createdAt = now;
      object.updatedAt = now;
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Dexie hook signature requires all params
    this.devis.hook('updating', (modifications, _primaryKey, _object, _transaction) => {
      modifications.updatedAt = new Date().toISOString();
    });
  }
}

// Singleton instance
export const db = new MetalProDatabase();

// Database initialization helper
export async function initializeDatabase(): Promise<void> {
  try {
    await db.open();
    console.log('[DB] MetalProDevisDB opened successfully');
  } catch (error) {
    console.error('[DB] Failed to open database:', error);
    throw error;
  }
}

// Export types for convenience
export {
  type Client,
  type Materiau,
  type Devis,
  type SyncEvent,
  type BackupRecord,
} from '../types';
