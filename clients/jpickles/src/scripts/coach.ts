// Coach dashboard: James signs in and sees every check-in grouped by client
// (weight trend, scores, flags) plus new onboarding forms. Client answers are
// always inserted as text (esc), never as HTML.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, dbReady } from "../lib/db";

type Schema = { title: string; fields: { id: string; label: string }[] }[];
type CheckIn = { id: string; created_at: string; name: string; email: string; checkin_date: string; weight_kg: number | null; answers: Record<string, any>; reviewed: boolean };
type Onboard = { id: string; created_at: string; name: string; email: string; phone: string | null; plan: string | null; answers: Record<string, any>; status: string };

const schema = (window as any).__schema as { onboarding: Schema; checkin: Schema };
const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector<T>(s)!;
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => Array.from(el.querySelectorAll<T>(s));
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const show = (view: string) => $$("[data-view]").forEach((v) => (v.hidden = v.dataset.view !== view));
const dateFmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const ago = (d: string) => {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 864e5);
  return days <= 0 ? "Today" : days === 1 ? "Yesterday" : days < 7 ? `${days} days ago` : dateFmt(d);
};

let db: SupabaseClient;
let checkins: CheckIn[] = [];
let clients: Onboard[] = [];
let current: string | null = null;

/* ---------- Flags: what James should look at first ---------- */
function flagsFor(c: CheckIn) {
  const a = c.answers || {};
  const out: { t: string; warn?: boolean; isNew?: boolean }[] = [];
  if (!c.reviewed) out.push({ t: "New", isNew: true });
  const pain = String(a.pain || "").trim().toLowerCase();
  if (pain && !/^(no|none|nope|n\/a|na|no\.?)$/.test(pain)) out.push({ t: "Pain", warn: true });
  if (a.difficulty === "Too hard") out.push({ t: "Too hard", warn: true });
  if (a.difficulty === "Too easy") out.push({ t: "Too easy" });
  if (a.nutrition === "Poor") out.push({ t: "Food: poor", warn: true });
  if (Number(a.sleep) && Number(a.sleep) <= 4) out.push({ t: "Low sleep", warn: true });
  if (Number(a.energy) && Number(a.energy) <= 4) out.push({ t: "Low energy", warn: true });
  return out;
}
const flagHtml = (f: ReturnType<typeof flagsFor>) => f.map((x) => `<span class="flag${x.warn ? " warn" : ""}${x.isNew ? " new" : ""}">${esc(x.t)}</span>`).join("");

/* ---------- Answers in form order ---------- */
function answersHtml(s: Schema, a: Record<string, any>) {
  return s.map((sec) => {
    const rows = sec.fields
      .filter((f) => a[f.id] !== undefined && a[f.id] !== "" && !(Array.isArray(a[f.id]) && !a[f.id].length))
      .map((f) => `<dt>${esc(f.label)}</dt><dd>${esc(Array.isArray(a[f.id]) ? a[f.id].join(", ") : a[f.id])}</dd>`)
      .join("");
    return rows ? `<div><h4>${esc(sec.title)}</h4><dl>${rows}</dl></div>` : "";
  }).join("");
}

/* ---------- Clients list (grouped by email) ---------- */
function groups() {
  const map = new Map<string, CheckIn[]>();
  checkins.forEach((c) => {
    const k = c.email.toLowerCase();
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(c);
  });
  return [...map.entries()]
    .map(([email, list]) => ({ email, list: list.sort((a, b) => b.checkin_date.localeCompare(a.checkin_date) || b.created_at.localeCompare(a.created_at)) }))
    .sort((a, b) => b.list[0].created_at.localeCompare(a.list[0].created_at));
}

function renderList() {
  const q = $<HTMLInputElement>("[data-search]").value.trim().toLowerCase();
  const onlyNew = $<HTMLInputElement>("[data-unreviewed]").checked;
  const list = $("[data-client-list]");
  const gs = groups().filter((g) => (!q || g.list[0].name.toLowerCase().includes(q) || g.email.includes(q)) && (!onlyNew || g.list.some((c) => !c.reviewed)));
  $("[data-count-checkins]").textContent = String(checkins.filter((c) => !c.reviewed).length || "");
  if (!gs.length) {
    list.innerHTML = `<li class="empty" style="min-height:30vh"><p>${checkins.length ? "No matches." : "No check-ins yet. Share /check-in with your clients."}</p></li>`;
    return;
  }
  list.innerHTML = gs.map((g) => {
    const [last, prev] = g.list;
    const delta = last.weight_kg != null && prev?.weight_kg != null ? Number(last.weight_kg) - Number(prev.weight_kg) : null;
    const flags = flagsFor(last);
    return `<li><button type="button" data-client="${esc(g.email)}" aria-current="${current === g.email}">
      <span class="who">${esc(last.name)}</span>
      <span class="when">${esc(ago(last.created_at))} · ${g.list.length} check-in${g.list.length === 1 ? "" : "s"}</span>
      <span class="wt">${last.weight_kg != null ? `${esc(last.weight_kg)} kg` : ""}${delta != null ? `<small>${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg</small>` : ""}</span>
      ${flags.length ? `<span class="flags">${flagHtml(flags)}</span>` : ""}
    </button></li>`;
  }).join("");
}

/* ---------- Weight chart (inline SVG, no library) ---------- */
function chart(list: CheckIn[]) {
  const pts = list.filter((c) => c.weight_kg != null).slice().reverse();
  if (pts.length < 2) return `<p class="note">The weight trend appears after two check-ins.</p>`;
  const W = 600, H = 160, P = 8;
  const ws = pts.map((p) => Number(p.weight_kg));
  const min = Math.min(...ws) - 0.5, max = Math.max(...ws) + 0.5;
  const x = (i: number) => P + (i / (pts.length - 1)) * (W - P * 2);
  const y = (v: number) => P + (1 - (v - min) / (max - min)) * (H - P * 2);
  const d = ws.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${d} L${x(ws.length - 1)},${H} L${x(0)},${H} Z`;
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Weight from ${ws[0]} to ${ws[ws.length - 1]} kg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9a45c" stop-opacity=".25"/><stop offset="1" stop-color="#c9a45c" stop-opacity="0"/></linearGradient></defs>
    <path d="${area}" fill="url(#g)"/><path d="${d}" fill="none" stroke="#c9a45c" stroke-width="2" vector-effect="non-scaling-stroke"/>
    ${ws.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="#f4f1ea"><title>${esc(dateFmt(pts[i].checkin_date))}: ${v} kg</title></circle>`).join("")}
  </svg>`;
}

const avg = (list: CheckIn[], key: string) => {
  const v = list.slice(0, 4).map((c) => Number(c.answers?.[key])).filter((n) => n > 0);
  return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : "-";
};

function renderClient(email: string) {
  current = email;
  const g = groups().find((x) => x.email === email);
  const box = $("[data-detail]");
  if (!g) { box.innerHTML = ""; return; }
  const [last] = g.list;
  const first = g.list[g.list.length - 1];
  const change = last.weight_kg != null && first.weight_kg != null ? Number(last.weight_kg) - Number(first.weight_kg) : null;
  box.innerHTML = `
    <button class="back-btn" type="button" data-back>&larr; All clients</button>
    <div class="detail-head">
      <div><h2>${esc(last.name)}</h2><p>${esc(email)} · since ${esc(dateFmt(first.checkin_date))}</p></div>
      <a class="btn btn-sm btn-ghost" href="mailto:${esc(email)}">Email</a>
    </div>
    <div class="stats">
      <div class="stat"><span>Weight</span><strong>${last.weight_kg ?? "-"}</strong><small>kg</small></div>
      <div class="stat"><span>Change</span><strong>${change != null ? (change > 0 ? "+" : "") + change.toFixed(1) : "-"}</strong><small>kg total</small></div>
      <div class="stat"><span>Energy</span><strong>${avg(g.list, "energy")}</strong><small>/10, 4 wk</small></div>
      <div class="stat"><span>Sleep</span><strong>${avg(g.list, "sleep")}</strong><small>/10, 4 wk</small></div>
      <div class="stat"><span>Felt</span><strong>${avg(g.list, "physical")}</strong><small>/10, 4 wk</small></div>
    </div>
    <div class="chart"><h3>Weight</h3>${chart(g.list)}</div>
    <div class="entries"><h3>Check-ins</h3>
      ${g.list.map((c, i) => `
        <details class="entry" ${i === 0 ? "open" : ""}>
          <summary><strong>${esc(dateFmt(c.checkin_date))}</strong><span class="meta">${c.weight_kg != null ? esc(c.weight_kg) + " kg" : ""}</span>
            <span class="flags">${flagHtml(flagsFor(c))}</span></summary>
          <div class="answers">${answersHtml(schema.checkin, c.answers)}</div>
          <div class="entry-actions">${c.reviewed ? `<span class="note">Reviewed</span>` : `<button class="btn btn-sm" type="button" data-review="${esc(c.id)}">Mark reviewed</button>`}</div>
        </details>`).join("")}
    </div>`;
  renderList();
  if (matchMedia("(max-width: 899px)").matches) box.scrollIntoView({ block: "start" });
}

/* ---------- New clients ---------- */
function renderOnboarding() {
  const box = $("[data-onboarding]");
  $("[data-count-clients]").textContent = String(clients.filter((c) => c.status === "new").length || "");
  if (!clients.length) {
    box.innerHTML = `<div class="empty"><p>No new client forms yet. Your "Start coaching" buttons send people to /start.</p></div>`;
    return;
  }
  const wa = (p: string | null) => {
    const d = String(p || "").replace(/\D/g, "").replace(/^0/, "44");
    return d.length >= 10 ? `https://wa.me/${d}` : "";
  };
  box.innerHTML = `<div class="detail-head"><div><h2>New clients</h2><p>Onboarding forms, newest first.</p></div></div>
    <div class="ob-grid">${clients.map((c) => `
      <details class="entry">
        <summary><strong>${esc(c.name)}</strong><span class="meta">${esc(ago(c.created_at))}</span>
          <span class="meta" style="grid-column:1/-1">${esc(c.plan || "")}</span>
          <span class="flags">${c.status === "new" ? `<span class="flag new">New</span>` : `<span class="flag">${esc(c.status)}</span>`}</span></summary>
        <div class="answers">${answersHtml(schema.onboarding, c.answers)}</div>
        <div class="entry-actions">
          ${wa(c.phone) ? `<a class="btn btn-sm" href="${esc(wa(c.phone))}" target="_blank" rel="noopener noreferrer">WhatsApp</a>` : ""}
          <a class="btn btn-sm btn-ghost" href="mailto:${esc(c.email)}">Email</a>
          <label class="sr" for="st-${esc(c.id)}">Status</label>
          <select class="status-select" id="st-${esc(c.id)}" data-status="${esc(c.id)}">
            ${["new", "contacted", "active", "archived"].map((s) => `<option value="${s}" ${s === c.status ? "selected" : ""}>${s[0].toUpperCase() + s.slice(1)}</option>`).join("")}
          </select>
        </div>
      </details>`).join("")}</div>`;
}

/* ---------- Data ---------- */
async function load() {
  const [a, b] = await Promise.all([
    db.from("check_ins").select("*").order("created_at", { ascending: false }).limit(2000),
    db.from("onboarding").select("*").order("created_at", { ascending: false }).limit(500),
  ]);
  if (a.error || b.error) {
    $("[data-detail]").innerHTML = `<div class="empty"><p>Couldn't load. ${esc((a.error || b.error)!.message)}</p></div>`;
    return;
  }
  checkins = a.data as CheckIn[];
  clients = b.data as Onboard[];
  renderList();
  renderOnboarding();
  if (current) renderClient(current);
}

function csv() {
  const onTab = $("[data-tab-btn='clients']").getAttribute("aria-selected") === "true";
  const s = onTab ? schema.onboarding : schema.checkin;
  const rows = (onTab ? clients : checkins) as any[];
  const fields = s.flatMap((x) => x.fields);
  const cell = (v: unknown) => `"${String(Array.isArray(v) ? v.join("; ") : v ?? "").replace(/"/g, '""')}"`;
  const out = [["Submitted", ...fields.map((f) => f.label)].map(cell).join(",")]
    .concat(rows.map((r) => [r.created_at, ...fields.map((f) => r.answers?.[f.id])].map(cell).join(",")));
  const blob = new Blob([out.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${onTab ? "new-clients" : "check-ins"}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ---------- Wiring ---------- */
function wire() {
  $("[data-client-list]").addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-client]");
    if (b) renderClient(b.dataset.client!);
  });
  $("[data-search]").addEventListener("input", renderList);
  $("[data-unreviewed]").addEventListener("change", renderList);
  $("[data-detail]").addEventListener("click", async (e) => {
    const t = e.target as HTMLElement;
    if (t.closest("[data-back]")) { current = null; $(".clients").scrollIntoView(); return; }
    const r = t.closest<HTMLElement>("[data-review]");
    if (r) {
      r.setAttribute("aria-busy", "true");
      const { error } = await db.from("check_ins").update({ reviewed: true }).eq("id", r.dataset.review!);
      if (!error) { const c = checkins.find((x) => x.id === r.dataset.review); if (c) c.reviewed = true; renderClient(current!); }
    }
  });
  $("[data-onboarding]").addEventListener("change", async (e) => {
    const sel = (e.target as HTMLElement).closest<HTMLSelectElement>("[data-status]");
    if (!sel) return;
    const { error } = await db.from("onboarding").update({ status: sel.value }).eq("id", sel.dataset.status!);
    if (!error) { const c = clients.find((x) => x.id === sel.dataset.status); if (c) c.status = sel.value; $("[data-count-clients]").textContent = String(clients.filter((c) => c.status === "new").length || ""); }
  });
  $$<HTMLButtonElement>("[data-tab-btn]").forEach((b) => b.addEventListener("click", () => {
    $$("[data-tab-btn]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
    $$("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== b.dataset.tabBtn));
  }));
  $("[data-refresh]").addEventListener("click", load);
  $("[data-export]").addEventListener("click", csv);
  $("[data-signout]").addEventListener("click", async () => { await db.auth.signOut(); show("signin"); });
}

async function main() {
  if (!dbReady) { show("setup"); return; }
  db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const msg = $("[data-signin-msg]");
  const form = $<HTMLFormElement>("[data-signin]");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    msg.textContent = "Signing in…";
    const { error } = await db.auth.signInWithPassword({ email: String(fd.get("email")), password: String(fd.get("password")) });
    if (error) { msg.textContent = "That email and password don't match."; return; }
    msg.textContent = "";
    show("dash");
    load();
  });
  $("[data-forgot]").addEventListener("click", async () => {
    const email = String(new FormData(form).get("email") || "");
    if (!email) { msg.textContent = "Type your email above first."; return; }
    await db.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/coach` });
    msg.textContent = "If that's your email, a reset link is on its way.";
  });
  // Password reset links land here signed in; let James set a new password.
  db.auth.onAuthStateChange(async (event) => {
    if (event === "PASSWORD_RECOVERY") {
      const pw = prompt("Choose a new password (at least 8 characters):");
      if (pw && pw.length >= 8) await db.auth.updateUser({ password: pw });
    }
  });
  wire();
  const { data } = await db.auth.getSession();
  if (data.session) { show("dash"); load(); } else show("signin");
}

main();
