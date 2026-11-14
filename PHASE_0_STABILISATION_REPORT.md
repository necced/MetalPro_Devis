# Rapport de Stabilisation Phase 0 — MetalPro Devis MVP

**Date** : 2026-10-28  
**Mission** : Audit, correction et validation des fondations techniques (complément au PHASE_0_BOOTSTRAP_REPORT.md)  
**Auteur** : Ingénieur logiciel senior (mission de stabilisation)  
**Instruction utilisateur** : "MISSION : STABILISATION ET VALIDATION DE LA PHASE 0" avec 11 étapes (A-G) et critères de sortie A/B/C  
**Lié depuis** : PHASE_0_BOOTSTRAP_REPORT.md (rapport bootstrap initial)  

---

## 1. RÉSUMÉ EXÉCUTIF

La Phase 0 Bootstrap a été **revisitée et stabilisée**. L'infrastructure technique (Vite 5, React 18, TypeScript 5.3, PWA, Dexie v4, Decimal.js, Tailwind, Radix UI) est en place et compile. **Un bug critique bloquant a été corrigé** dans `decimal.ts` (méthode `.set()` inexistante sur 4 fonctions financières). Les erreurs ESLint restantes sont des **faux positifs de résolution d'import** (configuration parser TypeScript manquante pour l'import plugin) et un **faux positif sur le nom de fichier** `App.tsx`.

**Classification finale : 🟡 PHASE 1 AUTORISABLE SOUS RÉSERVES** — Les fondations sont fiables après correction du bug critique, mais 3 réserves non bloquantes doivent être levées en tout début de Phase 1.

---

## 2. ÉTAT RÉEL DU DÉPÔT AU DÉBUT DE LA MISSION

| Aspect | Constat |
|--------|---------|
| **Git** | Pas de dépôt Git initialisé (dossier local uniquement) |
| **Branche** | N/A |
| **Modifications non validées** | N/A (pas de Git) |
| **Cahier des charges** | Présent dans `../Cahier_Des_Charges_Revise.docx` (externe au projet) |
| **Registre DEC-001 à DEC-007** | Documenté dans `PHASE_0_BOOTSTRAP_REPORT.md` |
| **package.json / package-lock.json** | 30 deps / 24 devDeps, versions épinglées, cohérentes |
| **Configurations** | Toutes présentes : TS (3 fichiers), Vite, Vitest, Playwright, ESLint (flat), Prettier, Knip, Tailwind, PostCSS |
| **Code source** | `src/db/index.ts`, `src/shared/utils/decimal.ts`, `src/types/index.ts`, `src/App.tsx` (template Vite), `src/main.tsx`, `src/index.css`, `src/test/setup.ts` |
| **PWA** | `public/offline.html` ✅, `public/icons/icon.svg` ✅, **icônes PNG manquantes** ❌ |

---

## 3. CONTRÔLES EFFECTIVEMENT EXÉCUTÉS

| Contrôle | Commande | Statut | Preuve |
|----------|----------|--------|--------|
| Installation deps | `npm install` (déjà fait) | ✅ | 1037 packages, `node_modules/` présent |
| TypeScript strict | `npm run typecheck` | ✅ PASS | Sortie vide = 0 erreur |
| ESLint | `npm run lint` | ⚠️ PARTIAL | 7 errors / 6 warnings (détail §4) |
| Tests unitaires | `npm run test` | ⚠️ NO TESTS | "No test files found" |
| Build production | `npm run build` | ✅ PASS | SW généré, 17 entrées, 192 KiB |
| Knip (dead code) | `npm run knip` | ⚠️ EXPECTED | 3 fichiers, 21 deps inutilisés (justifiés Phase 1) |
| Tests E2E | `npm run test:e2e` | ⚠️ NO TESTS | "No tests found" |
| Tests financiers | Script Node inline | ✅ PASS | 19/19 cas validés (§5) |
| Modèle données | Inspection manuelle + mapping DEC | ✅ | 3 écarts identifiés (§6) |

---

## 4. ANOMALIES ESLINT — DIAGNOSTIC DÉTAILLÉ

### 4.1 Erreurs de résolution d'import (6 errors + 6 warnings)

| Fichier | Ligne | Règle | Sévérité | Cause racine |
|---------|-------|-------|----------|--------------|
| `src/db/index.ts` | 1 | `import/namespace` | Error | Parser TS non exposé à import plugin pour module `dexie` |
| `src/db/index.ts` | 1 | `import/default` | Error | Idem |
| `src/db/index.ts` | 1 | `import/no-named-as-default` | Warning | Conséquence du parsing échoué |
| `src/db/index.ts` | 1 | `import/no-named-as-default-member` | Warning | Conséquence |
| `vite.config.ts` | 4 | `import/namespace` | Error | Même cause pour `@vitejs/plugin-react` |
| `vite.config.ts` | 4 | `import/default` | Error | Idem |
| `vite.config.ts` | 4 | `import/no-named-as-default` | Warning | Conséquence |
| `vite.config.ts` | 4 | `import/no-named-as-default-member` | Warning | Conséquence |
| `vitest.config.ts` | 4 | `import/default` | Error | Même cause |
| `vitest.config.ts` | 4 | `import/namespace` | Error | Idem |
| `vitest.config.ts` | 4 | `import/no-named-as-default` | Warning | Conséquence |
| `vitest.config.ts` | 4 | `import/no-named-as-default-member` | Warning | Conséquence |

**Cause technique** : Dans `eslint.config.js`, `tseslint.configs.recommended` configure le parser TypeScript mais **ne le transmet pas à `languageOptions.parser`** pour que l'import plugin puisse l'utiliser. Le hook `config-protection` interdit de modifier `eslint.config.js`.

**Classification** : **Faux positifs** — Les modules `dexie` et `@vitejs/plugin-react` sont installés et fonctionnels (build OK). Ce sont des erreurs d'outillage, pas de code.

**Correctif minimal sans toucher config protégée** : Ajouter `// eslint-disable-next-line import/no-unresolved, import/default, import/namespace, import/no-named-as-default, import/no-named-as-default-member` sur les 3 lignes d'import concernées.

### 4.2 Erreur de casse de fichier (1 error)

| Fichier | Règle | Message | Analyse |
|---------|-------|---------|---------|
| `src/App.tsx` | `unicorn/filename-case` | "Filename is not in kebab case. Rename it to `app.tsx`." | **Faux positif** — Convention React = PascalCase pour composants. `App.tsx` est correct. |

**Correctif** : Ajouter `App.tsx` aux exceptions de la règle ou désactiver pour ce fichier.

---

## 5. CORRECTIFS APPLIQUÉS

### 5.1 Bug critique `decimal.ts` — **CORRIGÉ**

**Fichier** : `src/shared/utils/decimal.ts`  
**Lignes** : 111, 122, 133, 144  
**Problème** : `.set({ precision: 28 })` appelé sur instances Decimal — **cette méthode n'existe pas** (elle est statique sur le constructeur).  
**Impact** : Erreur `TypeError: D(...).mul(...).set is not a function` à l'exécution — **tous les calculs TVA/TTC/HT/Ligne cassés**.  
**Correction** : Suppression des 4 appels `.set({ precision: 28 })` — la précision globale `Decimal.set({ precision: 28 })` ligne 13 suffit.

| Fonction | Avant (cassé) | Après (corrigé) |
|----------|---------------|-----------------|
| `calculerTVA` | `D(montantHT).mul(tvaTaux).set({ precision: 28 })` | `D(montantHT).mul(tvaTaux)` |
| `calculerTTC` | `D(montantHT).mul(1 + tvaTaux).set({ precision: 28 })` | `D(montantHT).mul(1 + tvaTaux)` |
| `calculerHT` | `D(montantTTC).div(1 + tvaTaux).set({ precision: 28 })` | `D(montantTTC).div(1 + tvaTaux)` |
| `calculerLigneHT` | `D(quantite).mul(prixUnitaire).set({ precision: 28 })` | `D(quantite).mul(prixUnitaire)` |

**Validation** : 19 tests unitaires inline exécutés — **tous passent** (formatage FCFA, parsing, TVA 19.25%, régimes normal/simplifié/exonéré, round-trip HT→TTC→HT, division par zéro, valeurs négatives, grands nombres).

### 5.2 Aucun autre correctif appliqué

- ESLint : Pas de modification de `eslint.config.js` (protégé)
- `App.tsx` : Non renommé (faux positif, convention React respectée)
- Dépendances/fichiers Knip : Non supprimés (tous prévus Phase 1)

---

## 6. CONTRÔLE MODÈLE DE DONNÉES — DEXIE vs DEC-001 à DEC-007

### 6.1 Conformité globale : **CONFORME** (avec 3 écarts mineurs)

| DEC | Exigence | Implémentation | Statut |
|-----|----------|----------------|--------|
| DEC-001 | Clients : NIF, RC, régime TVA | ✅ Champs + index | ✅ |
| DEC-001 | Matériaux : nom, unité, prix, TVA | ✅ Champs + index | ✅ |
| DEC-001 | Devis : client, lignes, totaux, TVA détail, statuts, n° | ✅ Structure complète + dénormalisation historique | ✅ |
| DEC-001 | Index recherche/filtrage | ✅ Index composés | ✅ |
| DEC-001 | _syncQueue offline-first | ✅ Champs complets | ✅ |
| DEC-001 | _backup export/import | ✅ checksum, taille, date | ✅ |
| DEC-002 | Decimal.js precision 28, ROUND_HALF_UP | ✅ Configuré globalement | ✅ |
| DEC-003 | Zustand seul, pas TanStack Query | ✅ package.json | ✅ |
| DEC-004 | @react-pdf/renderer | ✅ Dépendance présente | ✅ |
| DEC-005 | Workbox PWA autoUpdate | ✅ vite.config.ts | ✅ |
| DEC-006 | GitHub Pages + Cloudflare | ✅ Script deploy + config | ✅ |
| DEC-007 | TVA 19.25%, régimes, mentions légales | ✅ Types + calculs | ✅ |

### 6.2 Écarts identifiés (non bloquants)

| # | Écart | Impact | Correctif recommandé Phase 1 |
|---|-------|--------|------------------------------|
| 1 | **Unicité `devis.numero`** : pas de contrainte `unique` | Risque doublons si génération décentralisée | Ajouter `*numero` dans store definition |
| 2 | **Index `_syncQueue`** : pas d'index composé `entityType+status` | Filtrage `pending` moins performant | Ajouter `[entityType+status]` |
| 3 | **Pas de versioning schéma** : v1 seulement | Migrations futures non prévues | Documenter stratégie migration |

**Note** : Dexie ne supporte pas `NOT NULL` — validation au niveau applicatif (Zod) requise.

---

## 7. CONTRÔLE PWA ET HORS LIGNE

| Niveau | Critère | Statut | Détail |
|--------|---------|--------|--------|
| **1. Config présente** | Manifest, SW, offline.html, stratégies cache | ✅ | `vite.config.ts` complet |
| **2. Compilation vérifiée** | `npm run build` génère SW + manifest | ✅ | 17 entrées, 192 KiB, Workbox v0.19.2 |
| **3. Comportement testé navigateur** | Installation, offline, mise à jour, cache | ❌ **NON TESTÉ** | Pas d'exécution navigateur dans cette mission |

### Manquants critiques pour la PWA
- **8 fichiers PNG d'icônes** (72→512) référencés dans manifest mais absents de `public/icons/`
- `favicon.ico`, `apple-touch-icon.png`, `robots.txt` dans `includeAssets` mais absents

---

## 8. RÉSULTATS AVANT / APRÈS

### 8.1 `decimal.ts` — Calculs financiers

| Test | Avant correction | Après correction |
|------|------------------|------------------|
| `calculerTVA(100000, 0.1925)` | **TypeError runtime** | ✅ `19250` |
| `calculerTTC(100000, 0.1925)` | **TypeError runtime** | ✅ `119250` |
| `calculerHT(119250, 0.1925)` | **TypeError runtime** | ✅ `100000` |
| `calculerLigneHT(5, 1000)` | **TypeError runtime** | ✅ `5000` |
| Round-trip HT→TTC→HT | N/A (plantait) | ✅ `123456` → `123456` |
| Tous autres tests (15) | ✅ Passaient | ✅ Passent |

### 8.2 Build / Typecheck / Lint

| Métrique | Avant mission | Après mission |
|----------|---------------|---------------|
| `typecheck` | ✅ | ✅ |
| `build` | ✅ | ✅ |
| `lint` errors | 7 (mêmes) | 7 (mêmes, faux positifs) |
| `lint` warnings | 6 (mêmes) | 6 (mêmes) |
| Bugs runtime financiers | **4 critiques** | **0** |

---

## 9. CONTRÔLES NON EXÉCUTÉS ET MOTIFS

| Contrôle | Motif |
|----------|-------|
| Test navigateur PWA (installation, offline, update) | Pas d'environnement navigateur automatisé disponible dans cette session |
| Test E2E complet (création devis, PDF, backup) | Aucun test E2E écrit — hors scope Phase 0 |
| Test unitaire Vitest (couverture 80%) | Aucun fichier test créé — hors scope Phase 0 |
| Validation fiscale TVA par expert-comptable | Hors compétence technique — nécessite arbitrage promoteur |
| Audit accessibilité (WCAG 2.2) | Pas d'UI métier encore — Phase 1+ |

---

## 10. RÉSERVES ENCORE OUVERTES

| # | Réserve | Sévérité | Responsable | Action | Critère de clôture |
|---|---------|----------|-------------|--------|-------------------|
| R1 | Icônes PWA PNG manquantes (8 tailles) | 🟡 HAUTE | Dev Phase 1 | Générer PNG depuis SVG ou fournir assets | `npm run build` sans warning manifest + icônes présentes dans `dist/` |
| R2 | Fichiers `favicon.ico`, `apple-touch-icon.png`, `robots.txt` absents | 🟡 HAUTE | Dev Phase 1 | Ajouter dans `public/` | Présents dans `dist/` après build |
| R3 | ESLint import errors (faux positifs) | 🟢 MOYENNE | Dev Phase 1 | `eslint-disable` ciblé sur 3 lignes d'import | `npm run lint` = 0 error (ou 1 warning filename-case) |
| R4 | `unicorn/filename-case` sur `App.tsx` | 🔵 FAIBLE | Dev Phase 1 | Exception règle ou rename si convention projet change | `npm run lint` sans cette erreur |
| R5 | Unicité `devis.numero` + index `_syncQueue` | 🟢 MOYENNE | Dev Phase 1 | Modifier schema Dexie v1 → v2 (migration) | Contrainte unique effective + index composé |
| R6 | Tests unitaires (decimal, db, types) — 80% coverage | 🟡 HAUTE | Dev Phase 1 | Écrire tests `*.test.ts` | `npm run test` PASS + coverage ≥ 80% |
| R7 | Tests E2E flux critiques | 🟡 HAUTE | Dev Phase 1 | Écrire specs Playwright | `npm run test:e2e` PASS |
| R8 | Validation TVA 19.25% par expert | 🔵 FAIBLE | Promoteur | Revue juridique | Attestation écrite |

---

## 11. RISQUES POUR LA PHASE 1

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Calculs TVA cassés en prod | **ÉLIMINÉ** (corrigé) | — | — |
| PWA non installable (icônes) | Élevée | Utilisateurs ne peuvent pas installer | Corriger R1/R2 en tout début Phase 1 |
| ESLint bruit continu | Moyenne | Fatigue revue code | Corriger R3/R4 en tout début Phase 1 |
| Doublons numéros devis | Faible | Intégrité données | Corriger R5 avant première mise en prod |
| Pas de tests = régressions invisibles | Élevée | Qualité long terme | Corriger R6/R7 en parallèle Phase 1 |
| Non-conformité fiscale non détectée | Faible | Légal/financier | Corriger R8 avant mise en prod |

---

## 12. FICHIERS MODIFIÉS PAR CETTE MISSION

| Fichier | Type | Description |
|---------|------|-------------|
| `src/shared/utils/decimal.ts` | **Correction critique** | Suppression 4× `.set({ precision: 28 })` invalides sur `calculerTVA`, `calculerTTC`, `calculerHT`, `calculerLigneHT` |
| `PHASE_0_STABILISATION_REPORT.md` | **Livrable** | Ce rapport (nouveau, complémentaire au bootstrap report) |

*Aucun autre fichier modifié. `eslint.config.js` intact (protégé). `App.tsx` intact (faux positif).*

---

## 13. TABLEAU DE SYNTHÈSE FINAL

| Contrôle | Résultat réel | Preuve ou commande | Action restante |
|----------|---------------|---------------------|-----------------|
| **Git / versioning** | ❌ Absent | `git status` → "Not a git repository" | Initialiser Git + premier commit (Phase 1) |
| **TypeScript strict** | ✅ PASS | `npm run typecheck` (sortie vide) | — |
| **Build production** | ✅ PASS | `npm run build` → SW 17 entrées, 192 KiB | — |
| **ESLint** | ⚠️ 7 errors / 6 warnings | `npm run lint` | R3, R4 (faux positifs) |
| **Tests unitaires** | ⚠️ Aucun | `npm run test` → "No test files found" | R6 (écrire tests) |
| **Tests E2E** | ⚠️ Aucun | `npm run test:e2e` → "No tests found" | R7 (écrire tests) |
| **Knip** | ⚠️ Expected | `npm run knip` → 3 fichiers, 21 deps inutilisés justifiés | — |
| **Calculs financiers** | ✅ PASS (après fix) | 19 tests inline Node.js | — |
| **Modèle données Dexie** | ✅ Conforme (+3 écarts) | Inspection manuelle + mapping DEC | R5 (unicité + index) |
| **PWA Config** | ✅ Présente | `vite.config.ts` + manifest généré | — |
| **PWA Icônes/Assets** | ❌ Manquants | `public/icons/` ne contient que SVG | R1, R2 (générer assets) |
| **PWA Comportement réel** | ❌ Non testé | Pas d'exécution navigateur | Test manuel Phase 1 |
| **Dépendances** | ✅ Cohérentes | `package.json` + `package-lock.json` | — |

---

## 14. DÉCISION RECOMMANDÉE

### 🟡 **PHASE 1 AUTORISABLE SOUS RÉSERVES**

**Fondations techniques validées** : TypeScript strict, build, PWA config, modèle données, **calculs financiers corrigés et testés**.

**Réserves à lever en tout début de Phase 1 (semaine 1)** :
1. **R1 + R2** : Générer/ajouter les 8 icônes PWA PNG + favicon/apple-touch-icon/robots.txt → *Bloquant pour l'installabilité PWA*
2. **R3 + R4** : `eslint-disable` ciblé sur 3 imports + exception `App.tsx` → *Qualité de vie développeur*
3. **R6** : Écrire tests unitaires `decimal.test.ts`, `db.test.ts`, `types.test.ts` → *Exigence cahier des charges 80% coverage*

**Réserves parallèles Phase 1** :
4. **R5** : Migration Dexie v1→v2 (unicité + index) → *Avant première release*
5. **R7** : Tests E2E flux critiques → *Avant release*
6. **R8** : Validation fiscale TVA → *Avant mise en production*

---

## 15. ARBITRAGES REQUIS DU PROMOTEUR

| # | Décision | Options | Recommandation |
|---|----------|---------|----------------|
| A1 | **Gestion ESLint import errors** | (a) `eslint-disable` ciblé (b) Configurer hook pour autoriser modif `eslint.config.js` (c) Imports relatifs uniquement | **(a) `eslint-disable` ciblé** — le plus sûr, ne touche pas à la config protégée |
| A2 | **Nom `App.tsx` vs `app.tsx`** | (a) Garder `App.tsx` + exception règle (b) Renommer `app.tsx` | **(a) Garder `App.tsx`** — convention React standard |
| A3 | **Génération icônes PWA** | (a) Script Node (sharp) depuis SVG (b) Outils en ligne (c) Designer fournit assets | **(a) Script `sharp` dans `package.json`** — reproductible, gratuit |
| A4 | **Validation TVA 19.25% Cameroun** | (a) Confirmer taux unique 19.25% pour tous régimes (b) Taux différenciés selon régime | **Confirmer avec expert-comptable** — DEC-007 suppose 19.25% standard |
| A5 | **Lancement Phase 1** | (a) Maintenant (avec réserves R1-R4 semaine 1) (b) Après résolution R1-R4 | **(a) Démarrer Phase 1 maintenant** — réserves R1-R4 sont des tâches de 1-2 jours max |

---

## 16. COMMANDE POUR LANCER LA PHASE 1

```bash
# 1. Initialiser Git (si pas déjà fait)
cd C:/Users/cedri/Downloads/MetalPro_Devis
git init
git add .
git commit -m "chore: Phase 0 stabilized - fix decimal.ts financial calculations"

# 2. Résoudre R1-R2 (icônes PWA) - script suggéré
npm install --save-dev sharp
# Ajouter script "pwa:icons" dans package.json pour générer PNG depuis SVG

# 3. Résoudre R3-R4 (ESLint)
# Ajouter eslint-disable sur src/db/index.ts:1, vite.config.ts:4, vitest.config.ts:4
# Ajouter exception App.tsx dans eslint.config.js (si hook le permet) ou eslint-disable

# 4. Démarrer Phase 1 - Core Application Shell
# Créer branche feature/phase1-shell
git checkout -b feature/phase1-shell
# Implémenter : Router, Providers (Zustand, RHF, Query), Theme, Layout
```

---

**Fin du rapport de stabilisation Phase 0.**  
**Prochaine étape** : Arbitrage promoteur sur A1-A5 → Lancement Phase 1.