# Comparatif Hébergement Gratuit : GitHub Pages vs Cloudflare Pages

**Projet :** MetalPro Devis - PWA Installable  
**Version :** 1.0  
**Date :** 2026-11-14  
**Auteur :** Agent Exécution (Claude Code via FCC)  
**Profil :** Technique  
**Statut :** Brouillon - En attente validation Promoteur (R1)

---

## 1. Contexte et Objectifs

MetalPro Devis est une PWA (Progressive Web App) React 18 + TypeScript + Vite + Tailwind CSS, conçue pour les artisans menuisiers métalliques au Cameroun. L'application fonctionne **entièrement hors-ligne** (IndexedDB local, Service Worker, pas de backend).

**Critères de décision :**
- HTTPS obligatoire (requis PWA / installabilité)
- Déploiement gratuit, sans configuration complexe
- Support SPA (Single Page Application) avec routing client
- Headers HTTP corrects pour Service Worker et manifest
- Disponibilité mondiale, faible latence Afrique
- Pas de verrouillage propriétaire (portabilité)

---

## 2. Tableau Comparatif

| Critère | GitHub Pages | Cloudflare Pages |
|---------|-------------|------------------|
| **Coût** | Gratuit (public repos) | Gratuit (plan Free généreux) |
| **HTTPS** | ✅ Automatique (domaine *.github.io) | ✅ Automatique (domaine *.pages.dev) |
| **Domaine personnalisé** | ✅ Gratuit | ✅ Gratuit |
| **Build automatique** | ✅ GitHub Actions | ✅ Intégré (détection Vite/React) |
| **SPA Routing** | ⚠️ Workaround requis (404.html) | ✅ Natif (`_redirects` ou `_headers`) |
| **Headers personnalisés** | ❌ Limité | ✅ `_headers` complet |
| **Service Worker** | ✅ Fonctionne | ✅ Fonctionne nativement |
| **Manifest / PWA** | ✅ Fonctionne | ✅ Fonctionne nativement |
| **Latence Afrique (Cameroun)** | 🟡 Variable (CDN GitHub) | 🟢 Excellent (PoP Cloudflare Afrique) |
| **Bande passante** | 100 Go/mois | Illimitée (Fair use) |
| **Builds/mois** | Illimité (Actions) | 500 builds/mois (Free) |
| **Taille max site** | 1 Go | 25 MiB par build (500 MiB total) |
| **Variables d'env build** | ✅ Secrets GitHub | ✅ Dashboard / Wrangler |
| **Rollback instantané** | ❌ Via git revert | ✅ Un clic (deployments) |
| **Preview deployments (PR)** | ❌ Manuel | ✅ Automatique |
| **Analytics** | ❌ Tierce requis | ✅ Web Analytics gratuit |
| **Verrouillage (Vendor lock-in)** | Faible (HTML statique) | Faible (HTML statique + _redirects) |

---

## 3. Analyse Détaillée

### 3.1 GitHub Pages

**Avantages :**
- Intégration native GitHub (repo source = site)
- Gratuit pour repos publics (notre cas)
- Écosystème familier développeurs
- Actions pour builds complexes

**Inconvénients pour MetalPro Devis :**
- **SPA Routing** : Nécessite hack `404.html` + script redirect (fragile)
- **Headers** : Pas de contrôle `Service-Worker-Allowed`, `Cache-Control` fin
- **Latence Cameroun** : CDN GitHub moins dense en Afrique que Cloudflare
- **Build** : Doit configurer GitHub Actions (YAML) vs détection auto Cloudflare

**Workaround SPA requis :**
```html
<!-- 404.html -->
<script>
  var path = window.location.pathname;
  if (path !== "/") {
    window.location.href = "/" + "#" + path.slice(1);
  }
</script>
```
Puis dans `index.html` : restaurer l'URL propre au chargement.

### 3.2 Cloudflare Pages

**Avantages :**
- **SPA natif** : Fichier `_redirects` avec `/* /index.html 200`
- **Headers complets** : `_headers` pour SW, manifest, cache, CSP
- **PoP Afrique** : Points de présence à Lagos, Johannesburg, Nairobi, Le Caire
- **Preview PR** : Chaque PR = URL de test unique (excellent pour QA)
- **Rollback 1-clic** : Historique déploiements visuel
- **Analytics gratuit** : Web Analytics sans cookies, RGPD-friendly
- **Build auto** : Détecte Vite + React, `npm run build`, dossier `dist/`

**Inconvénients :**
- Limite 25 MiB / build (notre build ~2.5 MiB gzippé = OK)
- 500 builds/mois (largement suffisant)

**Configuration minimale requise :**
```
# public/_redirects
/* /index.html 200

# public/_headers
/sw.js
  Service-Worker-Allowed: /
  Cache-Control: no-cache
/manifest.webmanifest
  Cache-Control: public, max-age=31536000
/workbox-*.js
  Cache-Control: public, max-age=31536000
/*.png
  Cache-Control: public, max-age=31536000
/*.svg
  Cache-Control: public, max-age=31536000
/offline.html
  Cache-Control: no-cache
```

---

## 4. Recommandation

### 🏆 Choix recommandé : **Cloudflare Pages**

**Justification :**
1. **SPA & PWA natifs** : Zero-config pour routing, SW, manifest, headers
2. **Performance Afrique** : PoP Cloudflare au Cameroun (Douala/Yaoundé via Lagos) = latence < 50ms
3. **Expérience développeur** : Preview PR, rollback 1-clic, analytics intégré
4. **Évolutivité** : Migration future vers Workers/Pages Functions si backend nécessaire
5. **Coût réel = 0 €** : Plan Free couvre largement nos besoins

### Plan de déploiement Cloudflare Pages

1. **Connecter repo GitHub** → Cloudflare Pages dashboard
2. **Build config** :
   - Build command: `npm run build`
   - Output directory: `dist`
   - Node version: 20 (dans `.nvmrc` ou `package.json`)
3. **Ajouter `public/_redirects` et `public/_headers`** (voir §3.2)
4. **Déployer** → URL `metalpro-devis.pages.dev` (ou sous-domaine custom)
5. **Valider PWA** : Lighthouse > 90, installabilité Android confirmée

---

## 5. URLs de référence

- **GitHub Pages docs** : https://docs.github.com/en/pages
- **Cloudflare Pages docs** : https://developers.cloudflare.com/pages/
- **Cloudflare Pages SPA** : https://developers.cloudflare.com/pages/platform/serving-pages/#single-page-applications-spas
- **Headers Cloudflare** : https://developers.cloudflare.com/pages/platform/headers/
- **PWA Checklist** : https://web.dev/pwa-checklist/

---

## 6. Décision Promoteur Requise (R1)

> **Action** : Valider le choix Cloudflare Pages et autoriser la publication
> **Délai** : Avant déploiement production
> **Registre** : Inscrire dans `REGISTRE_DES_DECISIONS.md` (R6)

---

*Document généré via DocProductionSystem - Profil Technique*