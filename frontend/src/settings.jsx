import { Icon } from './icons.jsx';

// Settings modal — in-app preferences. Shares state with the Tweaks panel.

import React, { useState, useEffect } from 'react';


const THEMES = [
  { id: "light",        label: "Light",        panel: "rgba(255,255,255,.7)",  bg: "linear-gradient(135deg,#ffd5e2,#e9deff)", accent: "#BF5AF2", text: "#1c1c1e" },
  { id: "dark",         label: "Dark",         panel: "rgba(40,30,55,.55)",     bg: "linear-gradient(135deg,#4a2486,#1e0c45)", accent: "#FF5E8A", text: "#ffffff" },
  { id: "vesper",       label: "Vesper",       panel: "rgba(20,20,20,.95)",     bg: "#0a0908",                                    accent: "#FFC799", text: "#ffffff" },
  { id: "vesper-light", label: "Vesper Light", panel: "rgba(255,253,248,.95)",  bg: "#f5f2eb",                                    accent: "#C56A2E", text: "#1a1815" }
];

const ACCENT_SWATCHES = [
  { id: "pink-purple", c1: "#FF5E8A", c2: "#BF5AF2" },
  { id: "blue",        c1: "#0A84FF", c2: "#5856D6" },
  { id: "orange",      c1: "#FF9F0A", c2: "#FF453A" },
  { id: "green",       c1: "#30D158", c2: "#0BBA8D" },
  { id: "purple",      c1: "#BF5AF2", c2: "#5E5CE6" }
];

const Row = ({ label, hint, children, stacked }) => (
  <div className={`set-row ${stacked ? "stacked" : ""}`}>
    <div className="set-row-label">
      <div className="l">{label}</div>
      {hint && <div className="h">{hint}</div>}
    </div>
    {children && <div>{children}</div>}
  </div>
);

const Seg = ({ value, options, onChange }) => (
  <div className="seg">
    {options.map(o => (
      <button key={o} className={value === o ? "on" : ""} onClick={() => onChange(o)}>{o}</button>
    ))}
  </div>
);

const Switch = ({ value, onChange }) => (
  <button className={`switch ${value ? "on" : ""}`} onClick={() => onChange(!value)} aria-pressed={value}></button>
);

export function Settings({ open, onClose, t, setTweak, push }) {
  // Local mirrors for text inputs (so typing doesn't lag)
  const [apiBase, setApiBase] = useState(t.apiBase || "");
  const [apiKey, setApiKey]   = useState(t.apiKey || "");

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isVesper = t.theme === "vesper" || t.theme === "vesper-light";

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-card glass strong" onClick={(e) => e.stopPropagation()}>
        <div className="settings-hd">
          <h2>Settings</h2>
          <button className="icon-btn" onClick={onClose} title="Close (esc)">
            <Icon name="x" size={13} />
          </button>
        </div>

        <div className="settings-body">

          {/* APPEARANCE */}
          <div className="set-section">
            <div className="set-section-title">Appearance</div>

            <Row label="Theme" hint="Vesper themes are flat and sober — minimal blur, hairline borders, warm accent." stacked>
              <div className="theme-grid">
                {THEMES.map(th => (
                  <button
                    key={th.id}
                    className={`theme-card ${t.theme === th.id ? "on" : ""}`}
                    onClick={() => setTweak("theme", th.id)}
                  >
                    <div className="theme-preview" style={{ background: th.bg, ["--tp-panel"]: th.panel, ["--tp-accent"]: th.accent, ["--tp-text"]: th.text }}>
                      <span className="acc"></span>
                      <span className="tx t1"></span>
                      <span className="tx t2"></span>
                      <span className="tx t3"></span>
                    </div>
                    <div className="theme-name">{th.label}</div>
                  </button>
                ))}
              </div>
            </Row>

            <div className={isVesper ? "set-disabled" : ""}>
              <Row label="Accent color" hint="Used for highlights, primary buttons, and the active sidebar item.">
                <div className="swatch-row">
                  {ACCENT_SWATCHES.map(s => (
                    <button
                      key={s.id}
                      className={`swatch ${t.accent === s.id ? "on" : ""}`}
                      style={{ background: `linear-gradient(135deg, ${s.c1}, ${s.c2})` }}
                      onClick={() => setTweak("accent", s.id)}
                      title={s.id}
                    ></button>
                  ))}
                </div>
              </Row>

              <Row label="Wallpaper" hint="Background behind the glass surfaces.">
                <Seg value={t.wallpaper} options={["tahoe", "aurora", "dusk", "mono"]}
                     onChange={(v) => setTweak("wallpaper", v)} />
              </Row>

              <Row label="Glass intensity" hint="Blur and saturation of translucent surfaces.">
                <input type="range" className="set-slider" min={0} max={100} step={10}
                       value={t.glassIntensity}
                       onChange={(e) => setTweak("glassIntensity", +e.target.value)} />
              </Row>
            </div>

            <Row label="Density" hint="Spacing of rows and controls.">
              <Seg value={t.density} options={["compact", "regular"]}
                   onChange={(v) => setTweak("density", v)} />
            </Row>

            <Row label="Layout">
              <Seg value={t.layout} options={["sidebar", "grid"]}
                   onChange={(v) => setTweak("layout", v)} />
            </Row>
          </div>

          {/* EDITOR */}
          <div className="set-section">
            <div className="set-section-title">Editor</div>

            <Row label="Default view" hint="Table is best for many keys, raw for diffing the file as-is.">
              <Seg value={t.editorStyle} options={["table", "cards", "raw"]}
                   onChange={(v) => setTweak("editorStyle", v)} />
            </Row>

            <Row label="Mask secrets by default" hint="Hide values behind dots until you click reveal. Recommended.">
              <Switch value={t.maskByDefault !== false}
                      onChange={(v) => setTweak("maskByDefault", v)} />
            </Row>

            <Row label="Auto-save delay" hint={`Debounce before re-encrypting with sops -e (${t.autoSaveMs || 600} ms).`}>
              <input type="range" className="set-slider" min={200} max={2000} step={100}
                     value={t.autoSaveMs || 600}
                     onChange={(e) => setTweak("autoSaveMs", +e.target.value)} />
            </Row>
          </div>

          {/* GITOPS */}
          <div className="set-section">
            <div className="set-section-title">GitOps</div>

            <Row label="Auto-sync after save" hint="Add · commit · push every time you stop typing. Off by default — explicit syncs are safer.">
              <Switch value={!!t.autoSync}
                      onChange={(v) => setTweak("autoSync", v)} />
            </Row>

            <Row label="Default commit prefix" hint="Prepended to every commit message generated automatically." stacked>
              <input
                className="set-input"
                style={{ width: "100%" }}
                value={t.commitPrefix || ""}
                onChange={(e) => setTweak("commitPrefix", e.target.value)}
                placeholder="chore(secrets):"
              />
            </Row>
          </div>

          {/* BACKEND */}
          <div className="set-section">
            <div className="set-section-title">Backend</div>

            <Row label="API base URL" hint="When set, Rage UI talks to your real backend instead of the in-browser mock." stacked>
              <input
                className="set-input"
                style={{ width: "100%" }}
                value={apiBase}
                placeholder="http://localhost:3000"
                onChange={(e) => setApiBase(e.target.value)}
                onBlur={() => setTweak("apiBase", apiBase)}
              />
            </Row>

            <Row label="API token" hint="Sent as X-API-Key. Stays in localStorage on this device only." stacked>
              <input
                className="set-input"
                type="password"
                style={{ width: "100%" }}
                value={apiKey}
                placeholder="TokenSuperSecurise!"
                onChange={(e) => setApiKey(e.target.value)}
                onBlur={() => setTweak("apiKey", apiKey)}
              />
            </Row>

            <Row label="Mock state" hint="Wipe local edits and restore the seeded projects.">
              <button className="btn small" onClick={() => {
                window.RageAPI.reset();
                push?.({ kind: "info", msg: "Mock state reset" });
                onClose();
              }}>
                <Icon name="revert" size={12} /> Reset
              </button>
            </Row>
          </div>

          {/* ABOUT */}
          <div className="set-section">
            <div className="set-section-title">About</div>
            <Row label="Rage UI" hint="Local-first wrapper for SOPS · age secrets, with seamless GitOps sync.">
              <span style={{ font: "12px var(--mono)", color: "var(--text-faint)" }}>v2.0</span>
            </Row>
          </div>

        </div>
      </div>
    </div>
  );
}

