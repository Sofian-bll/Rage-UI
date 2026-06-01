# Rage UI — Global Secrets Manager & GitOps Injector

Rage UI est un manager de secrets local-first avec interface web. Il permet de gérer des secrets globaux (clés API, tokens) et des secrets par projet, puis de les injecter automatiquement dans des fichiers `.env` via un système de templates, le tout chiffré avec **SOPS + Age** et synchronisé sur Git.

---

## Concept en 30 secondes

Tu as plusieurs projets (Pokedex, API Météo...) qui ont tous besoin de secrets (un token DigitalOcean par exemple). Plutôt que de copier-coller le même token dans 10 fichiers `.env`, tu fais ça :

1. **Un coffre-fort central** : le dossier `global/` contient tes secrets communs (ex: `DO_TOKEN`).
2. **Un template par projet** : chaque projet a un fichier `.env.template` qui dit ce dont il a besoin (ex: `DO_TOKEN={{GLOBAL.DO_TOKEN}}`).
3. **Un clic sur "Inject .env"** : Rage UI lit le template, fusionne les secrets globaux + locaux, et génère le vrai `.env`.

Si ton token DigitalOcean change, tu le modifies **une seule fois** dans `global`, tu cliques sur "Inject" dans chaque projet, et tout est à jour.

```
PROJECTS_DIR/
├── global/
│   └── secrets.enc.json          ← Secrets communs (DO_TOKEN, clés API...)
├── pokedex/
│   ├── .env.template             ← DO_TOKEN={{GLOBAL.DO_TOKEN}}
│   └── secrets.enc.json          ← Secrets propres à Pokedex (PORT=8080)
└── api_meteo/
    ├── .env.template
    └── secrets.enc.json
```

---

## Quickstart Local (tester sur ton PC en 1 minute)

### Prérequis

- **Bun** installé (`brew install oven-sh/bun/bun` ou https://bun.sh)
- **Node.js** installé (pour le frontend)

### 1. Lance le Backend (Bun + Express)

```bash
cd backend
bun install
bun run server.ts
```

Le backend tourne sur `http://localhost:3000`.

### 2. Lance le Frontend (Vite + React)

Dans un **deuxième terminal** :

```bash
cd frontend
npm install
npm run dev
```

Le frontend tourne sur `http://localhost:5173`. Les appels `/api` sont automatiquement redirigés vers le backend.

### 3. Teste dans l'interface

Le dossier `backend/projects/` contient déjà deux projets de test (`pokedex` et `api_meteo`) avec leurs `.env.template`.

1. Dans la sidebar, clique sur **global** → ajoute une variable `POKE_API_KEY` avec la valeur `123456` → clique **Save**.
2. Clique sur **pokedex** → ajoute une variable `PORT` avec la valeur `8080` → **Save**.
3. Toujours sur Pokedex, clique sur le bouton ⚡ **Inject .env** en haut à droite.
4. Ouvre `backend/projects/pokedex/.env` : ton fichier `.env` vient d'être généré avec les valeurs fusionnées !

---

## Structure des Templates

Le fichier `.env.template` utilise des placeholders que Rage UI remplace à l'injection :

| Syntaxe | Source | Exemple |
|---------|--------|---------|
| `{{GLOBAL.KEY}}` | Secret du dossier `global/` | `{{GLOBAL.DO_TOKEN}}` |
| `{{KEY}}` | Secret local du projet | `{{PORT}}` |

**Exemple de `.env.template` :**
```
# Pokedex
POKE_API_KEY={{GLOBAL.POKE_API_KEY}}
DO_TOKEN={{GLOBAL.DO_TOKEN}}
PORT={{PORT}}
HOST=pokedex.local
```

Les secrets locaux **écrasent** les secrets globaux si le même nom est utilisé.

---

## Docker (Production / Homelab)

Un `docker-compose.yml` est fourni pour un déploiement en conteneur.

Le conteneur embarque tout : le backend Bun, le frontend statique, Git, SOPS, et OpenSSH.

### Configuration Docker

```yaml
services:
  sops-gitops-ui:
    build: .
    ports:
      - "3000:3000"
    environment:
      - APP_API_KEY=TokenSuperSecurise!    # Optionnel : protège les routes POST
      - PROJECTS_DIR=/projets              # Dossier contenant global/ + projets
    volumes:
      - /home/sofiane/.config/sops/age/keys.txt:/root/.config/sops/age/keys.txt:ro
      - /home/sofiane/.ssh/id_rsa:/root/.ssh/id_rsa:ro
      - /home/sofiane/docker-apps:/projets
    restart: unless-stopped
```

Les volumes montent :
1. **Clé Age SOPS** : nécessaire pour déchiffrer/chiffrer les secrets (fichier texte, à ne jamais commit).
2. **Clé SSH Git** : pour push les secrets chiffrés vers GitHub/GitLab.
3. **Dossier des projets** : ton dépôt Git contenant la structure `PROJECTS_DIR`.

### Lancer en Docker

```bash
docker-compose up -d --build
# Accéder à http://localhost:3000
```

---

## API Endpoints

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| `GET` | `/api/projects` | Liste tous les projets (dossiers dans `PROJECTS_DIR`) | — |
| `GET` | `/api/secrets/:project` | Déchiffre les secrets d'un projet | — |
| `POST` | `/api/secrets/:project` | Chiffre et sauvegarde les secrets d'un projet | API Key |
| `POST` | `/api/inject/:project` | Fusionne global + local, lit `.env.template`, génère `.env` | API Key |
| `GET` | `/api/git/status` | État Git du dossier `PROJECTS_DIR` | — |
| `POST` | `/api/git/sync` | `git add . && git commit && git push` | API Key |

---

## Générer une clé Age (SOPS)

Si tu n'as pas encore de clé Age pour SOPS :

```bash
# Installer SOPS
brew install sops

# Générer une clé Age
age-keygen -o ~/.config/sops/age/keys.txt
```

La clé publique s'affiche. Ajoute-la dans ton `.sops.yaml` à la racine de ton repo :

```yaml
creation_rules:
  - age: <TA_CLE_PUBLIQUE>
```

---

## Tests

```bash
# Backend (bun test)
cd backend && bun test

# Frontend (vitest)
cd frontend && npm run test

# End-to-end (Playwright — nécessite frontend + backend lancés)
cd e2e && npx playwright test
```

---

## Stack Technique

| Couche | Technologie |
|--------|------------|
| Frontend | Vite + React (JSX) |
| Backend | Bun + Express (TypeScript) |
| Chiffrement | SOPS (Age) |
| Git | simple-git |
| Déploiement | Docker (multi-stage) |
| Tests | bun test, Vitest, Playwright |
