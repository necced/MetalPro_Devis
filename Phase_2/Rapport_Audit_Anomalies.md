# Rapport d'Audit d'Anomalies — MetalPro Devis MVP

**Date :** 2026-10-28  
**Version :** 1.0  
**Document audité :** `Cahier_Des_Charges_Technique_MVP.md` (v1.0 du 2026-10-27)  
**Références croisées :** `Recommandation_Architecture.md`, `Solutions_Gratuites.md`, `Comparatif_Architectures.md`, `Contre_Expertise_DeepSeek.md`

---

## Résumé Exécutif

| Domaine                          | Anomalies BLOQUANT | Anomalies MAJEUR | Anomalies MINEUR | Total  |
| -------------------------------- | ------------------ | ---------------- | ---------------- | ------ |
| **A. Modèle de données**         | 2                  | 3                | 2                | 7      |
| **B. Calculs financiers**        | 1                  | 2                | 3                | 6      |
| **C. TVA Cameroun**              | 1                  | 2                | 1                | 4      |
| **D. Sauvegarde/Restauration**   | 3                  | 2                | 1                | 6      |
| **E. Offline-first / PWA**       | 0                  | 3                | 2                | 5      |
| **F. PDF (@react-pdf/renderer)** | 1                  | 2                | 3                | 6      |
| **G. Architecture / Couplage**   | 2                  | 3                | 2                | 7      |
| **TOTAL**                        | **10**             | **17**           | **14**           | **41** |

**Verdict :** Le cahier des charges **n'est pas prêt pour le développement**. 10 anomalies BLOQUANTES doivent être corrigées avant tout démarrage de code.

---

## A. Modèle de Données — Cohérence, Contraintes, Migrations

### ANOM-A-001 [BLOQUANT] — Incohérence schémas entre Cahier et Recommandation

**Localisation :** `Cahier_Des_Charges` lignes 102-151 vs `Recommandation_Architecture` lignes 129-181  
**Description :** Le schéma `Devis` du Cahier inclut `totalHT`, `tva`, `totalTTC` comme champs stockés (lignes 134-136), alors que la Recommandation (ligne 163-165) les définit aussi mais le pattern offline-first impose de **ne pas stocker des valeurs calculées** — elles doivent être dérivées à la lecture depuis les lignes.  
**Conséquence :** Risque de divergence entre totaux stockés et totaux recalculés (ex: modification prix matériau après création devis). Perte de l'historique prix réel si on recalcule à la volée.  
**Correction :** Supprimer `totalHT`, `tva`, `totalTTC` du schéma `Devis` Dexie. Ajouter une vue calculée `useDevisCalculations(devis)` qui derive les totaux depuis `lignes[]` avec `decimal.js`. Conserver la copie `prixUnitaire` dans `LigneDevis` (déjà correct ligne 126).

---

### ANOM-A-002 [BLOQUANT] — Table `_syncQueue` absente du schéma Dexie

**Localisation :** Cahier ligne 143-150 (`SyncEvent` défini) mais **absent** de `stores()` Dexie ; Recommandation ligne 179 mentionne `_syncQueue` peuplée par hooks.  
**Description :** L'interface `SyncEvent` est documentée mais la table correspondante n'est pas déclarée dans `MetalProDB.version(1).stores()`.  
**Conséquence :** Impossible d'enregistrer les événements de sync → préparation sync future cassée. Erreur runtime `db._syncQueue is undefined`.  
**Correction :** Ajouter `_syncQueue: 'id, entity, action, timestamp, deviceId'` dans `stores()`. Définir l'interface complète avec `vectorClock?: Record<string, number>`.

---

### ANOM-A-003 [MAJEUR] — Pas de champ `version` / `schemaVersion` sur les entités

**Localisation :** Schémas `Client`, `Materiau`, `Devis`, `SyncEvent`  
**Description :** Aucune propriété `schemaVersion: number` ou `version: number` sur les entités pour gérer les migrations Dexie futures.  
**Conséquence :** Migration v2 → v3 impossible sans heuristiques fragiles (détection par présence/absence de champs).  
**Correction :** Ajouter `schemaVersion: number` (défaut 1) sur chaque entité. Documenter la stratégie de migration dans `db/migrations/`.

---

### ANOM-A-004 [MAJEUR] — Index manquants pour requêtes fréquentes

**Localisation :** `stores()` Dexie lignes 62-64 (Recommandation)  
**Description :** Index déclarés : `clients: 'id, nom, telephone, createdAt'` — manque index composé `nom+telephone` pour recherche combinée. `devis: 'id, clientId, statut, createdAt, updatedAt'` — manque `clientId+statut` pour filtre "devis du client X avec statut Y".  
**Conséquence :** Requêtes lentes sur gros volumes (scan full table).  
**Correction :** Ajouter index composés : `clients: 'id, nom, telephone, createdAt, [nom+telephone]'` et `devis: 'id, clientId, statut, createdAt, updatedAt, [clientId+statut]'`.

---

### ANOM-A-005 [MAJEUR] — Contraintes d'intégrité non définies

**Localisation :** Schéma `LigneDevis` (ligne 123-128 Cahier)  
**Description :** `materiauId` référence `Materiau.id` mais aucune contrainte FK (Dexie ne supporte pas FK natives). Pas de validation à l'insertion qu'un `materiauId` existe.  
**Conséquence :** Devis orphelins (matériau supprimé) → erreur calculs / PDF incomplet.  
**Correction :** Implémenter validation applicative dans hook `devis.hook('creating', ...)` : vérifier existence de chaque `materiauId` dans `db.materiaux`. Refuser si manquant.

---

### ANOM-A-006 [MINEUR] — `email` optionnel mais pas validé format

**Localisation :** `Client.email?: string` (ligne 108)  
**Description :** Champ optionnel sans contrainte de format (regex email).  
**Conséquence :** Données sales (ex: "jean@") → problèmes envoi devis par email futur.  
**Correction :** Ajouter validation Zod `email: z.string().email().optional()` dans schema client.

---

### ANOM-A-007 [MINEUR] — `unite` comme string littéral vs enum TypeScript

**Localisation :** `Materiau.unite: 'm' | 'm2' | 'kg' | 'pcs'` (ligne 117)  
**Description :** Union type correct en TS mais pas de constante partagée pour réutilisation (UI select, validation, PDF).  
**Conséquence :** Duplication des valeurs dans composants Select, risque décalage.  
**Correction :** Définir `export const UNITES = ['m', 'm2', 'kg', 'pcs'] as const` dans `shared/constants/` et typer `unite: UniteType`.

---

## B. Calculs Financiers — Decimal.js, Arrondis, TVA, Marges

### ANOM-B-001 [BLOQUANT] — Configuration Decimal.js absente (précision, arrondi)

**Localisation :** Cahier ligne 287 "Decimal.js pour précision", ligne 118 `prixUnitaire: number`  
**Description :** `decimal.js` importé mais **aucune configuration globale** : `Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })` manquante. Pas de wrapper utilitaire `FCFA` / `DecimalFCFA`.  
**Conséquence :** Comportement par défaut `precision: 20`, `rounding: ROUND_HALF_EVEN` (banker's rounding) → arrondis incorrects pour FCFA (ex: 100.005 → 100 au lieu de 101).  
**Correction :** Créer `shared/utils/decimal.ts` :

```ts
import Decimal from 'decimal.js';
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });
export const D = (v: number | string) => new Decimal(v);
export const toFCFA = (d: Decimal) => d.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
```

---

### ANOM-B-002 [MAJEUR] — Règle arrondi FCFA non formalisée (seulement "pas de centimes")

**Localisation :** Cahier ligne 287 "arrondi FCFA (pas de centimes)", ligne 316 "Pas de centimes dans les totaux affichés"  
**Description :** Règle énoncée mais **pas de spécification** : arrondi au FCFA supérieur ? Inférieur ? Banker's rounding ? Seuil 0.5 ?  
**Conséquence :** Incohérence entre calculs UI, PDF, export. Litiges clients possibles.  
**Correction :** Spécifier explicitement : **Arrondi commercial au FCFA le plus proche (0.5 → supérieur)**. Implémenter dans `toFCFA()` unique. Tests unitaires : `toFCFA(D(100.4)) === 100`, `toFCFA(D(100.5)) === 101`, `toFCFA(D(100.6)) === 101`.

---

### ANOM-B-003 [MAJEUR] — Formule marge incomplète / ambiguë

**Localisation :** Cahier ligne 289 "Marges : Calculées comme (Prix Vente - Coût Total) / Prix Vente"  
**Description :** Formule donnée mais : (1) `Coût Total` non défini (somme `prixUnitaire * quantite` des lignes ? ou coût d'achat matériaux ?), (2) pas de distinction marge brute / nette, (3) pas de gestion division par zéro (Prix Vente = 0).  
**Conséquence :** Calculs erronés si `prixUnitaire` = prix vente vs prix achat. Crash si devis à 0.  
**Correction :** Clarifier : `Marge = (Total HT - Coût Total Achats) / Total HT`. Ajouter champ `prixAchat` optionnel sur `Materiau`. Si absent, marge = null (non calculable). Gérer division par zéro → retourner `null`.

---

### ANOM-B-004 [MINEUR] — Quantités en `number` sans contrainte positive

**Localisation :** `LigneDevis.quantite: number` (ligne 125)  
**Description :** Pas de validation `quantite > 0`. `number` accepte négatif, NaN, Infinity.  
**Conséquence :** Devis corrompus (quantité -5 → total négatif).  
**Correction :** Zod schema : `quantite: z.number().positive().finite()`. Type TS : `quantite: number & { readonly __brand: 'PositiveNumber' }` (branding).

---

### ANOM-B-005 [MINEUR] — Prix unitaire `number` au lieu de `Decimal` en runtime

**Localisation :** `Materiau.prixUnitaire: number`, `LigneDevis.prixUnitaire: number`  
**Description :** TypeScript `number` mais recommandation "Decimal.js pour précision". En runtime, valeurs stockées en `number` (IEEE 754) → perte précision avant calcul.  
**Conséquence :** Erreurs accumulation sur gros devis (ex: 1000 lignes × 0.01 FCFA erreur).  
**Correction :** Stocker en `string` (représentation exacte) ou `number` mais **toujours convertir via `D()` avant tout calcul**. Documenter convention : "Stockage = string JSON, Calcul = Decimal".

---

### ANOM-B-006 [MINEUR] — Pas de tests de régression calculs spécifiés

**Localisation :** Cahier section 5.1 "Tests de Calculs"  
**Description :** Critères de succès listés mais **pas de cas de test concrets** (valeurs d'entrée, sorties attendues).  
**Correction :** Ajouter matrice de tests dans livrable "Matrice de Tests" (Phase 4) : 10 cas couvrants (entiers, décimales, arrondis limites, gros volumes, TVA, marge, division zéro).

---

## C. TVA Cameroun — Taux, Assujettissement, Mentions Légales

### ANOM-C-001 [BLOQUANT] — Taux TVA 19.25% non justifié / potentiellement incorrect

**Localisation :** Cahier ligne 374-375 exemple PDF : "TVA (19.25%)" → 211,750 sur 1,100,000 HT  
**Description :** Taux 19.25% utilisé mais **aucune source officielle citée**. Au Cameroun, taux TVA standard = **19.25%** (depuis 2019, loi de finances) — **correct** mais non documenté. Risque si taux change.  
**Conséquence :** Si taux évolue (ex: 18% ou 20%), tous devis existants faux. Pas de traçabilité du taux appliqué.  
**Correction :** Définir constante `TVA_RATE = 0.1925` dans `shared/constants/tva.ts` avec commentaire source (Loi de Finances 2019, art. X). Stocker `tvaRateApplied: number` dans chaque `Devis` pour historicalité.

---

### ANOM-C-002 [MAJEUR] — Pas de gestion régimes TVA (réel simplifié / normal / exonéré)

**Localisation :** Cahier section 4.1, 7.1 — aucun mention  
**Description :** Au Cameroun, entreprises peuvent être : (1) Régime réel normal (TVA 19.25%), (2) Régime réel simplifié (TVA 19.25% mais déclarations simplifiées), (3) Exonérées (export, certains secteurs). Le cahier suppose un taux unique.  
**Conséquence :** Devis invalides pour clients exonérés ou régimes spéciaux. Non-conformité fiscale.  
**Correction :** Ajouter champ `tvaRegime: 'normal' | 'simplifie' | 'exonere'` sur `Client` (défaut 'normal'). Si 'exonere' → `tva = 0`, mention "TVA non applicable (art. CGI XXX)" sur PDF.

---

### ANOM-C-003 [MAJEUR] — Mentions légales obligatoires manquantes sur PDF

**Localisation :** Cahier section 7.1 exemple PDF  
**Description :** Exemple PDF (lignes 361-383) **ne contient pas** les mentions légales obligatoires Cameroun :

- Numéro d'identification contribuable (NIF) émetteur
- "TVA non applicable" ou "TVA 19.25%" selon régime
- Mention "Membre centre de gestion agréé" si applicable
- Numéro registre commerce (RC)  
  **Conséquence :** Devis non conformes légalement → risque redressement fiscal, refus client.  
  **Correction :** Ajouter champs `Client.nif`, `Client.rc`, `Entreprise.nif`, `Entreprise.rc` dans settings. Template PDF : mentions conditionnelles selon régime TVA client.

---

### ANOM-C-004 [MINEUR] — TVA calculée sur Total HT vs par ligne

**Localisation :** Cahier ligne 135 `tva: number` (niveau devis)  
**Description :** TVA stockée au niveau devis. Pratique mais si lignes ont régimes TVA différents (ex: matériel exonéré + main d'œuvre taxée), calcul global faux.  
**Correction :** Prévoir `tvaRate` par `LigneDevis` (optionnel, défaut = taux global). Calcul TVA = somme(`ligne.prixUnitaire * ligne.quantite * ligne.tvaRate`).

---

## D. Sauvegarde / Restauration — Export/Import, Validation, Conflits

### ANOM-D-001 [BLOQUANT] — `db.dump()` et `db.import()` **n'existent pas** dans Dexie.js

**Localisation :** Cahier lignes 175-177, 266-267, 322-323, `Solutions_Gratuites` ligne 175-177  
**Description :** Le code `JSON.stringify(db.dump())` et `db.import()` est **faux** — Dexie n'a **pas** ces méthodes. API réelle : `db.export()` (depuis v3) et `Dexie.import()` statique, ou itération manuelle tables.  
**Conséquence :** Code de backup/restore **ne compile pas** / **échoue à l'exécution**. Fonctionnalité critique cassée.  
**Correction :** Remplacer par implémentation correcte :

```ts
// Export
const data = await db.transaction('r', db.clients, db.materiaux, db.devis, async () => ({
  version: '1.0',
  timestamp: Date.now(),
  clients: await db.clients.toArray(),
  materiaux: await db.materiaux.toArray(),
  devis: await db.devis.toArray(),
}));

// Import
await Dexie.import(data, { overwriteValues: true }); // ou transaction manuelle
```

---

### ANOM-D-002 [BLOQUANT] — Backup auto `localStorage` toutes les 5 min → **quota 5 MB dépassé**

**Localisation :** Cahier ligne 268, `Solutions_Gratuites` ligne 177  
**Description :** `localStorage.setItem('backup', JSON.stringify(...))` toutes les 5 min. Données : clients + matériaux + devis. Estimation : 100 clients + 200 matériaux + 500 devis ≈ 500 KB JSON → **1 backup = 500 KB**. localStorage = **5 MB max** → **10 backups = quota plein**. Pas de rotation.  
**Conséquence :** `QuotaExceededError` → backup silencieux échoue → perte données silencieuse.  
**Correction :** (1) Utiliser IndexedDB pour backup (table `_backup` avec TTL), pas localStorage. (2) Si localStorage obligatoire : compression LZ-string + rotation (garder 3 derniers). (3) Alerte utilisateur si quota > 80%.

---

### ANOM-D-003 [BLOQUANT] — Import sans validation schéma ni résolution conflits

**Localisation :** Cahier lignes 267, 301-303, 323-324  
**Description :** Critères : "Validation avant import, rapport des conflits, confirmation" mais **aucune spécification** : quel validateur ? (Zod ? JSON Schema ?) Quels conflits ? (IDs doublons ? versions ?) Quelle UI de résolution ?  
**Conséquence :** Import corrompt la base (données invalides, doublons, perte données locales).  
**Correction :** Spécifier pipeline import :

1. Parse JSON → valider structure racine (version, timestamp, arrays)
2. Valider chaque entité avec schémas Zod (réutiliser schemas features)
3. Détecter conflits : `id` existant + `updatedAt` distant > local → stratégie LWW ou prompt utilisateur
4. Rapport détaillé : `{ imported: N, skipped: M, conflicts: [{ id, local, remote, resolution }] }`
5. Transaction Dexie atomique (tout ou rien)

---

### ANOM-D-004 [MAJEUR] — Pas de versionning format export / compatibilité future

**Localisation :** Cahier ligne 389 `"version": "1.0"` dans exemple export  
**Description :** Version présente mais **pas de stratégie de migration** : comment importer v1.0 dans app v2.0 ? Pas de `migrateExportData(v1 → v2)`.  
**Conséquence :** Casse import après évolution schéma (champs renommés, ajout obligatoires).  
**Correction :** Définir `export interface ExportFormat { version: string; schemaVersion: number; ... }`. Implémenter `migrateExport(data, fromVersion, toVersion)` dans `lib/export/migrate.ts`.

---

### ANOM-D-005 [MAJEUR] — Export "pas de données sensibles" mais définition floue

**Localisation :** Cahier ligne 302 "Pas de données sensibles dans les exports"  
**Description :** Qu'est-ce que "sensible" ? Prix d'achat (marge) ? Téléphone client ? NIF ? Pas de classification.  
**Conséquence :** Fuite infos commerciales (marges) ou PII (téléphone) si export partagé.  
**Correction :** Classifier champs : `public` (nom, adresse), `commercial` (prix vente), `sensitive` (prix achat, téléphone, NIF). Option export "Complet" vs "Partage client" (sans prix achat, sans téléphone).

---

### ANOM-D-006 [MINEUR] — Partage Web Share API : fallback non spécifié

**Localisation :** Cahier ligne 277, 332, `Solutions_Gratuites` ligne 179  
**Description :** `navigator.share()` non supporté sur tous navigateurs (Safari iOS limitations, desktop). Pas de fallback (téléchargement fichier, copie lien).  
**Correction :** Implémenter `shareDevis(devis)` : `if (navigator.canShare) await navigator.share(...); else fallbackDownload(blob)`.

---

## E. Offline-First / PWA — Service Worker, IndexedDB, UX Hors Ligne

### ANOM-E-001 [MAJEUR] — Indicateurs visuels online/offline non spécifiés

**Localisation :** Cahier section 3.6, 5.4, Recommandation ligne 222 "Indicateurs visuels (online/offline)"  
**Description :** Critère d'acceptation "Création offline" mais **pas de spec UX** : badge ? toast ? couleur header ? Icône ? Comportement au retour online ?  
**Conséquence :** Utilisateur ne sait pas s'il est offline → confusion, double-saisie, perte confiance.  
**Correction :** Spécifier composant `OnlineStatusIndicator` : (1) Icône WiFi barré + texte "Hors ligne" en header, (2) Toast "Mode hors ligne — vos données sont sauvegardées localement" à la déconnexion, (3) Sync auto + toast "Synchronisé" au retour online.

---

### ANOM-E-002 [MAJEUR] — Queue actions pending (offline) non spécifiée

**Localisation :** Cahier ligne 277 "Sync manuelle", Recommandation ligne 222 "queue actions pending"  
**Description :** Actions créées offline (créer devis, modifier client) doivent être en file d'attente pour sync future. Pas de spec : stockage ? UI ? Relecture ?  
**Conséquence :** Actions offline perdues ou non synchronisables.  
**Correction :** Utiliser table `_syncQueue` (ANOM-A-002) + UI "Actions en attente" (badge compteur sur icône sync). Au clic : liste actions avec statut (pending/synced/failed), bouton "Réessayer".

---

### ANOM-E-003 [MAJEUR] — Page `/offline.html` non spécifiée

**Localisation :** `vite.config.ts` ligne 194 `navigateFallback: '/offline.html'`  
**Description :** Fichier référencé mais **contenu non défini**. Doit affiquer : message clair, bouton "Réessayer", liste fonctionnalités dispo offline.  
**Conséquence :** Page blanche ou 404 si SW cache corrompu → utilisateur pense app cassée.  
**Correction :** Créer `public/offline.html` minimal : message "Vous êtes hors ligne", bouton "Réessayer" (`window.location.reload()`), lien "Voir devis récents" (ancre vers app si cachée).

---

### ANOM-E-004 [MINEUR] — Stratégie mise à jour SW non détaillée

**Localisation :** Recommandation ligne 260 "registration.update() au focus, notification nouvelle version"  
**Description :** `registerType: 'autoUpdate'` (Cahier ligne 169) mais pas de détail : `skipWaiting` ? `clients.claim` ? Notification utilisateur ?  
**Conséquence :** Utilisateur sur version obsolète sans le savoir.  
**Correction :** Configurer `workbox: { clientsClaim: true, skipWaiting: true }` + composant `UpdatePrompt` écoutant `swUpdate` event → toast "Nouvelle version disponible — Recharger".

---

### ANOM-E-005 [MINEUR] — Monitoring quota IndexedDB non implémenté

**Localisation :** Recommandation ligne 258 "Monitoring navigator.storage.estimate()"  
**Description :** Risque identifié (ligne 258) mais pas de code ni UI d'alerte.  
**Correction :** Hook `useStorageQuota()` : `navigator.storage.estimate()` périodique (1h) → alerte 80% + nettoyage auto devis archivés > 2 ans.

---

## F. PDF — Template, @react-pdf/renderer, Partage, Impression

### ANOM-F-001 [BLOQUANT] — Polices non embarquées → rendu incohérent / illisible

**Localisation :** `Solutions_Gratuites` ligne 88 `fontFamily: 'Helvetica'`, Cahier section 7.1  
**Description :** `@react-pdf/renderer` **n'embarque pas de polices par défaut**. `Helvetica` = police standard PDF (non embarquée) → rendu dépend des polices système client. Sur mobile Android : police de substitution → métriques différentes → débordements, pagination cassée.  
**Conséquence :** PDF professionnel impossible. Texte coupé, alignements cassés, caractères spéciaux (FCFA, accents) manquants.  
**Correction :** Embarquer police open source (ex: `Inter` ou `DejaVu Sans`) via `@react-pdf/renderer` `Font.register()`. Tester rendu mobile/desktop. Inclure dans bundle (≈ 50-100 KB).

---

### ANOM-F-002 [MAJEUR] — Pagination multi-pages non gérée

**Localisation :** Cahier section 5.3 "Pagination correcte", 7.1 exemple 1 page  
**Description :** Devis > 15 lignes → débordement page A4. `@react-pdf/renderer` gère pagination auto via `<Page>` multiples mais **pas de spec** : en-tête/pied de page répétés ? Total reporté ? "Suite page N" ?  
**Conséquence :** PDF tronqué ou illisible sur gros devis.  
**Correction :** Implémenter `DevisPDF` avec `<Document>` → `render()` pages dynamiques. Composant `PageHeader` / `PageFooter` répétés. Total TTC seulement dernière page. Test : devis 30 lignes → 2 pages correctes.

---

### ANOM-F-003 [MAJEUR] — Partage PDF offline : blob URL + Web Share API limitations

**Localisation :** Cahier ligne 277, 332, `Solutions_Gratuites` ligne 179  
**Description :** `URL.createObjectURL(blob)` + `navigator.share({ url: blobUrl })` : (1) `blob:` URLs non partageables sur tous OS (Android OK, iOS non), (2) blob URL expire si page rechargée, (3) Web Share Level 2 (fichiers) requis pour partager fichier réel.  
**Conséquence :** Partage échoue silencieusement sur iOS / desktop. Utilisateur pense bug.  
**Correction :** (1) Détecter `navigator.canShare({ files: [file] })` → partager `File` objet. (2) Fallback : téléchargement auto (`<a download>`) + message "Fichier téléchargé, partagez-le manuellement". (3) Option "Ouvrir dans..." via `window.open(blobUrl)` pour impression.

---

### ANOM-F-004 [MINEUR] — Template PDF : devises FCFA format non spécifié

**Localisation :** Cahier ligne 369-375 exemple : "500,000.00" (format FR avec virgule décimale)  
**Description :** Format affiché "500,000.00" mais FCFA **pas de centimes** (ligne 287). Incohérence : pourquoi ".00" ?  
**Correction :** Format FCFA : `new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0, maximumFractionDigits: 0 })` → "500 000 FCFA" (espace insécable, pas de décimales).

---

### ANOM-F-005 [MINEUR] — Impression navigateur (Ctrl+P) non préparée

**Localisation :** Cahier section 3.3 "Générer PDF", 5.3 "Partage"  
**Description :** Pas de `@media print` CSS pour impression directe depuis navigateur (alternative PDF).  
**Correction :** Ajouter `styles/print.css` : masquer nav, header, boutons ; afficher devis en plein largeur ; sauts de page contrôlés.

---

### ANOM-F-006 [MINEUR] — Tests visuels PDF non automatisés

**Localisation :** Cahier section 5.3, Recommandation ligne 262 "Tests visuels Playwright"  
**Description :** Critère "Template conforme" mais pas de test automatisé (pixel-perfect ou structurel).  
**Correction :** Playwright test : générer PDF → convertir en image (pdf.js) → comparer snapshot visuel (toHaveScreenshot) pour 3 cas : 1 page, 2 pages, devis vide.

---

## G. Architecture — Couplage, Boundaries, Préparation Sync, ADR

### ANOM-G-001 [BLOQUANT] — `package.json` Cahier ≠ Recommandation (dépendances manquantes)

**Localisation :** Cahier lignes 38-97 vs Recommandation lignes 290-356  
**Description :** Différences critiques :
| Dépendance | Cahier | Recommandation | Impact |
|------------|--------|----------------|--------|
| `zustand` | ❌ | ✅ 4.5.0 | État global manquant |
| `@tanstack/react-query` | ❌ | ✅ 5.20.0 | Cache serveur futur manquant |
| `@radix-ui/react-label` | ❌ | ✅ 2.0.2 | Accessibilité formulaires |
| `@radix-ui/react-slot` | ❌ | ✅ 1.0.2 | Polymorphisme composants |
| `clsx` | ❌ | ✅ 2.1.0 | Utilitaire classNames |
| `tailwind-merge` | ❌ | ✅ 2.2.0 | Fusion classes Tailwind |
| `lucide-react` | ❌ | ✅ 0.344.0 | Icônes |
| `gh-pages` | ❌ | ✅ 6.1.0 | Deploy GitHub Pages |
| `@playwright/test` | ❌ | ✅ 1.42.0 | Tests E2E |

**Conséquence :** Si on suit Cahier → code Recommandation ne compile pas (imports manquants). Incohérence source de vérité.  
**Correction :** **Aligner Cahier sur Recommandation** (plus complète). Mettre à jour `package.json` dans Cahier v2.

---

### ANOM-G-002 [BLOQUANT] — `vite.config.ts` : fix ESM `__dirname` présent dans Cahier mais **absent** de Recommandation

**Localisation :** Cahier lignes 155-163 vs Recommandation lignes 363-405  
**Description :** Cahier inclut correctement :

```ts
import { fileURLToPath } from 'url';
const __dirname = fileURLToPath(new URL('.', import.meta.url));
```

Recommandation utilise `path.resolve(__dirname, './src')` **sans définition** → `ReferenceError: __dirname is not defined` en ESM.  
**Conséquence :** Build Vite échoue si on suit Recommandation.  
**Correction :** Reporter le fix ESM dans Recommandation v2. Ajouter commentaire "Requis en ESM (type: module)".

---

### ANOM-G-003 [MAJEUR] — Pas de Repository Pattern / couche d'abstraction données

**Localisation :** Recommandation ligne 109-127 flux données : `UI → Zustand → Dexie` direct  
**Description :** Couplage direct UI → Dexie via Zustand. Pas d'interface `Repository<Client>` / `Repository<Materiau>` / `Repository<Devis>`.  
**Conséquence :** (1) Tests unitaires impossibles sans Dexie réel, (2) Migration stockage (ex: OPFS/SQLite WASM) = réécriture massive, (3) Sync future complexe (logique éparpillée).  
**Correction :** Définir `interface IRepository<T> { getAll(), getById(), create(), update(), delete(), subscribe() }`. Implémenter `DexieClientRepository`, `DexieMateriauRepository`, `DexieDevisRepository`. Injecter via Zustand ou Context.

---

### ANOM-G-004 [MAJEUR] — TanStack Query v5 inclus mais **pas de QueryClient / Provider** dans architecture

**Localisation :** Recommandation `package.json` ligne 314 `@tanstack/react-query: ^5.20.0` mais arborescence `src/` sans `QueryClientProvider`  
**Description :** Dépendance ajoutée "pour sync future" mais **aucune intégration** : pas de `QueryClient`, pas de `QueryClientProvider` dans `App.tsx`, pas de hooks `useQuery`/`useMutation` définis.  
**Conséquence :** Dépendance morte (bundle + poids). Sync future = réécriture.  
**Correction :** Soit (A) Retirer `@tanstack/react-query` du MVP (YAGNI) — garder pour Phase 4, soit (B) Intégrer minimal : `QueryClientProvider` + `useDevisQuery` / `useClientQuery` wrappers.

---

### ANOM-G-005 [MAJEUR] — Vector Clocks : interface définie mais **implémentation absente**

**Localisation :** Cahier ligne 149 `vectorClock?: Record<string, number>`, Recommandation ligne 179, 234-235  
**Description :** Type TS présent mais **aucune logique** : incrémentation ? Fusion ? Comparaison ? Résolution conflits ?  
**Conséquence :** Fausse impression de préparation sync. Code mort.  
**Correction :** Soit (A) Retirer `vectorClock` du MVP (YAGNI) — ajouter en Phase 4 avec implémentation complète, soit (B) Implémenter `VectorClock` class : `increment(deviceId)`, `merge(other)`, `compare(other)` → `'before' | 'after' | 'concurrent'`.

---

### ANOM-G-006 [MINEUR] — `tailwind.config.js` : police `Inter` référencée mais non installée

**Localisation :** Cahier ligne 214, Recommandation ligne 419 `fontFamily: { sans: ['Inter', ...] }`  
**Description :** `Inter` n'est pas une police système. Doit être importée (`@import url('https://fonts.googleapis.com/...')` ou self-hosted via `@fontsource/inter`).  
**Conséquence :** Police fallback système → incohérence visuelle.  
**Correction :** Ajouter `@fontsource/inter` en dépendance ou `@import` dans `index.css` + préchargement.

---

### ANOM-G-007 [MINEUR] — Scripts `package.json` : `knip` sans config

**Localisation :** Cahier ligne 50 `"knip": "knip"`, Recommandation ligne 304  
**Description :** `knip` nécessite `knip.config.js` pour ignorer faux positifs (ex: entry points Vite, types Dexie). Sans config → bruit CI.  
**Correction :** Ajouter `knip.config.js` minimal :

```js
export default {
  entry: ['index.html', 'src/main.tsx'],
  project: ['src/**/*.ts', 'src/**/*.tsx'],
  ignore: ['src/db/schema.ts', 'src/vite-env.d.ts'],
};
```

---

## Synthèse par Gravité

### 🔴 BLOQUANT (10) — Doivent être corrigés AVANT tout développement

1. ANOM-A-001 : Totaux stockés vs calculés (incohérence schéma)
2. ANOM-A-002 : Table `_syncQueue` manquante
3. ANOM-B-001 : Configuration Decimal.js absente
4. ANOM-C-001 : Taux TVA non documenté / non stocké par devis
5. ANOM-C-003 : Mentions légales PDF manquantes (conformité Cameroun)
6. ANOM-D-001 : `db.dump()` / `db.import()` API inexistantes
7. ANOM-D-002 : Backup localStorage quota 5 MB
8. ANOM-D-003 : Import sans validation / résolution conflits
9. ANOM-G-001 : package.json divergent (dépendances manquantes)
10. ANOM-G-002 : vite.config.ts \_\_dirname manquant dans Recommandation

### 🟠 MAJEUR (17) — Doivent être corrigés AVANT Phase 2 (développement core)

ANOM-A-003, A-004, A-005, B-002, B-003, C-002, C-004, D-004, D-005, E-001, E-002, E-003, F-001, F-002, F-003, G-003, G-004

### 🟡 MINEUR (14) — Peuvent être corrigés EN PARALLÈLE développement

ANOM-A-006, A-007, B-004, B-005, B-006, C-004, D-006, E-004, E-005, F-004, F-005, F-006, G-006, G-007

---

## Décisions Nécessitant Validation Promoteur

| ID      | Sujet                          | Options                                                                         | Recommandation                             |
| ------- | ------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------ |
| DEC-001 | Régime TVA client              | (A) Champ unique `tvaRegime` sur Client                                         | A — Simple, suffisant MVP                  |
| DEC-002 | Prix d'achat matériaux (marge) | (A) Champ `prixAchat` optionnel Materiau (B) Table separate `MateriauPrixAchat` | A — YAGNI, optionnel                       |
| DEC-003 | TanStack Query dans MVP        | (A) Retirer (YAGNI) (B) Intégrer minimal                                        | A — Retirer, Phase 4                       |
| DEC-004 | Vector Clocks MVP              | (A) Retirer type seulement (B) Implémenter basique                              | A — Type seulement, implémentation Phase 4 |
| DEC-005 | Police PDF embarquée           | (A) Inter (@fontsource) ~50KB (B) DejaVu Sans ~100KB (C) Noto Sans ~200KB       | A — Inter, déjà en UI                      |
| DEC-006 | Backup stockage                | (A) IndexedDB table `_backup` (B) localStorage compressé + rotation             | A — IndexedDB, pas de quota                |
| DEC-007 | Format export versionning      | (A) `schemaVersion` par entité (B) `exportVersion` global                       | A — Granulaire, migrable                   |

---

## Prochaines Étapes

1. **Corriger les 10 anomalies BLOQUANTES** → Produire `Cahier_Des_Charges_Technique_MVP_v2.md`
2. **Valider 7 décisions promoteur** (DEC-001 à DEC-007) → Registre décisions
3. **Produire 4 livrables restants** : Specs consolidées v2, Registre décisions, Matrice tests, Plan dev
4. **Revue technique finale** → Go/No-Go développement

---

**Fin du rapport d'audit.**  
41 anomalies identifiées. 10 bloquantes. Cahier v2 requis avant développement.
