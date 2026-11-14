# Recommandation d'Architecture Finale — MetalPro Devis

**Date :** 2026-10-27  
**Projet :** MetalPro Devis — Application de devis pour menuisiers métalliques (Yaoundé, Cameroun)  
**Statut :** **Validée** (soumise à contre-expertise DeepSeek — voir `Brief_Contre_Expertise_DeepSeek.md`)

---

## 1. Choix Recommandé

### **Option C : React 18 + Vite 5 + PWA (Workbox) + IndexedDB (Dexie.js) + Tailwind CSS 3.4 + Radix UI**

**Justification synthétique :**
| Critère Critique | Couverture |
|------------------|------------|
| Budget 0 FCFA | ✅ 100% MIT/Apache 2.0 |
| Hors ligne natif | ✅ Offline-first (IndexedDB + SW) |
| Stockage structuré | ✅ Dexie.js (requêtes indexées, migrations) |
| Préparation sync | ✅ Event queue + vector clocks optionnels |
| PDF professionnel | ✅ @react-pdf/renderer (natif React) |
| UX mobile | ✅ Tailwind + Radix (accessible, responsive) |
| Vendor lock-in | ✅ Nul (standards web + libs open source) |
| Environnement existant | ✅ Node 20, Chrome/Edge, Git prêts |

---

## 2. Architecture Détaillée

### 2.1 Arborescence Projet

```
metalpro-devis/
├── public/
│   ├── manifest.webmanifest          # Généré par vite-plugin-pwa
│   ├── sw.js                         # Service Worker (Workbox)
│   ├── offline.html                  # Fallback hors ligne
│   └── icons/                        # PWA icons (72, 96, 128, 144, 152, 192, 384, 512)
├── src/
│   ├── main.tsx                      # Entry point
│   ├── App.tsx                       # Root + Providers (Zustand, React Query, Theme)
│   ├── routes.tsx                    # React Router v6 (Lazy loading)
│   ├── index.css                     # Tailwind directives + CSS variables
│   ├── vite-env.d.ts                 # Types Vite
│   │
│   ├── db/
│   │   ├── schema.ts                 # Interfaces + MetalProDB class (Dexie)
│   │   ├── index.ts                  # Instance singleton + hooks sync
│   │   └── migrations/               # Migrations futures (v2, v3...)
│   │
│   ├── features/
│   │   ├── clients/
│   │   │   ├── components/           # ClientList, ClientForm, ClientCard
│   │   │   ├── hooks/                # useClients, useClientMutations
│   │   │   ├── schema.ts             # Zod schemas (validation)
│   │   │   └── index.ts
│   │   ├── materiaux/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── schema.ts
│   │   │   └── index.ts
│   │   ├── devis/
│   │   │   ├── components/           # DevisBuilder, DevisPreview, DevisPDF
│   │   │   ├── hooks/                # useDevis, useDevisCalculations
│   │   │   ├── schema.ts
│   │   │   ├── pdf/                  # DevisPDF.tsx (@react-pdf/renderer)
│   │   │   └── index.ts
│   │   └── settings/
│   │       ├── components/           # PrixMateriaux, TVA, Entreprise
│   │       └── hooks/
│   │
│   ├── shared/
│   │   ├── components/ui/            # Wrappers Radix (Button, Input, Dialog, Select, Toast, Tabs)
│   │   ├── hooks/                    # useLocalStorage, useMediaQuery, useDebounce
│   │   ├── utils/                    # formatFCFA, calculateTotals, generateId
│   │   ├── constants/                # TVA_RATE, UNITES, STATUTS_DEVIS
│   │   └── types/                    # Types partagés
│   │
│   ├── sync/
│   │   ├── queue.ts                  # Event queue (Dexie table _syncQueue)
│   │   ├── vectorClock.ts            # Logique vector clocks (optionnel v2)
│   │   └── strategies.ts             # LWW, CRDT (Yjs placeholder)
│   │
│   └── styles/
│       └── globals.css               # Styles globaux, print styles
│
├── tests/
│   ├── unit/                         # Vitest (utils, hooks, calculations)
│   ├── integration/                  # Dexie operations, PDF generation
│   └── e2e/                          # Playwright (flows critiques)
│
├── .github/workflows/
│   ├── ci.yml                        # Lint, TypeCheck, Test, Build
│   └── deploy.yml                    # GitHub Pages deploy
│
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── prettier.config.js
└── README.md
```

### 2.2 Flux de Données (Data Flow)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   UI React  │────▶│  Zustand     │────▶│  Dexie.js   │
│  (Components)│     │  (State)     │     │ (IndexedDB) │
└─────────────┘     └──────────────┘     └──────┬──────┘
       ▲                                        │
       │              ┌─────────────────────────┘
       │              ▼
       │       ┌──────────────┐
       │       │  Sync Queue  │◀── Dexie hooks (creating/updating/deleting)
       │       │ (_syncQueue) │
       │       └──────┬───────┘
       │              │ (Future: Background Sync API / Manual Export)
       ▼              ▼
┌─────────────┐ ┌──────────────┐
│  PDF Gen    │ │  Export/     │
│(@react-pdf) │ │  Import JSON │
└─────────────┘ └──────────────┘
```

### 2.3 Schéma Base de Données (Dexie v1)

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
  vectorClock?: Record<string, number>;
}
```

---

## 3. Phasage d'Implémentation

### Phase 1 — Fondations (Semaines 1-2) ✅ **DÉMARRABLE IMMÉDIATEMENT**

| Tâche                                             | Livrable                                             | Critère Done                              |
| ------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------- |
| Init repo + Vite + TypeScript + ESLint + Prettier | `npm create vite@latest` + config                    | `npm run lint` ✅, `npm run typecheck` ✅ |
| Tailwind + Radix UI setup                         | Composants UI de base (Button, Input, Dialog, Toast) | Storybook/Preview fonctionnel             |
| Dexie schema v1 + instance singleton              | `src/db/` complet                                    | CRUD clients/matériaux/testé              |
| PWA config (vite-plugin-pwa)                      | Manifest, SW, offline.html                           | `npm run build` → PWA installable         |
| CI GitHub Actions                                 | Lint, TypeCheck, Test, Build                         | Badge vert sur main                       |

**Estimation : 10-14 jours** — Parallélisable (DB + UI + PWA indépendants)

---

### Phase 2 — Domaine Métier Core (Semaines 3-5)

| Feature              | Composants Clés                                                           | Complexité |
| -------------------- | ------------------------------------------------------------------------- | ---------- |
| **Clients**          | Liste (virtualisée), Formulaire (Zod), Recherche, Suppression             | Moyenne    |
| **Matériaux**        | Liste groupée par catégorie, Prix editable, Historique prix               | Moyenne    |
| **Devis — Création** | Builder étapes (Client → Lignes → Récap), Calculs temps réel (decimal.js) | **Élevée** |
| **Devis — Liste**    | Filtres (statut, date, client), Actions (Dupliquer, PDF, Partager)        | Moyenne    |
| **Devis — PDF**      | Template @react-pdf/renderer, Aperçu, Téléchargement, Partage Web Share   | **Élevée** |

**Estimation : 15-21 jours** — Devis = cœur métier, priorité tests

---

### Phase 3 — Robustesse & UX (Semaines 6-7)

| Tâche              | Détail                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| **Tests**          | Vitest (unit: calculs, validation, utils) + Playwright (E2E: créer devis complet, export/import, offline) |
| **Accessibilité**  | Audit WCAG 2.2 AA (axe-core), navigation clavier, screen reader                                           |
| **Performance**    | Bundle analysis (knip, vite-bundle-analyzer), lazy loading routes, images WebP                            |
| **Offline UX**     | Indicateurs visuels (online/offline), queue actions pending, sync manuelle                                |
| **Backup/Restore** | Export JSON complet, Import avec validation, Backup auto localStorage (5min)                              |

**Estimation : 10-14 jours**

---

### Phase 4 — Préparation Sync v2 (Semaines 8-9, Optionnel)

| Tâche                   | Détail                                                   |
| ----------------------- | -------------------------------------------------------- |
| **Event Sourcing**      | Table `_syncQueue` peuplée par hooks Dexie               |
| **Vector Clocks**       | Implémentation basique (deviceId + counter par entité)   |
| **Conflict Resolution** | Stratégie LWW (Last-Write-Wins) + UI résolution manuelle |
| **Export Sync**         | Fichier `.metalpro-sync.json` (queue + vector clocks)    |
| **Import Sync**         | Merge intelligent + rapport conflits                     |

**Estimation : 10-14 jours** — À déclencher seulement si besoin réel multi-appareils

---

### Phase 5 — Sync Réelle (Futur, Post-MVP)

| Approche                  | Déclencheur                         | Coût                |
| ------------------------- | ----------------------------------- | ------------------- |
| **Background Sync API**   | Navigateurs supportés + besoin auto | 0 FCFA (natif)      |
| **Yjs + WebRTC**          | Travail collaboratif équipe         | Bundle + complexité |
| **Supabase Realtime**     | Budget serveur apparu               | Freemium → payant   |
| **Git-based (Automerge)** | Expérimental, peer-to-peer          | R&D                 |

---

## 4. Gestion des Risques & Mitigations

| Risque                                 | Probabilité | Impact                 | Mitigation                                                                                      |
| -------------------------------------- | ----------- | ---------------------- | ----------------------------------------------------------------------------------------------- |
| **Quota IndexedDB saturé**             | Moyenne     | Élevé (perte écriture) | Monitoring `navigator.storage.estimate()`, alerte 80%, nettoyage ancien devis archivés          |
| **Perte données utilisateur**          | Faible      | Critique               | Backup auto localStorage (5min), Export manuel prominent, Import validation                     |
| **SW cache corrompu**                  | Faible      | Élevé (app cassée)     | Versioning SW (`skipWaiting` + `clients.claim`), fallback `/offline.html`, bouton "Vider cache" |
| **Calculs flottants imprécis**         | Nulle       | Élevé                  | `decimal.js` obligatoire pour tous prix/quantités/totaux                                        |
| **PDF rendu différent mobile/desktop** | Moyenne     | Moyen                  | Tests visuels Playwright (Chrome mobile viewport), polices embeddées                            |
| **Mise à jour PWA bloquée**            | Moyenne     | Moyen                  | `registration.update()` au focus, notification "Nouvelle version dispo"                         |
| **Dépendance Radix breaking change**   | Faible      | Faible                 | Wrapper components (adapters), tests visuels, pin versions exactes                              |
| **RGPD / Données Cameroun**            | N/A         | Juridique              | Aucune donnée sort du device, export utilisateur = consentement explicite                       |

---

## 5. Métriques de Succès (Definition of Done)

### MVP (Fin Phase 2)

- [ ] Créer client + matériau + devis complet en < 3 min sur mobile 3G
- [ ] Générer PDF devis professionnel (logo, totaux, TVA, mentions légales)
- [ ] Fonctionner 100% offline (créer, lister, modifier, PDF)
- [ ] Export/Import JSON complet (backup/restore)
- [ ] Bundle < 150kb gz (First Load)
- [ ] Lighthouse PWA > 90, Performance > 80, Accessibility > 95

### Post-MVP (Fin Phase 3)

- [ ] Coverage tests > 80% (unit + integration)
- [ ] E2E Playwright : 5 parcours critiques verts
- [ ] Zero console errors/warnings en prod
- [ ] Knip : 0 dead code, 0 unused deps
- [ ] Temps build < 30s (Vite)

---

## 6. Stack Technique Verrouillée (package.json)

```json
{
  "name": "metalpro-devis",
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
    "@tanstack/react-query": "^5.20.0",
    "react-hook-form": "^7.50.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",
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
    "@playwright/test": "^1.42.0",
    "knip": "^5.8.0",
    "gh-pages": "^6.1.0"
  }
}
```

---

## 7. Configuration Clé (Extraits)

### `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

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

### `tailwind.config.js`

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

## 8. Prochaines Actions Immédiates

1. **Valider contre-expertise DeepSeek** → Lancer `fcc-dsh` avec `Brief_Contre_Expertise_DeepSeek.md`
2. **Si validée** → Init repo GitHub + `npm create vite@latest metalpro-devis -- --template react-ts`
3. **Si alternatives** → Comparatif ciblé (1 jour) → Recommandation révisée
4. **Démarrer Phase 1** — Paralléliser : DB (Dexie) + UI (Tailwind/Radix) + PWA (Vite config)

---

## 9. Annexe — Décisions Architecturales (ADR)

| ADR     | Décision                  | Raison                                            |
| ------- | ------------------------- | ------------------------------------------------- |
| ADR-001 | React + Vite              | DX, écosystème, Claude Code, PWA mature           |
| ADR-002 | Dexie.js (IndexedDB)      | TypeScript natif, migrations, hooks, React hooks  |
| ADR-003 | @react-pdf/renderer       | Natif React, pas DOM, performant, qualité print   |
| ADR-004 | Tailwind + Radix          | Bundle minimal, accessible, pas CSS-in-JS runtime |
| ADR-005 | Zustand + TanStack Query  | Simple (local) + prêt sync (server state)         |
| ADR-006 | Zod + React Hook Form     | Validation schema-first, types inférés, perf      |
| ADR-007 | decimal.js                | Précision financière (FCFA, pas de centimes)      |
| ADR-008 | GitHub Pages + Cloudflare | Gratuit, fiable, edge Afrique, CI intégré         |
| ADR-009 | Event queue (Dexie hooks) | Préparation sync sans complexité prématurée       |
| ADR-010 | Pas de backend v1         | Budget 0, hors ligne impératif, YAGNI             |

---

**Fin de la recommandation.**  
Cette architecture est **prête à l'implémentation immédiate** sous réserve de validation de la contre-expertise DeepSeek.
