# Brief de Contre-Expertise pour DeepSeek — MetalPro Devis

**Date :** 2026-10-27  
**Objet :** Revue indépendante et contradictoire du choix d'architecture (Option C : React + Vite + PWA + IndexedDB)  
**Destinataire :** DeepSeek (via FCC DSH ou API directe)  
**Contexte :** Projet MetalPro Devis — PWA devis menuisiers métalliques, Yaoundé, Cameroun, budget 0 FCFA.

---

## 1. Contexte & Contraintes Non Négociables

| Contrainte            | Détail                                                                             | Négociable ?     |
| --------------------- | ---------------------------------------------------------------------------------- | ---------------- |
| **Budget**            | 0 FCFA — aucun achat, abonnement, service payant sans accord explicite             | ❌ Non           |
| **Hors ligne**        | Fonctionnement 100% offline obligatoire (chantiers, connectivité instable Yaoundé) | ❌ Non           |
| **Données sensibles** | Clients, prix, marges — stockage local exclusif, pas de cloud sans accord          | ❌ Non           |
| **Mobile-first**      | Usage principal smartphone Android (Chrome/Edge) sur chantier                      | ❌ Non           |
| **PDF**               | Génération devis PDF professionnelle côté client                                   | ❌ Non           |
| **Évolutivité sync**  | Architecture doit préparer synchronisation future (multi-appareils, équipe)        | ✅ Oui (comment) |
| **Logiciels libres**  | Priorité MIT/Apache/BSD — pas de vendor lock-in                                    | ❌ Non           |

---

## 2. Choix Recommandé (à contester)

**Option C : React 18 + Vite 5 + PWA (Workbox) + IndexedDB (Dexie.js) + Tailwind + Radix UI**

Arguments avancés :

- Offline-first natif via IndexedDB + Service Worker
- Stockage structuré requêtes indexées (clients, matériaux, devis, historique prix)
- Bundle ~120kb gz — performant 3G/4G
- Préparation sync via event queue (Dexie hooks) + vector clocks optionnels
- 100% open source, standards web, pas de vendor lock-in
- DX excellente avec Claude Code (patterns React bien connus)

---

## 3. Points de Contestation Demandés (Challenge DeepSeek)

### A. Architecture — Alternatives crédibles

1. **Vanilla JS + IndexedDB natif** — Est-ce vraiment plus coûteux en dev ? Bundle <50kb. Maintenance long terme sans dépendances framework ?
2. **Preact + signals** — 3kb vs 40kb React. Compatibilité écosystème ? Hooks Dexie/TanStack Query ?
3. **SolidJS** — Réactivité fine-grained, pas de VDOM, bundle petit. Maturité PWA/IndexedDB ?
4. **Svelte 5 + runes** — Compilateur, pas de runtime, DX excellente. Écosystème PWA ?
5. **HTMX + Go/WASM backend local** — Architecture radicalement différente, hors ligne via WASM SQLite ?

### B. Stockage — IndexedDB vs alternatives

1. **SQLite WASM (sql.js, wa-sqlite, absurd-sql)** — Requêtes SQL réelles, ACID, migrations. Performance mobile ? Taille bundle ?
2. **OPFS (Origin Private File System) + SQLite WASM** — Persistance fichiers, pas de quota IndexedDB. Support navigateurs ?
3. **RxDB / Yjs** — Sync native CRDT. Overhead justifié pour mono-utilisateur initial ?
4. **LocalStorage + compression** — Pour données simples seulement. Limite 5MB bloquante ?

### C. PWA & Service Worker — Workbox vs natif

1. **SW écrit à la main** — Contrôle total, pas de dépendance, ~2kb. Complexité maintenance cache strategies ?
2. **Vite PWA plugin alternatives** — `vite-plugin-pwa` vs `vite-plugin-pwa` (offline-first config) vs custom ?
3. **Background Sync API** — Support Chrome/Edge Android ? Fiabilité pour queue sync ?

### D. Génération PDF — @react-pdf/renderer vs alternatives

1. **pdfmake** — Déclaratif, polices intégrées, tableaux natifs. Bundle plus gros ?
2. **jsPDF + autoTable** — Standard, beaucoup d'exemples. Performance gros devis ?
3. **HTML → Print CSS → PDF (navigateur)** — Zéro dépendance, mais contrôle mise en page limité. Qualité pro ?
4. **WASM (wkhtmltopdf, weasyprint via Pyodide)** — Qualité print, mais bundle énorme.

### E. UI Mobile — Tailwind + Radix vs alternatives

1. **MUI Joy / MUI Core** — Composants complets, accessibilité, mais bundle + CSS-in-JS runtime.
2. **Chakra UI** — Style props, dark mode, mais runtime emotion.
3. **shadcn/ui (copié)** — Pas de dépendance, owned code, mais maintenance manuelle.
4. **CSS natif + CSS Modules / Lightning CSS** — Zéro runtime, mais réinventer composants accessibles.

### F. Synchronisation — Préparation vs YAGNI

1. **YAGNI** — Ne pas préparer sync maintenant. Refactorer quand besoin réel. Coût différé vs coût anticipé ?
2. **CRDT dès maintenant (Yjs)** — Sync temps réel gratuite, mais complexité + bundle. Justifié ?
3. **Supabase / Firebase gratuit** — Backend géré gratuit tier. Vendor lock-in acceptable ? RGPD Cameroun ?
4. **Git-based sync (Automerge + GitHub)** — Hors ligne, peer-to-peer. Expérimental ?

### G. Risques non couverts

1. **Quota IndexedDB** — ~50-80% espace disque (24GB dispo). Risque saturation ? Éviction LRU navigateur ?
2. **Perte données** — Pas de backup cloud. Export manuel utilisateur fiable ? Formation ?
3. **Mise à jour PWA** — Cycle de vie SW, `skipWaiting`, `clients.claim`, versioning. Stratégie ?
4. **Compatibilité navigateurs anciens** — Android WebView anciens, KaiOS ? Support requis ?
5. **Accessibilité (WCAG 2.2 AA)** — Radix OK, mais tests réels utilisateurs malvoyants terrain ?
6. **Internationalisation** — Français + langues locales (Bassa, Ewondo, Fulfulde) ? RTL futur ?

---

## 4. Format de Réponse Attendu

DeepSeek doit répondre sous forme structurée :

```markdown
# Contre-Expertise MetalPro Devis — DeepSeek

## Verdict Global

[ ] Option C validée [ ] Option C rejetée [ ] Option alternative recommandée

## Analyse Point par Point

### A. Architecture

- Position : [Valide / Partiellement valide / Invalide]
- Argument clé :
- Alternative recommandée si invalide :

### B. Stockage

...

### C. PWA/SW

...

### D. PDF

...

### E. UI

...

### F. Sync

...

### G. Risques

- Risques majeurs non identifiés :
- Risques surévalués :
- Mitigations manquantes :

## Recommandation Alternative (si Option C rejetée)

- Architecture :
- Stack technique :
- Justification coûts/bénéfices :
- Plan migration si Option C déjà commencée :

## Score de Confiance

/10 — Niveau de certitude dans cette contre-expertise
```

---

## 5. Informations Techniques Supplémentaires (sur demande)

- Schéma Dexie complet (`db/schema.ts`)
- Configuration `vite.config.ts` + `vite-plugin-pwa`
- `tailwind.config.js` + thème MetalPro
- Composants Radix utilisés (Dialog, Select, Tabs, Toast, DropdownMenu)
- Flow création devis (états, validation Zod, calcul decimal.js)
- Stratégie cache SW (precache, runtime, fallback)
- Scripts `package.json` (dev, build, preview, lint, test, typecheck)

---

## 6. Contraintes de la Revue

- **Temps** : Analyse approfondie, pas de réponse superficielle
- **Indépendance** : Ignorer les arguments du brief, évaluer sur mérites techniques
- **Pragmatisme** : Contexte réel (Yaoundé, 3G/4G, smartphones 2-3 ans, électricien pas développeur)
- **Budget** : Toute recommandation coûtant >0 FCFA doit justifier ROI explicite
- **Preuves** : Citer sources (docs, benchmarks, issues GitHub) pour claims techniques

---

## 7. Prochaines Étapes Après Contre-Expertise

1. Si **Option C validée** → Passer à `Recommandation_Architecture.md` (détails implémentation, phasage, risques)
2. Si **Option alternative** → Nouveau comparatif ciblé + `Recommandation_Architecture.md` révisée
3. Si **Points de vigilance majeurs** → Ajouter section "Mitigations" dans recommandation finale

---

**Fin du brief.**  
DeepSeek est invité à répondre sans concession — l'objectif est la robustesse technique, pas la validation du choix initial.
