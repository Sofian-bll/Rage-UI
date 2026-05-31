import { test, expect, describe, mock } from 'bun:test';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import os from 'os';

const projectDirEntries = [
  { name: 'global', isDirectory: () => true },
  { name: 'pokedex', isDirectory: () => true },
  { name: 'api_meteo', isDirectory: () => true },
  { name: 'file.txt', isDirectory: () => false },
];

mock.module('child_process', () => {
  return {
    exec: (cmd: string, callback: any) => {
      if (cmd.includes('sops -d')) {
        return callback(null, JSON.stringify({ secret: 'value' }), '');
      }
      if (cmd.includes('sops -e')) {
        return callback(null, 'ENCRYPTED_DATA', '');
      }
      return callback(new Error('Command failed'), '', 'Error output');
    }
  };
});

mock.module('simple-git', () => {
  return {
    default: () => ({
      status: async () => ({ files: ['file1.json'] }),
      add: async () => {},
      commit: async () => {},
      push: async () => {}
    })
  };
});

mock.module('fs', () => {
  return {
    ...fs,
    existsSync: () => true,
    promises: {
      ...fs.promises,
      access: async () => {},
      mkdir: async () => undefined,
      readdir: async (dir: string) => {
        if (dir === './projects') {
          return projectDirEntries;
        }
        return [];
      },
      readFile: async (filePath: string) => {
        if (filePath.includes('.env.template')) {
          return 'DB_PASS={{GLOBAL.DB_PASS}}\nLOCAL_KEY={{LOCAL_KEY}}\n';
        }
        return '';
      },
      writeFile: async () => undefined,
    },
  };
});

const { default: app } = await import('./app');

describe('Backend API', () => {
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

  test('GET /api/git/status should return git status', async () => {
    const response = await request(app).get('/api/git/status');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ files: ['file1.json'] });
  });

  test('POST /api/git/sync should run git commands', async () => {
    const response = await request(app)
      .post('/api/git/sync')
      .send({ msg: 'Test commit' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
  });

  test('GET /api/projects should return list of projects', async () => {
    process.env.PROJECTS_DIR = './projects';

    const response = await request(app).get('/api/projects');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ projects: ['api_meteo', 'global', 'pokedex'] });
  });

  test('POST /api/inject/:project should merge and generate .env', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rage-test-'));
    process.env.PROJECTS_DIR = tmpDir;

    fs.mkdirSync(path.join(tmpDir, 'global'), { recursive: true });
    const pokedexDir = path.join(tmpDir, 'pokedex');
    fs.mkdirSync(pokedexDir, { recursive: true });
    fs.writeFileSync(path.join(pokedexDir, '.env.template'), 'DB_PASS={{GLOBAL.DB_PASS}}\nLOCAL_KEY={{LOCAL_KEY}}\n');

    const response = await request(app).post('/api/inject/pokedex');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });

    fs.rmSync(tmpDir, { recursive: true });
  });
});
