import React from 'react';


export const Icon = ({ name, size = 16, className = "", style = {} }) => {
  const s = { width: size, height: size, ...style };
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "search":
      return <svg viewBox="0 0 24 24" style={s} className={className}><circle cx="11" cy="11" r="7" {...p}/><path d="m20 20-3.5-3.5" {...p}/></svg>;
    case "eye":
      return <svg viewBox="0 0 24 24" style={s} className={className}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" {...p}/><circle cx="12" cy="12" r="3" {...p}/></svg>;
    case "eye-off":
      return <svg viewBox="0 0 24 24" style={s} className={className}><path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.3 4.2M6.6 6.6A17.5 17.5 0 0 0 2 12s3.5 7 10 7c1.9 0 3.5-.4 4.9-1.1" {...p}/></svg>;
    case "copy":
      return <svg viewBox="0 0 24 24" style={s} className={className}><rect x="8" y="8" width="12" height="12" rx="2.4" {...p}/><path d="M16 8V5.6a1.6 1.6 0 0 0-1.6-1.6H5.6A1.6 1.6 0 0 0 4 5.6v8.8A1.6 1.6 0 0 0 5.6 16H8" {...p}/></svg>;
    case "trash":
      return <svg viewBox="0 0 24 24" style={s} className={className}><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m1 0v12a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2V7" {...p}/></svg>;
    case "plus":
      return <svg viewBox="0 0 24 24" style={s} className={className}><path d="M12 5v14M5 12h14" {...p}/></svg>;
    case "branch":
      return <svg viewBox="0 0 24 24" style={s} className={className}><circle cx="6" cy="5" r="2.2" {...p}/><circle cx="6" cy="19" r="2.2" {...p}/><circle cx="18" cy="9" r="2.2" {...p}/><path d="M6 7.2v9.6M8.2 9c6 0 7.8 1.5 7.8 6v-3.8" {...p}/></svg>;
    case "sync":
      return <svg viewBox="0 0 24 24" style={s} className={className}><path d="M3 12a9 9 0 0 1 15.5-6.3M21 12a9 9 0 0 1-15.5 6.3M16 4.7h4v4M8 19.3H4v-4" {...p}/></svg>;
    case "check":
      return <svg viewBox="0 0 24 24" style={s} className={className}><path d="m5 12 5 5L20 7" {...p}/></svg>;
    case "x":
      return <svg viewBox="0 0 24 24" style={s} className={className}><path d="M6 6l12 12M6 18 18 6" {...p}/></svg>;
    case "drag":
      return <svg viewBox="0 0 24 24" style={s} className={className}><circle cx="9" cy="6" r="1.2" fill="currentColor"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="9" cy="18" r="1.2" fill="currentColor"/><circle cx="15" cy="6" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="18" r="1.2" fill="currentColor"/></svg>;
    case "sun":
      return <svg viewBox="0 0 24 24" style={s} className={className}><circle cx="12" cy="12" r="4" {...p}/><path d="M12 2v2m0 16v2M4 12H2m20 0h-2m-2.8-7.2-1.4 1.4M6.2 17.8l-1.4 1.4m0-14.4 1.4 1.4M17.8 17.8l1.4 1.4" {...p}/></svg>;
    case "gear":
      return <svg viewBox="0 0 24 24" style={s} className={className}><path d="M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" {...p}/><path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V20a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h0a1.6 1.6 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v0a1.6 1.6 0 0 0 1.5 1H20a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" {...p}/></svg>;
    case "menu":
      return <svg viewBox="0 0 24 24" style={s} className={className}><path d="M4 7h16M4 12h16M4 17h16" {...p}/></svg>;
    case "vesper":
      return <svg viewBox="0 0 24 24" style={s} className={className}><circle cx="12" cy="12" r="8" {...p}/><path d="M12 4a8 8 0 0 0 0 16Z" fill="currentColor" stroke="currentColor"/></svg>;
    case "moon":
      return <svg viewBox="0 0 24 24" style={s} className={className}><path d="M21 12.8A9 9 0 0 1 11.2 3a7 7 0 1 0 9.8 9.8Z" {...p}/></svg>;
    case "tweaks":
      return <svg viewBox="0 0 24 24" style={s} className={className}><path d="M4 7h11M4 12h7M4 17h13" {...p}/><circle cx="18" cy="7" r="2" {...p}/><circle cx="14" cy="12" r="2" {...p}/><circle cx="20" cy="17" r="2" {...p}/></svg>;
    case "git":
      return <svg viewBox="0 0 24 24" style={s} className={className}><path d="M21 12a9 9 0 1 1-9-9" {...p}/><circle cx="12" cy="12" r="2.4" {...p}/><path d="m18 6 3 3" {...p}/></svg>;
    case "panel-right":
      return <svg viewBox="0 0 24 24" style={s} className={className}><rect x="3" y="4" width="18" height="16" rx="3" {...p}/><path d="M15 4v16M11 9h1M11 12h1M11 15h1" {...p}/></svg>;
    case "more":
      return <svg viewBox="0 0 24 24" style={s} className={className}><circle cx="6" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="18" cy="12" r="1.4" fill="currentColor"/></svg>;
    case "folder":
      return <svg viewBox="0 0 24 24" style={s} className={className}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" {...p}/></svg>;
    case "key":
      return <svg viewBox="0 0 24 24" style={s} className={className}><circle cx="8" cy="15" r="4" {...p}/><path d="m11 13 9-9m-3 3 2 2m-5 1 2 2" {...p}/></svg>;
    case "table":
      return <svg viewBox="0 0 24 24" style={s} className={className}><rect x="3" y="4" width="18" height="16" rx="2" {...p}/><path d="M3 10h18M3 16h18M9 4v16" {...p}/></svg>;
    case "card":
      return <svg viewBox="0 0 24 24" style={s} className={className}><rect x="4" y="4" width="7" height="7" rx="1.5" {...p}/><rect x="13" y="4" width="7" height="7" rx="1.5" {...p}/><rect x="4" y="13" width="7" height="7" rx="1.5" {...p}/><rect x="13" y="13" width="7" height="7" rx="1.5" {...p}/></svg>;
    case "code":
      return <svg viewBox="0 0 24 24" style={s} className={className}><path d="m9 8-5 4 5 4M15 8l5 4-5 4M13 5l-2 14" {...p}/></svg>;
    case "lock":
      return <svg viewBox="0 0 24 24" style={s} className={className}><rect x="4" y="11" width="16" height="10" rx="2" {...p}/><path d="M8 11V8a4 4 0 0 1 8 0v3" {...p}/></svg>;
    case "history":
      return <svg viewBox="0 0 24 24" style={s} className={className}><path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5" {...p}/><path d="M12 7v5l3 2" {...p}/></svg>;
    case "diff":
      return <svg viewBox="0 0 24 24" style={s} className={className}><path d="M9 4v12M3 10l6-6 6 6M15 20V8m-6 12 6-6 6 6" {...p}/></svg>;
    case "revert":
      return <svg viewBox="0 0 24 24" style={s} className={className}><path d="M3 7v6h6M3.5 13a9 9 0 1 0 2.4-7.4L3 9" {...p}/></svg>;
    default:
      return null;
  }
};

