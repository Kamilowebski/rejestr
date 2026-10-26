"use strict";

/* =========================================================
   Rejestr maszyn — logika aplikacji
   ========================================================= */
const KEY = "machines_v1";
const CFG_KEY = "machines_settings";
const UI_KEY = "machines_ui";
const SAFE = /^[\w.:\-]+$/;
const DEFAULT_CFG = {
  sshUser: "su-t", vncPort: 5900, pingArgs: "-a -t",
  cmds: [], cats: [], theme: "light",
  show: { ping: true, vnc: true, web: true, scan: true }
};

const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

const load = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch (e) { return def; } };

const ICONS = {
  plus:  '<path d="M12 5v14M5 12h14"/>',
  edit:  '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  down:  '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',
  up:    '<path d="M12 20V8M7 13l5-5 5 5M5 4h14"/>',
  pin:   '<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  term:  '<path d="M5 8l4 4-4 4M12 17h7"/>',
  gear:  '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  star:  '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  tag:   '<path d="M20 13l-7 7-9-9V4h7z"/><circle cx="8" cy="8" r="1.2"/>',
  pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.7l7.6-3.4M8.2 13.3l7.6 3.4"/>',
  sun:   '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon:  '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  copy:  '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  tree:  '<path d="M12 3v4m0 0l-4 4m4-4l4 4M5 13v7h14v-7M5 13h14"/>'
};

const svg = (d, cls = "icon") =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

/* Typy maszyn */
const TYPES = {
  pc:      ["Komputer",        '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'],
  printer: ["Drukarka",        '<path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="7"/>'],
  scanner: ["Skaner",          '<path d="M3 12h18M5 7V5h2M17 5h2v2M5 17v2h2M17 19h2v-2"/>'],
  camera:  ["Kamera",          '<path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="12.5" r="3.5"/>'],
  rpi:     ["Raspberry Pi",    '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 10h2v2H8zM14 14h2M8 3v3M12 3v3M16 3v3"/>'],
  bizerba: ["Bizerba",         '<path d="M5 20h14M12 20V8M6 8h12M6 8l-3 6a3 3 0 0 0 6 0zM18 8l-3 6a3 3 0 0 0 6 0z"/>'],
  metal:   ["Detektor metalu", '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>'],
  other:   ["Inne",            '<path d="M21 8l-9-5-9 5 9 5zM3 8v8l9 5 9-5V8M12 13v8"/>']
};
const T = (m) => TYPES[m.type] || TYPES.other;

/* ===== Stan ===== */
let db = load(KEY, []);
if (!Array.isArray(db)) db = [];
let cfg = { ...DEFAULT_CFG, ...load(CFG_KEY, {}) };
if (!Array.isArray(cfg.cmds)) cfg.cmds = [];
if (!Array.isArray(cfg.cats)) cfg.cats = [];
if (!["light", "dark", "auto"].includes(cfg.theme)) cfg.theme = "light";
cfg.show = { ...DEFAULT_CFG.show, ...(cfg.show || {}) };
cfg.cats = cfg.cats.filter((c) => c && /^c_\w+$/.test(c.id) && c.name).map((c) => ({ id: c.id, name: String(c.name) }));

let ui = load(UI_KEY, {});
let sort = ui.sort && { k: ui.sort.k || "", d: ui.sort.d === -1 ? -1 : 1 } || { k: "", d: 1 };

const open = new Set();
const openNotes = new Set();
let dups = new Map();
let dupOnly = false;
let curDeps = [];
let editId = "";
let draftCmds = [];
let draftCats = [];
let REV = {};

const uid = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { toast("Brak miejsca w pamięci!", 4000); } };
const saveCfg = () => { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) {} };
const saveUi = () => { try { localStorage.setItem(UI_KEY, JSON.stringify({ q: $("q").value, sort })); } catch (e) {} };

function syncTypes() {
  const other = TYPES.other;
  Object.keys(TYPES).filter((k) => k.startsWith("c_") || k === "other").forEach((k) => delete TYPES[k]);
  cfg.cats.forEach((c) => (TYPES[c.id] = [c.name, ICONS.tag]));
  TYPES.other = other;
}
syncTypes();

/* ===== Toast ===== */
let toastT;
function toast(msg, ms = 1800) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove("show"), ms);
}

/* ===== Kopiowanie ===== */
function copy(text, label) {
  const ok = () => toast("Skopiowano: " + (label || text));
  const fb = () => {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); ok(); } catch (e) { toast("Nie udało się skopiować"); }
    ta.remove();
  };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, fb);
  else fb();
}

/* ===== Motyw ===== */
function applyTheme(t = cfg.theme) {
  const dark = t === "dark" || (t === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  document.querySelector('meta[name="theme-color"]').setAttribute("content", dark ? "#0f172a" : "#f8fafc");
  $("icoTheme").innerHTML = svg(dark ? ICONS.sun : ICONS.moon);
}
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (cfg.theme === "auto") applyTheme(); });

/* ===== Helpers komend ===== */
const sshCmd = (h) => `ssh -L ${cfg.vncPort}:localhost:${cfg.vncPort} ${cfg.sshUser ? cfg.sshUser + "@" : ""}${h}`;
const pingCmd = (h) => `ping ${cfg.pingArgs ? cfg.pingArgs + " " : ""}${h}`;

function fillCmd(tpl, host, m, kind) {
  const ip = kind === "ip" ? host : ((m.ips || []).find((x) => x.ip)?.ip || "");
  const vars = { host, name: m.name, ip, user: cfg.sshUser, port: String(cfg.vncPort) };
  let bad = false;
  const out = tpl.replace(/\{(\w+)\}/g, (all, k) => {
    if (!(k in vars)) return all;
    if (["host", "name", "ip"].includes(k) && vars[k] && !SAFE.test(vars[k])) bad = true;
    return vars[k];
  });
  return bad ? null : out;
}

function tools(host, web, m, kind) {
  const custom = cfg.cmds
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c.target === kind || c.target === "both")
    .map(({ c, i }) => {
      const t = fillCmd(c.tpl, host, m, kind);
      return `<button data-act="cmd" data-i="${i}" data-id="${m.id}" data-ip="${esc(host)}" data-kind="${kind}" title="Kopiuj: ${esc(t ?? "niedozwolone znaki")}" class="mini">${esc(c.label)}</button>`;
    }).join("");
  const sh = cfg.show;
  const parts = [
    sh.ping ? `<button data-act="ping" data-ip="${esc(host)}" title="Kopiuj: ${esc(pingCmd(host))}" class="mini">${svg(ICONS.term, "icon")}</button>` : "",
    sh.vnc ? `<button data-act="vnc" data-ip="${esc(host)}" title="Kopiuj: ${esc(sshCmd(host))}" class="mini">VNC</button>` : "",
    sh.web && web && SAFE.test(host) ? `<a href="http://${esc(host)}" target="_blank" rel="noopener" title="Otwórz http://${esc(host)}" class="mini">${svg(ICONS.globe, "icon")}</a>` : "",
    custom
  ].join("");
  return parts.trim() ? `<span class="flex flex-wrap items-center gap-1" style="flex-shrink:0">${parts}</span>` : "";
}

function ipChips(m) {
  const all = (m.ips || []).filter((x) => x.ip);
  const hasDeps = (m.deps || []).length > 0;
  const hasRev = (REV[m.id] || []).length > 0;
  const qualifies = all.length > 1 || hasDeps || hasRev;
  const scanBtn = qualifies && cfg.show.scan
    ? `<button data-act="scan" data-id="${m.id}" title="Ping grupy" class="mini">${svg(ICONS.share, "icon")}</button>`
    : "";
  if (!all.length) return scanBtn ? `<div class="flex flex-wrap items-center gap-1">${scanBtn}</div>` : "";
  const isOpen = open.has(m.id);
  const chips = (isOpen ? all : all.slice(0, 1)).map((i) => {
    const others = dups.has(i.ip)
      ? [...dups.get(i.ip)].filter((id) => id !== m.id).map((id) => db.find((x) => x.id === id)?.name).filter(Boolean).join(", ")
      : "";
    const cls = others ? "badge badge-warn" : "badge";
    return `<span class="flex flex-wrap items-center gap-1">
      <button data-act="copyip" data-ip="${esc(i.ip)}" title="${others ? "Duplikat IP: " + esc(others) : "Kopiuj IP"}" class="${cls} badge-mono">
        ${esc(i.ip)}${i.label ? `<span class="text-xs text-muted" style="font-family:inherit">· ${esc(i.label)}</span>` : ""}
      </button>${tools(i.ip, true, m, "ip")}
    </span>`;
  }).join("");
  const hiddenDup = !isOpen && all.slice(1).some((i) => dups.has(i.ip));
  const more = all.length > 1
    ? `<button data-act="more" data-id="${m.id}" class="badge ${hiddenDup ? "badge-warn" : "badge-primary"}">${isOpen ? "zwiń" : "+" + (all.length - 1)}</button>`
    : "";
  return `<div class="flex ${isOpen ? "flex-col items-start" : "flex-wrap items-center"} gap-1">${chips}${more}${scanBtn}</div>`;
}

const depBtn = (d, arrow, cls) =>
  `<button data-act="jump" data-id="${d.id}" class="badge ${cls}">${arrow} ${esc(d.name)}</button>`;

function depChips(m, M, rev) {
  const deps = (m.deps || []).map((id) => M.get(id)).filter(Boolean).map((d) => depBtn(d, "←", "")).join("");
  const users = (rev[m.id] || []).map((d) => depBtn(d, "→", "")).join("");
  return deps + users;
}

const nameBlock = (m) => `<div class="flex items-center gap-1">
  <button data-act="copy" data-id="${m.id}" title="Kopiuj nazwę" class="font-semibold" style="background:none;border:none;padding:0;cursor:pointer;color:var(--text);text-align:left;min-width:0">${esc(m.name)}</button>
  ${m.key ? `<span title="Kluczowy" style="color:var(--warning);flex-shrink:0">${svg(ICONS.star, "icon")}</span>` : ""}
  ${tools(m.name, false, m, "name")}
</div>`;

const tagChipsHtml = (m) => (m.tags || []).length
  ? `<div class="flex flex-wrap gap-1 mt-1">${(m.tags || []).map(t => `<span class="badge badge-tag">#${esc(t)}</span>`).join("")}</div>`
  : "";

const noteHtml = (m, extra = "") => {
  if (!m.note) return "";
  const o = openNotes.has(m.id);
  return `<button data-act="note" data-id="${m.id}" class="text-xs text-muted ${extra}" style="display:flex;width:100%;align-items:flex-start;gap:.25rem;text-align:left;background:none;border:none;padding:0;cursor:pointer">
    <span style="flex:1;min-width:0;${o ? "white-space:pre-wrap;word-break:break-all" : "overflow:hidden;text-overflow:ellipsis;white-space:nowrap"}">${esc(m.note)}</span>
    <span style="flex-shrink:0;opacity:.6">${o ? "▲" : "▼"}</span>
  </button>`;
};

const actions = (m) => `<button data-act="tree" data-id="${m.id}" title="Drzewo zależności" class="ibtn">${svg(ICONS.tree)}</button>
  <button data-act="edit" data-id="${m.id}" title="Edytuj" class="ibtn">${svg(ICONS.edit)}</button>
  <button data-act="del" data-id="${m.id}" title="Usuń" class="ibtn danger">${svg(ICONS.trash)}</button>`;

const locBadge = (m) => m.location
  ? `<span class="badge badge-info">${svg(ICONS.pin, "icon")} ${esc(m.location)}</span>`
  : "";

function row(m, M, rev) {
  const deps = depChips(m, M, rev);
  const ips = ipChips(m);
  return `<tr>
    <td><div class="flex items-start gap-2">
      <span class="text-faint" style="margin-top:.125rem">${svg(T(m)[1], "icon")}</span>
      <div class="min-w-0 flex-1">${nameBlock(m)}${tagChipsHtml(m)}${noteHtml(m, "mt-1")}</div>
    </div></td>
    <td class="text-muted">${esc(T(m)[0])}</td>
    <td>${locBadge(m) || '<span class="text-faint">—</span>'}</td>
    <td>${ips || '<span class="text-faint">—</span>'}</td>
    <td><div class="flex flex-wrap gap-1">${deps || '<span class="text-faint">—</span>'}</div></td>
    <td class="text-end" style="white-space:nowrap">${actions(m)}</td>
  </tr>`;
}

/* ===== Render ===== */
function render() {
  const M = new Map(db.map((m) => [m.id, m]));
  const rev = {};
  db.forEach((m) => (m.deps || []).forEach((id) => (rev[id] ||= []).push(m)));
  REV = rev;

  const owners = {};
  db.forEach((m) => [...new Set((m.ips || []).map((i) => i.ip).filter(Boolean))].forEach((ip) => (owners[ip] ||= new Set()).add(m.id)));
  dups = new Map(Object.entries(owners).filter(([, s]) => s.size > 1));

  const locs = [...new Set(db.map((m) => m.location).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pl"));
  const lv = $("loc").value, tv = $("typ").value;
  $("loc").innerHTML = '<option value="">Wszystkie lokalizacje</option>' + locs.map((l) => `<option>${esc(l)}</option>`).join("");
  $("loc").value = locs.includes(lv) ? lv : "";
  $("typ").innerHTML = '<option value="">Wszystkie typy</option>' +
    Object.entries(TYPES).map(([k, v]) => `<option value="${k}">${esc(v[0])}</option>`).join("");
  $("typ").value = TYPES[tv] ? tv : "";
  $("locList").innerHTML = locs.map((l) => `<option value="${esc(l)}">`).join("");

  const qs = $("q").value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const lf = $("loc").value, tf = $("typ").value;

  const cnt = {};
  db.forEach((m) => (cnt[m.type] = (cnt[m.type] || 0) + 1));
  if (!dups.size) dupOnly = false;
  const dupChip = dups.size
    ? `<button data-dup="1" class="chip ${dupOnly ? "chip-warn active" : "chip-warn"}">Duplikaty IP ${dups.size}</button>`
    : "";
  $("stats").innerHTML =
    `<button data-type="" class="chip ${!tf ? "active" : ""}">Wszystkie ${db.length}</button>` +
    Object.entries(TYPES).filter(([k]) => cnt[k]).map(([k, v]) =>
      `<button data-type="${k}" class="chip ${tf === k ? "active" : ""}">${esc(v[0])} ${cnt[k]}</button>`).join("") +
    dupChip;

  document.querySelectorAll("thead th[data-sort]").forEach((th) => {
    const k = th.dataset.sort;
    const label = { name: "Nazwa", type: "Typ", location: "Lokalizacja", ip: "Adresy IP" }[k];
    th.textContent = label + (sort.k === k ? (sort.d > 0 ? " ▲" : " ▼") : "");
    th.setAttribute("aria-sort", sort.k === k ? (sort.d > 0 ? "ascending" : "descending") : "none");
  });

  const H = new Map(db.map((m) => [m.id, [
    m.name, m.location, m.note, T(m)[0], m.type,
    ...(m.tags || []),
    ...(m.ips || []).flatMap((i) => [i.ip, i.label]),
    ...(m.deps || []).map((id) => M.get(id)?.name),
    ...(rev[m.id] || []).map((x) => x.name)
  ].filter(Boolean).join(" ").toLowerCase()]));

  const SORT_FN = {
    name: (m) => m.name || "",
    type: (m) => T(m)[0],
    location: (m) => m.location || "",
    ip: (m) => {
      const ip = (m.ips || []).find((x) => x.ip)?.ip || "";
      return ip.split(".").map((n) => (/^\d+$/.test(n) ? n.padStart(3, "0") : n)).join(".");
    }
  };

  const list = db
    .filter((m) => (!lf || m.location === lf) && (!tf || m.type === tf) && (!dupOnly || hasDup(m)) && qs.every((t) => H.get(m.id).includes(t)))
    .sort((a, b) => {
      if (sort.k && SORT_FN[sort.k]) {
        const x = SORT_FN[sort.k](a), y = SORT_FN[sort.k](b);
        if (x !== y) {
          if (!x) return 1;
          if (!y) return -1;
          const c = x.localeCompare(y, "pl", { numeric: true });
          if (c) return c * sort.d;
        }
      }
      return (a.location || "").localeCompare(b.location || "", "pl") ||
        a.name.localeCompare(b.name, "pl", { numeric: true });
    });

  if (!list.length) {
    $("rows").innerHTML = "";
    $("empty").classList.remove("d-none");
    $("empty").textContent = db.length ? "Brak wyników dla wybranych filtrów." : "Brak maszyn. Kliknij „Dodaj”, aby dodać pierwszą.";
  } else {
    $("empty").classList.add("d-none");
    $("rows").innerHTML = list.map((m) => row(m, M, rev)).join("");
  }
  $("count").textContent = `${list.length} z ${db.length} maszyn` + (lf ? ` • lokalizacja: ${lf}` : "");
}

const hasDup = (m) => (m.ips || []).some((i) => dups.has(i.ip));

/* ===== Modal maszyny ===== */
function ipRow(ip = "", label = "") {
  const d = document.createElement("div");
  d.className = "ip-row";
  d.innerHTML = `<input class="input ipv text-mono" placeholder="10.0.0.1" value="${esc(ip)}">
    <input class="input ipl" placeholder="opis" value="${esc(label)}">
    <button type="button" class="ibtn danger" title="Usuń">${svg(ICONS.trash)}</button>`;
  d.querySelector("button").onclick = () => d.remove();
  return d;
}

function renderDeps() {
  $("depChips").innerHTML = curDeps.map((id) => {
    const d = db.find((x) => x.id === id);
    return d ? `<span class="badge">${esc(d.name)} <button type="button" data-rmdep="${id}" style="background:none;border:none;padding:0;cursor:pointer;color:var(--text-2);margin-left:.25rem">✕</button></span>` : "";
  }).join("");
  const toks = $("depQ").value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const list = $("depList");
  if (!toks.length) { list.classList.add("d-none"); list.innerHTML = ""; return; }
  const found = db.filter((x) => x.id !== editId && !curDeps.includes(x.id))
    .filter((x) => {
      const h = [x.name, x.location, ...(x.ips || []).map((i) => i.ip)].filter(Boolean).join(" ").toLowerCase();
      return toks.every((t) => h.includes(t));
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pl", { numeric: true })).slice(0, 8);
  list.classList.remove("d-none");
  list.innerHTML = found.length
    ? found.map((x) => `<button type="button" data-adddep="${x.id}" class="dep-item"><span class="name">${esc(x.name)}</span><span class="sub">${esc(x.location || "")}</span></button>`).join("")
    : '<div style="padding:.5rem .75rem;font-size:.75rem;color:var(--text-2)">Brak pasujących maszyn.</div>';
}

function openModal(m) {
  $("mtitle").textContent = m ? "Edytuj maszynę" : "Nowa maszyna";
  $("fId").value = m?.id || "";
  $("fName").value = m?.name || "";
  $("fType").innerHTML = Object.entries(TYPES).map(([k, v]) => `<option value="${k}">${esc(v[0])}</option>`).join("");
  $("fType").value = m?.type || "pc";
  $("fLoc").value = m?.location || "";
  $("fNote").value = m?.note || "";
  $("fTags").value = (m?.tags || []).join(", ");
  $("fKey").checked = !!m?.key;
  $("ips").innerHTML = "";
  ((m?.ips?.length) ? m.ips : [{ ip: "", label: "" }]).forEach((x) => $("ips").appendChild(ipRow(x.ip, x.label)));
 
  if (m && m.createdAt) {
    const created = new Date(m.createdAt).toLocaleString("pl-PL");
    const updated = m.updatedAt ? new Date(m.updatedAt).toLocaleString("pl-PL") : created;
    $("auditInfo").textContent = `Utworzono: ${created} | Ostatnia zmiana: ${updated}`;
  } else {
    $("auditInfo").textContent = "";
  }

  editId = m?.id || "";
  curDeps = [...(m?.deps || [])].filter((id) => db.some((x) => x.id === id));
  $("depQ").value = ""; renderDeps();
  $("modal").showModal();
  setTimeout(() => $("fName").focus(), 50);
}

/* ===== Drzewo zależności (Visual Tree) ===== */
function openTreeModal(id) {
  const m = db.find(x => x.id === id);
  if (!m) return;
  const M = new Map(db.map(x => [x.id, x]));
  const rev = {};
  db.forEach(x => (x.deps || []).forEach(d => (rev[d] ||= []).push(x)));

  $("treeTitle").textContent = "Drzewo zależności: " + m.name;

  const renderNodeItem = (item, isCurrent = false) => {
    if (!item) return "";
    const typeName = TYPES[item.type]?.[0] || "Inne";
    const loc = item.location ? ` (${item.location})` : "";
    return `<div class="tree-node ${isCurrent ? "current" : ""}">
      <span class="badge badge-primary">${esc(typeName)}</span>
      <span class="name font-medium">${esc(item.name)}${esc(loc)}</span>
    </div>`;
  };

  const deps = (m.deps || []).map(dId => M.get(dId)).filter(Boolean);
  const dependents = (rev[m.id] || []).filter(Boolean);

  let html = `<div class="tree-section">
    <div class="tree-section-title">Urządzenia, od których zależy ta maszyna (W górę)</div>`;
  if (deps.length) {
    html += `<div class="tree-list">` + deps.map(d => renderNodeItem(d)).join("") + `</div>`;
  } else {
    html += `<div class="text-xs text-faint">Brak zależności nadrzędnych.</div>`;
  }
  html += `</div>`;

  html += `<div class="tree-section mt-3">
    <div class="tree-section-title">Bieżąca maszyna</div>
    <div class="tree-list">` + renderNodeItem(m, true) + `</div>
  </div>`;

  html += `<div class="tree-section mt-3">
    <div class="tree-section-title">Urządzenia zależące od tej maszyny (W dół)</div>`;
  if (dependents.length) {
    html += `<div class="tree-list">` + dependents.map(d => renderNodeItem(d)).join("") + `</div>`;
  } else {
    html += `<div class="text-xs text-faint">Brak maszyn zależnych.</div>`;
  }
  html += `</div>`;

  $("treeContent").innerHTML = html;
  $("treeModal").showModal();
}

$("treeClose").onclick = () => $("treeModal").close();

/* ===== Bind events ===== */
$("icoAdd").innerHTML = svg(ICONS.plus);
$("icoExp").innerHTML = svg(ICONS.down);
$("icoImp").innerHTML = svg(ICONS.up);
$("icoCfg").innerHTML = svg(ICONS.gear);
$("icoPg").innerHTML = svg(ICONS.pulse);

let raf;
const scheduleRender = () => { saveUi(); cancelAnimationFrame(raf); raf = requestAnimationFrame(render); };
$("q").oninput = scheduleRender;
$("loc").onchange = scheduleRender;
$("typ").onchange = scheduleRender;
$("clearFilters").onclick = () => {
  $("q").value = "";
  $("loc").value = "";
  $("typ").value = "";
  dupOnly = false;
  saveUi();
  render();
  $("q").focus();
};
$("q").addEventListener("keydown", (e) => {
  if (e.key === "Escape" && $("q").value) {
    $("q").value = "";
    scheduleRender();
  }
});
$("add").onclick = () => openModal(null);
$("cancel").onclick = () => $("modal").close();
$("addIp").onclick = () => $("ips").appendChild(ipRow());
$("depQ").oninput = renderDeps;
$("depQ").onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); $("depList").querySelector("[data-adddep]")?.click(); } };
$("depList").onclick = (e) => {
  const b = e.target.closest("[data-adddep]");
  if (!b) return;
  curDeps.push(b.dataset.adddep);
  $("depQ").value = "";
  renderDeps();
  $("depQ").focus();
};
$("depChips").onclick = (e) => {
  const b = e.target.closest("[data-rmdep]");
  if (!b) return;
  curDeps = curDeps.filter((id) => id !== b.dataset.rmdep);
  renderDeps();
};

$("form").onsubmit = (e) => {
  e.preventDefault();
  const id = $("fId").value;
  const ips = [...$("ips").children]
    .map((r) => ({ ip: r.querySelector(".ipv").value.trim(), label: r.querySelector(".ipl").value.trim() }))
    .filter((x) => x.ip);
  const tags = $("fTags").value.split(",").map(t => t.trim()).filter(Boolean);
  const now = new Date().toISOString();
  const existing = db.find((m) => m.id === id);

  const obj = {
    id: id || uid(),
    name: $("fName").value.trim(),
    type: $("fType").value,
    location: $("fLoc").value.trim(),
    ips, deps: [...curDeps],
    tags,
    note: $("fNote").value.trim(),
    key: $("fKey").checked,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };

  if (id) db[db.findIndex((m) => m.id === id)] = obj;
  else db.push(obj);
  save();
  $("modal").close();
  render();
  const clash = [...new Set(ips.map((x) => x.ip).filter((ip) => db.some((m) => m.id !== obj.id && (m.ips || []).some((i) => i.ip === ip))))];
  if (clash.length) toast("Zapisano. Duplikat IP: " + clash.join(", "), 4500);
  else toast(id ? "Zapisano zmiany" : "Dodano maszynę");
};

function handleClick(e) {
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const id = b.dataset.id, act = b.dataset.act;
  const m = db.find((x) => x.id === id);
  if (act === "tree") { openTreeModal(id); return; }
  if (act === "note") { openNotes.has(id) ? openNotes.delete(id) : openNotes.add(id); render(); return; }
  if (act === "more") { open.has(id) ? open.delete(id) : open.add(id); render(); return; }
  if (act === "scan") { openPgGroup(id); return; }
  if (act === "ping" || act === "vnc") {
    const h = b.dataset.ip;
    if (!SAFE.test(h)) { toast("Niedozwolone znaki"); return; }
    copy(act === "ping" ? pingCmd(h) : sshCmd(h));
    return;
  }
  if (act === "cmd") {
    const c = cfg.cmds[+b.dataset.i];
    if (!c || !m) return;
    const t = fillCmd(c.tpl, b.dataset.ip, m, b.dataset.kind);
    if (t === null) toast("Niedozwolone znaki");
    else copy(t);
    return;
  }
  if (act === "copy") copy(m.name);
  if (act === "copyip") copy(b.dataset.ip);
  if (act === "edit") openModal(m);
  if (act === "jump") { $("q").value = m.name; saveUi(); render(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  if (act === "del") {
    askConfirm("Usunąć „" + m.name + "”?", "Usuń").then((ok) => {
      if (!ok) return;
      db = db.filter((x) => x.id !== id);
      db.forEach((x) => (x.deps = (x.deps || []).filter((d) => d !== id)));
      save();
      render();
      toast("Usunięto");
    });
  }
}
$("rows").addEventListener("click", handleClick);

$("stats").onclick = (e) => {
  if (e.target.closest("[data-dup]")) { dupOnly = !dupOnly; render(); return; }
  const b = e.target.closest("[data-type]");
  if (!b) return;
  $("typ").value = b.dataset.type;
  render();
};
function sortFromHeader(th) {
  const k = th.dataset.sort;
  if (!k) return;
  sort = sort.k === k ? { k, d: -sort.d } : { k, d: 1 };
  saveUi();
  render();
}
document.querySelector("thead").addEventListener("click", (e) => {
  const th = e.target.closest("[data-sort]");
  if (th) sortFromHeader(th);
});
document.querySelector("thead").addEventListener("keydown", (e) => {
  const th = e.target.closest("[data-sort]");
  if (th && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    sortFromHeader(th);
  }
});

/* ===== Potwierdzenie (native <dialog>) ===== */
function askConfirm(msg, okLabel = "OK") {
  const dlg = $("cfmModal");
  $("cfmMsg").textContent = msg;
  $("cfmOk").textContent = okLabel;
  return new Promise((resolve) => {
    let answered = false;
    const onClose = () => {
      dlg.removeEventListener("close", onClose);
      resolve(answered);
    };
    $("cfmOk").onclick = () => { answered = true; dlg.close(); };
    $("cfmNo").onclick = () => { answered = false; dlg.close(); };
    dlg.addEventListener("close", onClose);
    dlg.showModal();
  });
}

/* ===== Ustawienia ===== */
function renderCats() {
  $("catList").innerHTML = draftCats.length
    ? draftCats.map((c, i) => `<div class="row-item">
        <span class="text-muted">${svg(ICONS.tag, "icon")}</span>
        <input data-catname="${i}" value="${esc(c.name)}" maxlength="24" class="input input-sm" style="flex:1">
        <button type="button" data-delcat="${i}" class="ibtn danger">${svg(ICONS.trash)}</button>
      </div>`).join("")
    : '<div class="text-xs text-faint">Brak własnych kategorii.</div>';
}
function addDraftCat() {
  const n = $("catNew").value.trim();
  if (!n) return false;
  draftCats.push({ id: "c_" + uid().replace(/[^a-z0-9]/gi, "").slice(0, 8), name: n });
  $("catNew").value = "";
  renderCats();
  return true;
}
const PING_OK = /^[\w\s.\-:=\/]*$/;
const TARGETS = { ip: "IP", name: "nazwa", both: "IP i nazwa" };
function cfgPreview() {
  const u = $("cSsh").value.trim(), p = $("cPort").value || "…", a = $("cPing").value.trim();
  $("cPrev").textContent = `ping ${a ? a + " " : ""}host\nssh -L ${p}:localhost:${p} ${u ? u + "@" : ""}host`;
}
function renderCmds() {
  $("cList").innerHTML = draftCmds.length
    ? draftCmds.map((c, i) => `<div class="row-item">
        <span class="badge badge-primary">${esc(c.label)}</span>
        <span class="text-xs text-muted truncate" style="flex:1;font-family:ui-monospace,monospace" title="${esc(c.tpl)}">${esc(c.tpl)}</span>
        <span class="text-xs text-faint">${TARGETS[c.target] || ""}</span>
        <button type="button" data-delcmd="${i}" class="ibtn danger">${svg(ICONS.trash)}</button>
      </div>`).join("")
    : '<div class="text-xs text-faint">Brak własnych komend.</div>';
}
function addDraftCmd() {
  const label = $("cmdLabel").value.trim(), tpl = $("cmdTpl").value.trim();
  if (!label || !tpl) return false;
  draftCmds.push({ label, tpl, target: $("cmdTarget").value });
  $("cmdLabel").value = "";
  $("cmdTpl").value = "";
  renderCmds();
  return true;
}
$("cfgBtn").onclick = () => {
  $("cTheme").value = cfg.theme;
  $("sPing").checked = cfg.show.ping;
  $("sVnc").checked = cfg.show.vnc;
  $("sWeb").checked = cfg.show.web;
  $("sScan").checked = cfg.show.scan;
  $("cPing").value = cfg.pingArgs;
  $("cSsh").value = cfg.sshUser;
  $("cPort").value = cfg.vncPort;
  draftCmds = cfg.cmds.map((c) => ({ ...c })); renderCmds(); cfgPreview();
  draftCats = cfg.cats.map((c) => ({ ...c })); renderCats();
  $("cfgModal").showModal();
};
["cPing", "cSsh", "cPort"].forEach((id) => ($(id).oninput = cfgPreview));
$("cTheme").onchange = () => applyTheme($("cTheme").value);
$("catAdd").onclick = () => { if (!addDraftCat()) toast("Wpisz nazwę kategorii"); };
$("catList").oninput = (e) => { const i = e.target.dataset.catname; if (i !== undefined) draftCats[+i].name = e.target.value; };
$("catList").onclick = (e) => {
  const b = e.target.closest("[data-delcat]");
  if (!b) return;
  draftCats.splice(+b.dataset.delcat, 1);
  renderCats();
};
$("cmdAdd").onclick = () => { if (!addDraftCmd()) toast("Podaj etykietę i komendę"); };
$("cList").onclick = (e) => {
  const b = e.target.closest("[data-delcmd]");
  if (!b) return;
  draftCmds.splice(+b.dataset.delcmd, 1);
  renderCmds();
};
$("cCancel").onclick = () => $("cfgModal").close();
$("cfgForm").onsubmit = (e) => {
  e.preventDefault();
  addDraftCmd();
  addDraftCat();
  draftCats = draftCats.map((c) => ({ ...c, name: c.name.trim() })).filter((c) => c.name);
  const used = new Set(Object.entries(TYPES).filter(([k]) => !k.startsWith("c_")).map(([, v]) => v[0].toLowerCase()));
  for (const c of draftCats) {
    if (used.has(c.name.toLowerCase())) { toast("Kategoria „" + c.name + "” już istnieje"); return; }
    used.add(c.name.toLowerCase());
  }
  const u = $("cSsh").value.trim(), p = parseInt($("cPort").value, 10), a = $("cPing").value.trim();
  if (u && !/^[\w.\-]+$/.test(u)) { toast("Nieprawidłowy login"); return; }
  if (!(p >= 1 && p <= 65535)) { toast("Port 1–65535"); return; }
  if (!PING_OK.test(a)) { toast("Nieprawidłowe parametry ping"); return; }
  const oldCats = cfg.cats;
  cfg = {
    sshUser: u, vncPort: p, pingArgs: a, cmds: draftCmds, theme: $("cTheme").value,
    show: { ping: $("sPing").checked, vnc: $("sVnc").checked, web: $("sWeb").checked, scan: $("sScan").checked },
    cats: draftCats
  };
  const keep = new Set(draftCats.map((c) => c.id));
  const gone = new Set(oldCats.filter((c) => !keep.has(c.id)).map((c) => c.id));
  if (gone.size) { db.forEach((m) => { if (gone.has(m.type)) m.type = "other"; }); save(); }
  syncTypes();
  saveCfg();
  $("cfgModal").close();
  render();
  toast("Zapisano ustawienia");
};
$("cfgModal").addEventListener("close", () => applyTheme());

/* ===== Kopia zapasowa ===== */
const bkJson = () => JSON.stringify({ version: 2, machines: db, cats: cfg.cats }, null, 1);
function openBk(mode) {
  const exp = mode === "exp";
  $("bkTitle").textContent = exp ? "Eksport danych" : "Import danych";
  $("bkHelp").textContent = exp
    ? "Pobierz plik JSON lub skopiuj zawartość."
    : "Wybierz plik JSON lub wklej jego zawartość, a potem kliknij „Wczytaj”.";
  $("bkImpBox").classList.toggle("d-none", exp);
  ["bkCopy", "bkDl"].forEach((id) => $(id).classList.toggle("d-none", !exp));
  $("bkGo").classList.toggle("d-none", exp);
  $("bkText").readOnly = exp;
  $("bkText").value = exp ? bkJson() : "";
  $("bkModal").showModal();
}
$("exp").onclick = () => openBk("exp");
$("imp").onclick = () => openBk("imp");
$("bkClose").onclick = () => $("bkModal").close();
$("bkText").onclick = (e) => { if (e.target.readOnly) e.target.select(); };
$("bkCopy").onclick = () => copy(bkJson(), "dane (JSON)");
$("bkDl").onclick = () => {
  try {
    const url = URL.createObjectURL(new Blob([bkJson()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url; a.download = "maszyny-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast("Pobieranie rozpoczęte", 3500);
  } catch (e) { toast("Pobieranie niedostępne", 3500); }
};
$("bkPick").onclick = () => $("file").click();
$("file").onchange = () => {
  const f = $("file").files[0];
  if (f) {
    const r = new FileReader();
    r.onload = () => { $("bkText").value = r.result; toast("Wczytano plik, kliknij „Wczytaj”"); };
    r.onerror = () => toast("Nie udało się odczytać pliku");
    r.readAsText(f);
  }
  $("file").value = "";
};
$("bkGo").onclick = () => {
  let raw;
  try { raw = JSON.parse($("bkText").value); } catch (e) { toast("Niepoprawny JSON"); return; }
  const d = Array.isArray(raw) ? raw : raw?.machines;
  if (!Array.isArray(d)) { toast("Brak listy maszyn"); return; }
  const importedCats = Array.isArray(raw?.cats)
    ? raw.cats.filter((c) => c && /^c_\w+$/.test(c.id) && c.name)
      .map((c) => ({ id: c.id, name: String(c.name) }))
    : [];
  const validTypes = new Set([...Object.keys(TYPES), ...importedCats.map((c) => c.id)]);
  const now = new Date().toISOString();
  const items = d.filter((x) => x && typeof x === "object" && x.name).map((x) => ({
    id: String(x.id || "").replace(/[^\w-]/g, "") || uid(),
    name: String(x.name),
    type: validTypes.has(x.type) ? x.type : "other",
    location: String(x.location || ""),
    ips: Array.isArray(x.ips) ? x.ips.filter((i) => i && i.ip).map((i) => ({ ip: String(i.ip), label: String(i.label || "") })) : [],
    deps: Array.isArray(x.deps) ? x.deps.map(String) : [],
    tags: Array.isArray(x.tags) ? x.tags.map(String) : [],
    note: String(x.note || ""),
    key: !!x.key,
    createdAt: x.createdAt || now,
    updatedAt: x.updatedAt || now
  }));
  if (!items.length) { toast("Brak poprawnych maszyn"); return; }
  const applyImportedCats = () => {
    importedCats.filter((c) => !cfg.cats.some((x) => x.id === c.id))
      .forEach((c) => cfg.cats.push(c));
    syncTypes();
    saveCfg();
  };
  if ($("bkMode").value === "replace") {
    askConfirm(`Zastąpić wszystkie obecne dane ${db.length} maszynami z pliku? Tej operacji nie można cofnąć.`, "Zastąp dane").then((ok) => {
      if (!ok) return;
      applyImportedCats();
      db = items;
      save();
      $("bkModal").close();
      render();
      toast("Zastąpiono dane. Zaimportowano " + items.length + " maszyn");
    });
    return;
  } else {
    applyImportedCats();
    const M = new Map(db.map((m) => [m.id, m]));
    items.forEach((m) => M.set(m.id, m));
    db = [...M.values()];
  }
  save(); $("bkModal").close(); render();
  toast("Zaimportowano " + items.length + " maszyn");
};

/* ===== Ping (PowerShell) ===== */
const psq = (s) => "'" + String(s).replace(/[\r\n]+/g, " ").replace(/'/g, "''") + "'";

function buildPingScriptCore(rows, opts = {}) {
  const { live = false, refreshMs = 1000, timeoutMs = 900, pause = false, title = "Ping" } = opts;
  const hasGroups = rows.some((r) => r.group);
  const hasDesc = rows.some((r) => r.desc);
  const wh = Math.max(4, ...rows.map((r) => r.host.length));
  const wi = Math.max(15, ...rows.map((r) => r.ip.length));
  const wd = hasDesc ? Math.max(4, ...rows.map((r) => (r.desc || "").length)) : 0;
  const fmtHead = hasDesc
    ? `'{0,-${wh}}  {1,-${wi}}  {2,-${wd}}  {3}' -f 'HOST', 'IP', 'DESC', 'DELAY'`
    : `'{0,-${wh}}  {1,-${wi}}  {2}' -f 'HOST', 'IP', 'DELAY'`;
  const fmtLine = hasDesc
    ? `$line = '{0,-${wh}}  {1,-${wi}}  {2,-${wd}}  {3}' -f $j.Host, $ip, $j.Desc, $delay`
    : `$line = '{0,-${wh}}  {1,-${wi}}  {2}' -f $j.Host, $ip, $delay`;
  const hostsBlock = rows.map((r) => {
    const parts = [`Host = ${psq(r.host)}`, `Ip = ${psq(r.ip)}`];
    if (r.desc) parts.push(`Desc = ${psq(r.desc)}`);
    if (r.group) parts.push(`Group = ${psq(r.group)}`);
    return `  @{ ${parts.join("; ")} }`;
  }).join(",\n");
  const objFields = (() => {
    const fields = ["Host = $h.Host", "Ip = $h.Ip"];
    if (hasDesc) fields.push("Desc = $h.Desc");
    if (hasGroups) fields.push("Group = $h.Group");
    fields.push("Task = $task");
    return `  [pscustomobject]@{ ${fields.join("; ")} }`;
  })();
  const body = [
    "$jobs = foreach ($h in $hosts) {",
    "  $target = if ($h.Ip) { $h.Ip } else { $h.Host }",
    "  $task = $null",
    "  try { $task = (New-Object System.Net.NetworkInformation.Ping).SendPingAsync($target, $pingMs) } catch {}",
    objFields,
    "}",
    fmtHead,
    ...(hasGroups ? ["$lastGroup = $null"] : []),
    "foreach ($j in $jobs) {",
    ...(hasGroups ? [
      "  if ($j.Group -and $j.Group -ne $lastGroup) {",
      "    if ($lastGroup -ne $null) { Write-Host '' }",
      '    Write-Host "=== $($j.Group) ===" -ForegroundColor Cyan',
      "    $lastGroup = $j.Group",
      "  }"
    ] : []),
    "  $delay = 'OFFLINE'; $ip = $j.Ip",
    "  try {",
    "    $r = $j.Task.Result",
    "    if ($r.Status -eq 'Success') {",
    '      $delay = "$($r.RoundtripTime) ms"',
    "      if (-not $ip) { $ip = $r.Address.IPAddressToString }",
    "    }",
    "  } catch {}",
    "  if (-not $ip) { $ip = '-' }",
    "  " + fmtLine,
    "  if ($delay -eq 'OFFLINE') { Write-Host $line -ForegroundColor Red } else { Write-Host $line -ForegroundColor Green }",
    "}"
  ];
  const lines = [`# ${title} (Rejestr maszyn)`];
  if (live) {
    lines.push("# Tryb na zywo - Ctrl+C aby zakonczyc", "");
    lines.push("$hosts = @(", hostsBlock, ")", "");
    lines.push(`$refreshMs = ${refreshMs}`, `$pingMs = ${timeoutMs}`, "");
    lines.push("while ($true) {");
    lines.push("  $sw = [System.Diagnostics.Stopwatch]::StartNew()");
    lines.push("  Clear-Host");
    lines.push(`  Write-Host ${psq(title)} -ForegroundColor White`);
    lines.push("  Write-Host ('Odswiezanie co ' + $refreshMs + ' ms - Ctrl+C') -ForegroundColor DarkGray");
    lines.push("  Write-Host ''", "");
    body.forEach((l) => lines.push("  " + l));
    lines.push("");
    lines.push("  $remain = $refreshMs - $sw.ElapsedMilliseconds");
    lines.push("  if ($remain -gt 0) { Start-Sleep -Milliseconds $remain }");
    lines.push("}");
  } else {
    lines.push("");
    lines.push("$hosts = @(", hostsBlock, ")", "");
    lines.push(`$pingMs = ${timeoutMs}`, "");
    body.forEach((l) => lines.push(l));
    if (pause) lines.push("", "Write-Host ''", "Read-Host 'Nacisnij Enter, aby zamknac'");
  }
  return lines.join("\n");
}

function buildPingScript(opts = {}) {
  const rows = db.filter((m) => m.key)
    .sort((a, b) => a.name.localeCompare(b.name, "pl", { numeric: true }))
    .map((m) => {
      const f = (m.ips || []).find((x) => x.ip);
      return { host: m.name, ip: f?.ip || "", desc: f?.label || "" };
    });
  return buildPingScriptCore(rows, { ...opts, title: "Ping kluczowych maszyn" });
}

function buildGroupPingScript(id, opts = {}) {
  const target = db.find((x) => x.id === id);
  if (!target) return "";
  const M = new Map(db.map((m) => [m.id, m]));
  const rev = {};
  db.forEach((m) => (m.deps || []).forEach((d) => (rev[d] ||= []).push(m)));
  const rows = [], seen = new Set();
  const add = (m, group) => {
    if (!m) return;
    const ips = (m.ips || []).filter((x) => x.ip);
    const entries = ips.length
      ? ips.map((i) => ({ host: m.name, ip: i.ip, desc: i.label || "", group }))
      : [{ host: m.name, ip: "", desc: "", group }];
    entries.forEach((e) => {
      const k = e.host + "|" + e.ip;
      if (seen.has(k)) return;
      seen.add(k); rows.push(e);
    });
  };
  add(target, "TA MASZYNA");
  (target.deps || []).forEach((dId) => add(M.get(dId), "ZALEZY OD"));
  (rev[id] || []).forEach((u) => add(u, "ZALEZY OD NIEJ"));
  return buildPingScriptCore(rows, { ...opts, title: `Ping grupy: ${target.name}` });
}

let pgMode = "key", pgGroupId = null;
const pgOpts = () => ({
  live: $("pgLive").checked,
  refreshMs: Math.min(60000, Math.max(300, parseInt($("pgEvery").value, 10) || 1000)),
  timeoutMs: Math.min(10000, Math.max(200, parseInt($("pgTimeout").value, 10) || 900))
});
const pgBuild = (pause = false) => {
  const o = { ...pgOpts(), pause };
  return pgMode === "group" ? buildGroupPingScript(pgGroupId, o) : buildPingScript(o);
};
const renderPg = () => { $("pgText").value = pgBuild(false); };

function openPgKey() {
  const n = db.filter((m) => m.key).length;
  if (!n) { toast("Brak kluczowych maszyn", 4000); return; }
  pgMode = "key"; pgGroupId = null;
  $("pgTitle").textContent = "Ping kluczowych maszyn";
  $("pgHelp").textContent = `Kluczowych maszyn: ${n}. Wklej do PowerShell. Pinguje po IP lub po nazwie.`;
  renderPg();
  $("pgModal").showModal();
}
function openPgGroup(id) {
  const m = db.find((x) => x.id === id);
  if (!m) return;
  pgMode = "group"; pgGroupId = id;
  const rev = {};
  db.forEach((x) => (x.deps || []).forEach((d) => (rev[d] ||= []).push(x)));
  const parts = [];
  const ipsN = (m.ips || []).filter((x) => x.ip).length;
  const depsN = (m.deps || []).filter((d) => db.some((x) => x.id === d)).length;
  const revN = (rev[id] || []).length;
  if (ipsN) parts.push(`${ipsN} adr. IP`);
  if (depsN) parts.push(`${depsN} zależności`);
  if (revN) parts.push(`${revN} zależnych`);
  $("pgTitle").textContent = "Ping grupy: " + m.name;
  $("pgHelp").textContent = `${m.name}${parts.length ? " (" + parts.join(", ") + ")" : ""}. Pinguje tę maszynę, jej zależności i maszyny zależne.`;
  renderPg();
  $("pgModal").showModal();
}
$("pg").onclick = openPgKey;
$("pgClose").onclick = () => $("pgModal").close();
$("pgText").onclick = (e) => e.target.select();
["pgLive", "pgEvery", "pgTimeout"].forEach((id) => ($(id).oninput = renderPg));
$("pgCopy").onclick = () => copy(pgBuild(false), "skrypt PowerShell");
$("pgDl").onclick = () => {
  try {
    const o = pgOpts();
    const s = pgBuild(!o.live);
    const body = "\ufeff" + s.replace(/\n/g, "\r\n");
    const safe = pgMode === "group"
      ? "ping-grupa-" + (db.find((x) => x.id === pgGroupId)?.name || "maszyna").replace(/[^\w.-]+/g, "_") + ".ps1"
      : "ping-kluczowe.ps1";
    const url = URL.createObjectURL(new Blob([body], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = safe;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast("Pobieranie rozpoczęte", 3500);
  } catch (e) { toast("Pobieranie niedostępne", 3500); }
};

/* ===== Backdrop-click na <dialog> ===== */
document.querySelectorAll("dialog").forEach((dlg) => {
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) {
      const r = dlg.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) dlg.close();
    }
  });
});

/* ===== Przełącznik motywu ===== */
$("themeToggle").onclick = () => {
  const cur = document.documentElement.getAttribute("data-theme");
  cfg.theme = cur === "dark" ? "light" : "dark";
  saveCfg();
  applyTheme();
};

/* ===== Start ===== */
applyTheme();
try { localStorage.setItem("_t", "1"); localStorage.removeItem("_t"); }
catch (e) { $("warn").classList.remove("d-none"); }
$("q").value = ui.q || "";
render();
