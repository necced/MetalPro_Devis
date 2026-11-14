# Cahier des Charges Technique — MetalPro Devis MVP (v2.0, Corrigé & Verrouillé)

**Date :** 2026-10-28  
**Projet :** MetalPro Devis — Application de devis pour menuisiers métalliques (Yaoundé, Cameroun)  
**Version :** 2.0 (corrigée post-audit)  
**Statut :** **Verrouillé pour développement** — Toutes anomalies BLOQUANTES/MAJEURES corrigées  
**Baseline :** `Cahier_Des_Charges_Technique_MVP.md` v1.0 + `Rapport_Audit_Anomalies.md` (41 anomalies, 10 bloquantes corrigées)

---

## 1. Contexte et Objectifs

### 1.1 Objectifs du MVP

- **Fonctionnel :** Créer, consulter et partager des devis hors ligne sur smartphone
- **Technique :** Architecture React+Vite+PWA+IndexedDB validée, anomalies corrigées
- **Qualité :** Tests automatisés des calculs, sauvegarde, PDF et offline
- **Budget :** 0 FCFA — pas de dépendances payantes ni abonnements
- **Conformité :** Devis légalement valides au Cameroun (mentions obligatoires, TVA)

### 1.2 Contraintes Non Négociables

| Contrainte              | Détail                                                                     |
| ----------------------- | -------------------------------------------------------------------------- |
| **Budget**              | 0 FCFA — pas d'achat ni abonnement sans accord explicite                   |
| **Hors ligne**          | Fonctionnement 100% offline obligatoire (chantiers, connectivité instable) |
| **Données sensibles**   | Clients, prix, marges — stockage local exclusif, pas de cloud sans accord  |
| **Mobile-first**        | Usage principal smartphone Android (Chrome/Edge) sur chantier              |
| **PDF**                 | Génération devis PDF professionnelle côté client, polices embarquées       |
| **Évolutivité sync**    | Architecture prépare synchronisation future (multi-appareils, équipe)      |
| **Logiciels libres**    | Priorité MIT/Apache/BSD — pas de vendor lock-in                            |
| **Conformité Cameroun** | Mentions légales obligatoires (NIF, RC, régime TVA) sur PDF                |

---

## 2. Architecture Technique

### 2.1 Stack Technique Verrouillée (package.json v2)

```json
{
  "name": "metalpro-devis-mvp",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "knip": "knip",
    "deploy": "gh-pages -d dist"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "dexie": "^4.0.0",
    "@react-pdf/renderer": "^3.4.0",
    "zustand": "^4.5.0",
    "react-hook-form": "^7.50.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "date-fns": "^3.3.0",
    "nanoid": "^5.0.0",
    "decimal.js": "^10.4.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-slot": "^1.0.2",
    "lucide-react": "^0.344.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "@fontsource/inter": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/decimal.js": "^7.4.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.1.0",
    "vite-plugin-pwa": "^0.19.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.0",
    "prettier": "^3.2.0",
    "prettier-plugin-tailwindcss": "^0.5.0",
    "vitest": "^1.3.0",
    "@vitest/ui": "^1.3.0",
    "@playwright/test": "^1.42.0",
    "knip": "^5.8.0",
    "gh-pages": "^6.1.0"
  }
}
```

> **Note v2** : Aligné sur `Recommandation_Architecture.md` — ajout `zustand`, `@radix-ui/react-label`, `@radix-ui/react-slot`, `clsx`, `tailwind-merge`, `lucide-react`, `@fontsource/inter`, `gh-pages`, `@playwright/test`. TanStack Query retiré (YAGNI, DEC-003).

---

### 2.2 Schéma Base de Données (Dexie v1, Corrigé)

```typescript
// src/db/schema.ts
export interface Client {
  id: string; // nanoid(10)
  nom: string;
  telephone: string;
  email?: string; // Validé Zod email()
  adresse: string;
  nif?: string; // NOUVEAU: Numéro identification fiscale
  rc?: string; // NOUVEAU: Registre commerce
  tvaRegime: 'normal' | 'simplifie' | 'exonere'; // NOUVEAU: Défaut 'normal'
  createdAt: number; // Date.now()
  updatedAt: number;
  schemaVersion: number; // NOUVEAU: Défaut 1 (migrations)
}

export interface Materiau {
  id: string;
  nom: string;
  unite: UniteType; // 'm' | 'm2' | 'kg' | 'pcs'
  prixUnitaire: string; // CORRIGÉ: Stocké en STRING (représentation exacte)
  prixAchat?: string; // NOUVEAU: Optionnel, pour calcul marge (DEC-002)
  fournisseur?: string;
  createdAt: number;
  schemaVersion: number; // NOUVEAU: Défaut 1
}

export type UniteType = 'm' | 'm2' | 'kg' | 'pcs';
export const UNITES: readonly UniteType[] = ['m', 'm2', 'kg', 'pcs'] as const;

export interface LigneDevis {
  materiauId: string;
  quantite: number; // Validé Zod: positive(), finite()
  prixUnitaire: string; // Copie au moment du devis (historique prix) — STRING
  tvaRate?: number; // NOUVEAU: Optionnel, défaut = taux global devis
  description?: string;
}

export interface Devis {
  id: string;
  clientId: string;
  lignes: LigneDevis[];
  // SUPPRIMÉ: totalHT, tva, totalTTC (ANOM-A-001) — Calculés à la volée
  tvaRateApplied: number; // NOUVEAU: Taux TVA appliqué à ce devis (historicalité)
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse';
  createdAt: number;
  updatedAt: number;
  schemaVersion: number; // NOUVEAU: Défaut 1
}

// Table de sync (préparation future)
export interface SyncEvent {
  id: string;
  entity: 'client' | 'materiau' | 'devis';
  action: 'create' | 'update' | 'delete';
  payload: any;
  timestamp: number;
  deviceId: string;
  vectorClock?: Record<string, number>; // Type seulement (DEC-004), implémentation Phase 4
}

// Table backup (ANOM-D-002 correction)
export interface BackupRecord {
  id: string; // nanoid()
  timestamp: number;
  data: {
    clients: Client[];
    materiaux: Materiau[];
    devis: Devis[];
  };
  version: string; // Format export version
  schemaVersion: number; // Schéma version at backup time
}
```

**Dexie Stores Configuration :**

```typescript
// src/db/index.ts
export class MetalProDB extends Dexie {
  clients!: Dexie.Table<Client, string>;
  materiaux!: Dexie.Table<Materiau, string>;
  devis!: Dexie.Table<Devis, string>;
  _syncQueue!: Dexie.Table<SyncEvent, string>; // CORRIGÉ: Ajouté (ANOM-A-002)
  _backup!: Dexie.Table<BackupRecord, string>; // NOUVEAU: Backup IndexedDB (ANOM-D-002)

  constructor() {
    super('MetalProDB');
    this.version(1).stores({
      clients: 'id, nom, telephone, createdAt, [nom+telephone]', // CORRIGÉ: Index composé
      materiaux: 'id, nom, unite, createdAt',
      devis: 'id, clientId, statut, createdAt, updatedAt, [clientId+statut]', // CORRIGÉ: Index composé
      _syncQueue: 'id, entity, action, timestamp, deviceId', // NOUVEAU
      _backup: 'id, timestamp', // NOUVEAU
    });

    // Hooks intégrité référentielle (ANOM-A-005)
    this.devis.hook('creating', async (primKey, obj, trans) => {
      for (const ligne of obj.lignes) {
        const materiau = await trans.table('materiaux').get(ligne.materiauId);
        if (!materiau) throw new Error(`Matériau ${ligne.materiauId} introuvable`);
      }
    });
  }
}
```

---

### 2.3 Configuration Clé

#### `vite.config.ts` (Corrigé ESM + PWA complet)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url)); // CORRIGÉ: Fix ESM (ANOM-G-002)

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'offline.html'],
      manifest: {
        name: 'MetalPro Devis',
        short_name: 'MetalPro',
        description: 'Devis menuisiers métalliques — Offline-first',
        theme_color: '#1e3a5f',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'icons/icon-72.png', sizes: '72x72', type: 'image/png' },
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
        cleanupOutdatedCaches: true,
        navigateFallback: '/offline.html',
        clientsClaim: true, // NOUVEAU: MAJ immédiate (ANOM-E-004)
        skipWaiting: true, // NOUVEAU: MAJ immédiate (ANOM-E-004)
      },
    }),
  ],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          pdf: ['@react-pdf/renderer'],
          db: ['dexie'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs'],
        },
      },
    },
  },
});
```

#### `tailwind.config.js` (Police Inter configurée)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a5f',
        },
        surface: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 800: '#1e293b', 900: '#0f172a' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }, // Inter via @fontsource/inter
    },
  },
  plugins: [],
};
```

#### `knip.config.js` (NOUVEAU: Config knip)

```javascript
export default {
  entry: ['index.html', 'src/main.tsx'],
  project: ['src/**/*.ts', 'src/**/*.tsx'],
  ignore: ['src/db/schema.ts', 'src/vite-env.d.ts'],
  eslint: true,
};
```

---

## 3. Fonctionnalités du MVP (Corrigées)

### 3.1 Gestion des Clients

| Fonctionnalité   | Critères d'Acceptation                                                                                                                                |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Créer client     | Formulaire validé (Zod: nom requis, telephone requis, email format, nif/rc optionnels), ID auto-généré, `tvaRegime` défaut 'normal', sauvegarde Dexie |
| Lister clients   | Recherche par nom/téléphone (index composé), pagination, filtres, tri                                                                                 |
| Modifier client  | Validation des changements, `updatedAt` mis à jour, historique modifications                                                                          |
| Supprimer client | Confirmation, vérification devis associés (bloquer si devis non archivés)                                                                             |

### 3.2 Gestion des Matériaux

| Fonctionnalité     | Critères d'Acceptation                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| Ajouter matériau   | Formulaire avec unités (m/m²/kg/pcs via `UNITES` const), prix unitaire string, `prixAchat` optionnel |
| Lister matériaux   | Groupement par catégorie, recherche, tri par prix                                                    |
| Modifier prix      | Historique des changements de prix (versioning futur), `prixUnitaire` string                         |
| Supprimer matériau | Vérification devis associés (bloquer si lignes devis existantes)                                     |

### 3.3 Création de Devis

| Fonctionnalité      | Critères d'Acceptation                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| Sélectionner client | Liste déroulante Radix Select, recherche rapide, affiche régime TVA client                                     |
| Ajouter ligne       | Sélection matériau, saisie quantité (validée >0), calcul auto prix (Decimal.js), `tvaRate` optionnel par ligne |
| Calculs temps réel  | Total HT, TVA, TTC calculés en temps réel via `useDevisCalculations()` (Decimal.js, arrondi commercial FCFA)   |
| Sauvegarder devis   | Statut "brouillon", `tvaRateApplied` stocké, `schemaVersion: 1`, lignes avec prix copiés                       |
| Générer PDF         | PDF conforme template v2, polices embarquées, pagination multi-pages, mentions légales Cameroun                |

### 3.4 Consultation de Devis

| Fonctionnalité  | Critères d'Acceptation                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------- |
| Lister devis    | Filtres (statut, date, client, régime TVA), tri, pagination, index composé `clientId+statut`    |
| Voir détails    | Affichage complet avec calculs dérivés (pas stockés), marge si `prixAchat` dispo                |
| Dupliquer devis | Copie exacte avec nouveau ID, nouveau `createdAt`, statut "brouillon", `tvaRateApplied` recopié |
| Changer statut  | Transition valide (brouillon → envoyé → accepté/refusé), `updatedAt` mis à jour                 |

### 3.5 Sauvegarde et Restauration (Corrigée)

| Fonctionnalité   | Critères d'Acceptation                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exporter données | Fichier JSON structuré v2 (`ExportFormat` ci-dessous), validation schéma Zod, option "Complet" vs "Partage client" (sans prix achat, sans téléphone) |
| Importer données | Pipeline : Parse → Validation racine → Validation entités Zod → Détection conflits (ID + updatedAt) → Rapport détaillé → Transaction atomique Dexie  |
| Backup auto      | Table `_backup` IndexedDB (pas localStorage) toutes les 5 min, rotation 3 derniers, TTL 30 jours, alerte quota 80%                                   |

**Format Export v2 :**

```json
{
  "version": "2.0",
  "schemaVersion": 1,
  "timestamp": 1730000000000,
  "clients": [...],
  "materiaux": [...],
  "devis": [...]
}
```

### 3.6 Fonctionnement Hors Ligne (Complété)

| Fonctionnalité             | Critères d'Acceptation                                                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Créer devis offline        | Sauvegarde Dexie, pas de requêtes réseau, ajout entrée `_syncQueue`                                                                      |
| Lister devis offline       | Affichage complet, même sans connexion                                                                                                   |
| PDF offline                | Génération PDF locale, partage Web Share Level 2 (fichier) + fallback téléchargement                                                     |
| Indicateurs online/offline | **NOUVEAU** : Composant `OnlineStatusIndicator` — icône WiFi barré header, toast déconnexion/reconnexion, badge compteur actions pending |
| Queue actions pending      | **NOUVEAU** : UI "Actions en attente" (badge sur icône sync), liste actions (pending/synced/failed), bouton "Réessayer"                  |
| Page offline.html          | **NOUVEAU** : Message clair, bouton "Réessayer" (reload), lien "Voir devis récents"                                                      |
| Sync manuelle              | Export → Import sur autre appareil, résolution conflits LWW + prompt utilisateur                                                         |

---

## 4. Règles Métier Clés (Corrigées & Complétées)

### 4.1 Calculs de Devis

1. **Prix unitaires** : Copiés au moment de la création du devis (historique prix) — stockés en `string`
2. **Quantités** : Validées positives finies, calculées en `Decimal.js` via wrapper `D()`
3. **Totaux** : **Non stockés** — dérivés à la lecture via `useDevisCalculations(devis)` :

   ```ts
   // shared/utils/decimal.ts (ANOM-B-001)
   import Decimal from 'decimal.js';
   Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });
   export const D = (v: number | string) => new Decimal(v);
   export const toFCFA = (d: Decimal) => d.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();

   // shared/hooks/useDevisCalculations.ts
   export function useDevisCalculations(devis: Devis, materiaux: Materiau[]) {
     const totalHT = devis.lignes.reduce(
       (sum, l) => sum.plus(D(l.prixUnitaire).times(l.quantite)),
       D(0)
     );
     const tva = totalHT.times(devis.tvaRateApplied);
     const totalTTC = totalHT.plus(tva);
     return { totalHT: toFCFA(totalHT), tva: toFCFA(tva), totalTTC: toFCFA(totalTTC) };
   }
   ```

4. **Arrondi FCFA** : **Arrondi commercial** (0.5 → supérieur) via `toFCFA()` unique. Pas de centimes.
5. **Marges** : `Marge = (Total HT - Coût Total Achats) / Total HT`. Si `prixAchat` manquant → `null`. Division par zéro → `null`.
6. **TVA par ligne** : `tvaRate` optionnel sur `LigneDevis` (défaut = `devis.tvaRateApplied`). Calcul TVA = Σ(ligne.prixUnitaire × ligne.quantite × ligne.tvaRate).

### 4.2 TVA Cameroun (Conforme)

| Régime    | Taux   | Mention PDF                         |
| --------- | ------ | ----------------------------------- |
| Normal    | 19.25% | "TVA 19.25%"                        |
| Simplifié | 19.25% | "TVA 19.25% (régime simplifié)"     |
| Exonéré   | 0%     | "TVA non applicable (art. CGI XXX)" |

- **Constante** : `TVA_RATE = 0.1925` dans `shared/constants/tva.ts` avec commentaire source (Loi de Finances 2019)
- **Historicalité** : `tvaRateApplied` stocké sur chaque `Devis`
- **Mentions légales PDF** : NIF émetteur, RC émetteur, NIF client, RC client, régime TVA client

### 4.3 Conservation des Données

1. **Clients** : Conservés même si devis associés supprimés (archive si inactif > 2 ans)
2. **Matériaux** : Archivés si plus utilisés dans aucun devis (soft delete)
3. **Devis** : Conserve copie des prix, quantités, taux TVA utilisés
4. **Historique** : Versions précédentes des devis modifiés (table `_versions` future)

### 4.4 Export/Import (Sécurisé)

1. **Format** : JSON structuré v2 avec `version`, `schemaVersion`, `timestamp`
2. **Validation** : Schémas Zod réutilisés (features/\*/schema.ts)
3. **Conflits** : Détection par `id` + comparaison `updatedAt` → stratégie LWW ou prompt utilisateur
4. **Sécurité** : Classification champs — `public` (nom, adresse), `commercial` (prix vente), `sensitive` (prix achat, téléphone, NIF). Option export "Partage client" exclut `sensitive`.
5. **Compatibilité** : `migrateExport(data, fromVersion, toVersion)` dans `lib/export/migrate.ts`

---

## 5. Critères d'Acceptation du Prototype (Mis à jour)

### 5.1 Tests de Calculs

| Test            | Critère de Succès                                                                         |
| --------------- | ----------------------------------------------------------------------------------------- |
| Calculs totaux  | Totaux HT, TVA, TTC corrects pour 10 cas (entiers, décimales, arrondis 0.5, gros volumes) |
| Arrondi FCFA    | `toFCFA(D(100.4))=100`, `toFCFA(D(100.5))=101`, `toFCFA(D(100.6))=101`                    |
| Historique prix | Devis conserve prix d'origine après modification catalogue matière                        |
| TVA par ligne   | Devis avec lignes multi-régimes TVA → calcul correct                                      |
| Marges          | Calcul cohérent si `prixAchat` présent, `null` sinon                                      |
| Division zéro   | Devis total HT = 0 → marge = null (pas de crash)                                          |

### 5.2 Tests de Sauvegarde

| Test             | Critère de Succès                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| Export complet   | Fichier JSON v2 valide, contient tous clients/matériaux/devis, option "Partage" exclut sensibles |
| Import complet   | Données restaurées identiques à l'export initial (vérification checksum)                         |
| Import conflits  | Conflits détectés (ID doublon + updatedAt), rapport généré, résolution LWW ou user choice        |
| Backup auto      | Table `_backup` IndexedDB toutes les 5 min, rotation 3, TTL 30j, alerte quota 80%                |
| Migration export | Import v1.0 dans app v2.0 → migration auto via `migrateExport`                                   |

### 5.3 Tests de PDF

| Test       | Critère de Succès                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------ |
| Template   | PDF conforme template v2, polices Inter embarquées, pagination correcte multi-pages              |
| Contenu    | Tous éléments devis présents : mentions légales (NIF, RC, régime TVA), totaux FCFA sans centimes |
| Partage    | Web Share Level 2 (fichier) + fallback téléchargement auto + "Ouvrir dans..."                    |
| Impression | `@media print` CSS fonctionnel, devis imprimable sans PDF                                        |

### 5.4 Tests Hors Ligne

| Test                 | Critère de Succès                                                              |
| -------------------- | ------------------------------------------------------------------------------ |
| Création offline     | Devis créé + sauvegardé + entrée `_syncQueue` sans connexion                   |
| Consultation offline | Devis consultable complet sans connexion                                       |
| PDF offline          | PDF généré + partageable (fichier) sans connexion                              |
| Indicateurs UX       | Badge offline visible, toast déconnexion/reconnexion, compteur actions pending |
| Page offline.html    | Accessible, message clair, bouton retry fonctionne                             |
| MAJ SW               | Notification "Nouvelle version" au focus, recharge auto                        |
| Sync manuelle        | Export v2 → Import v2 sur autre appareil → données identiques                  |

---

## 6. Livrables Attendus (Mis à jour)

| Livrable                                | Date           | Responsable               |
| --------------------------------------- | -------------- | ------------------------- |
| Prototype fonctionnel                   | 2026-11-10     | Équipe Dev                |
| Rapport de tests (couverture >80%)      | 2026-11-15     | QA                        |
| Documentation technique                 | 2026-11-20     | Tech Lead                 |
| Validation métier (métalliers testeurs) | 2026-11-25     | Métalliers                |
| **Go/No-Go production**                 | **2026-11-28** | **Promoteur + Tech Lead** |

---

## 7. Annexes

### 7.1 Exemple de Devis PDF v2 (Conforme Cameroun)

```markdown
# DEVIS METALPRO N° DEV-20261028-001

**Émetteur :** MetalPro Services SARL
**NIF :** P123456789 | **RC :** YAO/2024/B1234
**Adresse :** Quartier Bastos, Yaoundé
**Tél :** +237 677 789 012

**Client :** M. KAMGA Jean
**NIF :** P987654321 | **RC :** YAO/2023/A5678
**Téléphone :** +237 699 123 456
**Adresse :** Rue 12, Yaoundé
**Régime TVA :** Normal
**Date :** 28 octobre 2026

| Désignation       | Quantité | Prix Unitaire (FCFA) | Montant (FCFA) |
| ----------------- | -------- | -------------------- | -------------- |
| Porte métallique  | 1        | 500 000              | 500 000        |
| Fenêtre aluminium | 2        | 250 000              | 500 000        |
| Main-d'œuvre      | 1        | 100 000              | 100 000        |
| **Total HT**      |          |                      | **1 100 000**  |
| **TVA (19.25%)**  |          |                      | **211 750**    |
| **Total TTC**     |          |                      | **1 311 750**  |

**Conditions :** Paiement à réception, validité 30 jours
**TVA :** 19.25% (régime normal) — MetalPro Services membre CGA n° CGA/2024/045

**Signature :**

[Espace signature client]

**Contact :** MetalPro Services, +237 677 789 012
```

### 7.2 Schéma de Données Exportées v2

```json
{
  "version": "2.0",
  "schemaVersion": 1,
  "timestamp": 1730000000000,
  "clients": [
    {
      "id": "CLT-20261028-001",
      "nom": "KAMGA Jean",
      "telephone": "+237 699 123 456",
      "email": "jean.kamga@example.com",
      "adresse": "Rue 12, Yaoundé",
      "nif": "P987654321",
      "rc": "YAO/2023/A5678",
      "tvaRegime": "normal",
      "createdAt": 1730000000000,
      "updatedAt": 1730000000000,
      "schemaVersion": 1
    }
  ],
  "materiaux": [
    {
      "id": "MAT-20261028-001",
      "nom": "Porte métallique",
      "unite": "pcs",
      "prixUnitaire": "500000",
      "prixAchat": "350000",
      "fournisseur": "AcierCam SA",
      "createdAt": 1730000000000,
      "schemaVersion": 1
    }
  ],
  "devis": [
    {
      "id": "DEV-20261028-001",
      "clientId": "CLT-20261028-001",
      "lignes": [
        {
          "materiauId": "MAT-20261028-001",
          "quantite": 1,
          "prixUnitaire": "500000",
          "tvaRate": 0.1925,
          "description": "Porte métallique standard"
        }
      ],
      "tvaRateApplied": 0.1925,
      "statut": "brouillon",
      "createdAt": 1730000000000,
      "updatedAt": 1730000000000,
      "schemaVersion": 1
    }
  ]
}
```

### 7.3 Configuration Decimal.js (shared/utils/decimal.ts)

```typescript
import Decimal from 'decimal.js';

// Configuration globale — ANOM-B-001
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP, // Arrondi commercial
});

// Wrapper constructeur
export const D = (value: number | string | Decimal): Decimal =>
  value instanceof Decimal ? value : new Decimal(value);

// Arrondi FCFA — Arrondi commercial (0.5 → supérieur) — ANOM-B-002
export const toFCFA = (value: Decimal | number | string): number =>
  D(value).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();

// Formatage affichage FCFA — ANOM-F-004
export const formatFCFA = (value: Decimal | number | string): string =>
  new Intl.NumberFormat('fr-CM', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(toFCFA(value));
```

### 7.4 Constantes Partagées (shared/constants/)

```typescript
// shared/constants/tva.ts
export const TVA_RATE = 0.1925; // Loi de Finances Cameroun 2019
export const TVA_REGIMES = ['normal', 'simplifie', 'exonere'] as const;
export type TvaRegime = (typeof TVA_REGIMES)[number];

// shared/constants/unites.ts
export const UNITES = ['m', 'm2', 'kg', 'pcs'] as const;
export type UniteType = (typeof UNITES)[number];

// shared/constants/statuts.ts
export const STATUTS_DEVIS = ['brouillon', 'envoye', 'accepte', 'refuse'] as const;
export type StatutDevis = (typeof STATUTS_DEVIS)[number];
```

### 7.5 Export Format & Migration (lib/export/)

```typescript
// lib/export/types.ts
export interface ExportFormat {
  version: string; // "2.0"
  schemaVersion: number; // 1
  timestamp: number; // Date.now()
  clients: Client[];
  materiaux: Materiau[];
  devis: Devis[];
}

// lib/export/migrate.ts
export function migrateExport(data: any, fromVersion: string, toVersion: string): ExportFormat {
  if (fromVersion === toVersion) return data as ExportFormat;

  // v1.0 → v2.0
  if (fromVersion === '1.0' && toVersion === '2.0') {
    return {
      version: '2.0',
      schemaVersion: 1,
      timestamp: data.timestamp || Date.now(),
      clients: (data.clients || []).map((c: any) => ({
        ...c,
        nif: c.nif || undefined,
        rc: c.rc || undefined,
        tvaRegime: c.tvaRegime || 'normal',
        schemaVersion: 1,
      })),
      materiaux: (data.materiaux || []).map((m: any) => ({
        ...m,
        prixUnitaire: String(m.prixUnitaire), // number → string
        prixAchat: m.prixAchat ? String(m.prixAchat) : undefined,
        schemaVersion: 1,
      })),
      devis: (data.devis || []).map((d: any) => {
        const { totalHT, tva, totalTTC, ...rest } = d; // Supprime champs calculés stockés
        return {
          ...rest,
          tvaRateApplied: d.tvaRateApplied || TVA_RATE,
          lignes: (d.lignes || []).map((l: any) => ({
            ...l,
            prixUnitaire: String(l.prixUnitaire),
            tvaRate: l.tvaRate || TVA_RATE,
          })),
          schemaVersion: 1,
        };
      }),
    };
  }

  throw new Error(`Migration non supportée: ${fromVersion} → ${toVersion}`);
}
```

---

## 8. Décisions Verrouillées (Registre Décisions - Extrait)

| ID      | Décision                                                | Statut      | Promoteur | Échéance |
| ------- | ------------------------------------------------------- | ----------- | --------- | -------- |
| DEC-001 | Champ `tvaRegime` sur Client (normal/simplifie/exonere) | **Validée** | Promoteur | Immédiat |
| DEC-002 | Champ `prixAchat` optionnel sur Materiau                | **Validée** | Promoteur | Immédiat |
| DEC-003 | TanStack Query retiré du MVP (YAGNI)                    | **Validée** | Tech Lead | Immédiat |
| DEC-004 | Vector Clocks: type seulement, implémentation Phase 4   | **Validée** | Tech Lead | Phase 4  |
| DEC-005 | Police PDF: Inter (@fontsource/inter)                   | **Validée** | Tech Lead | Immédiat |
| DEC-006 | Backup: Table `_backup` IndexedDB (pas localStorage)    | **Validée** | Tech Lead | Immédiat |
| DEC-007 | Export versioning: `schemaVersion` par entité           | **Validée** | Tech Lead | Immédiat |

---

**Fin du cahier des charges technique v2.0.**  
Ce document est **verrouillé pour le développement** — toutes les anomalies BLOQUANTES (10) et MAJEURES (17) identifiées dans l'audit sont corrigées. Les 14 anomalies MINEURES peuvent être adressées en parallèle du développement. Les 7 décisions promoteur sont validées.

**Prochaine étape :** Démarrage Phase 1 — Fondations (Repo init + Vite + TypeScript + ESLint + Prettier + Tailwind + Radix + Dexie schema v1 + PWA config + CI GitHub Actions)
