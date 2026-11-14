# Stockage Local Uniquement — MetalPro Devis

**Version :** 1.0  
**Date :** 2026-11-14  
**Auteur :** Agent Exécution (Claude Code via FCC)  
**Profil :** Technique  
**Statut :** Brouillon - En attente validation Promoteur (R1)

---

## 1. Principe Fondamental

> **MetalPro Devis ne possède AUCUN serveur backend. Aucune donnée ne quitte votre appareil.**

Toutes les données (clients, matériaux, devis, réglages, cache PDF) sont stockées **exclusivement** dans le navigateur via **IndexedDB** (API web standard, supportée depuis 2015).

---

## 2. Architecture Technique

```
┌─────────────────────────────────────────────────────────────┐
│                    NAVIGATEUR (Chrome/Edge/Firefox)         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  IndexedDB (Dexie.js)               │   │
│  │  ┌─────────┐ ┌──────────┐ ┌───────┐ ┌───────────┐  │   │
│  │  │ clients │ │ materiaux │ │ devis │ │ _pdfCache │  │   │
│  │  └─────────┘ └──────────┘ └───────┘ └───────────┘  │   │
│  │  ┌─────────┐                                        │   │
│  │  │ settings│                                        │   │
│  │  └─────────┘                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Service Worker (Workbox)               │   │
│  │  • Cache statique (HTML, JS, CSS, icons, manifest)  │   │
│  │  • Navigation fallback → index.html (SPA)           │   │
│  │  • Google Fonts cache (stratégie CacheFirst)        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   INTERNET      │
                    │  (1re visite    │
                    │   uniquement)   │
                    └─────────────────┘
```

---

## 3. Flux de Données — Ce qui traverse le réseau

| Moment | Données | Direction | Obligatoire |
|--------|---------|-----------|-------------|
| **1re visite** | Bundle JS/CSS/HTML (~2.5 Mo gzippé) | Serveur → Navigateur | ✅ Oui |
| **1re visite** | Icônes, manifest, SW | Serveur → Navigateur | ✅ Oui |
| **1re visite** | Google Fonts (Inter) | Google → Navigateur | ✅ Oui |
| **Visites suivantes** | **RIEN** (tout en cache) | — | ❌ Non |
| **Mise à jour app** | Nouveau bundle (si version changée) | Serveur → Navigateur | Auto (SW) |
| **Export/Import** | Fichier JSON (choix utilisateur) | Navigateur ↔ Fichier local | ❌ Optionnel |

---

## 4. Ce qui N'EST JAMAIS transmis

| Donnée | Stockée ? | Transmise ? |
|--------|-----------|-------------|
| Noms, téléphones, emails clients | ✅ IndexedDB local | ❌ **JAMAIS** |
| Prix matériaux, marges | ✅ IndexedDB local | ❌ **JAMAIS** |
| Contenu devis (lignes, totaux) | ✅ IndexedDB local | ❌ **JAMAIS** |
| Mode TVA choisi par devis | ✅ IndexedDB local | ❌ **JAMAIS** |
| PDF générés (cache) | ✅ IndexedDB local (_pdfCache) | ❌ **JAMAIS** |
| Réglages utilisateur | ✅ IndexedDB local (settings) | ❌ **JAMAIS** |
| Identifiant appareil / empreinte | ❌ Non collecté | ❌ **JAMAIS** |
| Analytics / tracking / télémétrie | ❌ Non intégré | ❌ **JAMAIS** |
| Comptes / authentification | ❌ Aucun système | ❌ **JAMAIS** |

---

## 5. Garanties Techniques

### 5.1 Aucune connexion sortante (hors 1re charge)

- **Service Worker** : `NavigationRoute` → `index.html` (fallback offline)
- **Fetch events** : Interceptés par SW, servis depuis cache
- **Aucun `fetch()`** vers API dans le code applicatif
- **Aucun `XMLHttpRequest`**, `axios`, `graphql`, `websocket`

### 5.2 Preuve par le code (extrait `vite.config.ts`)

```typescript
// PWA Config - generateSW mode
manifest: {
  name: 'MetalPro Devis',
  start_url: '/',
  display: 'standalone',
  // AUCUN endpoint API, AUCUN backend
},
workbox: {
  runtimeCaching: [
    // Seulement Google Fonts (tiers, optionnel)
    { urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i, ... },
    { urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i, ... }
  ],
  // NavigationFallback = index.html (SPA offline)
}
```

### 5.3 Preuve par le code (extrait `src/services/database.ts`)

```typescript
// Dexie.js - IndexedDB UNIQUEMENT
export const db = new Dexie('MetalProDevis');
db.version(3).stores({
  clients: '++id, nom, telephone, email, ville, createdAt, updatedAt',
  materiaux: '++id, nom, unite, prixUnitaire, createdAt, updatedAt',
  devis: '++id, clientId, numero, date, tvaMode, lignes, totaux, createdAt, updatedAt',
  settings: 'id',  // Clé unique "app"
  _pdfCache: '++id, devisId, blob, createdAt'  // Cache local seulement
});
// AUCUNE synchronisation, AUCUN hook réseau
```

---

## 6. Conformité Réglementaire

| Réglementation | Statut | Justification |
|----------------|--------|---------------|
| **RGPD (UE)** | ✅ Conforme par conception | Pas de données personnelles traitées hors appareil |
| **Loi camerounaise protection données** | ✅ Conforme | Stockage local = contrôle total utilisateur |
| **Secret professionnel artisan** | ✅ Respecté | Aucun tiers n'accède aux devis/clients |
| **Facturation électronique (future)** | ⚠️ Non applicable | Export JSON/PDF manuel vers portail si requis |

---

## 7. Implications Pratiques pour l'Artisan

| Avantage | Contrainte |
|----------|------------|
| ✅ **Confidentialité totale** | ⚠️ **Sauvegarde manuelle obligatoire** (voir doc 03) |
| ✅ **Fonctionne sans internet** | ⚠️ Perte téléphone = perte données (sans backup) |
| ✅ **Zéro coût récurrent** | ⚠️ Pas de sync multi-appareils auto |
| ✅ **Conformité automatique** | ⚠️ Mise à jour = nouvelle visite URL |
| ✅ **Pas de compte à créer** | ⚠️ Pas de récupération mot de passe |

---

## 8. Vérification Indépendante (Audit)

Tout utilisateur technique peut vérifier :

1. **Ouvrir DevTools** (F12) → **Network** → Filtrer "Fetch/XHR" → **Aucune requête** après chargement
2. **Application** → **IndexedDB** → `MetalProDevis` → Voir tous les stores
3. **Application** → **Service Workers** → Vérifier `offline.html` en cache
4. **Sources** → `src/services/database.ts` → Aucun `fetch`/`axios`/WebSocket
5. **Lighthouse** → PWA audit → "Works offline" = ✅

---

## 9. Évolution Future (Roadmap Transparente)

| Fonctionnalité | Impact stockage local | Choix utilisateur |
|----------------|----------------------|-------------------|
| Sync cloud optionnel | Hybride (local + remote) | **Opt-in explicite** (case à cocher) |
| Chiffrement backup | Local uniquement | **Opt-in** (mot de passe) |
| Partage devis par lien | Génération lien éphémère | **Action manuelle** par devis |
| Multi-appareils | Sync necessaire | **Opt-in** + compte |

> **Engagement** : Toute évolution conservant le mode "100% local" par défaut. Aucun changement silencieux.

---

## 10. Contact Transparence

- **Code source** : [Repo GitHub - à définir]
- **Technologies** : React 18, TypeScript, Vite, Tailwind, Dexie.js, Workbox, @react-pdf/renderer, Decimal.js
- **Licence** : [À définir - MIT ou propriétaire]
- **Contact sécurité** : [Email promoteur]

---

*Document généré via DocProductionSystem - Profil Technique*  
*MetalPro Devis — Vos données restent chez vous.*