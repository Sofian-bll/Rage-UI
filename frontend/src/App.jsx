import { Titlebar, Sidebar, SyncOverlay, ToastProvider, useToast } from './shell.jsx';
import { Editor } from './editor.jsx';
import { GitPanel } from './gitpanel.jsx';
import { Settings } from './settings.jsx';
import { TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakSelect, TweakSlider, TweakButton, useTweaks } from './tweaks-panel.jsx';
import { Icon } from './icons.jsx';

// Rage UI root.

import React, { useState as useS, useEffect as useE, useMemo as useM, useCallback as useC } from 'react';

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "vesper",
  "accent": "pink-purple",
  "wallpaper": "tahoe",
  "glassIntensity": 70,
  "density": "regular",
  "layout": "sidebar",
  "editorStyle": "table",
  "maskByDefault": true,
  "autoSaveMs": 600,
  "autoSync": false,
  "commitPrefix": "",
  "apiBase": "",
  "apiKey": ""
}/*EDITMODE-END*/;

const ACCENT_MAP = {
  "pink-purple": { c1: "#FF5E8A", c2: "#BF5AF2", solid: "#C849C9" },
  "blue":        { c1: "#0A84FF", c2: "#5856D6", solid: "#0A84FF" },
  "orange":      { c1: "#FF9F0A", c2: "#FF453A", solid: "#FF8C2A" },
  "green":       { c1: "#30D158", c2: "#0BBA8D", solid: "#1FC78A" },
  "purple":      { c1: "#BF5AF2", c2: "#5E5CE6", solid: "#7E5BE8" }
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply theme + density at the document level so CSS variables flow
  useE(() => {
    document.documentElement.dataset.theme = t.theme;
    document.documentElement.dataset.density = t.density;
    const r = document.documentElement.style;
    if (t.theme === "vesper" || t.theme === "vesper-light") {
      // Vesper themes own their palette — clear inline tweaks so theme rules win.
      ["--accent-1", "--accent-2", "--accent-solid", "--accent-grad",
       "--glass-blur", "--glass-sat"].forEach(k => r.removeProperty(k));
      return;
    }
    const acc = ACCENT_MAP[t.accent] || ACCENT_MAP["pink-purple"];
    r.setProperty("--accent-1", acc.c1);
    r.setProperty("--accent-2", acc.c2);
    r.setProperty("--accent-solid", acc.solid);
    r.setProperty("--accent-grad", `linear-gradient(135deg, ${acc.c1} 0%, ${acc.c2} 100%)`);
    const blur = 14 + (t.glassIntensity / 100) * 50;     // 14 → 64
    const sat  = 110 + (t.glassIntensity / 100) * 110;   // 110 → 220
    r.setProperty("--glass-blur", `${blur}px`);
    r.setProperty("--glass-sat", `${sat}%`);
  }, [t.theme, t.density, t.accent, t.glassIntensity]);

  // ── data state ────────────────────────────────────────────────────────
  const [projects, setProjects] = useS([]);
  const [activeId, setActiveId] = useS(null);
  const [secrets, setSecrets] = useS(null);
  const [diff, setDiff] = useS(null);
  const [gitFiles, setGitFiles] = useS([]);
  const [gitLog, setGitLog] = useS([]);
  const [gitOpen, setGitOpen] = useS(true);
  const [syncing, setSyncing] = useS(false);
  const [syncStep, setSyncStep] = useS("");
  const [query, setQuery] = useS("");
  const [settingsOpen, setSettingsOpen] = useS(false);
  const [sidebarOpen, setSidebarOpen] = useS(false); // mobile drawer
  const push = useToast();

  const refresh = useC(async () => {
    const [p, gs, gl] = await Promise.all([
      window.RageAPI.listProjects(),
      window.RageAPI.gitStatus(),
      window.RageAPI.gitLog()
    ]);
    setProjects(p);
    setGitFiles(gs.files);
    setGitLog(gl);
    setActiveId((cur) => cur || p[0]?.id);
  }, []);

  useE(() => { refresh(); }, [refresh]);
  // listen to api state changes
  useE(() => window.RageAPI.onChange(refresh), [refresh]);

  // load secrets + per-project diff when activeId changes
  useE(() => {
    if (!activeId) return;
    let cancel = false;
    (async () => {
      const [s, d] = await Promise.all([
        window.RageAPI.getSecrets(activeId),
        window.RageAPI.gitDiff(activeId)
      ]);
      if (cancel) return;
      setSecrets(s); setDiff(d);
    })();
    return () => { cancel = true; };
  }, [activeId]);

  const activeProject = projects.find((p) => p.id === activeId);

  // baseline for current project (from diff API)
  const baseline = useM(() => {
    if (!secrets || !diff) return {};
    const base = { ...secrets };
    // undo "added" entries
    diff.added.forEach(a => { delete base[a.key]; });
    // restore modified
    diff.modified.forEach(m => { base[m.key] = m.oldValue; });
    // re-add removed
    diff.removed.forEach(r => { base[r.key] = r.value; });
    return base;
  }, [secrets, diff]);

  // ── actions ──────────────────────────────────────────────────────────
  const onSave = useC(async (obj) => {
    if (!activeId) return;
    await window.RageAPI.putSecrets(activeId, obj);
    const d = await window.RageAPI.gitDiff(activeId);
    setDiff(d);
  }, [activeId]);

  const onRevert = useC(async () => {
    if (!activeId) return;
    await window.RageAPI.revertProject(activeId);
    const s = await window.RageAPI.getSecrets(activeId);
    setSecrets(s);
    const d = await window.RageAPI.gitDiff(activeId);
    setDiff(d);
    push({ kind: "info", msg: "Reverted to last commit" });
  }, [activeId]);

  const onSync = useC(async (msg) => {
    setSyncing(true); setSyncStep("git add .");
    try {
      const res = await window.RageAPI.gitSync(msg, (step) => setSyncStep(step));
      push({ kind: "success", msg: `Pushed · ${res.hash}` });
      // re-load active project
      const s = await window.RageAPI.getSecrets(activeId);
      setSecrets(s);
      const d = await window.RageAPI.gitDiff(activeId);
      setDiff(d);
    } catch (e) {
      push({ kind: "error", msg: "Sync failed: " + (e?.message || "unknown") });
    } finally {
      setSyncing(false); setSyncStep("");
    }
  }, [activeId, push]);

  const onInject = useC(async () => {
    if (!activeId || activeId === 'global') return;
    try {
      await window.RageAPI.injectEnv(activeId);
      push({ kind: "success", msg: `.env generated for ${activeId}` });
    } catch (e) {
      push({ kind: "error", msg: "Injection failed" });
    }
  }, [activeId, push]);

  // global keyboard shortcuts
  useE(() => {
    const onKey = (ev) => {
      const mod = ev.metaKey || ev.ctrlKey;
      if (mod && ev.key.toLowerCase() === "k") {
        ev.preventDefault();
        document.querySelector(".tb-search input")?.focus();
      } else if (mod && ev.key.toLowerCase() === "g") {
        ev.preventDefault();
        setGitOpen(v => !v);
      } else if (mod && ev.key === "Enter" && gitFiles.length) {
        ev.preventDefault();
        onSync();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gitFiles.length, onSync]);

  const dirtyCount = gitFiles.length;
  const gitStatus = dirtyCount ? "dirty" : "clean";

  // filter project list by query
  const filteredProjects = useM(() => {
    if (!query) return projects;
    const q = query.toLowerCase();
    return projects.filter(p =>
      p.name.toLowerCase().includes(q) ||
      Object.keys(p.secrets || {}).some(k => k.toLowerCase().includes(q))
    );
  }, [projects, query]);

  const seedData = window.__seedData;

  return (
    <>
      <div className={`wallpaper wp-${
        t.theme === "vesper" ? "vesper" :
        t.theme === "vesper-light" ? "vesper-light" :
        t.wallpaper
      }`}></div>
      <div className={`app layout-${t.layout}`} data-density={t.density}>
        <Titlebar
          gitStatus={gitStatus}
          gitOpen={gitOpen}
          onToggleGit={() => setGitOpen(v => !v)}
          theme={t.theme}
          onTheme={(v) => setTweak("theme", v)}
          query={query}
          setQuery={setQuery}
          dirtyCount={dirtyCount}
          onOpenSettings={() => setSettingsOpen(true)}
          onToggleSidebar={() => setSidebarOpen(v => !v)}
        />
        {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)}></div>}
        <Sidebar
          projects={filteredProjects}
          activeId={activeId}
          onSelect={(id) => { setActiveId(id); setSidebarOpen(false); }}
          user={seedData?.user}
          dirtyCount={dirtyCount}
          open={sidebarOpen}
        />
        <div className={`main ${gitOpen ? "git-open" : ""}`}>
          {activeProject && secrets ? (
            <Editor
              project={activeProject}
              secrets={secrets}
              baseline={baseline}
              view={t.editorStyle}
              setView={(v) => setTweak("editorStyle", v)}
              onSave={onSave}
              onRevert={onRevert}
              onInject={onInject}
              onRequestSync={() => { setGitOpen(true); }}
              query={query}
              autoSaveMs={t.autoSaveMs || 600}
              maskByDefault={t.maskByDefault !== false}
            />
          ) : (
            <div className="content glass"><div className="empty">
              <Icon name="key" size={40} />
              <h2>Loading…</h2>
              <p>Decrypting secrets via sops · age</p>
            </div></div>
          )}
          <GitPanel
            open={gitOpen}
            files={gitFiles}
            activeProjectId={activeId}
            log={gitLog}
            syncing={syncing}
            onSync={onSync}
            onClose={() => setGitOpen(false)}
            onFocusFile={(pid) => setActiveId(pid)}
          />
        </div>
      </div>

      <SyncOverlay visible={syncing} step={syncStep} />

      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        t={t}
        setTweak={setTweak}
        push={push}
      />

      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakRadio  label="Mode" value={t.theme} options={["light", "dark", "vesper"]}
                     onChange={(v) => setTweak("theme", v)} />
        <TweakColor  label="Accent"
                     value={[ACCENT_MAP[t.accent].c1, ACCENT_MAP[t.accent].c2]}
                     options={[
                       ["#FF5E8A", "#BF5AF2"],
                       ["#0A84FF", "#5856D6"],
                       ["#FF9F0A", "#FF453A"],
                       ["#30D158", "#0BBA8D"],
                       ["#BF5AF2", "#5E5CE6"]
                     ]}
                     onChange={(v) => {
                       const found = Object.entries(ACCENT_MAP).find(([_, m]) => m.c1.toLowerCase() === v[0].toLowerCase());
                       setTweak("accent", found ? found[0] : "pink-purple");
                     }} />
        <TweakSelect label="Wallpaper" value={t.wallpaper}
                     options={["tahoe", "aurora", "dusk", "mono"]}
                     onChange={(v) => setTweak("wallpaper", v)} />
        <TweakSlider label="Glass intensity" value={t.glassIntensity} min={0} max={100} step={10}
                     onChange={(v) => setTweak("glassIntensity", v)} />

        <TweakSection label="Layout" />
        <TweakRadio  label="Density" value={t.density} options={["compact", "regular"]}
                     onChange={(v) => setTweak("density", v)} />
        <TweakRadio  label="Navigation" value={t.layout} options={["sidebar", "grid"]}
                     onChange={(v) => setTweak("layout", v)} />
        <TweakRadio  label="Editor" value={t.editorStyle} options={["table", "cards", "raw"]}
                     onChange={(v) => setTweak("editorStyle", v)} />

        <TweakSection label="Data" />
        <TweakButton label="Reset mock state" onClick={() => {
          window.RageAPI.reset();
          push({ kind: "info", msg: "Mock state reset" });
        }} />
      </TweaksPanel>
    </>
  );
}

function Root() {
  return (
    <ToastProvider>
      <App />
    </ToastProvider>
  );
}

export default Root;
