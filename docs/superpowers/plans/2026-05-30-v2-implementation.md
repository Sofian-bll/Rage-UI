# Rage UI V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve Rage UI into a multi-project secret manager that supports template injection (Global Secrets -> Project .env files).

**Architecture:** The backend will scan a `PROJECTS_DIR` for subfolders (representing projects, plus a special `global` folder). It provides APIs to list projects, get/set secrets per project, and an `inject` API that merges global + project secrets and renders an `.env.template` into an `.env` file. The frontend will adapt its UI to display these projects in the sidebar and allow triggering the injection process.

**Tech Stack:** Bun, Express, simple-git, sops, Vite, React.

---

### Task 1: Backend Setup & Multi-Project Structure API

**Files:**
- Modify: `backend/app.ts`
- Modify: `backend/app.test.ts`
- Modify: `backend/.env` (or setup test environment variables)

- [ ] **Step 1: Write the failing test for `GET /api/projects`**

```typescript
// in backend/app.test.ts
import { describe, test, expect, mock } from 'bun:test';
import request from 'supertest';
import fs from 'fs';

// Mock fs to simulate a directory structure
mock.module('fs', () => {
  return {
    ...fs,
    readdirSync: (dir: string, options: any) => {
      if (dir === './projects') {
        return [
          { name: 'global', isDirectory: () => true },
          { name: 'pokedex', isDirectory: () => true },
          { name: 'api_meteo', isDirectory: () => true },
          { name: 'file.txt', isDirectory: () => false }
        ];
      }
      return [];
    },
    existsSync: () => false,
  };
});

// Import app after mocks
const { default: app } = await import('./app');

describe('Backend API V2', () => {
  test('GET /api/projects should return list of projects', async () => {
    process.env.PROJECTS_DIR = './projects';
    const response = await request(app).get('/api/projects');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ projects: ['global', 'api_meteo', 'pokedex'] }); // order might vary, sort or expect.arrayContaining
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test` in `backend`
Expected: FAIL (404 on `/api/projects`)

- [ ] **Step 3: Write minimal implementation in `app.ts`**

```typescript
// in backend/app.ts
import fs from 'fs';
import path from 'path';

const projectsDir = process.env.PROJECTS_DIR || './projects';

app.get('/api/projects', (req, res) => {
  try {
    if (!fs.existsSync(projectsDir)) {
      fs.mkdirSync(projectsDir, { recursive: true });
    }
    const entries = fs.readdirSync(projectsDir, { withFileTypes: true });
    const projects = entries
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .sort(); // Sort for consistent test results
    
    // Ensure 'global' always exists in the returned list, even if empty folder created dynamically
    if (!projects.includes('global')) {
      fs.mkdirSync(path.join(projectsDir, 'global'), { recursive: true });
      projects.unshift('global');
    }
    
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list projects', details: err });
  }
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test` in `backend`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app.ts backend/app.test.ts
git commit -m "feat(backend): add /api/projects endpoint to list subdirectories"
```

---

### Task 2: Backend Dynamic Secret Endpoints

**Files:**
- Modify: `backend/app.ts`
- Modify: `backend/app.test.ts`

- [ ] **Step 1: Write the failing tests for dynamic secrets**

```typescript
// in backend/app.test.ts (update existing secrets tests)
  test('GET /api/secrets/:project should return decrypted data', async () => {
    const response = await request(app).get('/api/secrets/pokedex');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ secret: 'value' });
  });

  test('POST /api/secrets/:project should encrypt and save data', async () => {
    const response = await request(app)
      .post('/api/secrets/pokedex')
      .send({ newSecret: 'newValue' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test` in `backend`
Expected: FAIL (404 on `/api/secrets/pokedex`)

- [ ] **Step 3: Update endpoints in `app.ts`**

```typescript
// Replace app.get('/api/secrets', ...) with:
app.get('/api/secrets/:project', async (req, res) => {
  const project = req.params.project;
  const targetFile = path.join(projectsDir, project, 'secrets.enc.json');
  
  if (!fs.existsSync(targetFile)) {
    return res.json({}); // Return empty object for new projects
  }

  try {
    const data = await runSops(`sops -d --output-type json ${targetFile}`);
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'Failed to decrypt secrets', details: err });
  }
});

// Replace app.post('/api/secrets', ...) with:
app.post('/api/secrets/:project', async (req, res) => {
  const project = req.params.project;
  const projectDir = path.join(projectsDir, project);
  const targetFile = path.join(projectDir, 'secrets.enc.json');

  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  try {
    const input = JSON.stringify(req.body);
    const encrypted = await runSops(`sops -e --input-type json /dev/stdin`, input);
    fs.writeFileSync(targetFile, encrypted);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to encrypt secrets', details: err });
  }
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test` in `backend`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app.ts backend/app.test.ts
git commit -m "feat(backend): support per-project secrets reading and writing"
```

---

### Task 3: Backend Injection Endpoint

**Files:**
- Modify: `backend/app.ts`
- Modify: `backend/app.test.ts`

- [ ] **Step 1: Write the failing test for `/api/inject/:project`**

```typescript
// in backend/app.test.ts
mock.module('fs', () => {
  return {
    ...fs,
    readFileSync: (filePath: string, encoding: string) => {
      if (filePath.endsWith('.env.template')) {
        return 'DB_PASS={{GLOBAL.DB_PASS}}\nLOCAL_KEY={{LOCAL_KEY}}\n';
      }
      return '';
    },
    // ... keep existing mocks
  };
});

describe('Injection API', () => {
  test('POST /api/inject/:project should merge and generate .env', async () => {
    // We assume sops -d mock returns { secret: 'value' }, so we'll mock specifically for this test if needed,
    // or just assume both global and local return { secret: 'value' } for now. Let's send a payload.
    // Actually our SOPS mock returns { secret: 'value' }. 
    // Let's just verify the endpoint returns success.
    const response = await request(app).post('/api/inject/pokedex');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test` in `backend`
Expected: FAIL (404)

- [ ] **Step 3: Implement Injection in `app.ts`**

```typescript
// in backend/app.ts
app.post('/api/inject/:project', async (req, res) => {
  const project = req.params.project;
  if (project === 'global') {
    return res.status(400).json({ error: 'Cannot inject into global project' });
  }

  try {
    let globalSecrets = {};
    let localSecrets = {};

    const globalFile = path.join(projectsDir, 'global', 'secrets.enc.json');
    if (fs.existsSync(globalFile)) {
      const data = await runSops(`sops -d --output-type json ${globalFile}`);
      globalSecrets = JSON.parse(data);
    }

    const localFile = path.join(projectsDir, project, 'secrets.enc.json');
    if (fs.existsSync(localFile)) {
      const data = await runSops(`sops -d --output-type json ${localFile}`);
      localSecrets = JSON.parse(data);
    }

    const templateFile = path.join(projectsDir, project, '.env.template');
    if (!fs.existsSync(templateFile)) {
      return res.status(404).json({ error: '.env.template not found in project' });
    }

    let templateContent = fs.readFileSync(templateFile, 'utf8');

    // Replace {{GLOBAL.KEY}}
    for (const [key, value] of Object.entries(globalSecrets)) {
      const regex = new RegExp(`{{\\s*GLOBAL\\.${key}\\s*}}`, 'g');
      templateContent = templateContent.replace(regex, String(value));
    }

    // Replace {{KEY}}
    for (const [key, value] of Object.entries(localSecrets)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      templateContent = templateContent.replace(regex, String(value));
    }

    const envFile = path.join(projectsDir, project, '.env');
    fs.writeFileSync(envFile, templateContent);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Injection failed', details: err });
  }
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test` in `backend`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app.ts backend/app.test.ts
git commit -m "feat(backend): implement template injection for .env generation"
```

---

### Task 4: Frontend API Adaptation

**Files:**
- Modify: `frontend/src/api.js`
- Modify: `frontend/src/api.test.js`

- [ ] **Step 1: Update API wrapper**

```javascript
// in frontend/src/api.js
  async listProjects() {
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      return data.projects.map(p => ({ id: p, name: p }));
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getSecrets(id) {
    try {
      const res = await fetch(`/api/secrets/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return await res.json();
    } catch (e) {
      console.error(e);
      return {};
    }
  },

  async putSecrets(id, data) {
    try {
      const res = await fetch(`/api/secrets/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to save');
      this._emit();
    } catch (e) {
      console.error(e);
    }
  },

  async injectEnv(id) {
    try {
      const res = await fetch(`/api/inject/${id}`, { method: 'POST' });
      if (!res.ok) throw new Error('Injection failed');
      return await res.json();
    } catch (e) {
      console.error(e);
      throw e;
    }
  },
```

- [ ] **Step 2: Write tests for `api.js`**

```javascript
// in frontend/src/api.test.js
// Add to describe block:
  it('should list projects', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ projects: ['global', 'pokedex'] }),
    });
    const data = await RageAPI.listProjects();
    expect(global.fetch).toHaveBeenCalledWith('/api/projects');
    expect(data).toEqual([{ id: 'global', name: 'global' }, { id: 'pokedex', name: 'pokedex' }]);
  });

  it('should inject env', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
    await RageAPI.injectEnv('pokedex');
    expect(global.fetch).toHaveBeenCalledWith('/api/inject/pokedex', { method: 'POST' });
  });
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npm run test` in `frontend`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add frontend/src/api.js frontend/src/api.test.js
git commit -m "feat(frontend): update api.js to support multi-project and injection"
```

---

### Task 5: Frontend UI - Injection Button

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/editor.jsx`

- [ ] **Step 1: Add inject action in `App.jsx`**

```javascript
// in frontend/src/App.jsx
  // Add this inside App component, alongside onSave / onSync
  const onInject = useC(async () => {
    if (!activeId || activeId === 'global') return;
    try {
      await window.RageAPI.injectEnv(activeId);
      push({ kind: "success", msg: `.env generated for ${activeId}` });
    } catch (e) {
      push({ kind: "error", msg: "Injection failed" });
    }
  }, [activeId, push]);
```

```javascript
// in App.jsx, pass onInject to Editor
              <Editor
                project={activeProject}
                secrets={secrets}
                baseline={baseline}
                view={t.editorStyle}
                setView={(v) => setTweak("editorStyle", v)}
                onSave={onSave}
                onRevert={onRevert}
                onInject={onInject} // <--- ADD THIS
                onRequestSync={() => { setGitOpen(true); }}
                query={query}
                autoSaveMs={t.autoSaveMs || 600}
                maskByDefault={t.maskByDefault !== false}
              />
```

- [ ] **Step 2: Add Inject Button to `Editor` toolbar**

```javascript
// in frontend/src/editor.jsx
// Modify export function Editor({ project, secrets, baseline, view, setView, onSave, onRevert, onInject, ... })
// Inside Editor's return statement, find the toolbar (usually near "Save" / "Revert")
// Add:
        {project.id !== 'global' && (
          <button className="btn outline" onClick={onInject}>
            <Icon name="bolt" /> Inject .env
          </button>
        )}
```

- [ ] **Step 3: Verify frontend build**

Run: `npm run build` in `frontend`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.jsx frontend/src/editor.jsx
git commit -m "feat(frontend): add Inject .env button to editor"
```
