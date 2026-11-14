# Package de Distribution — MetalPro Devis PWA

**Version :** 1.0  
**Date :** 2026-11-14  
**Statut :** Prêt pour validation Promoteur (R1)  
**Profil DocProductionSystem :** Technique + Pédagogique

---

## 📦 Contenu du Package

```
distribution/
├── README.md                           # Ce fichier
├── generate-qrcode.js                  # Script génération QR Code
├── docs/
│   ├── 01-hebergement-comparaison.md   # Comparatif GitHub Pages vs Cloudflare Pages
│   ├── 02-guide-artisan.md             # Guide artisan 1 page (Pédagogique)
│   ├── 03-procedure-backup-restore.md  # Procédure sauvegarde/restauration (Technique)
│   ├── 04-stockage-local.md            # Documentation stockage local seul (Technique)
│   └── assets/
│       ├── qrcode-metalpro-devis.svg      # QR Code vectoriel (impression)
│       ├── qrcode-metalpro-devis.png      # QR Code 512px (affichage écran)
│       └── qrcode-metalpro-devis@2x.png   # QR Code 1024px (haute résolution)
```

---

## 🎯 Objectifs du Package

| Document | Public | But |
|----------|--------|-----|
| **01-hebergement-comparaison.md** | Promoteur / Technique | Décision hébergement (Cloudflare Pages recommandé) |
| **02-guide-artisan.md** | **Artisans (utilisateurs finaux)** | Prise en main 5 min, installation Android, création devis |
| **03-procedure-backup-restore.md** | Artisans / Support | Sauvegarde hebdo, restauration, migration téléphone |
| **04-stockage-local.md** | Promoteur / Audit / Transparence | Preuve "aucune donnée ne sort", conformité RGPD |
| **QR Codes** | Artisans (physique/numérique) | Accès direct URL PWA par scan caméra |

---

## 🚀 Déploiement Production — Checklist

### Pré-requis (Promoteur)
- [ ] **R1** : Validation choix Cloudflare Pages
- [ ] **R1** : Autorisation publication publique
- [ ] **R6** : Inscription décision dans `REGISTRE_DES_DECISIONS.md`
- [ ] Clé API Cloudflare configurée (si domaine custom)

### Étapes Déploiement
1. **Push repo GitHub** (code source MetalPro_Devis)
2. **Cloudflare Pages** : Connecter repo → Build `npm run build` → Output `dist/`
3. **Ajouter `public/_redirects` et `public/_headers`** (voir doc 01)
4. **Déployer** → Obtenir URL `*.pages.dev` ou domaine custom
5. **Mettre à jour URL** dans :
   - `generate-qrcode.js` (DEFAULT_URL)
   - `02-guide-artisan.md` (section 1)
   - QR Codes (régénérer via `node generate-qrcode.js <nouvelle_url>`)
6. **Valider PWA** : Lighthouse > 90, installabilité Android, hors-ligne
7. **Distribuer** : Guide artisan + QR Code (impression/partage)

---

## 📱 Génération QR Code

```bash
# URL par défaut (metalpro-devis.pages.dev)
node generate-qrcode.js

# URL personnalisée (après déploiement)
node generate-qrcode.js https://metalpro.mondomaine.cm

# Options avancées
node generate-qrcode.js https://metalpro-devis.pages.dev -n qrcode-prod -s 1024 -e H
```

**Sorties** : `distribution/docs/assets/` (SVG + PNG 512px + PNG 1024px)

---

## 📋 Utilisation DocProductionSystem

Les documents Markdown peuvent être convertis aux formats standards :

```python
# Exemple Python (depuis DocProductionSystem)
from moteurs.base.engine import create_engine
from pathlib import Path

charte_path = Path(r"C:\Users\cedri\OneDrive\Documents\DocProductionSystem\charte\CHARTE_GRAPHIQUE_GLOBALE.json")

# Guide Artisan → PDF (Profil Pédagogique)
engine_pdf = create_engine("pdf", charte_path=charte_path)
engine_pdf.generate(
    Path("distribution/docs/02-guide-artisan.pdf"),
    {"source_md": "distribution/docs/02-guide-artisan.md", "profil": "pedagogique"},
    CharteGraphique(charte_path)
)

# Procédure Backup → DOCX (Profil Technique)
engine_docx = create_engine("docx", charte_path=charte_path)
engine_docx.generate(...)

# Comparatif Hébergement → PDF (Profil Technique)
engine_pdf.generate(...)
```

**Profils utilisés :**
- **Pédagogique** : Guide artisan (objectifs Bloom, exercices, accessibilité)
- **Technique** : Comparatif, Backup, Stockage local (architecture, specs, conformité)

---

## ✅ Validation Qualité (QA N1-N4)

| Niveau | Critères | Statut |
|--------|----------|--------|
| **N1 Technique** | Fichiers valides, structure Markdown, liens relatifs OK | ⏳ À faire |
| **N2 Présentation** | Charte respectée, lisibilité, navigation claire | ⏳ À faire |
| **N3 Contenu** | Complétude, cohérence interne, références valides | ⏳ À faire |
| **N4 Métier** | Validation expert (Promoteur), conformité exigences | ⏳ **En attente R1** |

---

## 🔗 Références Projet

- **Code source** : `C:/Users/cedri/Downloads/MetalPro_Devis/`
- **Build production** : `dist/` (SW, manifest, icons, workbox)
- **DocProductionSystem** : `C:/Users/cedri/OneDrive/Documents/DocProductionSystem/`
- **Gouvernance AI_WORKFORCE** : `C:/Users/cedri/OneDrive/Documents/AI WORKFORCE/00_GOUVERNANCE/`

---

## ⚠️ Rappel Règles Gouvernance

> **R1** : Décision finale = Promoteur — **Aucune publication sans autorisation explicite**  
> **R8** : Zéro modif config FCC/DSH — Ce package ne touche à aucune config  
> **R9** : Zéro secret — Ce package ne contient AUCUNE clé API, token, mot de passe  
> **R10** : Consulter l'existant — Basé sur build PWA validé et docs projet

---

*Package généré via DocProductionSystem — MetalPro Devis v1.0*  
*Prêt pour validation Promoteur → Déploiement Cloudflare Pages → Distribution artisans*