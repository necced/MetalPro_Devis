# Guide Artisan — MetalPro Devis

**Version :** 1.0  
**Date :** 2026-11-14  
**Niveau :** Débutant  
**Public cible :** Artisans menuisiers métalliques (Cameroun)  
**Durée lecture :** 5 min  
**Prérequis :** Smartphone Android + connexion internet (1re fois seulement)  
**Profil :** Pédagogique  

---

## 🎯 Objectif

Créer un devis professionnel en 3 minutes, avec ou sans TVA, et l'exporter en PDF — **hors-ligne** après la 1re visite.

---

## 1. Accéder à l'application

### Depuis votre navigateur Chrome (Android)
1. Ouvrez Chrome
2. Saisissez l'URL : **`https://metalpro-devis.pages.dev`** *(à confirmer)*
3. L'application se charge → **Installer** (voir §2)

> 💡 **Astuce** : Scannez le QR Code ci-dessous pour ouvrir directement :
> ```
> [QR CODE À GÉNÉRER AVEC L'URL FINALE]
> ```

---

## 2. Installer sur l'écran d'accueil (PWA)

| Étape | Action |
|-------|--------|
| 1️⃣ | Menu Chrome (⋮) → **Installer l'application** |
| 2️⃣ | Confirmer → Icône **MetalPro** sur l'écran d'accueil |
| 3️⃣ | Ouvrir depuis l'icône → **Fonctionne sans internet** ✅ |

> ⚠️ **Important** : La 1re ouverture nécessite internet. Ensuite, **100% hors-ligne**.

---

## 3. Créer votre premier devis

### Étape 1 — Client
- Appuyez **Clients** → **+ Nouveau**
- Remplissez : Nom, Téléphone, Email, Ville
- **Enregistrer**

### Étape 2 — Matériaux (optionnel)
- **Matériaux** → **+ Nouveau**
- Ajoutez vos profils tubes, tôles, peinture, etc.
- Prix unitaire en **FCFA**
- **Enregistrer**

### Étape 3 — Devis
- **Devis** → **+ Nouveau**
- Sélectionnez le **Client**
- **Mode TVA** : 🔘 **Avec TVA** (19,25% Cameroun) | 🔘 **Sans TVA** (particuliers)
- Ajoutez les **Lignes** : Matériau, Quantité, Prix unitaire
- Totaux calculés **automatiquement** (HT, TVA, TTC)
- **Enregistrer**

---

## 4. Générer le PDF

1. Ouvrez le devis → **Voir détails**
2. Appuyez **📄 Générer PDF**
3. Attente 1-2s (1re fois) → **Instantané** (suivantes, cache)
4. **Partager** → WhatsApp, Email, Imprimer, Sauvegarder

> ✅ **Cache PDF** : Le PDF est stocké localement. Régénération immédiate.

---

## 5. Mode TVA — Quand choisir quoi ?

| Situation | Mode | Détail |
|-----------|------|--------|
| Client **entreprise** (assujetti TVA) | **Avec TVA** | 19,25% affiché, déductible client |
| Client **particulier** / auto-entrepreneur non assujetti | **Sans TVA** | Prix net, mention "TVA non applicable, art. 293 B CGI" |
| **Défaut** | **Avec TVA** | Configurable dans ⚙️ Réglages |

---

## 6. Fonctionnalités clés

| Fonction | Description |
|----------|-------------|
| 📱 **100% Mobile** | Interface tactile, responsive |
| 💾 **Hors-ligne total** | IndexedDB local, rien dans le cloud |
| 🔢 **Calculs exacts** | Decimal.js — zéro erreur arrondi FCFA |
| 🔒 **Vos données = chez vous** | Pas de serveur, pas de compte, pas de sync |
| 📤 **Export** | PDF, JSON (sauvegarde) |
| 🔄 **Restauration** | Import JSON en 1 clic |

---

## 7. Sauvegarde / Restauration (Vital !)

> 📋 **Voir document détaillé : `03-procedure-backup-restore.md`**

**En résumé :**
- **Sauvegarder** : Réglages → **Exporter données** → Fichier `.json` → Partager (WhatsApp, Drive, Email)
- **Restaurer** : Réglages → **Importer données** → Sélectionner `.json` → **Écraser / Fusionner**
- **Fréquence** : Hebdomadaire recommandée / Avant changement téléphone

---

## 8. Dépannage rapide

| Problème | Solution |
|----------|----------|
| "Application non installée" | Réouvrir URL Chrome → Menu → Installer |
| PDF ne génère pas | Attendre 5s (1re fois) / Vider cache navigateur |
| Données perdues | Importer dernière sauvegarde `.json` |
| Mode TVA bloqué | Vérifier Réglages → Mode TVA par défaut |

---

## 9. Contact & Support

- **Développeur** : [Votre nom/contact]
- **Signalement bug** : Capture écran + description → WhatsApp/Email
- **Mise à jour** : Automatique à l'ouverture (si internet)

---

## ✅ Checklist "Premier devis en 5 min"

- [ ] URL ouverte dans Chrome
- [ ] Application installée (icône écran d'accueil)
- [ ] 1 client créé
- [ ] 1 devis créé (mode TVA choisi)
- [ ] PDF généré et partagé
- [ ] Sauvegarde `.json` faite

---

*Document généré via DocProductionSystem - Profil Pédagogique*  
*MetalPro Devis — Votre devis métallerie, simple et pro.*