/**
 * MetalPro Devis Type Definitions
 * Per Cahier des Charges Technique MVP v2.0
 *
 * All monetary values use Decimal.js for precision (no floating-point).
 * Dates stored as ISO 8601 strings in IndexedDB.
 */

/** TVA Regimes per Cameroon tax law */
export type TvaRegime = 'normal' | 'simplifie' | 'exonere';

/** TVA Rate (standard 19.25% for Cameroon) */
export const TVA_STANDARD_RATE = 0.1925;

/** Devis Status */
export type DevisStatut = 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire';

/** Sync Operation Types */
export type SyncOperation = 'create' | 'update' | 'delete';

/** Sync Entity Types */
export type SyncEntityType = 'client' | 'materiau' | 'devis';

/** Sync Status */
export type SyncStatus = 'pending' | 'synced' | 'failed' | 'conflict';

/** Client Entity */
export interface Client {
  id?: number;
  nom: string;
  telephone: string;
  email?: string;
  adresse?: string;
  nif?: string; // Numéro d'Identification Fiscale
  rc?: string; // Registre de Commerce
  regimeTva: TvaRegime;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/** Materiau (Material) Entity */
export interface Materiau {
  id?: number;
  nom: string;
  unite: string; // e.g., 'm', 'm2', 'kg', 'unité'
  prixUnitaire: string; // Decimal string for precision
  tvaTaux: number; // e.g., 0.1925 for 19.25%
  description?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/** Devis Line Item */
export interface DevisLigne {
  materiauId: number;
  materiauNom: string; // Denormalized for display
  unite: string;
  quantite: string; // Decimal string
  prixUnitaire: string; // Decimal string
  tvaTaux: number;
  montantHT: string; // Decimal string (quantite * prixUnitaire)
  montantTTC: string; // Decimal string (montantHT * (1 + tvaTaux))
}

/** TVA Breakdown Detail */
export interface TvaDetail {
  taux: number;
  baseHT: string; // Decimal string
  montantTva: string; // Decimal string
}

/** Devis Totals */
export interface DevisTotaux {
  totalHT: string; // Decimal string
  totalTva: string; // Decimal string
  totalTTC: string; // Decimal string
}

/** TVA Mode for Devis */
export type TvaMode = 'avec' | 'sans';

/** Devis Entity */
export interface Devis {
  id?: number;
  clientId: number;
  clientNom: string; // Denormalized for display
  lignes: DevisLigne[];
  totaux: DevisTotaux;
  tvaDetails: TvaDetail[];
  tvaMode: TvaMode; // 'avec' = with VAT, 'sans' = without VAT
  statut: DevisStatut;
  numero: string; // e.g., "DEV-2024-001"
  dateCreation: string; // ISO 8601
  dateValidite: string; // ISO 8601
  notes?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/** Sync Queue Event */
export interface SyncEvent {
  id?: number;
  entityType: SyncEntityType;
  entityId: number;
  operation: SyncOperation;
  payload: string; // JSON string of entity data
  timestamp: string; // ISO 8601
  retryCount: number;
  status: SyncStatus;
}

/** Backup Record */
export interface BackupRecord {
  id?: number;
  filename: string;
  data: string; // JSON string of full database export
  checksum: string; // SHA-256 hex
  size: number; // bytes
  createdAt: string; // ISO 8601
}

/** Devis Counter for Atomic Numbering */
export interface DevisCounter {
  id?: number;
  prefix: string; // e.g., 'DEV'
  year: number; // e.g., 2024
  lastSeq: number; // Last sequence number used
}

/** PDF Cache Entry */
export interface PdfCacheEntry {
  id?: number;
  devisId: number;
  blob: Blob;
  createdAt: string; // ISO 8601
}

/** App Settings (stored in localStorage or IndexedDB) */
export interface AppSettings {
  entrepriseNom: string;
  entrepriseAdresse: string;
  entrepriseTelephone: string;
  entrepriseEmail: string;
  entrepriseNif: string;
  entrepriseRc: string;
  devise: 'FCFA';
  numeroDevisPrefix: string; // e.g., 'DEV'
  tvaDefaultRate: number; // 0.1925
  tvaDefaultMode: TvaMode; // 'avec' | 'sans'
  theme: 'light' | 'dark' | 'system';
}
