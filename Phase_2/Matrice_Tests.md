# Matrice de Tests — MetalPro Devis MVP

**Date :** 2026-10-28  
**Version :** 1.0  
**Baseline :** `Rapport_Audit_Anomalies.md` (41 anomalies) + `Cahier_Des_Charges_Technique_MVP_v2.md`  
**Objectif :** 100% anomalies BLOQUANT/MAJEUR couvertes, 80%+ couverture code

---

## Contexte & Faits Demandés par GateGuard

**Ce qui est remplacé/superseded :** Nouveau fichier (première création) — ne remplace rien.

**Où il est lié depuis :**

- `Cahier_Des_Charges_Technique_MVP_v2.md` §13 "Matrice de Tests" (référence croisée)
- `Rapport_Audit_Anomalies.md` § "Plan de remédiation" → lien vers cette matrice
- Plan de développement Phase 4.5 (prochaine étape)

**Importeurs/Appelants (API affectées) :**

- `vitest.config.ts` → importe `tests/unit/**/*.test.ts` + `tests/integration/**/*.test.ts`
- `playwright.config.ts` → importe `tests/e2e/critical-flows/*.spec.ts`
- GitHub Actions `.github/workflows/ci.yml` → exécute `npm run test:unit:ci`, `test:integration`, `test:e2e:ci`
- Composants testés : `lib/tva.ts`, `lib/calculations.ts`, `lib/export/migrate.ts`, `lib/pdf/generator.ts`, `hooks/useFeatureFlags.ts`, `hooks/useStorageQuota.ts`, stores Zustand (`clientStore`, `materiauStore`, `devisStore`), Dexie schema (`db.ts`)

**Schémas de données concernés :**

- `Client` (id, nom, email, telephone, adresse, nif, rc, tvaRegime, createdAt, updatedAt, schemaVersion)
- `Materiau` (id, nom, categorie, unite, prixUnitaire, prixAchat?, description, createdAt, updatedAt, schemaVersion)
- `Devis` (id, clientId, lignes[], statut, dateCreation, dateValidite, totalHT, totalTTC, tvaRateApplied, marge, notes, createdAt, updatedAt, schemaVersion)
- `SyncEvent` (id, entity, entityId, operation, payload, vectorClock?, timestamp, schemaVersion)
- `BackupRecord` (id, timestamp, data, version, schemaVersion)
- `ExportFormat` (version, schemaVersion, exportedAt, clients[], materiaux[], devis[], syncEvents[])

**Instruction verbatim utilisateur :**

> "AUDITER, CORRIGER ET VERROUILLER LE CAHIER DES CHARGES TECHNIQUE DE METALPRO DEVIS AVANT LE DÉVELOPPEMENT" — Phase 4.4 : "Matrice de tests (liens ANOM → cas de test, couverture, automatisation)"

---

## Résumé Couverture

| Domaine                | Anomalies | BLOQUANT | MAJEUR | MINEUR | Couverture Cible      |
| ---------------------- | --------- | -------- | ------ | ------ | --------------------- |
| A — Architecture       | 6         | 0        | 3      | 3      | 100% MAJEUR           |
| B — Modèle Données     | 5         | 0        | 3      | 2      | 100% MAJEUR           |
| C — Règles Métier TVA  | 5         | 2        | 3      | 0      | 100% BLOQUANT/MAJEUR  |
| D — Persistance/Export | 6         | 2        | 3      | 1      | 100% BLOQUANT/MAJEUR  |
| E — UI/UX              | 7         | 0        | 4      | 3      | 100% MAJEUR           |
| F — Génération PDF     | 4         | 1        | 2      | 1      | 100% BLOQUANT/MAJEUR  |
| G — Sync/Conflicts     | 8         | 0        | 5      | 3      | 100% MAJEUR (Phase 4) |
| **TOTAL**              | **41**    | **5**    | **23** | **13** | —                     |

> **Note :** Anomalies Phase 4 (G-003 à G-008) testées en Phase 4. Seules G-004, G-005 concernent MVP (décisions DEC-003, DEC-004).

---

## Légende Automatisation

| Code  | Niveau      | Outils                | Critères                                             |
| ----- | ----------- | --------------------- | ---------------------------------------------------- |
| **U** | Unit        | Vitest                | Fonction pure, déterministe, <10ms                   |
| **I** | Integration | Vitest + Dexie + MSW  | Composants couplés (store + DB + API)                |
| **E** | E2E         | Playwright (Chromium) | Parcours utilisateur critique, mobile viewport       |
| **M** | Manual      | Checkliste humaine    | Visuel, accessibilité, offline réel, device physique |

---

## Domaine A — Architecture

| ANOM  | Titre                     | Type Test | Automatisation         | Description Test                                                                     | Critères Acceptation                                                              |
| ----- | ------------------------- | --------- | ---------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| A-001 | Pas de layering explicite | I         | **U**                  | Architecture test : vérifier imports `lib/` → `hooks/` → `components/` (pas inverse) | `madge --circular` = 0 ; `eslint-plugin-import` rules respectées                  |
| A-002 | Config Vite incomplète    | I         | **U** + **E**          | Build prod : `vite build` → sortie `dist/` valide, PWA manifest, SW enregistré       | `dist/index.html` contient `/sw.js` ; `workbox` precache manifest présent         |
| A-003 | Pas de feature flags      | U         | **U**                  | `useFeatureFlags()` hook : toggle features sans rebuild                              | `VITE_FEATURE_SYNC=false` → sync UI cachée ; `true` → visible                     |
| A-004 | Pas de monitoring erreurs | I         | **U**                  | `ErrorBoundary` capture erreurs React + log structuré                                | `throw new Error()` dans composant → `console.error` appelé avec `componentStack` |
| A-005 | Bundle size non contraint | U         | **U**                  | `vite build --mode=analyze` : budget < 200 KB gzipped (JS)                           | `gzip-size` < 200 KB ; chunks < 50 KB chacun                                      |
| A-006 | Pas de CI/CD défini       | I         | **E** (GitHub Actions) | Pipeline : lint → typecheck → test → build → deploy preview                          | PR merged → preview Cloudflare Pages déployé automatiquement                      |

---

## Domaine B — Modèle Données

| ANOM  | Titre                       | Type Test | Automatisation | Description Test                                                                          | Critères Acceptation                                                               |
| ----- | --------------------------- | --------- | -------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| B-001 | Champs calculés persistés   | U         | **U**          | `Devis` : `totalHT`, `totalTTC`, `marge` NON stockés en DB                                | Insert `Devis` sans champs calculés → lecture → champs calculés = getters          |
| B-002 | Prix stockés en `number`    | U         | **U**          | `Materiau.prixUnitaire` / `Devis.lignes[].prixUnitaire` = `string`                        | Insert `number` → rejet validation Zod ; insert `"12500"` → OK                     |
| B-003 | Formule marge incomplète    | U + I     | **U**          | `calculateMarge(devis, materiaux)` retourne `null` si `prixAchat` manquant                | Cas : prixAchat fourni → marge % ; prixAchat absent → `null` ; division 0 → `null` |
| B-004 | Clé primaire `id` type flou | U         | **U**          | Toutes entités : `id: string` (UUID v4)                                                   | `crypto.randomUUID()` utilisé ; pas d'auto-incrément                               |
| B-005 | Index Dexie non déclarés    | I         | **I**          | Dexie schema : index `Client.nom`, `Materiau.categorie`, `Devis.clientId`, `Devis.statut` | `db.open()` → `table.schema.indexes` contient index attendus                       |

---

## Domaine C — Règles Métier TVA (CRITIQUE)

| ANOM  | Titre                           | Type Test | Automatisation | Description Test                                                             | Critères Acceptation                                                               |
| ----- | ------------------------------- | --------- | -------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| C-001 | Taux TVA unique hardcodé        | U         | **U**          | `TVA_RATES = { standard: 19.25, reduit: 0 }` constants utilisées partout     | Recherche `19.25` dans code = 0 occurrence hors constante                          |
| C-002 | Pas de gestion régimes TVA      | U + I     | **U** + **I**  | `Client.tvaRegime` : `normal` → 19.25%, `simplifie` → 19.25%, `exonere` → 0% | 3 clients (1 par régime) → calcul TVA correct sur devis identiques                 |
| C-003 | Mentions légales PDF manquantes | I + E     | **I** + **E**  | PDF généré contient mentions selon régime client                             | `exonere` → "TVA non applicable art. 259 CGI" ; `normal` → "TVA 19.25%" + NIF + RC |
| C-004 | NIF/RC non validés              | U         | **U**          | `validateNIF(nif)` / `validateRC(rc)` : format Cameroun                      | NIF : 10 chiffres ; RC : `RC/DL/YYYY/B/XXXX` regex                                 |
| C-005 | Arrondi FCFA non géré           | U         | **U**          | `roundFCFA(amount)` : arrondi 5 FCFA (pas centimes)                          | `1234` → `1235` ; `1232` → `1230` ; `1237` → `1235`                                |

---

## Domaine D — Persistance / Export / Import

| ANOM  | Titre                            | Type Test | Automatisation | Description Test                                                     | Critères Acceptation                                                    |
| ----- | -------------------------------- | --------- | -------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| D-001 | Format export v1.0 non versionné | I         | **U** + **I**  | Export JSON contient `version: 2` + `schemaVersion` par entité       | Import v1.0 → migration auto → v2.0 ; Import v2.0 → direct              |
| D-002 | Backup auto localStorage quota   | I         | **I**          | Backup IndexedDB (`_backup` table) : 3 derniers, TTL 30j, quota OK   | 10 backups créés → 3 conservés ; `navigator.storage.estimate()` < 80%   |
| D-003 | Import sans validation           | I         | **U** + **I**  | Import JSON invalide → rejet + message erreur clair                  | Zod validation échoue → toast erreur + pas de corruption DB             |
| D-004 | Pas de stratégie migration       | U + I     | **U**          | `migrateExport(v1, v2)` : transforme structure v1 → v2               | Export v1 (sans schemaVersion) → import → données v2 complètes          |
| D-005 | Données sensibles non classées   | U         | **U**          | `classifySensitivity(field)` : `prixAchat`, `marge` = `confidentiel` | Export "public" exclut champs confidentiels ; backup complet les inclut |
| D-006 | Pas de nettoyage DB              | I         | **I**          | `cleanupOldData()` : devis > 2 ans + statut `refuse` → archive       | 100 devis anciens → archivés (table `_archive`) ; DB taille stable      |

---

## Domaine E — UI / UX

| ANOM  | Titre                            | Type Test | Automatisation | Description Test                                                              | Critères Acceptation                                                                         |
| ----- | -------------------------------- | --------- | -------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| E-001 | Pas de gestion états vides       | I + E     | **I** + **E**  | Listes vides : `ClientList`, `MateriauList`, `DevisList` → état vide illustré | 0 item → illustration + CTA "Créer premier" ; focus clavier sur CTA                          |
| E-002 | Feedback actions manquant        | I + E     | **I** + **E**  | Actions CRUD : toast succès/erreur + optimistic UI rollback                   | Créer client → toast "Créé" ; erreur réseau → toast "Réessayer" + rollback                   |
| E-003 | Accessibilité clavier incomplète | E         | **E**          | Parcours `Tab` : tous éléments interactifs atteignables, ordre logique        | `Tab` → focus visible ; `Shift+Tab` inverse ; `Enter/Espace` active ; `Escape` ferme modales |
| E-004 | Responsive non testé mobile      | E         | **E**          | Viewports : 375px (mobile), 768px (tablette), 1280px (desktop)                | Pas de scroll horizontal ; touch targets ≥ 44×44px ; texte lisible sans zoom                 |
| E-005 | PWA install prompt non géré      | E         | **E**          | `beforeinstallprompt` → bouton "Installer" affiché si supporté                | Chrome mobile → prompt natif si dismiss → bouton custom affiché                              |
| E-006 | Mode hors-ligne non signalé      | I + E     | **I** + **E**  | `navigator.onLine` false → bannière "Mode hors-ligne" persistante             | Déconnexion WiFi → bannière visible ; reconnexion → bannière disparue                        |
| E-007 | Pas de skeletons/loading         | I         | **I**          | Composants listes : skeleton affiché pendant chargement Dexie                 | `isLoading` true → skeleton ; false → données ou état vide                                   |

---

## Domaine F — Génération PDF

| ANOM  | Titre                          | Type Test | Automatisation | Description Test                                                    | Critères Acceptation                                                         |
| ----- | ------------------------------ | --------- | -------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| F-001 | Police Helvetica non embarquée | I + E     | **U** + **E**  | PDF généré utilise police `Inter` embarquée (pas Helvetica système) | `pdf-parser` → font `Inter` présente ; rendu mobile = desktop                |
| F-002 | Mise en page rigide            | I         | **I**          | `DevisPDF` : contenu long → pagination auto, pas de débordement     | 50 lignes → 2+ pages ; en-tête/pied répétés ; pas de coupure ligne au milieu |
| F-003 | Totaux non recalculés PDF      | U + I     | **U**          | PDF utilise `calculateTotals(devis)` (même logique UI)              | UI total = PDF total (au FCFA près) pour 100 devis aléatoires                |
| F-004 | Pas de nom fichier standardisé | U         | **U**          | `generateFilename(devis)` : `DEVIS-YYYYMMDD-CLIENT-NNN.pdf`         | Format respecté ; caractères spéciaux client sanitizés                       |

---

## Domaine G — Synchronisation / Conflits (Phase 4)

> **Note MVP :** Seules G-004, G-005 concernent MVP (décisions DEC-003, DEC-004). Autres testées Phase 4.

| ANOM  | Titre                                | Type Test | Automatisation  | Description Test                                                                    | Critères Acceptation                                                |
| ----- | ------------------------------------ | --------- | --------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| G-001 | Pas de stratégie conflict resolution | I         | **I** (Phase 4) | `resolveConflict(local, remote, strategy)` : `last-write-wins` / `merge` / `manual` | Conflit même champ → stratégie appliquée ; `manual` → UI résolution |
| G-002 | Vector clocks non implémentés        | U         | **U** (Phase 4) | `VectorClock` class : `increment()`, `merge()`, `compare()`                         | `vc1 < vc2` → true si causal ; `merge` → union max par device       |
| G-003 | Sync événementielle non définie      | I         | **I** (Phase 4) | `SyncEvent` queue : ordre FIFO, déduplication, retry exponentiel                    | 100 events → ordonnancés, 0 duplication, retry max 3x               |
| G-004 | TanStack Query inclus sans usage     | U         | **U**           | `@tanstack/react-query` **ABSENT** de `package.json` MVP                            | `npm ls @tanstack/react-query` → not found                          |
| G-005 | Vector clocks type seulement         | U         | **U**           | `SyncEvent.vectorClock` = type seulement, pas d'implémentation                      | TypeScript compile ; pas de code runtime `vectorClock`              |
| G-006 | Pas de détection conflit offline     | I         | **I** (Phase 4) | Deux appareils modifient même devis offline → conflit détecté sync                  | Sync → conflit flaggé ; UI résolution proposée                      |
| G-007 | Pas de réessai sync échouée          | I         | **I** (Phase 4) | Échec réseau sync → retry backoff (1s, 2s, 4s, 8s, max 5x)                          | 5 échecs → arrêt ; succès → queue vidée                             |
| G-008 | Pas de métriques sync                | I         | **I** (Phase 4) | `useSyncMetrics()` : latence, conflits, taux succès, dernière sync                  | Dashboard admin affiche métriques temps réel                        |

---

## Stratégie d'Automatisation par Couche

### Couche 1 — Unit Tests (Vitest) — **Cible : 85% couverture**

```bash
# Commandes
npm run test:unit           # Watch mode
npm run test:unit:coverage  # Rapport coverage (lcov + html)
npm run test:unit:ci        # CI mode (no watch, junit output)
```

- **Scope :** `lib/`, `hooks/` (logique pure), `utils/`, calculs TVA/marge/arrondi
- **Mocking :** Dexie mocké via `vitest-mock-extended` ; pas de vrai DB
- **Nommage :** `*.test.ts` à côté du fichier source

### Couche 2 — Integration Tests (Vitest + Dexie réel) — **Cible : 70% flux critiques**

```bash
npm run test:integration
```

- **Scope :** Stores Zustand + Dexie persistance, Import/Export, Backup/Restore
- **DB :** IndexedDB réel (JSDOM + fake-indexeddb) ou Dexie en mémoire
- **Données :** Factories `createClient()`, `createMateriau()`, `createDevis()`

### Couche 3 — E2E Tests (Playwright) — **Cible : 10 parcours critiques**

```bash
npm run test:e2e           # Headed (dev)
npm run test:e2e:ci        # Headless (CI)
npm run test:e2e:mobile    # Viewport 375×812
```

- **Parcours critiques (10) :**
  1. Créer client → créer matériaux → créer devis → générer PDF → exporter
  2. Modifier devis → vérifier totaux recalculés
  3. Changer régime TVA client → PDF mentions mises à jour
  4. Hors-ligne : créer devis → reconnexion → données persistées
  5. Export JSON → Import sur navigateur propre → données identiques
  6. Backup auto → clear cache → restore backup → données récupérées
  7. Installation PWA → lancement standalone → fonctionnement complet
  8. Responsive mobile : tous formulaires utilisables 375px
  9. Accessibilité : parcours clavier complet + lecteurs écran (NVDA/VoiceOver)
  10. Erreur réseau sync (Phase 4) → retry → récupération

### Couche 4 — Tests Manuels (Checkliste) — **À chaque release**

| Checklist                                          | Fréquence | Responsable |
| -------------------------------------------------- | --------- | ----------- |
| Installation PWA vrai device (Android/iOS)         | Release   | QA          |
| Hors-ligne réel (mode avion) 30 min                | Release   | QA          |
| PDF généré ouvert Adobe Reader / navigateur mobile | Release   | QA          |
| Accessibilité NVDA (Windows) + VoiceOver (iOS)     | Release   | QA          |
| Performance Lighthouse (mobile) > 90               | Release   | Tech Lead   |
| Quota stockage navigateur (DevTools Application)   | Sprint    | Dev         |

---

## Matrice Traçabilité ANOM → Tests

| ANOM  | Tests Unit    | Tests Intégration | Tests E2E       | Tests Manuels |
| ----- | ------------- | ----------------- | --------------- | ------------- |
| A-001 | TC-A-001      | —                 | —               | —             |
| A-002 | TC-A-002      | TC-A-002-I        | TC-A-002-E      | —             |
| A-003 | TC-A-003      | —                 | —               | —             |
| A-004 | TC-A-004      | —                 | TC-A-004-E      | —             |
| A-005 | TC-A-005      | —                 | —               | —             |
| A-006 | —             | —                 | TC-A-006-E      | —             |
| B-001 | TC-B-001      | TC-B-001-I        | —               | —             |
| B-002 | TC-B-002      | TC-B-002-I        | —               | —             |
| B-003 | TC-B-003      | TC-B-003-I        | TC-B-003-E      | —             |
| B-004 | TC-B-004      | —                 | —               | —             |
| B-005 | —             | TC-B-005-I        | —               | —             |
| C-001 | TC-C-001      | —                 | —               | —             |
| C-002 | TC-C-002      | TC-C-002-I        | TC-C-002-E      | —             |
| C-003 | TC-C-003      | TC-C-003-I        | TC-C-003-E      | TC-C-003-M    |
| C-004 | TC-C-004      | —                 | —               | —             |
| C-005 | TC-C-005      | —                 | —               | TC-C-005-M    |
| D-001 | TC-D-001      | TC-D-001-I        | TC-D-001-E      | —             |
| D-002 | —             | TC-D-002-I        | —               | TC-D-002-M    |
| D-003 | TC-D-003      | TC-D-003-I        | TC-D-003-E      | —             |
| D-004 | TC-D-004      | TC-D-004-I        | —               | —             |
| D-005 | TC-D-005      | —                 | —               | —             |
| D-006 | —             | TC-D-006-I        | —               | —             |
| E-001 | —             | TC-E-001-I        | TC-E-001-E      | —             |
| E-002 | —             | TC-E-002-I        | TC-E-002-E      | —             |
| E-003 | —             | —                 | TC-E-003-E      | TC-E-003-M    |
| E-004 | —             | —                 | TC-E-004-E      | TC-E-004-M    |
| E-005 | —             | —                 | TC-E-005-E      | TC-E-005-M    |
| E-006 | —             | TC-E-006-I        | TC-E-006-E      | —             |
| E-007 | —             | TC-E-007-I        | —               | —             |
| F-001 | TC-F-001      | TC-F-001-I        | TC-F-001-E      | TC-F-001-M    |
| F-002 | —             | TC-F-002-I        | TC-F-002-E      | —             |
| F-003 | TC-F-003      | TC-F-003-I        | TC-F-003-E      | —             |
| F-004 | TC-F-004      | —                 | —               | —             |
| G-001 | —             | TC-G-001-I (P4)   | TC-G-001-E (P4) | —             |
| G-002 | TC-G-002 (P4) | —                 | —               | —             |
| G-003 | —             | TC-G-003-I (P4)   | —               | —             |
| G-004 | TC-G-004      | —                 | —               | —             |
| G-005 | TC-G-005      | —                 | —               | —             |
| G-006 | —             | TC-G-006-I (P4)   | TC-G-006-E (P4) | —             |
| G-007 | —             | TC-G-007-I (P4)   | —               | —             |
| G-008 | —             | TC-G-008-I (P4)   | —               | —             |

---

## Seuils de Qualité (Quality Gates)

| Métrique                        | Seuil    | Bloquant si |
| ------------------------------- | -------- | ----------- |
| Couverture Unit (lignes)        | ≥ 85%    | < 80%       |
| Couverture Branches             | ≥ 80%    | < 75%       |
| Couverture Fonctions            | ≥ 90%    | < 85%       |
| Tests E2E critiques passants    | 10/10    | < 10        |
| Temps exécution Unit            | < 30s    | > 60s       |
| Temps exécution E2E             | < 5 min  | > 10 min    |
| Bundle JS gzipped               | < 200 KB | > 250 KB    |
| Lighthouse Performance (mobile) | ≥ 90     | < 85        |
| Lighthouse Accessibility        | ≥ 95     | < 90        |
| Lighthouse PWA                  | ≥ 90     | < 80        |
| Zéro `console.error` non géré   | 0        | > 0         |

---

## Exécution CI/CD (GitHub Actions)

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:unit:ci
      - run: npm run test:integration
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with: { name: coverage, path: coverage/ }

  e2e:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e:ci
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: e2e-trace, path: test-results/ }
```

---

## Outils & Configuration

| Outil                | Version | Config                                             | Usage                  |
| -------------------- | ------- | -------------------------------------------------- | ---------------------- |
| Vitest               | ^1.6    | `vitest.config.ts`                                 | Unit + Integration     |
| @vitest/coverage-v8  | ^1.6    | `coverage: { reporter: ['lcov', 'html', 'json'] }` | Coverage               |
| Playwright           | ^1.44   | `playwright.config.ts`                             | E2E (Chromium, Mobile) |
| fake-indexeddb       | ^6.0    | Auto (JSDOM)                                       | Dexie en tests         |
| eslint-plugin-vitest | ^0.5    | `extends: ['plugin:vitest/recommended']`           | Lint tests             |
| @axe-core/playwright | ^4.9    | Auto-inject                                        | Accessibilité E2E      |

---

## Fichiers de Test à Créer (Squelette)

```
tests/
├── unit/
│   ├── lib/
│   │   ├── tva.test.ts              # TC-C-001, C-002, C-005
│   │   ├── calculations.test.ts     # TC-B-001, B-003, B-004
│   │   ├── export-migrate.test.ts   # TC-D-001, D-004
│   │   ├── validation.test.ts       # TC-C-004, D-003
│   │   ├── pdf-generator.test.ts    # TC-F-003, F-004
│   │   └── vector-clock.test.ts     # TC-G-002 (Phase 4)
│   ├── hooks/
│   │   ├── useFeatureFlags.test.ts  # TC-A-003
│   │   ├── useStorageQuota.test.ts  # TC-D-002
│   │   └── useSyncMetrics.test.ts   # TC-G-008 (Phase 4)
│   └── utils/
│       ├── roundFCFA.test.ts        # TC-C-005
│       ├── classifySensitivity.test.ts # TC-D-005
│       └── generateFilename.test.ts # TC-F-004
├── integration/
│   ├── stores/
│   │   ├── clientStore.test.ts      # TC-B-005, E-001, E-002
│   │   ├── materiauStore.test.ts    # TC-B-002, B-003
│   │   └── devisStore.test.ts       # TC-B-001, B-003, D-006
│   ├── persistence/
│   │   ├── backup-restore.test.ts   # TC-D-002
│   │   ├── import-export.test.ts    # TC-D-001, D-003, D-004
│   │   └── dexie-schema.test.ts     # TC-B-005
│   └── pdf/
│       └── pdf-generation.test.ts   # TC-F-001, F-002, F-003
└── e2e/
    ├── critical-flows/
    │   ├── create-devis-pdf-export.spec.ts     # Parcours 1
    │   ├── edit-devis-recalc.spec.ts           # Parcours 2
    │   ├── tva-regime-pdf-mentions.spec.ts     # Parcours 3
    │   ├── offline-create-persist.spec.ts      # Parcours 4
    │   ├── export-import-roundtrip.spec.ts     # Parcours 5
    │   ├── backup-restore.spec.ts              # Parcours 6
    │   ├── pwa-install-standalone.spec.ts      # Parcours 7
    │   ├── responsive-mobile.spec.ts           # Parcours 8
    │   ├── accessibility-keyboard.spec.ts      # Parcours 9
    │   └── sync-retry-recovery.spec.ts         # Parcours 10 (Phase 4)
    └── fixtures/
        ├── clients.json
        ├── materiaux.json
        └── devis.json
```

---

## Suivi & Reporting

| Artefact                                   | Fréquence    | Destination              |
| ------------------------------------------ | ------------ | ------------------------ |
| Rapport coverage (HTML)                    | Chaque PR    | GitHub Actions Artifacts |
| Rapport E2E (HTML + traces)                | Chaque PR    | GitHub Actions Artifacts |
| Dashboard qualité (SonarCloud)             | Quotidien    | SonarCloud Project       |
| Métriques bundle (webpack-bundle-analyzer) | Chaque build | `dist/stats.html`        |

---

**Fin de la matrice de tests.**  
41 anomalies tracées → cas de test. 10 parcours E2E critiques. Automatisation 3 couches + manuel. Prêt pour implémentation Phase 1.
