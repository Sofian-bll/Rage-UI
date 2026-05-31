import { Icon } from './icons.jsx';

// Git panel: status + diff + commit message + history.

import React, { useState, useEffect, useMemo } from 'react';


function DiffView({ diff }) {
  if (!diff) return null;
  const lines = [];
  let ln = 1;
  // context-ish: show a header
  if (diff.added.length === 0 && diff.removed.length === 0 && diff.modified.length === 0) {
    return <div className="gp-diff"><div className="line" style={{ color: "var(--text-faint)", padding: "8px 10px" }}>No changes</div></div>;
  }
  for (const m of diff.modified) {
    lines.push({ kind: "del", txt: `${m.key}: ${m.oldValue}` });
    lines.push({ kind: "add", txt: `${m.key}: ${m.newValue}` });
  }
  for (const a of diff.added) {
    lines.push({ kind: "add", txt: `${a.key}: ${a.value}` });
  }
  for (const r of diff.removed) {
    lines.push({ kind: "del", txt: `${r.key}: ${r.value}` });
  }
  return (
    <div className="gp-diff">
      {lines.map((l, i) => (
        <div key={i} className={`line ${l.kind}`}>
          <span className="ln">{i + 1}</span>
          <span className="sign">{l.kind === "add" ? "+" : "-"}</span>
          <span className="txt">{l.txt}</span>
        </div>
      ))}
    </div>
  );
}

export function GitPanel({ open, files, activeProjectId, log, syncing, onSync, onClose, onFocusFile }) {
  const [selectedPath, setSelectedPath] = useState(null);
  const [msg, setMsg] = useState("");
  const [showHistory, setShowHistory] = useState(true);

  useEffect(() => {
    // auto-select first dirty file or the active project
    if (!files.length) { setSelectedPath(null); return; }
    const ofActive = files.find(f => f.projectId === activeProjectId);
    setSelectedPath((ofActive || files[0]).path);
  }, [files.length, activeProjectId]);

  const selected = files.find(f => f.path === selectedPath);

  const defaultMsg = useMemo(() => {
    if (!files.length) return "";
    if (files.length === 1) return `Update ${files[0].projectName} secrets`;
    return `Update secrets (${files.length} files)`;
  }, [files]);

  if (!open) return <div className="git-panel closed"></div>;

  return (
    <div className="git-panel glass">
      <div className="gp-hd">
        <h3>Source Control</h3>
        <span className={`gp-status ${files.length ? "dirty" : "clean"}`}>
          <span className="dot"></span>
          {files.length ? `${files.length} changed` : "Clean"}
        </span>
        <button className="icon-btn" onClick={onClose} style={{ width: 26, height: 26 }} title="Close">
          <Icon name="x" size={13} />
        </button>
      </div>

      <div className="gp-body">
        {files.length > 0 && (
          <>
            <div className="gp-section-title">Changes ({files.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {files.map((f) => (
                <div
                  key={f.path}
                  className={`gp-file ${selectedPath === f.path ? "active" : ""}`}
                  onClick={() => { setSelectedPath(f.path); onFocusFile?.(f.projectId); }}
                >
                  <span className={`tag ${f.tag}`}>{f.tag}</span>
                  <span className="fname">{f.path}</span>
                  <span className="changes">
                    {f.adds > 0 && <span className="plus">+{f.adds}</span>}
                    {f.adds > 0 && f.dels > 0 && " "}
                    {f.dels > 0 && <span className="minus">−{f.dels}</span>}
                  </span>
                </div>
              ))}
            </div>

            {selected && (
              <>
                <div className="gp-section-title">
                  Diff · <span style={{ fontFamily: "var(--mono)", textTransform: "none", letterSpacing: 0 }}>{selected.path}</span>
                </div>
                <DiffView diff={selected.diff} />
              </>
            )}
          </>
        )}

        {files.length === 0 && (
          <div style={{ padding: "30px 12px", textAlign: "center", color: "var(--text-faint)" }}>
            <Icon name="check" size={22} style={{ opacity: .5, marginBottom: 8 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-dim)" }}>Working tree clean</div>
            <div style={{ fontSize: 11.5, marginTop: 4 }}>No changes to commit.</div>
          </div>
        )}

        <div className="gp-section-title" style={{ display: "flex", alignItems: "center" }}>
          <Icon name="history" size={11} style={{ marginRight: 6, opacity: .7 }} />
          Recent commits
          <button
            style={{ marginLeft: "auto", textTransform: "none", fontSize: 10.5, color: "var(--text-faint)" }}
            onClick={() => setShowHistory(v => !v)}
          >{showHistory ? "Hide" : "Show"}</button>
        </div>
        {showHistory && (
          <div className="gp-history">
            {log.slice(0, 6).map((c) => (
              <div className="gp-commit" key={c.hash}>
                <div className="dot"></div>
                <div>
                  <div className="msg">{c.msg}</div>
                  <div className="meta">{c.hash} · {c.author} · {c.date}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="gp-footer">
        <textarea
          className="gp-commit-msg"
          placeholder={defaultMsg || "Commit message…"}
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          disabled={!files.length}
        />
        <button
          className="btn primary"
          style={{ width: "100%", height: 36, justifyContent: "center" }}
          disabled={!files.length || syncing}
          onClick={() => onSync(msg.trim() || defaultMsg)}
        >
          <Icon name="sync" size={13} />
          {syncing ? "Syncing…" : "Sync to GitHub"}
        </button>
      </div>
    </div>
  );
}

