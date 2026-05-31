import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RageAPI } from './api.js';

describe('RageAPI', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('should fetch secrets successfully', async () => {
    const mockData = { secretKey: 'secretValue' };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const data = await RageAPI.getSecrets('pokedex');
    expect(global.fetch).toHaveBeenCalledWith('/api/secrets/pokedex');
    expect(data).toEqual(mockData);
  });

  it('should return empty object on fetch failure', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
    });

    const data = await RageAPI.getSecrets('pokedex');
    expect(data).toEqual({});
  });

  it('should push secrets successfully', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true });
    
    const emitSpy = vi.spyOn(RageAPI, '_emit');

    await RageAPI.putSecrets('pokedex', { key: 'value' });
    
    expect(global.fetch).toHaveBeenCalledWith('/api/secrets/pokedex', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ key: 'value' })
    }));
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should fetch git status', async () => {
    const mockStatus = { files: ['test.js'] };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatus,
    });

    const status = await RageAPI.gitStatus();
    expect(global.fetch).toHaveBeenCalledWith('/api/git/status');
    expect(status).toEqual(mockStatus);
  });

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
});
