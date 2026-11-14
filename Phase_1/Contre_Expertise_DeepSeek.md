# Contre-Expertise MetalPro Devis — DeepSeek

## Verdict Global

[✅] Option C validée [ ] Option C rejetée [ ] Option alternative recommandée

## Analyse Point par Point

### A. Architecture

- **Position : Valide**
- **Argument clé :** React 18 + Vite 5 offre le meilleur équilibre productivité/qualité pour ce contexte précis. Les alternatives crédibles (Preact, SolidJS, Svelte 5, Vanilla JS) présentent chacune des compromis défavorables : Preact perd l'écosystème React (hooks Dexie/TanStack Query, Radix, @react-pdf/renderer) pour un gain de bundle marginal (~37kb) ; SolidJS et Svelte 5 ont une maturité PWA/IndexedDB moindre et moins de patterns Claude Code ; Vanilla JS impose un coût de développement et maintenance prohibitif pour l'UI mobile, formulaires complexes, génération PDF et préparation sync. HTMX + Go/WASM est architecturalement inadapté (complexité backend local, bundle WASM, DX médiocre pour une équipe solo).
- **Alternative recommandée si invalide :** Aucune — Option C reste optimale.

### B. Stockage

- **Position : Valide**
- **Argument clé :** Dexie.js sur IndexedDB est le choix optimal. SQLite WASM (sql.js ~500kb, wa-sqlite ~200kb, absurd-sql complexité OPFS) alourdit le bundle de 4-10x sans bénéfice ACID réel pour un usage mono-utilisateur offline-first (pas de transactions concurrentes). OPFS + SQLite WASM a un support navigateur encore imparfait (Firefox récent, Safari 15.4+, Chrome 86+) et ajoute une couche de complexité (fichiers virtuels, verrous) injustifiée. RxDB/Yjs apportent un overhead sync (CRDT, réplication) non nécessaire en v1 (YAGNI). LocalStorage (5MB) est insuffisant pour devis + matériaux + historique prix + clients. IndexedDB offre quotas dynamiques (~50-80% espace disque = ~12-19GB sur 24GB dispo), requêtes indexées natives, et Dexie apporte TypeScript, migrations, hooks reactivity — critiques pour la robustesse.
- **Alternative recommandée si invalide :** idb (wrapper léger 3kb) si bundle critique, mais perte DX/migrations/hooks.

### C. PWA & Service Worker

- **Position : Valide**
- **Argument clé :** Workbox via `vite-plugin-pwa` est le standard de facto : stratégies de cache éprouvées (precache, runtime, stale-while-revalidate), gestion du cycle de vie SW (`skipWaiting`, `clients.claim`), fallback offline, mise à jour automatique. Un SW écrit à la main (~2kb) ferait gagner ~15kb (workbox-runtime) mais reporterait la charge de maintenance (stratégies cache, expiration, navigation fallback, versioning) sur l'équipe — risque élevé d'erreurs subtiles (cache corruption, stale content). `vite-plugin-pwa` configure Workbox correctement par défaut. Background Sync API est supportée Chrome/Edge Android mais reste limitée (retry réseau seulement, pas de sync logique métier) — l'event queue Dexie + export/import manuel est plus robuste et contrôlable pour v1.
- **Alternative recommandée si invalide :** SW custom uniquement si contrainte bundle extrême (<50kb) et équipe expérimentée SW.

### D. Génération PDF

- **Position : Partiellement valide**
- **Argument clé :** `@react-pdf/renderer` est un excellent choix pour la qualité d'impression et l'intégration React native, mais son bundle (~60kb gz) et sa courbe d'apprentissage (Flexbox yoga layout, pas CSS standard) sont non négligeables. `pdfmake` (~80kb) offre une API déclarative plus simple pour tableaux complexes et polices intégrées. `jsPDF + autoTable` (~120kb) est le standard le plus documenté mais approche impérative moins maintenable. **Recommandation ajustée :** Conserver `@react-pdf/renderer` pour le template devis principal (qualité pro, pagination A4 native), mais prévoir un fallback `jsPDF` simple pour exports rapides si performance mobile dégradée. HTML → Print CSS → PDF (navigateur) n'offre pas le contrôle mise en page requis pour devis professionnels (marges, en-têtes/pieds de page répétés, coupures de page).
- **Alternative recommandée si invalide :** pdfmake (meilleur compromis simplicité/qualité/tableaux).

### E. UI Mobile

- **Position : Valide**
- **Argument clé :** Tailwind CSS 3.4 (JIT, purge CSS, ~0kb runtime) + Radix UI (headless, accessible, ARIA, ~15kb total pour composants utilisés) est optimal : bundle minimal, pas de CSS-in-JS runtime (vs MUI/Chakra/Emotion), composants accessibles testés, thème configurable, maintenance via wrappers propriétaires (adapters). `shadcn/ui` (copié) éviterait la dépendance Radix mais impose la maintenance manuelle de 15+ composants accessibles — coût caché élevé. CSS natif + CSS Modules réinvente la roue (Dialog, Select, Toast accessibles = semaines de travail).
- **Alternative recommandée si invalide :** MUI Joy (si bundle acceptable ~80kb) pour composants complets prêts à l'emploi.

### F. Synchronisation

- **Position : Valide (approche YAGNI préparée)**
- **Argument clé :** L'architecture Option C prépare la sync sans l'implémenter : event queue (`_syncQueue` table Dexie) peuplée par hooks `creating`/`updating`/`deleting`, `deviceId` localStorage, structure `vectorClock` optionnelle. Cela coûte ~50 lignes de code, zéro dépendance, et permet d'ajouter LWW, CRDT (Yjs), ou backend (Supabase) plus tard sans réécriture. Implémenter Yjs/CRDT maintenant ajouterait ~40kb + complexité réactivité pour un cas d'usage non validé. Supabase/Firebase gratuit impose vendor lock-in, RGPD (données hors Cameroun), et coûts futurs. Git-based sync (Automerge) est expérimental. **La préparation légère actuelle est le bon curseur.**
- **Alternative recommandée si invalide :** Aucune — l'approche YAGNI préparée est correcte.

### G. Risques

- **Risques majeurs non identifiés dans le brief :**
  1. **Quota IndexedDB & éviction LRU :** Navigateurs peuvent évincer les données sous pression mémoire (mode navigation privée, stockage plein). Mitigation : `navigator.storage.persist()` + monitoring `navigator.storage.estimate()` + alerte utilisateur 80% + nettoyage devis archivés.
  2. **Perte données sans backup cloud :** Export manuel JSON + backup auto localStorage (5min) + Import validation sont essentiels — pas optionnels. Former l'utilisateur (documentation in-app, toast périodique).
  3. **Cycle de vie PWA / mise à jour SW :** `registerType: 'autoUpdate'` + `skipWaiting` + `clients.claim` + notification "Nouvelle version" + bouton "Recharger" sont requis. Tester scénarios : onglets multiples, installation PWA, mise à jour en arrière-plan.
  4. **Compatibilité Android WebView anciens :** Cibler Chrome/Edge Android récents (2 dernières années) — WebView système non supporté (pas d'installation PWA). Documenter exigence.
  5. **Accessibilité terrain :** Radix fournit les primitives ARIA, mais tests réels avec TalkBack/VoiceOver sur chantiers (bruit, gants, luminosité) sont indispensables. Prévoir audit axe-core en CI + tests manuels.
  6. **Internationalisation (i18n) :** Français + langues locales (Bassa, Ewondo, Fulfulde) non prévus. Ajouter `i18next` ou structure clés/valeurs dès v1 pour éviter refactor. RTL non requis (langues locales LTR).
- **Risques surévalués :**
  1. Bundle size : 120kb gz est excellent pour 3G/4G Yaoundé (chargement <3s). Optimisation prématurée (Preact, SW custom) rapporte peu.
  2. IndexedDB corruption : Rare sur navigateurs modernes. Dexie gère les transactions.
  3. PDF performance : @react-pdf/renderer génère en WebWorker possible, temps acceptable pour devis <50 lignes.
- **Mitigations manquantes dans la recommandation :**
  1. `navigator.storage.persist()` explicite au premier chargement.
  2. Service Worker `navigationPreload` pour accélérer navigation offline.
  3. `Cache-Control: immutable` sur assets hashés (Vite le fait).
  4. Tests Playwright en mode offline (simulé) + mobile viewport.
  5. Documentation utilisateur intégrée (FAQ offline, backup, mise à jour).

## Recommandation Alternative (si Option C rejetée)

- **Architecture :** N/A — Option C validée
- **Stack technique :** N/A
- **Justification coûts/bénéfices :** N/A
- **Plan migration si Option C déjà commencée :** N/A

## Score de Confiance

**9/10** — L'Option C est techniquement solide pour les contraintes données. Les ajustements mineurs (PDF fallback, persist(), i18n structure, tests offline) renforcent la robustesse sans changer l'architecture. Le seul risque résiduel significatif est l'adoption utilisateur (formation backup, UX offline), pas technique.
