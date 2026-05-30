import { test, expect, describe, mock } from 'bun:test';
import request from 'supertest';
import app from './app';
import fs from 'fs';

// Mock child_process and simple-git to avoid executing real commands
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
  return () => ({
    status: async () => ({ files: ['file1.json'] }),
    add: async () => {},
    commit: async () => {},
    push: async () => {}
  });
});

mock.module('fs', () => {
  return {
    ...fs,
    writeFileSync: () => {} // Mock to prevent writing to real files
  };
});

describe('Backend API', () => {
  test('GET /api/secrets should return decrypted data', async () => {
    const response = await request(app).get('/api/secrets');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ secret: 'value' });
  });

  test('POST /api/secrets should encrypt and save data', async () => {
    const response = await request(app)
      .post('/api/secrets')
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
});
