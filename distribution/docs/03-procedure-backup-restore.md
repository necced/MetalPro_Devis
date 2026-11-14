# Procédure Sauvegarde / Restauration — MetalPro Devis

**Version :** 1.0  
**Date :** 2026-11-14  
**Auteur :** Agent Exécution (Claude Code via FCC)  
**Profil :** Technique  
**Statut :** Brouillon - En attente validation Promoteur (R1)  
**Criticité :** **ÉLEVÉE** — Perte de données irréversible sans sauvegarde

---

## 1. Architecture de stockage — Rappel technique

MetalPro Devis stocke **toutes les données localement** dans le navigateur via **IndexedDB** (Dexie.js) :

| Store IndexedDB | Contenu | Clé primaire |
|-----------------|---------|--------------|
| `clients` | Liste clients | `id` (auto-incrément) |
| `materiaux` | Catalogue matériaux | `id` (auto-incrément) |
| `devis` | Devis (entête + lignes) | `id` (auto-incrément) |
| `settings` | Configuration app (TVA défaut, etc.) | `id: "app"` |
| `_pdfCache` | Cache PDF générés (blob) | `id` (auto), `devisId` (unique) |

**Aucune donnée ne quitte le navigateur.** Pas de serveur, pas de cloud, pas de synchronisation automatique.

---

## 2. Format d'échange — JSON Standard

L'export/import utilise un **fichier JSON unique** contenant tous les stores :

```json
{
  "version": 3,
  "exportedAt": "2026-11-14T10:30:00.000Z",
  "appVersion": "1.0.0",
  "data": {
    "clients": [...],
    "materiaux": [...],
    "devis": [...],
    "settings": {...}
  },
  "checksum": "sha256:abc123..."
}
```

> ⚠️ **Le store `_pdfCache` n'est PAS exporté** (gros volumes, régénérables).

---

## 3. Sauvegarde (Export)

### 3.1 Via l'interface utilisateur (Recommandé)

1. Ouvrir MetalPro Devis
2. Aller dans **⚙️ Réglages** (en-tête ou menu)
3. Section **Données** → **Exporter les données**
4. Le navigateur propose le téléchargement : `metalpro-backup-2026-11-14.json`
5. **Partager immédiatement** :
   - 📱 WhatsApp (vers soi-même ou collègue)
   - ☁️ Google Drive / OneDrive / Dropbox
   - 📧 Email (pièce jointe)
   - 💾 Carte SD / Clé USB (via gestionnaire fichiers Android)

### 3.2 Via DevTools (Avancé / Dépannage)

```javascript
// Dans Console Chrome DevTools (F12)
const db = await import('./src/db/index.ts').then(m => m.db);
const data = {};
for (const table of db.tables) {
  data[table.name] = await table.toArray();
}
const exportObj = {
  version: 3,
  exportedAt: new Date().toISOString(),
  appVersion: "1.0.0",
  data
};
const blob = new Blob([JSON.stringify(exportObj, null, 2)], {type: 'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `metalpro-backup-${new Date().toISOString().slice(0,10)}.json`;
a.click();
```

---

## 4. Restauration (Import)

### 4.1 Via l'interface utilisateur (Recommandé)

1. **⚙️ Réglages** → **Importer les données**
2. Sélectionner le fichier `.json` de sauvegarde
3. Choisir le mode :
   - **Écraser** (défaut) : Remplace TOUTES les données actuelles
   - **Fusionner** : Ajoute/Met à jour (conserve l'existant non conflictuel)
4. Confirmer → **Redémarrage automatique** de l'app

> ⚠️ **Attention** : Mode "Écraser" = **perte définitive** des données actuelles non sauvegardées.

### 4.2 Via DevTools (Avancé / Récupération d'urgence)

```javascript
// Dans Console Chrome DevTools (F12)
// 1. Récupérer le fichier (input type=file ou drag-drop)
const file = /* ... File object ... */;
const text = await file.text();
const backup = JSON.parse(text);

// 2. Valider structure
if (!backup.data || !backup.version) throw new Error("Format invalide");

// 3. Importer dans IndexedDB
const db = (await import('./src/db/index.ts')).db;
await db.transaction('rw', db.clients, db.materiaux, db.devis, db.settings, async () => {
  // Option A: ÉCRASER (vider puis insérer)
  await Promise.all([
    db.clients.clear(),
    db.materiaux.clear(),
    db.devis.clear(),
    db.settings.clear()
  ]);
  await Promise.all([
    db.clients.bulkAdd(backup.data.clients || []),
    db.materiaux.bulkAdd(backup.data.materiaux || []),
    db.devis.bulkAdd(backup.data.devis || []),
    db.settings.put(backup.data.settings || {id: "app"})
  ]);
  
  // Option B: FUSIONNER (upsert par id)
  // await Promise.all([
  //   db.clients.bulkPut(backup.data.clients || []),
  //   db.materiaux.bulkPut(backup.data.materiaux || []),
  //   db.devis.bulkPut(backup.data.devis || []),
  //   db.settings.put(backup.data.settings || {id: "app"})
  // ]);
});

// 4. Recharger
location.reload();
```

---

## 5. Scénarios & Fréquences Recommandées

| Scénario | Action | Fréquence |
|----------|--------|-----------|
| **Usage normal** | Export complet | **Hebdomadaire** (chaque vendredi) |
| **Avant MAJ téléphone** | Export complet | **Obligatoire** |
| **Changement téléphone** | Export → Transfert → Import | **Obligatoire** |
| **Nouveau devis important** | Export incrémental (optionnel) | Après chaque gros chantier |
| **Partage collègue** | Export → Envoi fichier | Ponctuel |
| **Réinitialisation app** | Export → Clear storage → Import | Rare |

---

## 6. Checklist Validation Post-Restauration

Après import, **vérifier systématiquement** :

- [ ] Nombre clients = attendu
- [ ] Nombre matériaux = attendu  
- [ ] Nombre devis = attendu
- [ ] Dernier devis ouvre correctement
- [ ] PDF se génère (cache vide → régénération 1-2s)
- [ ] Mode TVA par défaut = correct (Réglages)
- [ ] Totaux calculs = cohérents (test 1 ligne simple)

---

## 7. Gestion des Conflits (Mode Fusion)

| Conflit | Règle de fusion |
|---------|-----------------|
| Même `id` client | **Garder le plus récent** (`updatedAt` ou `createdAt`) |
| Même `id` matériau | **Garder le plus récent** |
| Même `id` devis | **Garder le plus récent** (attention : lignes incluses) |
| Settings | **Garder l'importé** (config utilisateur explicite) |

> 💡 **Conseil** : Préférer **Écraser** après vérification manuelle. Fusion = risque doublons.

---

## 8. Sécurité & Confidentialité

| Aspect | Détail |
|--------|--------|
| **Chiffrement** | Aucun (fichier JSON clair) — **Ne pas stocker en public** |
| **Données sensibles** | Noms, téléphones, emails clients, prix — **Traiter comme confidentiel** |
| **Partage** | WhatsApp/Email = transit non chiffré — Préférer Drive chiffré ou transfert local |
| **Rétention** | Conserver 3 dernières sauvegardes minimum (rotation) |
| **Suppression** | Effacer fichier `.json` après import réussi (si téléphone partagé) |

---

## 9. Dépannage

| Erreur | Cause | Solution |
|--------|-------|----------|
| "Format invalide" | Fichier corrompu / pas JSON | Vérifier extension `.json`, ouvrir dans éditeur |
| "Version incompatible" | Schema DB changé (v2→v3) | Mettre à jour l'app d'abord, puis réessayer |
| "Quota exceeded" | IndexedDB plein (raro) | Vider cache navigateur / Supprimer anciens devis |
| Données manquantes post-import | Mode Fusion + conflit id | Refaire en mode ÉCRASE |
| PDF ne génère plus | Cache `_pdfCache` non importé | Normal — 1re génération = 1-2s, puis instantané |

---

## 10. Automatisation Future (Roadmap)

- [ ] Export auto périodique (Service Worker background sync)
- [ ] Chiffrement AES-256 côté client (mot de passe utilisateur)
- [ ] Sync optionnel vers Firebase/Supabase (opt-in explicite)
- [ ] Notification "Sauvegarde vieille de > 7 jours"

---

## 11. Références Code Source

- **Export** : `src/pages/Settings.tsx` → `handleExport()`
- **Import** : `src/pages/Settings.tsx` → `handleImport()`
- **DB Schema** : `src/db/index.ts` → `db.version(3).stores({...})`
- **Services** : `src/services/database.ts` → `exportData()`, `importData()`

---

*Document généré via DocProductionSystem - Profil Technique*  
*MetalPro Devis — Vos données, votre contrôle.*