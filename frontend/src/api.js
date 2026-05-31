export const RageAPI = {
  onChangeHandlers: [],

  onChange(fn) {
    this.onChangeHandlers.push(fn);
  },

  _emit() {
    this.onChangeHandlers.forEach((fn) => fn());
  },

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

  async gitStatus() {
    try {
      const res = await fetch('/api/git/status');
      if (!res.ok) throw new Error('Failed to fetch status');
      const json = await res.json();
      return { files: json.files || [] };
    } catch (e) {
      console.error(e);
      return { files: [] };
    }
  },

  async gitSync(msg, progressCb) {
    try {
      if (progressCb) progressCb('Syncing...');
      const res = await fetch('/api/git/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msg })
      });
      if (!res.ok) throw new Error('Sync failed');
      this._emit();
      return await res.json();
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  async gitLog() {
    return []; // mock
  },

  async gitDiff(id) {
    return { added: [], modified: [], removed: [] }; // mock per requirements for now
  },

  async revertProject(id) {
    // mock
  },

  reset() {
    // mock
  }
};
