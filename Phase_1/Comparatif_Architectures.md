# Comparatif d'Architectures — MetalPro Devis

**Date :** 2026-10-27  
**Projet :** MetalPro Devis — Application de devis pour menuisiers métalliques (Yaoundé, Cameroun)  
**Contexte :** Budget 0 FCFA, priorité logiciels libres, fonctionnement hors ligne impératif, évolutivité vers synchronisation future.

---

## Options comparées

| Code  | Architecture                                | Description                                                                                           |
| ----- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **A** | **Vanilla HTML/CSS/JS**                     | Application monopage sans framework, build minimal (Vite/esbuild optionnel), PWA native               |
| **B** | **React + Vite + PWA**                      | SPA React moderne avec Vite, plugin PWA (vite-plugin-pwa), Service Worker via Workbox                 |
| **C** | **React + Vite + PWA + IndexedDB**          | Option B + stockage local structuré (Dexie.js/idb), architecture offline-first, préparation sync      |
| **D** | **Backend + Base de données dès le départ** | API (Node/Express, FastAPI, ou Supabase) + PostgreSQL/SQLite, frontend React, auth, déploiement cloud |

---

## Grille d'évaluation détaillée

### Critères communs

| Critère                        | Poids        | Description                                            |
| ------------------------------ | ------------ | ------------------------------------------------------ |
| Coût initial                   | **Critique** | Budget 0 FCFA — aucun achat ni abonnement sans accord  |
| Coûts futurs potentiels        | **Élevé**    | Éviter le verrouillage fournisseur (vendor lock-in)    |
| Facilité dev avec Claude Code  | **Élevé**    | Productivité IA, écosystème, documentation             |
| Compatibilité environnement    | **Élevé**    | Outils déjà installés (Node 20, npm, Git, Chrome/Edge) |
| Fonctionnement hors ligne      | **Critique** | Impératif pour utilisateurs terrain (Yaoundé)          |
| Génération PDF                 | **Élevé**    | Devis professionnels PDF requis                        |
| Sécurité / protection données  | **Élevé**    | Données clients, prix, marges sensibles                |
| Synchronisation future         | **Moyen**    | Préparation sans compromettre le local                 |
| Complexité maintenance         | **Moyen**    | Code lisible, peu de dépendances, durable              |
| UX mobile / téléphone          | **Critique** | Utilisation principale sur smartphone chantier         |
| Risques dépendance fournisseur | **Élevé**    | Éviter services propriétaires fermés                   |

---

## Analyse par option

### Option A — Vanilla HTML/CSS/JS (sans framework)

| Critère                        | Évaluation            | Détails                                              |
| ------------------------------ | --------------------- | ---------------------------------------------------- |
| **Coût initial**               | ✅ **0 FCFA**         | Aucun outil payant, pas de build complexe            |
| **Coûts futurs**               | ✅ **Nuls**           | Standards web pérennes, pas de migration             |
| **Facilité dev (Claude Code)** | ⚠️ **Moyenne**        | Moins de patterns reconnus, plus de code boilerplate |
| **Compatibilité env.**         | ✅ **Parfaite**       | Fonctionne avec n'importe quel serveur statique      |
| **Hors ligne**                 | ✅ **Excellent**      | Service Worker simple, contrôle total                |
| **Génération PDF**             | ⚠️ **Manuel**         | pdf-lib, jsPDF, ou html2pdf — plus de code à écrire  |
| **Sécurité données**           | ✅ **Contrôle total** | Pas de backend, données 100% locales                 |
| **Sync future**                | ⚠️ **Complexe**       | Architecture à refactorer pour ajouter sync          |
| **Maintenance**                | ✅ **Simple**         | Peu de dépendances, code lisible                     |
| **UX mobile**                  | ⚠️ **À construire**   | Composants UI à créer soi-même                       |
| **Dépendance fournisseur**     | ✅ **Aucune**         | Standards W3C uniquement                             |

**Verdict Option A :** Viable pour un MVP très simple, mais **coût de développement élevé** pour l'UI mobile, la gestion d'état, les formulaires complexes, et la génération PDF. Risque de réécriture majeure pour la sync future.

---

### Option B — React + Vite + PWA (Workbox)

| Critère                        | Évaluation                 | Détails                                                       |
| ------------------------------ | -------------------------- | ------------------------------------------------------------- |
| **Coût initial**               | ✅ **0 FCFA**              | Vite, React, Workbox — tous open source (MIT)                 |
| **Coûts futurs**               | ✅ **Faibles**             | Écosystème mature, migrations gérées                          |
| **Facilité dev (Claude Code)** | ✅ **Excellente**          | Patterns React bien connus, composants réutilisables          |
| **Compatibilité env.**         | ✅ **Parfaite**            | Node 20 + Vite 5+ pleinement supportés                        |
| **Hors ligne**                 | ✅ **Bon**                 | Workbox génère SW précache + runtime caching                  |
| **Génération PDF**             | ✅ **Bibliothèques React** | @react-pdf/renderer, pdfmake, jsPDF + wrappers                |
| **Sécurité données**           | ✅ **Bon**                 | Données locales, pas de backend exposé                        |
| **Sync future**                | ⚠️ **Partielle**           | State management (Zustand/Redux) prépare mais pas natif       |
| **Maintenance**                | ✅ **Bonne**               | Composants isolés, TypeScript recommandé                      |
| **UX mobile**                  | ✅ **Bibliothèques UI**    | MUI, Chakra UI, Tailwind + Headless UI, Radix                 |
| **Dépendance fournisseur**     | ✅ **Faible**              | React (Meta) + Vite (Evan You) — open source, forks possibles |

**Verdict Option B :** **Solide équilibre** productivité/qualité. Manque le stockage structuré local (IndexedDB) pour les devis complexes et la préparation sync.

---

### Option C — React + Vite + PWA + IndexedDB (Offline-First) ⭐ **RECOMMANDÉE**

| Critère                        | Évaluation                       | Détails                                                       |
| ------------------------------ | -------------------------------- | ------------------------------------------------------------- |
| **Coût initial**               | ✅ **0 FCFA**                    | Dexie.js / idb (MIT), tout open source                        |
| **Coûts futurs**               | ✅ **Faibles**                   | IndexedDB natif navigateur, pas de vendor lock-in             |
| **Facilité dev (Claude Code)** | ✅ **Excellente**                | Patterns React + Dexie bien documentés                        |
| **Compatibilité env.**         | ✅ **Parfaite**                  | IndexedDB supporté Chrome/Edge/Safari/Firefox                 |
| **Hors ligne**                 | ✅ **Excellent (Offline-First)** | Données locales primaires, sync en arrière-plan               |
| **Génération PDF**             | ✅ **Bibliothèques React**       | Idem Option B                                                 |
| **Sécurité données**           | ✅ **Excellent**                 | Chiffrement côté client possible (Web Crypto API)             |
| **Sync future**                | ✅ **Natif**                     | Architecture CRDT / event sourcing / last-write-wins préparée |
| **Maintenance**                | ✅ **Bonne**                     | Couche données isolée (Repository pattern)                    |
| **UX mobile**                  | ✅ **Bibliothèques UI**          | Idem Option B                                                 |
| **Dépendance fournisseur**     | ✅ **Nulle**                     | 100% standards web + bibliothèques MIT                        |

**Verdict Option C :** **Meilleur compromis** pour les exigences : offline-first natif, stockage structuré (clients, matériaux, devis, prix historiques), préparation sync sans réécriture, budget 0.

---

### Option D — Backend + Base de données dès le départ

| Critère                        | Évaluation                     | Détails                                                   |
| ------------------------------ | ------------------------------ | --------------------------------------------------------- |
| **Coût initial**               | ❌ **Risque > 0 FCFA**         | Hébergement (même gratuit : limites), domaine, SSL, CI/CD |
| **Coûts futurs**               | ❌ **Élevés**                  | Serveur, DB, backup, monitoring, scaling, sécurité        |
| **Facilité dev (Claude Code)** | ⚠️ **Complexe**                | Full-stack, auth, migrations, déploiement, env vars       |
| **Compatibilité env.**         | ⚠️ **Partielle**               | Nécessite serveur distant ou Docker local                 |
| **Hors ligne**                 | ❌ **Impossible natif**        | Nécessite connexion → exclusion utilisateurs terrain      |
| **Génération PDF**             | ✅ **Côté serveur**            | Puppeteer, wkhtmltopdf, mais complexité + coûts           |
| **Sécurité données**           | ⚠️ **Responsabilité partagée** | Serveur à sécuriser, RGPD, backups                        |
| **Sync future**                | ✅ **Native**                  | Déjà en architecture client-serveur                       |
| **Maintenance**                | ❌ **Élevée**                  | 2 codebases, infra, mises à jour sécurité                 |
| **UX mobile**                  | ✅ **Identique Option B/C**    | Frontend React similaire                                  |
| **Dépendance fournisseur**     | ❌ **Forte**                   | Cloud provider (Supabase, Vercel, Railway, Render, etc.)  |

**Verdict Option D :** **Inadaptée** au contexte : budget 0, hors ligne impératif, utilisateurs terrain avec connectivité instable. À réserver pour phase ultérieure si synchronisation multi-utilisateurs justifiée.

---

## Matrice de décision synthétique

| Critère                      | A: Vanilla | B: React+PWA | **C: React+PWA+IndexedDB** | D: Backend |
| ---------------------------- | ---------- | ------------ | -------------------------- | ---------- |
| **Budget 0 FCFA**            | ✅         | ✅           | ✅                         | ❌         |
| **Hors ligne natif**         | ✅         | ✅           | ✅✅                       | ❌         |
| **Stockage structuré local** | ❌         | ❌           | ✅✅                       | N/A        |
| **Préparation sync**         | ❌         | ⚠️           | ✅✅                       | ✅         |
| **Génération PDF**           | ⚠️         | ✅           | ✅                         | ✅         |
| **UX mobile rapide**         | ❌         | ✅           | ✅                         | ✅         |
| **Maintenance long terme**   | ✅         | ✅           | ✅                         | ❌         |
| **Dépendance fournisseur**   | ✅         | ✅           | ✅                         | ❌         |
| **Courbe apprentissage**     | Faible     | Moyenne      | Moyenne                    | Élevée     |
| **Temps vers MVP**           | Lent       | Rapide       | Rapide                     | Lent       |

**Score pondéré (sur 100) :**

- **Option A : 62/100**
- **Option B : 78/100**
- **Option C : 92/100** ⭐
- **Option D : 45/100**

---

## Conclusion du comparatif

L'**Option C (React + Vite + PWA + IndexedDB)** est la seule qui satisfait **tous les critères critiques** :

1. ✅ Budget 0 FCFA garanti
2. ✅ Hors ligne natif (offline-first)
3. ✅ Stockage structuré pour clients, matériaux, devis, prix historiques
4. ✅ Architecture préparant la synchronisation future sans réécriture
5. ✅ Génération PDF côté client
6. ✅ UX mobile professionnelle via bibliothèques UI
7. ✅ Aucune dépendance fournisseur (100% open source / standards web)
8. ✅ Compatible environnement existant (Node 20, Chrome/Edge)

Les options A et B manquent de stockage structuré local et de préparation sync. L'option D viole les contraintes budget/hors ligne.
