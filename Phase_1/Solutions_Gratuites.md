# Catalogue des Solutions Gratuites — MetalPro Devis

**Date :** 2026-10-27  
**Projet :** MetalPro Devis — Application de devis pour menuisiers métalliques (Yaoundé, Cameroun)  
**Contrainte :** Budget 0 FCFA — uniquement logiciels libres (MIT, Apache 2.0, BSD, GPL compatibles) et services gratuits sans limite bloquante.

---

## 1. Framework & Build

| Outil                 | Licence    | Usage                                   | Alternative               |
| --------------------- | ---------- | --------------------------------------- | ------------------------- |
| **React 18+**         | MIT        | UI déclarative, composants              | Preact (3kb)              |
| **Vite 5+**           | MIT        | Dev server ultra-rapide, build optimisé | esbuild direct, Rsbuild   |
| **TypeScript 5+**     | Apache 2.0 | Typage statique, DX                     | JSDoc + JS pur            |
| **ESLint + Prettier** | MIT        | Linting + formatage                     | Biome (Rust, plus rapide) |

---

## 2. PWA & Service Worker

| Outil               | Licence    | Usage                                                        | Notes                        |
| ------------------- | ---------- | ------------------------------------------------------------ | ---------------------------- |
| **vite-plugin-pwa** | MIT        | Génération manifest + SW automatique                         | Basé sur Workbox             |
| **Workbox**         | Apache 2.0 | Stratégies cache (precache, runtime, stale-while-revalidate) | Standard Google, très mature |
| **PWA Builder**     | MIT        | Validation, packaging store (optionnel)                      | Outil Microsoft, gratuit     |

**Stratégie cache recommandée :**

- `precache` : assets statiques (HTML, CSS, JS, icônes)
- `runtime` : `NetworkFirst` pour API (futur), `StaleWhileRevalidate` pour ressources
- `offline fallback` : page `/offline.html` explicative

---

## 3. Stockage Local Structuré (IndexedDB)

| Bibliothèque     | Licence    | Taille   | API                                            | Pourquoi                                            |
| ---------------- | ---------- | -------- | ---------------------------------------------- | --------------------------------------------------- |
| **Dexie.js 4+**  | Apache 2.0 | ~25kb gz | Promises, TypeScript native, migrations, hooks | **Recommandée** — DX excellente, React hooks inclus |
| **idb (Google)** | Apache 2.0 | ~3kb gz  | Promises, wrapper bas niveau                   | Alternative ultra-légère                            |
| **RxDB**         | Apache 2.0 | ~40kb gz | Reactive, sync native, CRDT                    | Si sync temps réel requise plus tard                |
| **LocalForage**  | Apache 2.0 | ~8kb gz  | API localStorage-like                          | Fallback simple, pas de requêtes indexées           |

**Schéma Dexie recommandé pour MetalPro :**

```typescript
// db/schema.ts
import { Dexie } from 'dexie';

export interface Client {
  id: string;
  nom: string;
  telephone: string;
  email?: string;
  adresse: string;
  createdAt: number;
  updatedAt: number;
}
export interface Materiau {
  id: string;
  nom: string;
  unite: 'm' | 'm2' | 'kg' | 'pcs';
  prixUnitaire: number;
  fournisseur?: string;
  createdAt: number;
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
export interface LigneDevis {
  materiauId: string;
  quantite: number;
  prixUnitaire: number;
  description?: string;
}

export class MetalProDB extends Dexie {
  clients!: Dexie.Table<Client, string>;
  materiaux!: Dexie.Table<Materiau, string>;
  devis!: Dexie.Table<Devis, string>;

  constructor() {
    super('MetalProDB');
    this.version(1).stores({
      clients: 'id, nom, telephone, createdAt',
      materiaux: 'id, nom, unite, createdAt',
      devis: 'id, clientId, statut, createdAt, updatedAt',
    });
  }
}
```

---

## 4. Génération PDF Côté Client

| Bibliothèque            | Licence | Taille | Approche                          | Recommandation                                        |
| ----------------------- | ------- | ------ | --------------------------------- | ----------------------------------------------------- |
| **@react-pdf/renderer** | MIT     | ~60kb  | React primitives → PDF (pas HTML) | **Recommandée** — Natif React, pas de DOM, performant |
| **pdfmake**             | MIT     | ~80kb  | Déclaratif (doc definition)       | Bon pour structures complexes                         |
| **jsPDF + autoTable**   | MIT     | ~120kb | Impératif, canvas-based           | Simple, mais plus lourd                               |
| **html2pdf.js**         | MIT     | ~40kb  | HTML → canvas → PDF               | Dépend du rendu navigateur, moins précis              |

**Template devis @react-pdf/renderer :**

```tsx
// components/DevisPDF.tsx
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 20, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  tableHeader: { backgroundColor: '#1e3a5f', color: 'white', padding: 8 },
  tableRow: { flexDirection: 'row', padding: 8, borderBottom: '1px solid #ddd' },
  total: {
    marginTop: 20,
    paddingTop: 10,
    borderTop: '2px solid #1e3a5f',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export function DevisPDF({
  devis,
  client,
  materiaux,
}: {
  devis: Devis;
  client: Client;
  materiaux: Materiau[];
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text>METALPRO DEVIS</Text>
          <Text>Devis N° {devis.id.slice(0, 8).toUpperCase()}</Text>
        </View>
        <View>
          <Text>
            <strong>Client :</strong> {client.nom}
          </Text>
          <Text>
            <strong>Tél :</strong> {client.telephone}
          </Text>
          <Text>
            <strong>Adresse :</strong> {client.adresse}
          </Text>
        </View>
        {/* Tableau lignes... */}
        <View style={styles.total}>
          <Text>Total TTC : {devis.totalTTC.toLocaleString()} FCFA</Text>
        </View>
      </Page>
    </Document>
  );
}
```

---

## 5. UI & Composants Mobile-First

| Bibliothèque                | Licence | Type                                  | Pourquoi                                                                        |
| --------------------------- | ------- | ------------------------------------- | ------------------------------------------------------------------------------- |
| **MUI (Material UI) Core**  | MIT     | Composants complets                   | Accessible, thème, responsive, Tree-shaking                                     |
| **Chakra UI**               | MIT     | Composants + style props              | DX excellente, dark mode natif                                                  |
| **Radix UI + Tailwind CSS** | MIT     | Headless + utility CSS                | **Recommandé** — Taille bundle minime, contrôle total, pas de runtime CSS-in-JS |
| **shadcn/ui**               | MIT     | Composants copiables (Radix+Tailwind) | Pas de dépendance, code owned                                                   |

**Stack UI recommandée : Tailwind CSS 3.4+ + Radix UI primitives**

- Bundle ~0kb CSS (purge), composants accessibles (ARIA), thème configurable
- Installation : `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`
- Radix : `npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-toast`

---

## 6. Gestion d'État & Formulaires

| Besoin                      | Bibliothèque              | Licence | Pourquoi                                          |
| --------------------------- | ------------------------- | ------- | ------------------------------------------------- |
| **État global simple**      | **Zustand**               | MIT     | ~1kb, hooks, TypeScript, pas de providers         |
| **État serveur/sync futur** | **TanStack Query v5**     | MIT     | Cache, invalidation, mutations, offline mutations |
| **Formulaires**             | **React Hook Form + Zod** | MIT     | Performant, validation schema, TypeScript inféré  |
| **Dates (FR/CM)**           | **date-fns**              | MIT     | Modulaire, tree-shakable, locales fr-CM           |

---

## 7. Utilitaires Métier

| Besoin                | Bibliothèque          | Licence | Usage                                                                    |
| --------------------- | --------------------- | ------- | ------------------------------------------------------------------------ |
| **ID unique**         | **nanoid**            | MIT     | `nanoid(10)` — URL-safe, pas de collision                                |
| **Devises FCFA**      | **Intl.NumberFormat** | Natif   | `new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' })` |
| **Validation schéma** | **Zod**               | MIT     | Schémas TypeScript-first, inférence types                                |
| **Calculs précis**    | **decimal.js**        | MIT     | Éviter erreurs flottantes (prix, quantités)                              |

---

## 8. Hébergement Statique Gratuit (Production)

| Plateforme           | Limites gratuites                    | HTTPS | Domaine custom | CI/CD      | Note                                 |
| -------------------- | ------------------------------------ | ----- | -------------- | ---------- | ------------------------------------ |
| **GitHub Pages**     | 1 GB stockage, 100 GB/mois bandwidth | ✅    | ✅ (CNAME)     | ✅ Actions | **Recommandé** — Intégré Git, fiable |
| **Cloudflare Pages** | Builds illimités, 500 builds/mois    | ✅    | ✅             | ✅         | Edge global, fonctions Workers       |
| **Netlify**          | 100 GB bandwidth, 300 build min/mois | ✅    | ✅             | ✅         | Formulaires, edge functions          |
| **Vercel**           | 100 GB bandwidth, pas de serveur     | ✅    | ✅             | ✅         | Optimisé Next.js, mais OK Vite       |
| **Firebase Hosting** | 10 GB stockage, 360 MB/jour          | ✅    | ✅             | ✅         | Google, limite quotidienne           |

**Recommandation :** **GitHub Pages** pour simplicité (repo unique, Actions pour build auto) + **Cloudflare Pages** en backup/mirror (performance edge Afrique).

---

## 9. Sauvegarde & Export Données (Utilisateur Final)

| Fonction              | Solution                   | Implémentation                                                                               |
| --------------------- | -------------------------- | -------------------------------------------------------------------------------------------- |
| **Export complet**    | JSON + Blob download       | `JSON.stringify(db.dump())` → `URL.createObjectURL(blob)` → `<a download>`                   |
| **Import/Restore**    | File input + Dexie import  | `input type="file" accept=".json"` → `db.import()`                                           |
| **Backup auto local** | localStorage + IndexedDB   | `setInterval(() => localStorage.setItem('backup', JSON.stringify(await db.export())), 5min)` |
| **Partage devis**     | Share API (Web Share)      | `navigator.share({ title, text, url: blobUrl })` → WhatsApp, Email, etc.                     |
| **Impression PDF**    | @react-pdf/renderer + blob | Génération → `blob` → `window.open(URL.createObjectURL(blob))`                               |

---

## 10. Synchronisation Future (Préparation)

| Approche              | Bibliothèque            | Licence | Complexité            | Quand utiliser                    |
| --------------------- | ----------------------- | ------- | --------------------- | --------------------------------- |
| **Last-Write-Wins**   | Code custom + timestamp | —       | Faible                | Mono-utilisateur, multi-appareils |
| **CRDT (Yjs)**        | **Yjs + y-indexeddb**   | MIT     | Moyenne               | Collaboratif temps réel           |
| **Event Sourcing**    | Custom (Dexie hooks)    | —       | Moyenne               | Audit trail, replay               |
| **Supabase Realtime** | @supabase/supabase-js   | MIT     | Faible (backend géré) | Si budget serveur apparaît        |

**Architecture préparation (Option C) :**

```typescript
// lib/sync/types.ts
export interface SyncEvent {
  id: string; // nanoid()
  entity: 'client' | 'materiau' | 'devis';
  action: 'create' | 'update' | 'delete';
  payload: any; // Données complètes
  timestamp: number; // Date.now()
  deviceId: string; // Identifiant appareil (stocké localStorage)
  vectorClock?: Record<string, number>; // Pour CRDT futur
}

// Dans Dexie hooks
db.clients.hook('creating', (primKey, obj, trans) => {
  trans.table('_syncQueue').add({ ...syncEvent, payload: obj });
});
```

---

## 11. Outils Qualité & CI (Gratuits)

| Outil                 | Usage                   | Gratuit pour                                 |
| --------------------- | ----------------------- | -------------------------------------------- |
| **GitHub Actions**    | CI/CD                   | Public repos illimités, 2000 min/mois privés |
| **TypeScript**        | Check types             | `npx tsc --noEmit` dans CI                   |
| **ESLint + Prettier** | Lint/Format             | `npm run lint` dans CI                       |
| **Vitest**            | Tests unitaires         | Rapide, compatible Vite, API Jest            |
| **Playwright**        | Tests E2E               | Navigateurs réels, gratuit                   |
| **Knip**              | Dead code detection     | `npx knip` dans CI                           |
| **Depcheck**          | Dépendances inutilisées | `npx depcheck`                               |

---

## 12. Résumé — Stack Recommandée (Option C)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
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
    "lucide-react": "^0.344.0"
  },
  "devDependencies": {
    "vite": "^5.1.0",
    "vite-plugin-pwa": "^0.19.0",
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.56.0",
    "prettier": "^3.2.0",
    "vitest": "^1.3.0",
    "@playwright/test": "^1.42.0",
    "knip": "^5.8.0"
  }
}
```

**Coût total licences : 0 FCFA** — Toutes dépendances MIT/Apache 2.0.  
**Bundle estimé (gz) :** ~120kb (React + Dexie + PDF + UI) — Excellent pour mobile 3G/4G Yaoundé.
