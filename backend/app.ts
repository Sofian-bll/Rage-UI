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

const targetFile = process.env.TARGET_FILE || 'secrets.json';

// Utility to handle SOPS exec
const runSops = (cmd: string, input?: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const process = exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.message);
      resolve(stdout);
    });
    if (input && process.stdin) {
      process.stdin.write(input);
      process.stdin.end();
    }
  });
};

app.get('/api/secrets', async (req, res) => {
  try {
    const data = await runSops(`sops -d --output-type json ${targetFile}`);
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'Failed to decrypt secrets', details: err });
  }
});

app.post('/api/secrets', async (req, res) => {
  try {
    const input = JSON.stringify(req.body);
    const encrypted = await runSops(`sops -e --input-type json /dev/stdin`, input);
    // Overwrite the file with encrypted content
    fs.writeFileSync(targetFile, encrypted);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to encrypt secrets', details: err });
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

app.post('/api/git/sync', async (req, res) => {
  try {
    await git.add('.');
    await git.commit(req.body?.msg || 'Updated secrets via Rage UI');
    // Note: To avoid accidental pushes, check if we should push. 
    // The requirement says "run git.push()", so I will fulfill it.
    await git.push();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Git sync failed', details: err });
  }
});

// Serve frontend static files
const frontendPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  // Catch-all route for SPA
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
      next();
    }
  });
}

export default app;
