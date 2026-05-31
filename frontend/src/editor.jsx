import { Icon } from './icons.jsx';

// Secret editor: header, view tabs (table / cards / raw), table rows with drag-to-reorder,
// reveal/copy/edit, raw YAML+JSON view.

import React, { useState, useEffect, useRef, useMemo } from 'react';

import { useToast } from './shell';

function ProjectHeader({ project, dirty, onRevert, onSync, hasChanges, onInject }) {
  return (
    <div className="proj-hd">
      <div className="icon" style={{ background: project.iconColor }}>{project.icon}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <h1>{project.name}</h1>
        <div className="path">
          <span>{project.path}/{project.file}</span>
          <span className="pill">
            <Icon name="branch" size={10} style={{ marginRight: 4, verticalAlign: -1 }} />
            {project.branch}
          </span>
          <span style={{ color: "var(--text-faint)" }}>· Last sync {project.lastSync}</span>
        </div>
      </div>
      <div className="proj-hd-actions">
        {onInject && project.id !== 'global' && (
          <button className="btn small" onClick={onInject} title="Generate .env from template">
            <Icon name="bolt" size={12} /> Inject .env
          </button>
        )}
        {hasChanges && (
          <button className="btn small" onClick={onRevert} title="Discard local changes">
            <Icon name="revert" size={12} /> Revert
          </button>
        )}
        <button
          className={`btn small ${hasChanges ? "primary" : ""}`}
          onClick={onSync}
          disabled={!hasChanges}
        >
          <Icon name="sync" size={12} />
          {hasChanges ? "Sync changes" : "All synced"}
        </button>
      </div>
    </div>
  );
}

/* ───────── Table view ───────── */
function SecretRow({ entry, onChange, onDelete, masked, onToggleMask, onCopy, status, dragHandlers }) {
  const valRef = useRef(null);
  return (
    <div
      className={`st-row ${status || ""} ${dragHandlers.dragging ? "dragging" : ""} ${dragHandlers.over ? "drag-over" : ""}`}
      draggable
      onDragStart={dragHandlers.onDragStart}
      onDragOver={dragHandlers.onDragOver}
      onDragLeave={dragHandlers.onDragLeave}
      onDrop={dragHandlers.onDrop}
      onDragEnd={dragHandlers.onDragEnd}
    >
      <div className="drag-handle" title="Drag to reorder"><Icon name="drag" size={12} /></div>
      <input
        className="st-key"
        value={entry.key}
        spellCheck="false"
        onChange={(e) => onChange({ ...entry, key: e.target.value })}
      />
      <div className={`st-val-wrap ${masked ? "masked" : ""}`}>
        <input
          ref={valRef}
          className="st-val"
          value={entry.value}
          spellCheck="false"
          onChange={(e) => onChange({ ...entry, value: e.target.value })}
        />
      </div>
      <div className="st-actions">
        <button className="st-action" onClick={onToggleMask} title={masked ? "Reveal" : "Hide"}>
          <Icon name={masked ? "eye" : "eye-off"} size={14} />
        </button>
        <button className="st-action" onClick={onCopy} title="Copy value">
          <Icon name="copy" size={14} />
        </button>
        <button className="st-action danger" onClick={onDelete} title="Remove">
          <Icon name="trash" size={14} />
        </button>
      </div>
    </div>
  );
}

function SecretsTable({ entries, setEntries, baseline, masked, setMasked, push }) {
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  const status = (e) => {
    if (!(e.key in baseline)) return "added";
    if (baseline[e.key] !== e.value) return "modified";
    return "";
  };

  const dragHandlers = (i) => ({
    dragging: dragIdx === i,
    over: overIdx === i && dragIdx !== i,
    onDragStart: (ev) => {
      setDragIdx(i);
      ev.dataTransfer.effectAllowed = "move";
      ev.dataTransfer.setData("text/plain", String(i));
    },
    onDragOver: (ev) => { ev.preventDefault(); setOverIdx(i); },
    onDragLeave: () => setOverIdx((v) => (v === i ? null : v)),
    onDrop: (ev) => {
      ev.preventDefault();
      if (dragIdx == null || dragIdx === i) return;
      const next = entries.slice();
      const [moved] = next.splice(dragIdx, 1);
      next.splice(i, 0, moved);
      setEntries(next);
      setDragIdx(null); setOverIdx(null);
    },
    onDragEnd: () => { setDragIdx(null); setOverIdx(null); },
  });

  const copy = async (val) => {
    try { await navigator.clipboard.writeText(val); push({ kind: "success", msg: "Copied to clipboard" }); }
    catch { push({ kind: "error", msg: "Copy failed" }); }
  };

  return (
    <div className="secrets-table glass thin">
      <div className="st-head">
        <span></span>
        <span>Key</span>
        <span>Value</span>
        <span style={{ textAlign: "right" }}>Actions</span>
      </div>
      {entries.map((e, i) => (
        <SecretRow
          key={e.id}
          entry={e}
          status={status(e)}
          masked={masked[e.id] !== false}
          dragHandlers={dragHandlers(i)}
          onChange={(next) => {
            const cp = entries.slice(); cp[i] = next; setEntries(cp);
          }}
          onDelete={() => setEntries(entries.filter((_, j) => j !== i))}
          onToggleMask={() => setMasked((m) => ({ ...m, [e.id]: !(m[e.id] !== false) }))}
          onCopy={() => copy(e.value)}
        />
      ))}
      <button
        className="add-row"
        onClick={() => setEntries([...entries, { id: Math.random().toString(36).slice(2), key: "NEW_KEY", value: "" }])}
      >
        <Icon name="plus" size={13} /> Add variable
      </button>
    </div>
  );
}

/* ───────── Card view ───────── */
function SecretsCards({ entries, setEntries, baseline, masked, setMasked, push }) {
  const status = (e) => {
    if (!(e.key in baseline)) return "added";
    if (baseline[e.key] !== e.value) return "modified";
    return "";
  };
  return (
    <div className="cards-grid">
      {entries.map((e, i) => {
        const st = status(e);
        const m = masked[e.id] !== false;
        return (
          <div key={e.id} className="secret-card glass thin" style={st === "added" ? { borderColor: "color-mix(in srgb, var(--green) 40%, var(--glass-border))" } : st === "modified" ? { borderColor: "color-mix(in srgb, var(--orange) 50%, var(--glass-border))" } : {}}>
            <input
              className="st-key"
              style={{ padding: 0, fontSize: 12 }}
              value={e.key}
              onChange={(ev) => { const cp = entries.slice(); cp[i] = { ...e, key: ev.target.value }; setEntries(cp); }}
            />
            <input
              className={`st-val ${m ? "" : ""}`}
              style={{ padding: 0, fontSize: 13, color: "var(--text-dim)", letterSpacing: m ? 2 : 0, WebkitTextSecurity: m ? "disc" : "none" }}
              value={e.value}
              onChange={(ev) => { const cp = entries.slice(); cp[i] = { ...e, value: ev.target.value }; setEntries(cp); }}
            />
            <div className="row" style={{ marginTop: "auto", justifyContent: "flex-end" }}>
              <button className="st-action" style={{ opacity: 1 }} onClick={() => setMasked((mm) => ({ ...mm, [e.id]: !(mm[e.id] !== false) }))}>
                <Icon name={m ? "eye" : "eye-off"} size={13} />
              </button>
              <button className="st-action" style={{ opacity: 1 }} onClick={async () => {
                try { await navigator.clipboard.writeText(e.value); push({ kind: "success", msg: "Copied" }); } catch {}
              }}>
                <Icon name="copy" size={13} />
              </button>
              <button className="st-action danger" style={{ opacity: 1 }} onClick={() => setEntries(entries.filter((_, j) => j !== i))}>
                <Icon name="trash" size={13} />
              </button>
            </div>
          </div>
        );
      })}
      <button
        className="secret-card glass thin"
        style={{ alignItems: "center", justifyContent: "center", color: "var(--text-faint)", border: ".5px dashed var(--hairline-strong)", minHeight: 96 }}
        onClick={() => setEntries([...entries, { id: Math.random().toString(36).slice(2), key: "NEW_KEY", value: "" }])}
      >
        <Icon name="plus" size={18} />
        <span style={{ fontSize: 12, fontWeight: 600, marginLeft: 6 }}>Add variable</span>
      </button>
    </div>
  );
}

/* ───────── Raw view (YAML / JSON) ───────── */
function highlightYaml(obj) {
  return Object.entries(obj).map(([k, v]) => (
    <div key={k}>
      <span className="k">{k}</span>
      <span className="p">: </span>
      <span className="v">{JSON.stringify(v)}</span>
    </div>
  ));
}
function highlightJson(obj) {
  const lines = JSON.stringify(obj, null, 2).split("\n");
  return lines.map((line, i) => {
    const m = line.match(/^(\s*)"([^"]+)":\s*(.+?)(,?)$/);
    if (m) {
      return <div key={i}>{m[1]}<span className="p">"</span><span className="k">{m[2]}</span><span className="p">": </span><span className="v">{m[3]}</span><span className="p">{m[4]}</span></div>;
    }
    return <div key={i} className="p">{line}</div>;
  });
}
function RawView({ entries, format, setFormat }) {
  const obj = useMemo(() => Object.fromEntries(entries.map(e => [e.key, e.value])), [entries]);
  return (
    <div className="raw-wrap">
      <div className="raw-hd">
        <Icon name="lock" size={12} style={{ opacity: .6 }} />
        <span>Decrypted via sops -d</span>
        <div className="fmt-tabs">
          <button className={format === "yaml" ? "active" : ""} onClick={() => setFormat("yaml")}>YAML</button>
          <button className={format === "json" ? "active" : ""} onClick={() => setFormat("json")}>JSON</button>
        </div>
      </div>
      <div className="raw-body">
        {format === "yaml" ? (
          <>
            <div className="c"># {entries.length} encrypted secrets · sops · age</div>
            {highlightYaml(obj)}
          </>
        ) : highlightJson(obj)}
      </div>
    </div>
  );
}

/* ───────── Editor root ───────── */
export function Editor({ project, secrets, baseline, view, setView, editorStyle, onSave, onRevert, onInject, onRequestSync, query, autoSaveMs = 600, maskByDefault = true }) {
  const initialEntries = useMemo(
    () => Object.entries(secrets).map(([k, v]) => ({ id: k + "::" + Math.random().toString(36).slice(2, 6), key: k, value: String(v) })),
    [secrets, project.id]
  );
  const [entries, setEntries] = useState(initialEntries);
  const [masked, setMasked] = useState(() => {
    const init = {};
    initialEntries.forEach(e => { init[e.id] = maskByDefault; });
    return init;
  });
  const [format, setFormat] = useState("yaml");

  // reset when project changes
  useEffect(() => {
    setEntries(initialEntries);
    const init = {};
    initialEntries.forEach(e => { init[e.id] = maskByDefault; });
    setMasked(init);
  }, [project.id]);

  const push = useToast();

  // Compute "dirty vs disk"
  const isDirtyVsDisk = useMemo(() => {
    const cur = Object.fromEntries(entries.map(e => [e.key, e.value]));
    if (Object.keys(cur).length !== Object.keys(secrets).length) return true;
    for (const k of Object.keys(cur)) if (cur[k] !== secrets[k]) return true;
    return false;
  }, [entries, secrets]);

  // Compute "dirty vs git baseline"
  const isDirtyVsBaseline = useMemo(() => {
    const cur = Object.fromEntries(entries.map(e => [e.key, e.value]));
    if (Object.keys(cur).length !== Object.keys(baseline).length) return true;
    for (const k of Object.keys(cur)) if (cur[k] !== baseline[k]) return true;
    return false;
  }, [entries, baseline]);

  const filteredEntries = useMemo(() => {
    if (!query) return entries;
    const q = query.toLowerCase();
    return entries.filter(e => e.key.toLowerCase().includes(q) || e.value.toLowerCase().includes(q));
  }, [entries, query]);

  // Auto-save to disk (debounced)
  useEffect(() => {
    if (!isDirtyVsDisk) return;
    const t = setTimeout(() => {
      const obj = Object.fromEntries(entries.map(e => [e.key, e.value]));
      onSave(obj);
    }, autoSaveMs);
    return () => clearTimeout(t);
  }, [entries, isDirtyVsDisk, autoSaveMs]);

  // Keyboard reveal-all toggle (⌥ + R)
  useEffect(() => {
    const onKey = (ev) => {
      if (ev.altKey && ev.key === "r") {
        const allMasked = entries.every(e => masked[e.id] !== false);
        const next = {};
        entries.forEach(e => { next[e.id] = !allMasked; });
        setMasked(next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [entries, masked]);

  const allRevealed = entries.every(e => masked[e.id] === false);

  return (
    <div className="content glass">
      <ProjectHeader
        project={project}
        dirty={isDirtyVsBaseline}
        hasChanges={isDirtyVsBaseline}
        onSync={onRequestSync}
        onRevert={() => { onRevert(); }}
        onInject={onInject}
      />
      <div className="editor-body">
        <div className="toolbar">
          <span className="count"><b>{filteredEntries.length}</b> / {entries.length} secrets {isDirtyVsDisk && <span style={{ color: "var(--orange)", marginLeft: 8 }}>● saving…</span>}{!isDirtyVsDisk && isDirtyVsBaseline && <span style={{ color: "var(--orange)", marginLeft: 8 }}>● uncommitted</span>}</span>

          <div className="view-tabs">
            <button className={`view-tab ${view === "table" ? "active" : ""}`} onClick={() => setView("table")}>
              <Icon name="table" size={11} style={{ verticalAlign: -1, marginRight: 4 }} />Table
            </button>
            <button className={`view-tab ${view === "cards" ? "active" : ""}`} onClick={() => setView("cards")}>
              <Icon name="card" size={11} style={{ verticalAlign: -1, marginRight: 4 }} />Cards
            </button>
            <button className={`view-tab ${view === "raw" ? "active" : ""}`} onClick={() => setView("raw")}>
              <Icon name="code" size={11} style={{ verticalAlign: -1, marginRight: 4 }} />Raw
            </button>
          </div>

          <button
            className="btn small ghost"
            onClick={() => {
              const next = {};
              entries.forEach(e => { next[e.id] = allRevealed; }); // toggle to opposite
              setMasked(next);
            }}
            title="Reveal/hide all (⌥R)"
          >
            <Icon name={allRevealed ? "eye-off" : "eye"} size={12} />
            {allRevealed ? "Hide all" : "Reveal all"}
          </button>
        </div>

        {view === "table" && (
          <SecretsTable
            entries={filteredEntries.length === entries.length ? entries : filteredEntries}
            setEntries={(next) => {
              // if filtered, merge back
              if (filteredEntries.length === entries.length) setEntries(next);
              else {
                const map = new Map(next.map(e => [e.id, e]));
                setEntries(entries.map(e => map.get(e.id) || e).filter(e => map.has(e.id) || !filteredEntries.find(f => f.id === e.id)));
              }
            }}
            baseline={baseline}
            masked={masked}
            setMasked={setMasked}
            push={push}
          />
        )}
        {view === "cards" && (
          <SecretsCards
            entries={filteredEntries.length === entries.length ? entries : filteredEntries}
            setEntries={(next) => {
              if (filteredEntries.length === entries.length) setEntries(next);
            }}
            baseline={baseline}
            masked={masked}
            setMasked={setMasked}
            push={push}
          />
        )}
        {view === "raw" && (
          <RawView entries={entries} format={format} setFormat={setFormat} />
        )}
      </div>
    </div>
  );
}

