import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import simpleGit from 'simple-git';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const app = express();
const port = 3000;
const git = simpleGit();

app.use(cors());
app.use(express.json());

const appApiKey = process.env.APP_API_KEY;

const requireApiKey: express.RequestHandler = (req, res, next) => {
  if (!appApiKey || req.header('x-api-key') === appApiKey) {
    next();
    return;
  }
  res.status(401).json({ error: 'Unauthorized' });
};

const runSops = (cmd: string, input?: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const childProcess = exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.message);
      resolve(stdout);
    });
    if (input && childProcess.stdin) {
      childProcess.stdin.write(input);
      childProcess.stdin.end();
    }
  });
};

app.get('/api/secrets/:project', async (req, res) => {
  const project = req.params.project;
  const projectsDir = process.env.PROJECTS_DIR || './projects';
  const targetFile = path.join(projectsDir, project, 'secrets.enc.json');

  if (!fs.existsSync(targetFile)) {
    return res.json({});
  }

  try {
    const data = await runSops(`sops -d --output-type json ${targetFile}`);
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'Failed to decrypt secrets', details: err });
  }
});

app.post('/api/secrets/:project', requireApiKey, async (req, res) => {
  const project = req.params.project;
  const projectsDir = process.env.PROJECTS_DIR || './projects';
  const projectDir = path.join(projectsDir, project);
  const targetFile = path.join(projectDir, 'secrets.enc.json');

  if (!fs.existsSync(projectDir)) {
    await fs.promises.mkdir(projectDir, { recursive: true });
  }

  try {
    const input = JSON.stringify(req.body);
    const encrypted = await runSops(`sops -e --input-type json /dev/stdin`, input);
    await fs.promises.writeFile(targetFile, encrypted);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to encrypt secrets', details: err });
  }
});

app.get('/api/projects', async (req, res) => {
  const projectsDir = process.env.PROJECTS_DIR || './projects';
  try {
    await fs.promises.mkdir(path.join(projectsDir, 'global'), { recursive: true });

    const entries = await fs.promises.readdir(projectsDir, { withFileTypes: true });
    const projects = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    if (!projects.includes('global')) {
      projects.push('global');
    }
    projects.sort();

    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list projects', details: err });
  }
});

app.get('/api/git/status', async (req, res) => {
  try {
    const status = await git.status();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: 'Git status failed', details: err });
  }
});

app.post('/api/git/sync', requireApiKey, async (req, res) => {
  try {
    await git.add('.');
    await git.commit(req.body?.msg || 'Updated secrets via Rage UI');
    await git.push();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Git sync failed', details: err });
  }
});

app.post('/api/inject/:project', requireApiKey, async (req, res) => {
  const project = req.params.project;
  if (project === 'global') {
    return res.status(400).json({ error: 'Cannot inject into global project' });
  }

  const projectsDir = process.env.PROJECTS_DIR || './projects';

  try {
    let globalSecrets: Record<string, unknown> = {};
    const globalFile = path.join(projectsDir, 'global', 'secrets.enc.json');
    if (fs.existsSync(globalFile)) {
      const data = await runSops(`sops -d --output-type json ${globalFile}`);
      globalSecrets = JSON.parse(data);
    }

    const localFile = path.join(projectsDir, project, 'secrets.enc.json');
    let localSecrets: Record<string, unknown> = {};
    if (fs.existsSync(localFile)) {
      const data = await runSops(`sops -d --output-type json ${localFile}`);
      localSecrets = JSON.parse(data);
    }

    const templateFile = path.join(projectsDir, project, '.env.template');
    if (!fs.existsSync(templateFile)) {
      return res.status(404).json({ error: '.env.template not found in project' });
    }

    let templateContent = await fs.promises.readFile(templateFile, 'utf8');

    for (const [key, value] of Object.entries(globalSecrets)) {
      const regex = new RegExp(`{{\\s*GLOBAL\\.${key}\\s*}}`, 'g');
      templateContent = templateContent.replace(regex, String(value));
    }

    for (const [key, value] of Object.entries(localSecrets)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      templateContent = templateContent.replace(regex, String(value));
    }

    const envFile = path.join(projectsDir, project, '.env');
    await fs.promises.writeFile(envFile, templateContent);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Injection failed', details: err });
  }
});

const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    next();
    return;
  }
  const indexFile = path.join(frontendPath, 'index.html');
  try {
    await fs.promises.access(indexFile);
    res.sendFile(indexFile);
  } catch {
    next();
  }
});

export default app;
