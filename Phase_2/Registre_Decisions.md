# Registre des Décisions — MetalPro Devis MVP

**Date :** 2026-10-28  
**Version :** 1.0  
**Baseline :** `Rapport_Audit_Anomalies.md` + `Cahier_Des_Charges_Technique_MVP_v2.md`  
**Statut :** **Verrouillé** — Toutes décisions validées pour développement Phase 1

---

## Résumé des Décisions

| ID      | Sujet                        | Statut                             | Promoteur        | Échéance | Impact Anomalies         |
| ------- | ---------------------------- | ---------------------------------- | ---------------- | -------- | ------------------------ |
| DEC-001 | Régime TVA Client            | **Validée**                        | Promoteur Métier | Immédiat | ANOM-C-002, C-003, C-004 |
| DEC-002 | Prix Achat Matériaux (Marge) | **Validée**                        | Promoteur Métier | Immédiat | ANOM-B-003               |
| DEC-003 | TanStack Query dans MVP      | **Validée** (Retrait)              | Tech Lead        | Immédiat | ANOM-G-004               |
| DEC-004 | Vector Clocks MVP            | **Validée** (Type only)            | Tech Lead        | Phase 4  | ANOM-G-005               |
| DEC-005 | Police PDF Embarquée         | **Validée** (Inter)                | Tech Lead        | Immédiat | ANOM-F-001               |
| DEC-006 | Stockage Backup              | **Validée** (IndexedDB)            | Tech Lead        | Immédiat | ANOM-D-002               |
| DEC-007 | Versionning Export           | **Validée** (schemaVersion/entité) | Tech Lead        | Immédiat | ANOM-D-004               |

---

## Détail des Décisions

### DEC-001 — Régime TVA Client

**Contexte :** ANOM-C-002 (MAJEUR) — Pas de gestion régimes TVA (réel simplifié / normal / exonéré). ANOM-C-003 (MAJEUR) — Mentions légales obligatoires manquantes sur PDF.

**Options évaluées :**
| Option | Description | Avantages | Inconvénients |
|--------|-------------|-----------|---------------|
| **A** | Champ unique `tvaRegime` sur `Client` (enum: normal/simplifie/exonere) | Simple, suffit MVP, extensible | Nécessite validation métier par client |
| B | Table séparée `ClientTvaRegime` avec historique | Historique complet | Over-engineering MVP |
| C | Régime global unique (pas par client) | Plus simple | Non conforme — clients ont régimes différents |

**Décision :** **Option A validée** par Promoteur Métier (2026-10-28)

**Implémentation dans v2 :**

- Ajout `tvaRegime: 'normal' | 'simplifie' | 'exonere'` sur interface `Client` (défaut 'normal')
- Mentions PDF conditionnelles selon régime
- `tvaRateApplied` stocké sur `Devis` pour historicalité

**Validation :** ✅ Promoteur Métier — "Correspond à la réalité terrain Yaoundé"

---

### DEC-002 — Prix Achat Matériaux (Calcul Marge)

**Contexte :** ANOM-B-003 (MAJEUR) — Formule marge incomplète : `Coût Total` non défini, pas de distinction prix vente/achat.

**Options évaluées :**
| Option | Description | Avantages | Inconvénients |
|--------|-------------|-----------|---------------|
| **A** | Champ `prixAchat` optionnel sur `Materiau` (string) | YAGNI, optionnel, simple | Marge null si non renseigné |
| B | Table séparée `MateriauPrixAchat` avec historique | Historique complet prix achat | Complexité MVP non justifiée |
| C | Pas de prix achat → pas de marge | Zéro complexité | Besoin métier non couvert |

**Décision :** **Option A validée** par Promoteur Métier (2026-10-28)

**Implémentation dans v2 :**

- Ajout `prixAchat?: string` sur `Materiau` (optionnel, stocké en string)
- Marge = `(Total HT - Σ(prixAchat × quantite)) / Total HT`
- Si `prixAchat` manquant → marge = `null` (non calculable)
- Division par zéro → `null`

**Validation :** ✅ Promoteur Métier — "Utile pour négociation, optionnel au début"

---

### DEC-003 — TanStack Query v5 dans MVP

**Contexte :** ANOM-G-004 (MAJEUR) — Dépendance `@tanstack/react-query: ^5.20.0` incluse mais pas de `QueryClient` / Provider / hooks dans architecture.

**Options évaluées :**
| Option | Description | Avantages | Inconvénients |
|--------|-------------|-----------|---------------|
| **A** | Retirer du MVP (YAGNI) — Garder pour Phase 4 (Sync) | Bundle -15kb, pas de code mort, focus MVP | Réintégration Phase 4 |
| B | Intégrer minimal (`QueryClientProvider` + wrappers) | Prêt sync future | Poids bundle, complexité non utilisée v1 |

**Décision :** **Option A validée** par Tech Lead (2026-10-28)

**Justification :**

- MVP = 100% local, pas de server state
- TanStack Query = cache serveur, invalidation, mutations optimistes → inutile offline-first
- Réintégration Phase 4 quand sync réelle (Background Sync API / Supabase) justifiée

**Implémentation dans v2 :**

- Supprimé `@tanstack/react-query` du `package.json` v2
- Note dans ADR-005 : "TanStack Query — Phase 4 (Sync)"

**Validation :** ✅ Tech Lead — "YAGNI confirmé, économie bundle + simplicité"

---

### DEC-004 — Vector Clocks MVP

**Contexte :** ANOM-G-005 (MAJEUR) — Interface `vectorClock?: Record<string, number>` définie sur `SyncEvent` mais aucune logique d'incrémentation/fusion/comparaison.

**Options évaluées :**
| Option | Description | Avantages | Inconvénients |
|--------|-------------|-----------|---------------|
| **A** | Type seulement dans MVP, implémentation complète Phase 4 | Honnête, pas de code mort, préparé | Type "dormant" v1 |
| B | Implémenter basique (deviceId + counter) | Fonctionnel minimal | Risque bug sync, complexité prématurée |
| C | Retirer complètement | Propre | Perte préparation sync |

**Décision :** **Option A validée** par Tech Lead (2026-10-28)

**Implémentation dans v2 :**

- `vectorClock?: Record<string, number>` conservé sur `SyncEvent` (type seulement)
- Commentaire : `// Type seulement (DEC-004), implémentation Phase 4`
- Implémentation `VectorClock` class (incrémentation, merge, compare) planifiée Phase 4

**Validation :** ✅ Tech Lead — "Pas de fake implémentation, honnêteté technique"

---

### DEC-005 — Police PDF Embarquée

**Contexte :** ANOM-F-001 (BLOQUANT) — `@react-pdf/renderer` n'embarque pas de polices. Helvetica = police standard PDF non embarquée → rendu incohérent mobile.

**Options évaluées :**
| Option | Police | Taille ~ | Caractères FCFA/Accents | Licence |
|--------|--------|----------|------------------------|---------|
| **A** | Inter (@fontsource/inter) | ~50 KB | ✅ Complet (Latin Extended) | SIL OFL |
| B | DejaVu Sans | ~100 KB | ✅ Complet | Bitstream Vera |
| C | Noto Sans | ~200 KB | ✅ Universel | SIL OFL |

**Décision :** **Option A validée** par Tech Lead (2026-10-28)

**Justification :**

- Inter déjà utilisée en UI (Tailwind config) → cohérence visuelle
- Taille minimale (~50 KB vs 100-200 KB)
- Support complet caractères FCFA (₣, espace insécable) + accents français
- Auto-hébergée via `@fontsource/inter` (pas de requête Google Fonts offline)

**Implémentation dans v2 :**

- Ajout `@fontsource/inter` en dépendance
- `Font.register({ family: 'Inter', src: '...' })` dans `DevisPDF.tsx`
- `fontFamily: 'Inter'` dans StyleSheet PDF

**Validation :** ✅ Tech Lead — "Cohérence UI/PDF, taille optimale, offline-compatible"

---

### DEC-006 — Stockage Backup Automatique

**Contexte :** ANOM-D-002 (BLOQUANT) — Backup auto `localStorage` toutes les 5 min → quota 5 MB dépassé (estimation 500 KB/backup → 10 backups = quota plein).

**Options évaluées :**
| Option | Stockage | Quota | Persistance | Complexité |
|--------|----------|-------|-------------|------------|
| **A** | Table `_backup` IndexedDB | ~50-80% disque (GB) | ✅ Survie clear cache | Faible (Dexie natif) |
| B | localStorage + compression LZ-string + rotation 3 | 5 MB max | ❌ Clear cache = perte | Moyenne |
| C | OPFS (Origin Private File System) | Disque illimité | ✅ | API récente, support navigateur partiel |

**Décision :** **Option A validée** par Tech Lead (2026-10-28)

**Implémentation dans v2 :**

- Table `_backup` dans Dexie stores : `_backup: 'id, timestamp'`
- Interface `BackupRecord` avec `data`, `version`, `schemaVersion`
- Intervalle 5 min, rotation 3 derniers, TTL 30 jours
- Hook `useStorageQuota()` monitoring `navigator.storage.estimate()` → alerte 80%

**Validation :** ✅ Tech Lead — "IndexedDB natif, pas de quota artificiel, cohérent architecture"

---

### DEC-007 — Versionning Format Export

**Contexte :** ANOM-D-004 (MAJEUR) — Pas de stratégie migration export v1.0 → v2.0.

**Options évaluées :**
| Option | Description | Avantages | Inconvénients |
|--------|-------------|-----------|---------------|
| **A** | `schemaVersion` par entité (granulaire) | Migration fine, rollback partiel possible | Légère complexité |
| B | `exportVersion` global seulement | Simple | Tout ou rien, moins flexible |
| C | Les deux (global + par entité) | Max flexibilité | Redondance |

**Décision :** **Option A validée** par Tech Lead (2026-10-28)

**Implémentation dans v2 :**

- `schemaVersion: number` (défaut 1) sur CHAQUE entité : `Client`, `Materiau`, `Devis`, `SyncEvent`, `BackupRecord`
- `version` (format export) + `schemaVersion` (schéma données) dans `ExportFormat`
- Fonction `migrateExport(data, fromVersion, toVersion)` dans `lib/export/migrate.ts`
- Migration v1.0 → v2.0 implémentée (suppression champs calculés, stringification prix, ajouts champs v2)

**Validation :** ✅ Tech Lead — "Granulaire, migrable, future-proof"

---

## Matrice Traçabilité Décisions ↔ Anomalies

| Décision | Anomalies Résolues  | Anomalies Atténuées              |
| -------- | ------------------- | -------------------------------- |
| DEC-001  | C-002, C-003, C-004 | —                                |
| DEC-002  | B-003               | —                                |
| DEC-003  | G-004               | —                                |
| DEC-004  | G-005               | —                                |
| DEC-005  | F-001               | —                                |
| DEC-006  | D-002               | D-005 (classification sensibles) |
| DEC-007  | D-004               | D-001 (format export v2)         |

---

## Processus de Validation

1. **Proposition** : Tech Lead identifie décision nécessaire (audit Phase 2/3)
2. **Documentation** : Fiche décision rédigée (contexte, options, recommandation)
3. **Validation** : Promoteur Métier (décisions métier) OU Tech Lead (décisions techniques)
4. **Traçabilité** : Enregistrement dans ce registre + lien dans cahier v2
5. **Verrouillage** : Aucune modification sans nouveau cycle validation

---

## Décisions Futures (Post-MVP, Phase 4+)

| ID Prévu | Sujet                                                    | Déclencheur                 |
| -------- | -------------------------------------------------------- | --------------------------- |
| DEC-008  | Stratégie sync réelle (Background Sync / Yjs / Supabase) | Besoin multi-appareils réel |
| DEC-009  | Implémentation Vector Clocks complète                    | DEC-008 validée             |
| DEC-010  | Chiffrement données sensibles (Web Crypto API)           | Exigence sécurité client    |
| DEC-011  | Internationalisation (Bassa, Ewondo, Fulfulde)           | Demande utilisateurs        |
| DEC-012  | Mode "Entreprise" multi-utilisateurs / rôles             | Croissance équipe           |

---

**Fin du registre des décisions.**  
7 décisions verrouillées pour développement Phase 1. Toute modification nécessite nouveau cycle validation promoteur.
