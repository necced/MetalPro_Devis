# Inventaire de l'Environnement de Développement

**Date de l'inventaire :** 2026-10-27  
**Poste de travail :** Windows 11 Pro (utilisateur : cedri)  
**Projet :** MetalPro Devis — Phase 1 : Étude technique et choix d'architecture

---

## 1. Outils de développement installés

| Outil                        | Version          | Chemin / Notes                                                      | Disponible |
| ---------------------------- | ---------------- | ------------------------------------------------------------------- | ---------- |
| **Node.js**                  | v20.19.5         | `/c/Program Files/nodejs/node.exe`                                  | ✅         |
| **npm**                      | 10.8.2           | Inclus avec Node.js                                                 | ✅         |
| **Git**                      | 2.55.0.windows.4 | `/c/Program Files/Git/bin/git.exe`                                  | ✅         |
| **Python**                   | 3.12.9 / 3.13.15 | `/c/Users/cedri/AppData/Local/Programs/Python/Python313/python.exe` | ✅         |
| **uv** (gestionnaire Python) | 0.x              | `/c/Users/cedri/.local/bin/uv.exe`                                  | ✅         |
| **rtk** (Rust Token Killer)  | x.x              | `/c/Users/cedri/.local/bin/rtk.exe`                                 | ✅         |

## 2. Outils FCC (Free Claude Code)

| Outil       | Version | Chemin                                      | Notes                   |
| ----------- | ------- | ------------------------------------------- | ----------------------- |
| fcc-desktop | 6.9.1   | `/c/Users/cedri/.local/bin/fcc-desktop.exe` | Interface desktop       |
| fcc-server  | 6.9.1   | `/c/Users/cedri/.local/bin/fcc-server.exe`  | Serveur local port 8082 |
| fcc-doctor  | 6.9.1   | `/c/Users/cedri/.local/bin/fcc-doctor.exe`  | Diagnostics             |
| fcc-claude  | 6.9.1   | `/c/Users/cedri/.local/bin/fcc-claude.exe`  | Intégration Claude Code |
| fcc-dsh     | 6.9.1   | `/c/Users/cedri/.local/bin/fcc-dsh.exe`     | DeepSeek via DSH        |
| fcc-update  | —       | `/c/Users/cedri/.local/bin/fcc-update`      | Mise à jour             |

## 3. Navigateurs disponibles

| Navigateur         | Version         | Chemin                                                         | Notes                  |
| ------------------ | --------------- | -------------------------------------------------------------- | ---------------------- |
| **Google Chrome**  | Dernière stable | `C:\Program Files\Google\Chrome\Application\chrome.exe`        | ✅ Support PWA complet |
| **Microsoft Edge** | Dernière stable | `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` | ✅ Support PWA complet |
| Mozilla Firefox    | Non installé    | —                                                              | ❌                     |

## 4. Éditeurs de code

| Éditeur        | Statut                          | Notes                           |
| -------------- | ------------------------------- | ------------------------------- |
| **VS Code**    | Non installé (ou pas dans PATH) | Peut être installé gratuitement |
| **Notepad++**  | Non vérifié                     | Alternative légère              |
| **Vim/Neovim** | Non vérifié                     | Disponible via Git Bash         |

## 5. Espace disque

| Disque | Total  | Utilisé | Libre     | % Utilisé |
| ------ | ------ | ------- | --------- | --------- |
| **C:** | 290 GB | 267 GB  | **24 GB** | 93%       |

> ⚠️ **Attention :** Espace disque limité (24 GB). Prévoir le nettoyage si nécessaire avant développement.

## 6. Réseau et connectivité

- **Connexion Internet :** Disponible (vérifié via téléchargements antérieurs)
- **Proxy d'entreprise :** Non détecté
- **Ports locaux disponibles :** 8082 (FCC), 3000, 5173 (Vite), 8080, etc.

## 7. Variables d'environnement pertinentes

```bash
PATH inclut :
  - C:\Program Files\nodejs\
  - C:\Program Files\Git\bin\
  - C:\Users\cedri\.local\bin\
  - C:\Users\cedri\AppData\Local\Programs\Python\Python313\
  - C:\Users\cedri\AppData\Roaming\npm\
```

## 8. Configuration FCC existante

- **Serveur FCC :** Actif sur `http://127.0.0.1:8082`
- **Version :** 6.9.1
- **Authentification :** Activée (token par défaut `freecc`)
- **Modèles disponibles :** 436 modèles via `/v1/models`
- **Intégration Claude Desktop :** Connectée
- **DSH (DeepSeek) :** Disponible via `fcc-dsh`

## 9. Résumé des capacités

| Capacité                     | Statut        | Détails                                 |
| ---------------------------- | ------------- | --------------------------------------- |
| Développement Node.js/React  | ✅ Prêt       | Node 20 LTS, npm 10                     |
| Gestion de versions Git      | ✅ Prêt       | Git 2.55                                |
| Exécution Python             | ✅ Prêt       | Python 3.12/3.13 + uv                   |
| Test navigateur mobile       | ✅ Prêt       | Chrome + Edge (DevTools device toolbar) |
| PWA / Service Workers        | ✅ Supporté   | Chrome/Edge support complet             |
| IndexedDB / LocalStorage     | ✅ Supporté   | Navigateurs modernes                    |
| Génération PDF côté client   | ✅ Possible   | Bibliothèques JS disponibles            |
| Hébergement statique gratuit | ✅ Disponible | GitHub Pages, Netlify, Cloudflare Pages |

---

**Conclusion :** L'environnement est **prêt pour le développement** d'une PWA React+Vite ou Vanilla JS. Tous les outils essentiels sont présents. L'espace disque est le point d'attention principal.
