import { Icon } from './icons.jsx';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';


/* ───────── Toast system ───────── */
const ToastCtx = React.createContext(null);
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((p) => [...p, { ...t, id }]);
    setTimeout(() => {
      setToasts((p) => p.map(x => x.id === id ? { ...x, exiting: true } : x));
      setTimeout(() => setToasts((p) => p.filter(x => x.id !== id)), 250);
    }, t.duration || 2600);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts">
        {toasts.map(t => (
          <div key={t.id} className={`toast glass strong ${t.kind || "info"} ${t.exiting ? "exiting" : ""}`}>
            <span className="ico">{t.kind === "success" ? "✓" : t.kind === "error" ? "!" : "i"}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => React.useContext(ToastCtx);

/* ───────── Titlebar ───────── */
export function Titlebar({ gitStatus, onToggleGit, gitOpen, theme, onTheme, query, setQuery, dirtyCount, onOpenSettings, onToggleSidebar }) {
  return (
    <div className="titlebar glass">
      <button className="icon-btn hamburger" onClick={onToggleSidebar} title="Menu">
        <Icon name="menu" size={16} />
      </button>
      <div className="tb-lights" aria-hidden="true">
        <span className="r"></span><span className="y"></span><span className="g"></span>
      </div>
      <div className="tb-title">
        Rage UI
        <span className="badge">SOPS · GITOPS</span>
      </div>

      <div className="tb-search">
        <Icon name="search" size={14} style={{ opacity: .55 }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search secrets, projects…"
        />
        <kbd>⌘K</kbd>
      </div>

      <div className="tb-right">
        <button
          className={`git-chip ${gitStatus === "dirty" ? "dirty" : "clean"}`}
          onClick={onToggleGit}
          title="Git status"
        >
          <span className="dot"></span>
          <span>
            {gitStatus === "dirty"
              ? <>{dirtyCount} change{dirtyCount === 1 ? "" : "s"}</>
              : <>Up to date</>}
          </span>
        </button>

        <button
          className={`icon-btn ${gitOpen ? "active" : ""}`}
          onClick={onToggleGit}
          title="Git panel"
        >
          <Icon name="panel-right" size={15} />
        </button>

        <button
          className="icon-btn"
          onClick={() => {
            const order = ["dark", "vesper", "light"];
            const i = order.indexOf(theme);
            // If current is vesper-light or unknown, go to dark; else cycle in order
            onTheme(i === -1 ? "dark" : order[(i + 1) % order.length]);
          }}
          title={`Theme · ${theme} (click to cycle)`}
        >
          <Icon name={theme === "dark" ? "moon" : (theme === "vesper" || theme === "vesper-light") ? "vesper" : "sun"} size={15} />
        </button>

        <button className="icon-btn" onClick={onOpenSettings} title="Settings">
          <Icon name="gear" size={15} />
        </button>
      </div>
    </div>
  );
}

/* ───────── Sidebar ───────── */
export function Sidebar({ projects, activeId, onSelect, user, dirtyCount, open }) {
  return (
    <div className={`sidebar glass ${open ? "open" : ""}`}>
      <div className="sb-section">Repository</div>
      <div className="sb-list">
        <div className="sb-item">
          <div className="sb-icon" style={{ background: "linear-gradient(135deg,#FF5E8A,#BF5AF2)" }}>
            <Icon name="branch" size={13} />
          </div>
          <div className="sb-name">homelab</div>
          <div className="sb-meta">
            {dirtyCount > 0 && <span className="sb-dirty-dot" title="Uncommitted changes"></span>}
            <span>main</span>
          </div>
        </div>
      </div>

      <div className="sb-section">Projects</div>
      <div className="sb-list" style={{ flex: 1 }}>
        {projects.map((p) => (
          <div
            key={p.id}
            className={`sb-item ${activeId === p.id ? "active" : ""}`}
            onClick={() => onSelect(p.id)}
          >
            <div className="sb-icon" style={{ background: p.iconColor }}>{p.icon}</div>
            <div className="sb-name">{p.name}</div>
            <div className="sb-meta">
              {p.dirty && <span className="sb-dirty-dot" title="Uncommitted"></span>}
              <span>{p.secretCount}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="sb-footer">
        <div className="sb-user">
          <div className="sb-avatar">{(user?.name || "?")[0].toUpperCase()}</div>
          <div className="sb-user-meta">
            <div className="n">{user?.name}</div>
            <div className="h">{user?.host}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── Sync overlay ───────── */
export function SyncOverlay({ visible, step }) {
  if (!visible) return null;
  return (
    <div className="sync-overlay">
      <div className="sync-card glass strong">
        <div className="sync-spinner"></div>
        <h3>Syncing to GitHub</h3>
        <p>Add · Commit · Push</p>
        {step && <div className="sync-step">$ {step}</div>}
      </div>
    </div>
  );
}

