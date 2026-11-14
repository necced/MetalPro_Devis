import { z } from 'zod';
import { TVA_STANDARD_RATE } from '../types';

/**
 * Shared Zod validation schemas for all entities
 * Used by react-hook-form + @hookform/resolvers/zod
 */

// ============================================================================
// Client Validation
// ============================================================================

export const clientSchema = z.object({
  nom: z.string().min(1, 'Nom du client requis').max(200),
  telephone: z.string().min(1, 'Téléphone requis').max(50),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  adresse: z.string().max(500).optional(),
  nif: z.string().max(50).optional(),
  rc: z.string().max(100).optional(),
  regimeTva: z.enum(['normal', 'simplifie', 'exonere']),
});

export type ClientForm = z.infer<typeof clientSchema>;

// ============================================================================
// Materiau Validation
// ============================================================================

export const materiauSchema = z.object({
  nom: z.string().min(1, 'Nom du matériau requis').max(200),
  unite: z.string().min(1, 'Unité requise').max(20),
  prixUnitaire: z
    .string()
    .min(1, 'Prix unitaire requis')
    .regex(/^\d+(\.\d+)?$/, 'Format de prix invalide'),
  tvaTaux: z.number().min(0).max(1).default(TVA_STANDARD_RATE),
  description: z.string().max(1000).optional(),
});

export type MateriauForm = z.infer<typeof materiauSchema>;

// ============================================================================
// Devis Line Validation
// ============================================================================

export const devisLigneSchema = z.object({
  materiauId: z.number().optional(),
  materiauNom: z.string().min(1, 'Nom du matériau requis').max(200),
  unite: z.string().min(1, 'Unité requise').max(20),
  quantite: z
    .string()
    .min(1, 'Quantité requise')
    .regex(/^\d+(\.\d+)?$/, 'Format de quantité invalide'),
  prixUnitaire: z
    .string()
    .min(1, 'Prix unitaire requis')
    .regex(/^\d+(\.\d+)?$/, 'Format de prix invalide'),
  tvaTaux: z.number().min(0).max(1).default(TVA_STANDARD_RATE),
});

export type DevisLigneForm = z.infer<typeof devisLigneSchema>;

// ============================================================================
// Devis Validation
// ============================================================================

export const devisSchema = z.object({
  clientId: z.number().nullable(),
  clientNom: z.string().min(1, 'Client requis').max(200),
  lignes: z.array(devisLigneSchema).min(1, 'Au moins une ligne requise'),
  dateValidite: z
    .string()
    .min(1, 'Date de validité requise')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
  notes: z.string().max(2000).optional(),
  statut: z.enum(['brouillon', 'envoye']).optional().default('brouillon'),
  tvaMode: z.enum(['avec', 'sans']).optional().default('avec'),
});

export type DevisForm = z.infer<typeof devisSchema>;

// ============================================================================
// Settings Validation (re-exported from Settings page for consistency)
// ============================================================================

export const settingsSchema = z.object({
  entrepriseNom: z.string().min(1, 'Nom requis').max(200),
  entrepriseAdresse: z.string().max(500).optional(),
  entrepriseTelephone: z.string().max(50).optional(),
  entrepriseEmail: z.string().email('Email invalide').optional().or(z.literal('')),
  entrepriseNif: z.string().max(50).optional(),
  entrepriseRc: z.string().max(100).optional(),
  numeroDevisPrefix: z
    .string()
    .min(1, 'Préfixe requis')
    .max(10)
    .regex(/^[A-Z0-9]+$/, 'Majuscules et chiffres uniquement'),
  tvaDefaultRate: z.number().min(0).max(1),
  theme: z.enum(['light', 'dark', 'system']),
});

export type SettingsForm = z.infer<typeof settingsSchema>;
