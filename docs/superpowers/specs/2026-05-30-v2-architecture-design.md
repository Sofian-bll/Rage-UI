# Rage UI V2: Global Secrets Manager & GitOps Injector

## Purpose
Evolve Rage UI from managing a single `secrets.json` file into a multi-project secret manager that handles both global and project-specific secrets, utilizing a template injection pattern (SOPS + `.env.template`).

## Context
Currently, the backend expects a single `TARGET_FILE`. The frontend manages this single object.
The user wants to manage global secrets (like API keys) and inject them into local `.env` files for different applications (e.g., Pokedex, API Meteo) based on `.env.template` files tracked in Git.

## Architecture

### 1. File Structure (Target Directory)
The backend will manage a directory structure like this:
```
/projets/ (Configured via env TARGET_DIR)
├── global/
│   └── secrets.enc.json
├── pokedex/
│   ├── .env.template
│   └── secrets.enc.json
└── api_meteo/
    ├── .env.template
    └── secrets.enc.json
```

### 2. Backend Changes
- Change environment variable from `TARGET_FILE` to `PROJECTS_DIR` (default to `./projects`).
- **Endpoints:**
    - `GET /api/projects`: Scans `PROJECTS_DIR` for subdirectories and the `global` directory. Returns a list of projects.
    - `GET /api/secrets/:project`: Reads `secrets.enc.json` in the specified project directory via SOPS.
    - `POST /api/secrets/:project`: Writes and encrypts `secrets.enc.json` in the specified project directory via SOPS.
    - `POST /api/inject/:project`: 
        1. Decrypts `global/secrets.enc.json`.
        2. Decrypts `<project>/secrets.enc.json`.
        3. Merges them (project secrets take precedence).
        4. Reads `<project>/.env.template`.
        5. Replaces placeholders (e.g., `{{GLOBAL.DB_PASS}}` or `{{DB_PASS}}`) with actual values.
        6. Writes the result to `<project>/.env`.
- Ensure SOPS error handling returns clear messages.

### 3. Frontend Changes
- **Sidebar**: Update `api.js` `listProjects` to fetch from `GET /api/projects`. Display the projects in the sidebar, keeping "global" at the top.
- **Editor**: When editing a project, show its specific secrets. If it's a regular project (not global), fetch the global secrets as well to display them in a read-only "Inherited Globals" section.
- **Actions**: Add an "Inject .env" button to the Titlebar or Editor actions when viewing a specific project. This calls `POST /api/inject/:project`.
- Update `api.js` methods to accept the project ID (folder name) and call the correct backend endpoints.

## Data Flow for Injection
1. User clicks "Inject .env" on `pokedex`.
2. Frontend calls `POST /api/inject/pokedex`.
3. Backend merges `global` + `pokedex` secrets.
4. Backend parses `pokedex/.env.template` using simple string replacement or a lightweight templating engine (like Handlebars or Regex).
5. Backend writes `pokedex/.env`.
6. Success response sent to UI.

## Error Handling & Edge Cases
- **Missing Global Dir**: If `global/` doesn't exist, create it or handle gracefully.
- **Missing Template**: If `<project>/.env.template` is missing, the injection endpoint should return an error or skip injection.
- **Git Sync**: `git add .` and `git commit` should still work at the `PROJECTS_DIR` level.

## Testing Strategy
- Update backend unit tests (`app.test.ts`) to cover multi-project logic and the injection endpoint.
- Update frontend API tests.
