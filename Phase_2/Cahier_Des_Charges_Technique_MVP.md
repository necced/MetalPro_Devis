# Cahier des Charges Technique — MetalPro Devis MVP

**Date :** 2026-10-27  
**Projet :** MetalPro Devis — Application de devis pour menuisiers métalliques (Yaoundé, Cameroun)  
**Version :** 1.0  
**Statut :** En cours de développement

---

## 1. Contexte et Objectifs

### 1.1 Objectifs du MVP

- **Fonctionnel :** Créer, consulter et partager des devis hors ligne sur smartphone
- **Technique :** Architecture simplifiée validée par l'arbitrage (React+Vite+PWA+IndexedDB)
- **Qualité :** Tests automatisés des calculs, sauvegarde, PDF et offline
- **Budget :** 0 FCFA — pas de dépendances payantes ni abonnements

### 1.2 Contraintes Non Négociables

| Contrainte            | Détail                                                                      |
| --------------------- | --------------------------------------------------------------------------- |
| **Budget**            | 0 FCFA — pas d'achat ni abonnement sans accord explicite                    |
| **Hors ligne**        | Fonctionnement 100% offline obligatoire (chantiers, connectivité instable)  |
| **Données sensibles** | Clients, prix, marges — stockage local exclusif, pas de cloud sans accord   |
| **Mobile-first**      | Usage principal smartphone Android (Chrome/Edge) sur chantier               |
| **PDF**               | Génération devis PDF professionnelle côté client                            |
| **Évolutivité sync**  | Architecture doit préparer synchronisation future (multi-appareils, équipe) |
| **Logiciels libres**  | Priorité MIT/Apache/BSD — pas de vendor lock-in                             |

---

## 2. Architecture Technique

### 2.1 Stack Technique Verrouillée

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
    "knip": "knip"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "dexie": "^4.0.0",
    "@react-pdf/renderer": "^3.4.0",
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
    "tailwind-merge": "^2.2.0"
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
    "knip": "^5.8.0"
  }
}
```

### 2.2 Schéma Base de Données (Dexie v1)

```typescript
// src/db/schema.ts
export interface Client {
  id: string; // nanoid(10)
  nom: string;
  telephone: string;
  email?: string;
  adresse: string;
  createdAt: number; // Date.now()
  updatedAt: number;
}

export interface Materiau {
  id: string;
  nom: string;
  unite: 'm' | 'm2' | 'kg' | 'pcs';
  prixUnitaire: number; // Decimal.js pour précision
  fournisseur?: string;
  createdAt: number;
}

export interface LigneDevis {
  materiauId: string;
  quantite: number;
  prixUnitaire: number; // Copie au moment du devis (historique prix)
  description?: string;
}

export interface Devis {
  id: string;
  clientId: string;
  lignes: LigneDevis[];
  totalHT: number;
  tva: number;
  totalTTC: number;
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse';
  createdAt: number;
  updatedAt: number;
}

// Table de sync (préparation future)
export interface SyncEvent {
  id: string;
  entity: 'client' | 'materiau' | 'devis';
  action: 'create' | 'update' | 'delete';
  payload: any;
  timestamp: number;
  deviceId: string;
}
```

### 2.3 Configuration Clé

#### `vite.config.ts` (corrigé pour ESM)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

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

#### `tailwind.config.js`

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
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
```

---

## 3. Fonctionnalités du MVP

### 3.1 Gestion des Clients

| Fonctionnalité   | Critères d'Acceptation                                    |
| ---------------- | --------------------------------------------------------- |
| Créer client     | Formulaire validé (Zod), ID auto-généré, sauvegarde Dexie |
| Lister clients   | Recherche par nom/téléphone, pagination, filtres          |
| Modifier client  | Validation des changements, historique des modifications  |
| Supprimer client | Confirmation, vérification devis associés                 |

### 3.2 Gestion des Matériaux

| Fonctionnalité     | Critères d'Acceptation                                |
| ------------------ | ----------------------------------------------------- |
| Ajouter matériau   | Formulaire avec unités (m/m²/kg/pcs), prix Decimal.js |
| Lister matériaux   | Groupement par catégorie, recherche, tri par prix     |
| Modifier prix      | Historique des changements de prix                    |
| Supprimer matériau | Vérification devis associés                           |

### 3.3 Création de Devis

| Fonctionnalité      | Critères d'Acceptation                                      |
| ------------------- | ----------------------------------------------------------- |
| Sélectionner client | Liste déroulante Radix, recherche rapide                    |
| Ajouter ligne       | Sélection matériau, saisie quantité, calcul auto prix       |
| Calculs             | Total HT, TVA, TTC calculés en temps réel (Decimal.js)      |
| Sauvegarder devis   | Statut "brouillon", historique des versions                 |
| Générer PDF         | PDF conforme au template, téléchargement, partage Web Share |

### 3.4 Consultation de Devis

| Fonctionnalité  | Critères d'Acceptation                                  |
| --------------- | ------------------------------------------------------- |
| Lister devis    | Filtres (statut, date, client), tri, pagination         |
| Voir détails    | Affichage complet avec calculs vérifiés                 |
| Dupliquer devis | Copie exacte avec nouveau ID, statut "brouillon"        |
| Changer statut  | Transition valide (brouillon → envoyé → accepté/refusé) |

### 3.5 Sauvegarde et Restauration

| Fonctionnalité   | Critères d'Acceptation                                          |
| ---------------- | --------------------------------------------------------------- |
| Exporter données | Fichier JSON complet, validation schéma                         |
| Importer données | Validation avant import, rapport des conflits, confirmation     |
| Backup auto      | Sauvegarde locale toutes les 5 minutes, alerte si quota atteint |

### 3.6 Fonctionnement Hors Ligne

| Fonctionnalité       | Critères d'Acceptation                                  |
| -------------------- | ------------------------------------------------------- |
| Créer devis offline  | Sauvegarde Dexie, pas de requêtes réseau                |
| Lister devis offline | Affichage complet, même sans connexion                  |
| PDF offline          | Génération PDF locale, partage Web Share offline        |
| Sync manuelle        | Export → Import sur autre appareil, résolution conflits |

---

## 4. Règles Métier Clés

### 4.1 Calculs de Devis

1. **Prix unitaires** : Copiés au moment de la création du devis (historique prix)
2. **Quantités** : Calculées en Decimal.js pour éviter erreurs flottantes
3. **Totaux** : Calculés en temps réel avec arrondi FCFA (pas de centimes)
4. **Formules** : Validées par des métalliers avant implémentation
5. **Marges** : Calculées comme (Prix Vente - Coût Total) / Prix Vente

### 4.2 Conservation des Données

1. **Clients** : Conservés même si devis associés supprimés
2. **Matériaux** : Archivés si plus utilisés dans aucun devis
3. **Devis** : Conserve une copie des prix et quantités utilisés
4. **Historique** : Conserve les versions précédentes des devis modifiés

### 4.3 Export/Import

1. **Format** : JSON structuré avec schéma de validation
2. **Validation** : Vérification avant import, rapport des conflits
3. **Sécurité** : Pas de données sensibles dans les exports
4. **Compatibilité** : Import compatible avec les versions futures

---

## 5. Critères d'Acceptation du Prototype

### 5.1 Tests de Calculs

| Test            | Critère de Succès                                          |
| --------------- | ---------------------------------------------------------- |
| Calculs totaux  | Totaux HT, TVA, TTC corrects pour 10 cas aléatoires        |
| Historique prix | Devis conserve prix d'origine après modification catalogue |
| Marges          | Calculs de marge cohérents avec les règles métier          |
| Arrondi FCFA    | Pas de centimes dans les totaux affichés                   |

### 5.2 Tests de Sauvegarde

| Test           | Critère de Succès                                               |
| -------------- | --------------------------------------------------------------- |
| Export complet | Fichier JSON valide, contient tous les clients/matériaux/devis  |
| Import complet | Données restaurées identiques à l'export initial                |
| Backup auto    | Sauvegarde locale toutes les 5 minutes, alerte si quota atteint |

### 5.3 Tests de PDF

| Test     | Critère de Succès                               |
| -------- | ----------------------------------------------- |
| Template | PDF conforme au template, pagination correcte   |
| Contenu  | Tous les éléments du devis présents et corrects |
| Partage  | PDF partageable via Web Share, même offline     |

### 5.4 Tests Hors Ligne

| Test                 | Critère de Succès                             |
| -------------------- | --------------------------------------------- |
| Création offline     | Devis créé et sauvegardé sans connexion       |
| Consultation offline | Devis consultable sans connexion              |
| PDF offline          | PDF généré et partageable sans connexion      |
| Sync manuelle        | Export → Import fonctionne sur autre appareil |

---

## 6. Livrables Attendus

| Livrable                | Date       | Responsable         |
| ----------------------- | ---------- | ------------------- |
| Prototype fonctionnel   | 2026-11-10 | Équipe Dev          |
| Rapport de tests        | 2026-11-15 | QA                  |
| Documentation technique | 2026-11-20 | Tech Lead           |
| Validation métier       | 2026-11-25 | Métalliers testeurs |

---

## 7. Annexes

### 7.1 Exemple de Devis PDF

```markdown
# DEVIS METALPRO N° DEV-20261027-001

**Client :** M. KAMGA Jean
**Téléphone :** +237 699 123 456
**Adresse :** Rue 12, Yaoundé
**Date :** 27 octobre 2026

| Désignation       | Quantité | Prix Unitaire (FCFA) | Montant (FCFA) |
| ----------------- | -------- | -------------------- | -------------- |
| Porte métallique  | 1        | 500,000.00           | 500,000.00     |
| Fenêtre aluminium | 2        | 250,000.00           | 500,000.00     |
| Main-d'œuvre      | 1        | 100,000.00           | 100,000.00     |
| **Total HT**      |          |                      | 1,100,000.00   |
| **TVA (19.25%)**  |          |                      | 211,750.00     |
| **Total TTC**     |          |                      | 1,311,750.00   |

**Conditions :** Paiement à réception, validité 30 jours

**Signature :**

[Espace signature client]

**Contact :** MetalPro Services, +237 677 789 012
```

### 7.2 Schéma de Données Exportées

```json
{
  "version": "1.0",
  "timestamp": 1730000000000,
  "clients": [
    {
      "id": "CLT-20261027-001",
      "nom": "KAMGA Jean",
      "telephone": "+237 699 123 456",
      "adresse": "Rue 12, Yaoundé",
      "createdAt": 1730000000000,
      "updatedAt": 1730000000000
    }
  ],
  "materiaux": [
    {
      "id": "MAT-20261027-001",
      "nom": "Porte métallique",
      "unite": "pcs",
      "prixUnitaire": 500000,
      "createdAt": 1730000000000
    }
  ],
  "devis": [
    {
      "id": "DEV-20261027-001",
      "clientId": "CLT-20261027-001",
      "lignes": [
        {
          "materiauId": "MAT-20261027-001",
          "quantite": 1,
          "prixUnitaire": 500000,
          "description": "Porte métallique standard"
        }
      ],
      "totalHT": 500000,
      "tva": 96250,
      "totalTTC": 596250,
      "statut": "brouillon",
      "createdAt": 1730000000000,
      "updatedAt": 1730000000000
    }
  ]
}
```

---

**Fin du cahier des charges technique.**  
Ce document est **prêt pour le développement Phase 2** — les corrections d'architecture identifiées dans l'arbitrage sont intégrées, et les critères d'acceptation du prototype sont définis pour valider les risques les plus critiques.
