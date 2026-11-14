# Plan de Développement — MetalPro Devis MVP

**Date :** 2026-10-28  
**Version :** 1.0  
**Baseline :** `Cahier_Des_Charges_Technique_MVP_v2.md` + `Registre_Decisions.md` + `Matrice_Tests.md`  
**Budget :** 0 FCFA (outils gratuits uniquement)  
**Équipe cible :** 1 dev full-stack (React/TS) + 1 QA (part-time)  
**Durée estimée :** 8-10 semaines (Phase 1 MVP)

---

## Contexte & Faits Demandés par GateGuard

**Ce qui est remplacé/superseded :** Nouveau fichier (première création) — ne remplace rien.

**Où il est lié depuis :**

- `Cahier_Des_Charges_Technique_MVP_v2.md` §14 "Plan de Développement" (référence croisée)
- `Registre_Decisions.md` § "Décisions Futures" → backlog Phase 4
- `Matrice_Tests.md` § "Stratégie d'Automatisation" → phases P4-T01 à T03

**Importeurs/Appelants (API affectées) :**

- `package.json` scripts : `dev`, `build`, `lint`, `typecheck`, `test:unit`, `test:unit:ci`, `test:unit:coverage`, `test:integration`, `test:e2e`, `test:e2e:ci`, `test:e2e:mobile`, `test:all`, `analyze`, `lighthouse`, `db:studio`, `clean`
- GitHub Actions `.github/workflows/ci.yml` → exécute `npm run test:unit:ci`, `test:integration`, `build`, `test:e2e:ci`, `lighthouse`
- `vite.config.ts` : config PWA, build, analyze, CSP headers
- `vitest.config.ts` + `vitest.integration.config.ts` : config tests unit/integration
- `playwright.config.ts` : config E2E (chromium, mobile-chrome)
- `lighthouserc.json` : budgets Lighthouse CI
- Composants créés : `stores/{client,materiau,devis}.ts`, `lib/tva/*`, `lib/pdf/*`, `lib/export/*`, `lib/calculations/*`, `hooks/useAutoBackup.ts`, `hooks/useOnlineStatus.ts`, `hooks/usePWAInstall.ts`, `hooks/useFeatureFlags.ts`, `hooks/useStorageQuota.ts`, `components/*`, `pages/*`

**Schémas de données concernés :**

- `Client` (id, nom, email, telephone, adresse, nif, rc, tvaRegime, createdAt, updatedAt, schemaVersion)
- `Materiau` (id, nom, categorie, unite, prixUnitaire, prixAchat?, description, createdAt, updatedAt, schemaVersion)
- `Devis` (id, clientId, lignes[], statut, dateCreation, dateValidite, totalHT, totalTTC, tvaRateApplied, marge, notes, createdAt, updatedAt, schemaVersion)
- `SyncEvent` (id, entity, entityId, operation, payload, vectorClock?, timestamp, schemaVersion)
- `BackupRecord` (id, timestamp, data, version, schemaVersion)
- `ExportFormat` (version, schemaVersion, exportedAt, clients[], materiaux[], devis[], syncEvents[])

**Instruction verbatim utilisateur :**

> "AUDITER, CORRIGER ET VERROUILLER LE CAHIER DES CHARGES TECHNIQUE DE METALPRO DEVIS AVANT LE DÉVELOPPEMENT" — Phase 4.5 : "Plan de développement (phases, tâches, dépendances, estimation, jalons)"

---

## Vue d'Ensemble Phases

| Phase  | Nom                          | Durée   | Jalons                                                    | Dépendances       |
| ------ | ---------------------------- | ------- | --------------------------------------------------------- | ----------------- |
| **P0** | Bootstrap & Fondations       | 1 sem   | Repo prêt, CI verte, PWA installable                      | —                 |
| **P1** | Modèle Données & Persistance | 1.5 sem | CRUD complet Client/Matériau/Devis, Export/Import, Backup | P0                |
| **P2** | Moteur Calculs & TVA         | 1 sem   | TVA multi-régimes, Marge, Arrondi FCFA, PDF               | P1                |
| **P3** | UI/UX Mobile-First           | 2 sem   | Parcours complets, Accessibilité, Offline UI, PWA         | P1 (parallèle P2) |
| **P4** | Qualité & Durcissement       | 1.5 sem | Tests (85%+), Performance, Sécurité, Docs                 | P2, P3            |
| **P5** | Release & Déploiement        | 0.5 sem | Production live, Monitoring, Rétrospective                | P4                |

**Total : ~7.5 semaines effet + 1 semaine buffer = 8.5 semaines**

---

## Phase 0 — Bootstrap & Fondations (1 semaine)

**Objectif :** Environnement de dev prêt, CI/CD verte, PWA "Hello World" installable.

### Tâches

| ID     | Tâche                     | Description                                                                                                                                          | Estimation | Dépendances            | Livrable                                   |
| ------ | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------- | ------------------------------------------ |
| P0-T01 | Init repo + structure     | `npm create vite@latest metalpro-devis -- --template react-ts` ; structure dossiers `src/{lib,hooks,components,stores,types,utils}`                  | 0.5j       | —                      | Repo initialisé                            |
| P0-T02 | Config TypeScript strict  | `tsconfig.json` : `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`                                                           | 0.5j       | P0-T01                 | `tsc --noEmit` = 0 erreurs                 |
| P0-T03 | Config ESLint + Prettier  | `eslint.config.js` (flat) + `prettier.config.js` ; rules: `react-hooks`, `import/order`, `unicorn`                                                   | 0.5j       | P0-T02                 | `npm run lint` = 0 warnings                |
| P0-T04 | Config Vitest + Coverage  | `vitest.config.ts` : `globals: true`, `environment: 'jsdom'`, `coverage: { provider: 'v8', reporter: ['lcov', 'html'] }`                             | 0.5j       | P0-T02                 | `npm run test:unit:ci` passe               |
| P0-T05 | Config Playwright         | `playwright.config.ts` : projects `chromium`, `mobile-chrome` ; `baseURL: 'http://localhost:5173'`                                                   | 0.5j       | P0-T02                 | `npm run test:e2e:ci` passe (smoke)        |
| P0-T06 | GitHub Actions CI         | `.github/workflows/ci.yml` : lint → typecheck → test:unit → test:integration → build → e2e                                                           | 1j         | P0-T03, P0-T04, P0-T05 | Pipeline verte sur PR test                 |
| P0-T07 | Vite PWA + Workbox        | `vite-plugin-pwa` : `registerType: 'autoUpdate'`, `manifest: { name, short_name, icons, start_url, display: 'standalone' }`                          | 1j         | P0-T01                 | PWA installable (Lighthouse PWA > 90)      |
| P0-T08 | Dexie + Schema v2         | `db.ts` : stores `clients`, `materiaux`, `devis`, `syncEvents`, `_backup` ; indexes déclarés ; `schemaVersion: 1` sur chaque entité                  | 1j         | P0-T01                 | `db.open()` OK, IndexedDB DevTools visible |
| P0-T09 | Zustand Stores squelettes | `stores/{client,materiau,devis}.ts` : CRUD basique (add/getAll/getById/update/delete) + `useStore` hooks                                             | 1j         | P0-T08                 | Stores fonctionnels (test unit passe)      |
| P0-T10 | Tailwind + Radix UI base  | `tailwind.config.ts` : `content`, `theme.extend.colors` (primary FCFA), `plugins: [require('@tailwindcss/forms')]` ; Radix `Slot`, `Dialog`, `Toast` | 1j         | P0-T01                 | Composants de base rendus                  |

**Jalon P0 ✅** — `main` branch : `npm run build` → `dist/` déployable sur Cloudflare Pages preview. PWA installable sur mobile.

---

## Phase 1 — Modèle Données & Persistance (1.5 semaines)

**Objectif :** CRUD complet 3 entités, Export/Import versionné, Backup auto IndexedDB.

### Tâches

| ID     | Tâche                         | Description                                                                                                                          | Estimation | Dépendances            | Livrable                                         |
| ------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ---------------------- | ------------------------------------------------ |
| P1-T01 | Zod Schemas v2                | `schemas/{client,materiau,devis}.ts` : validation complète (NIF, RC, prix string, tvaRegime enum, schemaVersion)                     | 1j         | P0-T09                 | `schema.parse(data)` valide/rejette correctement |
| P1-T02 | Client Store complet          | CRUD + recherche par nom + filtre régime TVA + pagination (50/page)                                                                  | 1j         | P1-T01                 | Tests unit + intégration passent                 |
| P1-T03 | Materiau Store complet        | CRUD + filtre catégorie + tri nom/prix + gestion `prixAchat` optionnel                                                               | 1j         | P1-T01                 | Tests unit + intégration passent                 |
| P1-T04 | Devis Store complet           | CRUD + lignes (add/update/remove/reorder) + calculs dérivés (getters) + filtre statut + duplication devis                            | 1.5j       | P1-T01, P1-T02, P1-T03 | Tests unit + intégration passent                 |
| P1-T05 | Export JSON v2                | `lib/export/export.ts` : `exportData()` → `{ version: 2, schemaVersion, exportedAt, clients[], materiaux[], devis[], syncEvents[] }` | 1j         | P1-T02, P1-T03, P1-T04 | Fichier `.json` valide, importable               |
| P1-T06 | Import JSON + Migration v1→v2 | `lib/export/import.ts` : `importData(json)` → validation Zod → migration auto si `schemaVersion` absent → upsert Dexie               | 1.5j       | P1-T05                 | Import v1 (legacy) → données v2 complètes        |
| P1-T07 | Backup Auto IndexedDB         | `hooks/useAutoBackup.ts` : intervalle 5 min → table `_backup` (rotation 3, TTL 30j) + `useStorageQuota()` monitoring 80%             | 1j         | P0-T08                 | Backup créé, restaurable, quota surveillé        |
| P1-T08 | Restore Backup UI             | Composant `BackupRestore` : liste backups (date, taille) → bouton "Restaurer" → confirmation → reload                                | 1j         | P1-T07                 | Restore fonctionnel (test E2E)                   |
| P1-T09 | Nettoyage DB (Archivage)      | `lib/db/cleanup.ts` : `archiveOldDevis(olderThanMonths: 24, status: 'refuse')` → table `_archive`                                    | 0.5j       | P1-T04                 | Job planifiable (Phase 4)                        |

**Jalon P1 ✅** — Données persistées survivent refresh/clear cache. Export/Import roundtrip 100% fidèle. Backup auto restaurable.

---

## Phase 2 — Moteur Calculs & TVA (1 semaine)

**Objectif :** TVA multi-régimes Cameroun, Marge matériaux, Arrondi FCFA, Génération PDF conforme.

### Tâches

| ID     | Tâche                   | Description                                                                                                                                              | Estimation | Dépendances                    | Livrable                                                        |
| ------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------ | --------------------------------------------------------------- |
| P2-T01 | Constantes TVA Cameroun | `lib/tva/constants.ts` : `TVA_RATES = { standard: 19.25, reduit: 0 }` ; `TVA_REGIMES = ['normal', 'simplifie', 'exonere']`                               | 0.5j       | P0-T02                         | Constantes utilisées partout (grep 19.25 = 0)                   |
| P2-T02 | Calcul TVA par régime   | `lib/tva/calculate.ts` : `calculateTVA(ht, regime)` → `{ tva, ttc, rateApplied }` ; `regime: 'exonere'` → tva=0                                          | 0.5j       | P2-T01                         | Tests unit : 3 régimes × 5 montants = 15 cas                    |
| P2-T03 | Validation NIF/RC       | `lib/validation/cameroon.ts` : `validateNIF()`, `validateRC()` regex Cameroun + `formatNIF()`, `formatRC()`                                              | 0.5j       | P0-T02                         | Tests unit : 10 valides, 10 invalides                           |
| P2-T04 | Arrondi FCFA            | `lib/utils/round.ts` : `roundFCFA(n)` → multiple de 5 ; `roundFCFA(1234)=1235`, `roundFCFA(1232)=1230`                                                   | 0.5j       | P0-T02                         | Tests unit : 20 cas limites                                     |
| P2-T05 | Calcul Marge (DEC-002)  | `lib/calculations/marge.ts` : `calculateMarge(devis, materiauxMap)` → `null` si prixAchat manquant ou division 0                                         | 0.5j       | P1-T03, P1-T04                 | Tests unit : avec/sans prixAchat, division 0                    |
| P2-T06 | Totaux Devis (getters)  | `stores/devis.ts` : `getTotalHT()`, `getTotalTTC()`, `getMarge()` utilisent `calculateTVA` + `roundFCFA` + `calculateMarge`                              | 0.5j       | P2-T02, P2-T04, P2-T05         | Totaux cohérents UI ↔ PDF                                      |
| P2-T07 | Police Inter embarquée  | `@fontsource/inter` install + `lib/pdf/fonts.ts` : `Font.register({ family: 'Inter', fonts: [...] })`                                                    | 0.5j       | P0-T01                         | Police enregistrée `@react-pdf/renderer`                        |
| P2-T08 | DevisPDF Generator      | `lib/pdf/DevisPDF.tsx` : `@react-pdf/renderer` + StyleSheet Inter + mentions légales conditionnelles (régime, NIF, RC) + pagination                      | 2j         | P2-T02, P2-T03, P2-T06, P2-T07 | PDF généré : 1 page simple, 3 pages longues, mentions correctes |
| P2-T09 | Téléchargement PDF      | Composant `DownloadPDF` : `blob = await pdfInstance.toBlob()` → `URL.createObjectURL` → `<a download>` + nom standardisé `DEVIS-YYYYMMDD-CLIENT-NNN.pdf` | 0.5j       | P2-T08                         | Fichier PDF téléchargeable, ouvrable                            |
| P2-T10 | Tests PDF automatisés   | `tests/integration/pdf-generation.test.ts` : comparaison totaux UI/PDF, police embarquée, pagination, mentions                                           | 1j         | P2-T08, P2-T09                 | 100 devis aléatoires : UI total = PDF total                     |

**Jalon P2 ✅** — Devis créé → PDF généré avec TVA correcte selon régime client, mentions légales, police Inter, totaux exacts au FCFA.

---

## Phase 3 — UI/UX Mobile-First (2 semaines)

**Objectif :** Parcours utilisateurs complets, accessibilité AA, mode offline visible, PWA production-ready.

### Tâches

| ID     | Tâche                       | Description                                                                                                                                      | Estimation | Dépendances            | Livrable                                               |
| ------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ---------------------- | ------------------------------------------------------ |
| P3-T01 | Layout Responsive           | `components/Layout.tsx` : Header (logo, menu hamburger), Footer, `main` container max-w-4xl mx-auto ; breakpoints `sm:640`, `md:768`, `lg:1024`  | 1j         | P0-T10                 | Pas de scroll horizontal 375-1920px                    |
| P3-T02 | Navigation + Routing        | `react-router-dom` v6 : routes `/`, `/clients`, `/materiaux`, `/devis`, `/devis/:id`, `/settings` ; `Outlet` + `NavLink` actif                   | 1j         | P3-T01                 | Navigation clavier + mobile fonctionnelle              |
| P3-T03 | Clients UI                  | `pages/Clients.tsx` : liste (table mobile: cards), empty state, FAB "Nouveau", modal création/édition (React Hook Form + Zod)                    | 2j         | P1-T02, P3-T02         | CRUD Client complet, validation temps réel             |
| P3-T04 | Matériaux UI                | `pages/Materiaux.tsx` : liste groupée par catégorie, empty state, modal création/édition (prixAchat optionnel)                                   | 1.5j       | P1-T03, P3-T02         | CRUD Matériau complet                                  |
| P3-T05 | Devis UI — Liste            | `pages/DevisList.tsx` : cartes statut (brouillon/validé/envoyé/refusé), filtres, actions (voir, dupliquer, PDF, supprimer)                       | 1.5j       | P1-T04, P3-T02         | Liste devis fonctionnelle                              |
| P3-T06 | Devis UI — Détail/Édition   | `pages/DevisDetail.tsx` : header (client, dates, statut), lignes éditables (add/del/reorder), totaux temps réel, actions (valider, PDF, envoyer) | 2.5j       | P1-T04, P2-T06, P3-T02 | Édition devis fluide, totaux mis à jour instantanément |
| P3-T07 | Sélecteur Client/Produit    | Composants `ClientSelect`, `MateriauSelect` : searchable, créable depuis modal, accès clavier complet                                            | 1j         | P3-T03, P3-T04         | UX efficace sur mobile                                 |
| P3-T08 | États Vides + Skeletons     | Tous listes : `EmptyState` illustration + CTA ; `Skeleton` lignes pendant chargement Dexie                                                       | 1j         | P3-T03, P3-T04, P3-T05 | Feedback visuel constant                               |
| P3-T09 | Toasts + Feedback           | `components/Toast.tsx` (Radix) : succès, erreur, info, warning ; `useToast()` hook ; auto-dismiss 4s ; action "Annuler" pour rollback            | 1j         | P3-T02                 | Feedback toute action utilisateur                      |
| P3-T10 | Indicateur Offline          | `hooks/useOnlineStatus.ts` : `navigator.onLine` + `online`/`offline` events → contexte → `OfflineBanner` persistant + icône header               | 0.5j       | P3-T01                 | Visible immédiatement déconnexion                      |
| P3-T11 | PWA Install Prompt          | `hooks/usePWAInstall.ts` : `beforeinstallprompt` → state → bouton "Installer" dans Settings + header si dismiss                                  | 0.5j       | P0-T07                 | Installation 1-clic mobile/desktop                     |
| P3-T12 | Accessibilité (WCAG 2.2 AA) | Focus visible (`:focus-visible`), ARIA labels, landmarks, heading hierarchy, contrast ratio ≥ 4.5:1, `skip-link`                                 | 1.5j       | P3-T01 à P3-T11        | Audit `axe-core` 0 violations AA                       |
| P3-T13 | Settings / À propos         | `pages/Settings.tsx` : info version, clear cache, export/import, backup/restore, PWA install, mentions légales                                   | 1j         | P1-T05, P1-T08, P3-T11 | Centre contrôle utilisateur                            |

**Jalon P3 ✅** — Parcours complets : Créer client → Créer matériaux → Créer devis → PDF → Export. Fonctionne offline. Accessible clavier/lecteur écran. PWA installable.

---

## Phase 4 — Qualité & Durcissement (1.5 semaines)

**Objectif :** Couverture tests ≥ 85%, Performance < 200KB JS, Sécurité, Documentation.

### Tâches

| ID     | Tâche                        | Description                                                                                                      | Estimation | Dépendances    | Livrable                                         |
| ------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------- | -------------- | ------------------------------------------------ |
| P4-T01 | Compléter Unit Tests         | Écrire tests manquants pour atteindre 85% lignes / 80% branches / 90% fonctions                                  | 3j         | P1, P2, P3     | `npm run test:unit:coverage` → seuils atteints   |
| P4-T02 | Compléter Integration Tests  | Tests stores + Dexie + Export/Import + Backup/Restore + PDF                                                      | 2j         | P1, P2         | `npm run test:integration` → 100% flux critiques |
| P4-T03 | Compléter E2E Tests          | 10 parcours critiques `tests/e2e/critical-flows/*.spec.ts`                                                       | 2j         | P3             | `npm run test:e2e:ci` → 10/10 pass               |
| P4-T04 | Accessibilité E2E            | `@axe-core/playwright` injecté dans chaque test E2E → 0 violations AA                                            | 1j         | P3-T12, P4-T03 | CI bloque si violation accessibilité             |
| P4-T05 | Performance Bundle           | `vite build --mode=analyze` → `rollup-plugin-visualizer` → optimiser imports (lazy load pages, tree-shaking)     | 1j         | P0-T07, P3     | Bundle JS gzipped < 200 KB                       |
| P4-T06 | Lighthouse CI                | `lighthouse-ci` dans GH Actions : budgets Performance ≥ 90, Accessibility ≥ 95, PWA ≥ 90                         | 1j         | P4-T05         | CI bloque si régression                          |
| P4-T07 | Sécurité : Audit Dépendances | `npm audit` + `snyk test` (gratuit) → 0 vulnérabilités HIGH/CRITICAL ; vérifier licences MIT/Apache-2.0 only     | 0.5j       | P0-T01         | Rapport sécurité clean                           |
| P4-T08 | Sécurité : Headers CSP       | `vite.config.ts` : `build.manifest: true` + Cloudflare Pages `_headers` : CSP strict, `frame-ancestors 'none'`   | 0.5j       | P0-T06         | Headers présents en prod                         |
| P4-T09 | Documentation Technique      | `docs/ARCHITECTURE.md` (layering, data flow), `docs/API.md` (schemas, fonctions publiques), `docs/DEPLOYMENT.md` | 1.5j       | Toutes         | Docs à jour, lisibles                            |
| P4-T10 | Documentation Utilisateur    | `docs/USER_GUIDE.md` : captures d'écran, workflows, FAQ, dépannage offline                                       | 1j         | P3             | Guide utilisateur complet                        |

**Jalon P4 ✅** — CI verte complète. Couverture ≥ 85%. Bundle < 200KB. Lighthouse ≥ 90/95/90. 0 vuln HIGH. Docs complètes.

---

## Phase 5 — Release & Déploiement (0.5 semaine)

**Objectif :** Mise en production, monitoring, rétrospective.

### Tâches

| ID     | Tâche                             | Description                                                                                               | Estimation | Dépendances | Livrable                  |
| ------ | --------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------- | ----------- | ------------------------- |
| P5-T01 | Build Production                  | `npm run build` → `dist/` vérifié (manifest, SW, assets hashés)                                           | 0.5j       | P4          | Artefact build prêt       |
| P5-T02 | Déploiement Cloudflare Pages      | Connect repo → `build command: npm run build` → `output: dist` → custom domain `metalpro-devis.pages.dev` | 0.5j       | P5-T01      | URL production live       |
| P5-T03 | Déploiement GitHub Pages (mirror) | `gh-pages` branch auto via Action → `metalpro-devis.github.io`                                            | 0.5j       | P5-T01      | Miroir gratuit            |
| P5-T04 | Monitoring Erreurs                | Sentry (gratuit 5k events/mois) ou `window.onerror` → log local + export                                  | 0.5j       | P5-T02      | Erreurs capturées en prod |
| P5-T05 | Analytics Respectueux             | Plausible (self-hosted gratuit) ou simple `localStorage` events → export CSV                              | 0.5j       | P5-T02      | Métriques usage anonymes  |
| P5-T06 | Rétrospective + Backlog Phase 4   | Réunion 1h : what went well / pain points → backlog Phase 4 (Sync, Vector Clocks, Chiffrement, i18n)      | 0.5j       | P5-T02      | Backlog Phase 4 priorisé  |

**Jalon P5 ✅ — MVP LIVE** — Application accessible publiquement, fonctionnelle offline, monitorée.

---

## Diagramme de Gantt (Semaines)

```mermaid
gantt
    title MetalPro Devis MVP — Plan 8.5 Semaines
    dateFormat  YYYY-MM-DD
    axisFormat  %W

    section Phase 0 - Bootstrap
    P0-T01 Init Repo           :p0t1, 2026-11-04, 1d
    P0-T02 TS Strict           :p0t2, after p0t1, 1d
    P0-T03 Lint/Prettier       :p0t3, after p0t2, 1d
    P0-T04 Vitest              :p0t4, after p0t2, 1d
    P0-T05 Playwright          :p0t5, after p0t2, 1d
    P0-T06 CI/CD               :p0t6, after p0t3, 2d
    P0-T07 PWA/Workbox         :p0t7, after p0t1, 2d
    P0-T08 Dexie Schema        :p0t8, after p0t1, 2d
    P0-T09 Zustand Stores      :p0t9, after p0t8, 2d
    P0-T10 Tailwind/Radix      :p0t10, after p0t1, 2d

    section Phase 1 - Data
    P1-T01 Zod Schemas         :p1t1, after p0t9, 2d
    P1-T02 Client Store        :p1t2, after p1t1, 2d
    P1-T03 Materiau Store      :p1t3, after p1t1, 2d
    P1-T04 Devis Store         :p1t4, after p1t1, 3d
    P1-T05 Export JSON         :p1t5, after p1t4, 2d
    P1-T06 Import+Migration    :p1t6, after p1t5, 3d
    P1-T07 Backup Auto         :p1t7, after p0t8, 2d
    P1-T08 Restore UI          :p1t8, after p1t7, 2d
    P1-T09 Cleanup DB          :p1t9, after p1t4, 1d

    section Phase 2 - Calculs/TVA/PDF
    P2-T01 Constantes TVA      :p2t1, after p1t1, 1d
    P2-T02 Calcul TVA          :p2t2, after p2t1, 1d
    P2-T03 Valid NIF/RC        :p2t3, after p2t1, 1d
    P2-T04 Arrondi FCFA        :p2t4, after p2t1, 1d
    P2-T05 Calcul Marge        :p2t5, after p1t3,p1t4, 1d
    P2-T06 Totaux Devis        :p2t6, after p2t2,p2t4,p2t5, 1d
    P2-T07 Police Inter        :p2t7, after p0t1, 1d
    P2-T08 DevisPDF Gen        :p2t8, after p2t6,p2t7, 4d
    P2-T09 Download PDF        :p2t9, after p2t8, 1d
    P2-T10 Tests PDF           :p2t10, after p2t9, 2d

    section Phase 3 - UI/UX
    P3-T01 Layout              :p3t1, after p0t10, 2d
    P3-T02 Routing             :p3t2, after p3t1, 2d
    P3-T03 Clients UI          :p3t3, after p3t2,p1t2, 4d
    P3-T04 Materiaux UI        :p3t4, after p3t2,p1t3, 3d
    P3-T05 Devis List          :p3t5, after p3t2,p1t4, 3d
    P3-T06 Devis Detail        :p3t6, after p3t2,p2t6, 5d
    P3-T07 Selecteurs          :p3t7, after p3t3,p3t4, 2d
    P3-T08 Empty/Skeleton      :p3t8, after p3t3,p3t4,p3t5, 2d
    P3-T09 Toasts              :p3t9, after p3t2, 2d
    P3-T10 Offline Banner      :p3t10, after p3t1, 1d
    P3-T11 PWA Install         :p3t11, after p0t7, 1d
    P3-T12 Accessibilité       :p3t12, after p3t6, 3d
    P3-T13 Settings            :p3t13, after p3t6,p1t5,p1t8, 2d

    section Phase 4 - Qualité
    P4-T01 Unit Tests          :p4t1, after p2t10,p3t13, 6d
    P4-T02 Integ Tests         :p4t2, after p4t1, 4d
    P4-T03 E2E Tests           :p4t3, after p3t13, 4d
    P4-T04 A11y E2E            :p4t4, after p4t3, 2d
    P4-T05 Perf Bundle         :p4t5, after p3t6, 2d
    P4-T06 Lighthouse CI       :p4t6, after p4t5, 2d
    P4-T07 Sec Audit           :p4t7, after p0t1, 1d
    P4-T08 CSP Headers         :p4t8, after p0t6, 1d
    P4-T09 Doc Tech            :p4t9, after p4t1, 3d
    P4-T10 Doc User            :p4t10, after p3t13, 2d

    section Phase 5 - Release
    P5-T01 Build Prod          :p5t1, after p4t6, 1d
    P5-T02 Deploy CF Pages     :p5t2, after p5t1, 1d
    P5-T03 Deploy GH Pages     :p5t3, after p5t1, 1d
    P5-T04 Monitoring          :p5t4, after p5t2, 1d
    P5-T05 Analytics           :p5t5, after p5t2, 1d
    P5-T06 Rétro + Backlog     :p5t6, after p5t2, 1d
```

---

## Estimation Détaillée (Jours Homme)

| Phase          | Dev Senior | QA     | Total              |
| -------------- | ---------- | ------ | ------------------ |
| P0 Bootstrap   | 8          | 1      | 9                  |
| P1 Données     | 9          | 2      | 11                 |
| P2 Calculs/PDF | 8          | 2      | 10                 |
| P3 UI/UX       | 16         | 3      | 19                 |
| P4 Qualité     | 10         | 4      | 14                 |
| P5 Release     | 2          | 1      | 3                  |
| **Total**      | **53**     | **13** | **66 jours-homme** |

> **Note :** 1 dev full-stack ≈ 53 jours = ~10.5 semaines (avec parallélisation P2/P3, buffer). QA part-time ≈ 13 jours répartis.

---

## Dépendances Critiques (Chemin Critique)

```
P0-T01 → P0-T08 → P1-T01 → P1-T04 → P2-T06 → P3-T06 → P4-T01 → P5-T01 → P5-T02
      ↘ P0-T07 → P3-T11                                    ↗
      ↘ P0-T10 → P3-T01 → P3-T02 → P3-T06                  ↗
```

**Chemin le plus long :** P0 (5j) → P1 (7j) → P2 (5j) → P3 (10j séquentiel sur DevisDetail) → P4 (6j) → P5 (1j) = **34 jours ouvrés ≈ 7 semaines**

Parallélisation possible :

- P2 (Calculs/PDF) // P3 (UI) après P1-T04
- P4-T01/T02/T03 en parallèle (différentes couches test)
- P4-T05/T07/T08/T09/T10 en parallèle

---

## Gestion des Risques

| Risque                                       | Probabilité | Impact | Mitigation                                                                                 | Déclencheur Plan B       |
| -------------------------------------------- | ----------- | ------ | ------------------------------------------------------------------------------------------ | ------------------------ |
| Dexie/IndexedDB bugs mobile (Safari iOS)     | Moyenne     | Élevé  | Tests réels iOS dès P1-T02 ; fallback localStorage si quota                                | Échec backup/restore iOS |
| `@react-pdf/renderer` performance gros devis | Faible      | Moyen  | Pagination lazy ; test 100 lignes P2-T10                                                   | PDF > 5s génération      |
| Workbox SW cache strategies complexes        | Moyenne     | Moyen  | Stratégie simple `StaleWhileRevalidate` + `precacheManifest` only ; pas de runtime caching | SW non enregistré        |
| Bundle size > 200KB                          | Faible      | Élevé  | `rollup-plugin-visualizer` hebdo ; dynamic import pages ; `manualChunks` vendor            | Audit P4-T05 > 250KB     |
| Disponibilité QA part-time                   | Élevée      | Moyen  | Dev auto-test E2E ; scripts reproductibles ; prioriser P4-T03                              | QA indisponible > 1 sem  |
| Changement réglementation TVA Cameroun       | Faible      | Élevé  | Constantes centralisées `lib/tva/constants.ts` ; feature flag taux                         | Annonce officielle DGI   |

---

## Définition de Fait (Definition of Done) par Phase

### Phase 0-1 (Fondations + Data)

- [ ] `npm run build` → `dist/` sans erreurs TypeScript
- [ ] `npm run lint` + `npm run typecheck` = 0 erreur
- [ ] `npm run test:unit:ci` + `test:integration` = 100% pass
- [ ] PWA installable (Lighthouse PWA > 90)
- [ ] Données survivent refresh + clear cache (IndexedDB)
- [ ] Export/Import roundtrip 100% fidèle

### Phase 2 (Calculs/TVA/PDF)

- [ ] TVA calculée correctement 3 régimes × 10 montants
- [ ] Marge `null` si prixAchat absent, correcte si présent
- [ ] Arrondi FCFA : 20 cas limites passants
- [ ] PDF généré : police Inter, mentions légales selon régime, pagination
- [ ] Totaux UI = PDF (100 devis aléatoires)

### Phase 3 (UI/UX)

- [ ] 10 parcours E2E passent (headed + headless + mobile)
- [ ] Accessibilité : `axe-core` 0 violations AA
- [ ] Responsive : 375/768/1280px sans scroll horizontal
- [ ] Offline : banner visible, données persistées, sync à la reconnexion
- [ ] PWA : install prompt, standalone mode fonctionnel

### Phase 4 (Qualité)

- [ ] Couverture : lignes ≥ 85%, branches ≥ 80%, fonctions ≥ 90%
- [ ] Bundle JS gzipped < 200 KB
- [ ] Lighthouse : Perf ≥ 90, A11y ≥ 95, PWA ≥ 90
- [ ] `npm audit` + `snyk` : 0 HIGH/CRITICAL
- [ ] Docs technique + utilisateur complètes

### Phase 5 (Release)

- [ ] URL production accessible HTTPS
- [ ] Miroir GitHub Pages accessible
- [ ] Erreurs monitorées (Sentry/local)
- [ ] Rétrospective faite, backlog Phase 4 prêt

---

## Commandes de Développement (package.json scripts)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "test:unit": "vitest",
    "test:unit:ci": "vitest run --reporter=junit --outputFile=junit.xml",
    "test:unit:coverage": "vitest run --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:ci": "playwright test --reporter=junit,line",
    "test:e2e:mobile": "playwright test --project=mobile-chrome",
    "test:all": "npm run test:unit:ci && npm run test:integration && npm run test:e2e:ci",
    "analyze": "vite build --mode=analyze",
    "lighthouse": "lhci autorun",
    "db:studio": "npx dexie-studio",
    "clean": "rm -rf dist coverage .vitest test-results"
  }
}
```

---

## Métriques de Suivi Hebdomadaires

| Semaine    | Métriques Clés                                    | Seuil Alerte             |
| ---------- | ------------------------------------------------- | ------------------------ |
| 1 (P0)     | CI time < 5min, Build OK, PWA installable         | CI > 10min ou PWA < 80   |
| 2 (P1)     | CRUD 3 entités OK, Export/Import roundtrip        | Import échoue > 1 cas    |
| 3 (P1+P2)  | TVA 3 régimes OK, PDF généré                      | PDF mentions manquantes  |
| 4 (P2+P3)  | DevisDetail complet, Totaux temps réel            | Lag > 200ms saisie ligne |
| 5 (P3)     | 5/10 E2E passent, A11y 0 violations               | A11y violations > 0      |
| 6 (P3+P4)  | 10/10 E2E, Couverture > 70%                       | Couverture < 60%         |
| 7 (P4)     | Couverture ≥ 85%, Bundle < 200KB, Lighthouse ≥ 90 | Un seuil non atteint     |
| 8 (P4+P5)  | Release candidate, Monitoring OK                  | Erreurs prod > 0/jour    |
| 9 (Buffer) | MVP LIVE, Rétro faite                             | —                        |

---

## Backlog Phase 4 (Post-MVP) — Préparation

| ID     | Épic                 | Description                                                                           | Estimation | Déclencheur                |
| ------ | -------------------- | ------------------------------------------------------------------------------------- | ---------- | -------------------------- |
| P4-E01 | Sync Multi-Appareils | Background Sync API + IndexedDB sync + Vector Clocks (DEC-004, DEC-008, DEC-009)      | 3 sem      | Demande utilisateurs réels |
| P4-E02 | Chiffrement Données  | Web Crypto API : chiffrement `prixAchat`, `marge`, `notes` au repos (DEC-010)         | 1 sem      | Exigence client/RGPD       |
| P4-E03 | Internationalisation | i18n (fr, en, bassa, ewondo, fulfulde) ; formats nombre/date/monnaie locaux (DEC-011) | 2 sem      | Demande utilisateurs       |
| P4-E04 | Mode Entreprise      | Multi-utilisateurs, rôles (admin/commercial), équipes, devis partagés (DEC-012)       | 4 sem      | Croissance équipe          |
| P4-E05 | Analytics Avancées   | Dashboard métriques : devis/mois, taux conversion, marge moyenne, top matériaux       | 1 sem      | Besoin pilotage activité   |
| P4-E06 | API Publique         | REST API (Hono/Cloudflare Workers) pour intégrations tierces (ERP, compta)            | 2 sem      | Demande partenaires        |

---

## Récapitulatif Livrables Phase 2 (Audit)

| Livrable                                 | Fichier                                  | Statut                  |
| ---------------------------------------- | ---------------------------------------- | ----------------------- |
| 1. Rapport Audit Anomalies               | `Rapport_Audit_Anomalies.md`             | ✅ Terminé              |
| 2. Cahier des Charges Technique MVP v2.0 | `Cahier_Des_Charges_Technique_MVP_v2.md` | ✅ Terminé              |
| 3. Registre des Décisions                | `Registre_Decisions.md`                  | ✅ Terminé              |
| 4. Matrice de Tests                      | `Matrice_Tests.md`                       | ✅ Terminé              |
| 5. Plan de Développement                 | `Plan_Developpement.md`                  | ✅ Terminé (ce fichier) |

---

**Fin du plan de développement.**  
Prêt pour exécution Phase 0. Toutes décisions verrouillées, anomalies tracées, tests planifiés, risques identifiés.
