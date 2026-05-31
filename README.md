# Rage UI (SOPS & GitOps Seamless UI)

Rage UI est un service auto-hébergé permettant de gérer des secrets via **SOPS** / **Age** de manière transparente, en s'intégrant directement dans un workflow **GitOps**. 
L'objectif est de fournir une interface web pour modifier des variables d'environnement chiffrées et les synchroniser avec un dépôt Git (GitHub/GitLab) sans jamais ouvrir un terminal.

## 🚀 Fonctionnalités

- **Édition Seamless** : Interface web fluide (Vue 3 / React) pour modifier vos secrets en clair.
- **GitOps Intégré** : Synchronisation en 1-clic (Add, Commit, Push) vers votre dépôt.
- **Auto-Chiffrement** : Le backend s'occupe de chiffrer (via `sops -e`) et déchiffrer (`sops -d`) à la volée.
- **Local-First** : Pensé pour tourner dans un Homelab, au plus près de vos fichiers de configuration.

## 📦 Structure du Projet

Le projet est divisé en deux parties :
- `/frontend` : L'interface utilisateur construite avec Vite et React.
- `/backend` : L'API construite avec Bun et Express, qui orchestre `sops` et `git`.

## 🛠 Prérequis

Pour utiliser Rage UI, la machine (ou le conteneur) exécutant le backend doit disposer de :
1. **Git** configuré avec accès SSH (`id_rsa`) à votre dépôt (GitHub/GitLab).
2. **SOPS** installé.
3. Une **Clé Age** pour SOPS (généralement dans `~/.config/sops/age/keys.txt`).
4. Le dossier cible doit être un dépôt Git initialisé.

## 🐳 Utilisation via Docker (Recommandé)

Un fichier `docker-compose.yml` est fourni pour un déploiement facile sur un Homelab.

1. Éditez le `docker-compose.yml` pour ajuster les chemins de vos volumes :
   - Clé Age : `/home/sofiane/.config/sops/age/keys.txt`
   - Clé SSH : `/home/sofiane/.ssh/id_rsa`
   - Dossier GitOps : `/home/sofiane/docker-apps` (qui sera monté sur `/projets`)
2. Définissez la variable `TARGET_FILE` pour pointer vers le fichier de secrets à gérer (ex: `/projets/secrets.json`).
3. Lancez le conteneur :
   ```bash
   docker-compose up -d --build
   ```
4. Accédez à l'interface via `http://localhost:3000`.

## 💻 Développement Local

### Lancer le Backend
```bash
cd backend
bun install
# Créez un fichier .env avec TARGET_FILE=/chemin/vers/votre/fichier.json
bun run index.ts
```
Le backend tournera sur `http://localhost:3000`.

### Lancer le Frontend
```bash
cd frontend
npm install
npm run dev
```
Le frontend tournera sur `http://localhost:5173` et redirigera les appels `/api` vers le backend via le proxy de Vite.

## 🧪 Tests

- **Backend** : Les tests unitaires sont écrits avec `bun test`. Lancez `bun test` dans le dossier `backend`.
- **Frontend** : Les tests unitaires utilisent Vitest. Lancez `npm run test` dans le dossier `frontend`.
- **E2E** : Les tests end-to-end utilisent Playwright. Lancez `npm run test:e2e` dans le dossier `e2e` (à configurer).

---
### 💡 Réponses aux questions fréquentes

**Est-ce que je vais en faire un... (plusieurs fichiers / un seul fichier) ?**
Dans l'état actuel (v1.0), le backend lit la variable d'environnement `TARGET_FILE` et gère un seul fichier de secrets à la fois (par exemple `secrets.json`). 
Cependant, l'architecture prévoit déjà que l'on puisse lister des projets. Pour gérer plusieurs fichiers, on peut facilement faire évoluer le backend pour que `TARGET_FILE` soit un dossier, et que le frontend demande un fichier spécifique (via un paramètre `?file=...` sur les routes API).
