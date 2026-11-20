// Branded emails James receives when a client sends a form. Built in the browser from the
// answers, then delivered by EmailJS (see send.ts). Email-safe HTML only: tables, inline
// styles, no web fonts or SVG, so it looks right in Outlook, Gmail and Apple Mail.
import { checkin, onboarding, type Section } from "./forms";
import { site } from "./site";

type Values = Record<string, string | string[]>;
export type EmailParts = { subject: string; html: string; text: string; replyTo: string; fromName: string };

export const COACH_EMAIL = "jpickles.coaching@outlook.com";

const C = { ink: "#0c0c0d", ink2: "#151516", bone: "#f4f1ea", paper: "#ffffff", line: "#e7e2d8", mute: "#7a756c", gold: "#c9a45c", goldDark: "#9a7a3c", warn: "#b4533f", warnBg: "#fbefeb" };
const SERIF = "'Bodoni 72','Didot','Bodoni MT',Georgia,'Times New Roman',serif";
const SANS = "'Helvetica Neue',Helvetica,Arial,sans-serif";

const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const val = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(", ") : (v ?? "")).toString().trim();
const first = (name: string) => name.trim().split(/\s+/)[0] || name;
const niceDate = (iso?: string) => {
  const d = iso ? new Date(iso) : new Date();
  return isNaN(+d) ? String(iso ?? "") : d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
};
const abs = (path: string) => new URL(path, site).href;

/* ---------- Building blocks ---------- */
function shell(label: string, body: string, preheader: string) {
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${esc(label)}</title></head>
<body style="margin:0;padding:0;background:${C.bone};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.bone};">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.bone}" style="background:${C.bone};"><tr><td align="center" style="padding:24px 12px 40px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
<tr><td bgcolor="${C.ink}" style="background:${C.ink};border-radius:14px 14px 0 0;padding:30px 32px 26px;" align="center">
  <img src="${abs("/media/email-logo.png")}" width="220" alt="J.PICKLES COACHING" style="display:block;width:220px;max-width:70%;height:auto;border:0;color:${C.bone};font:600 18px ${SANS};letter-spacing:6px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px auto 0;"><tr>
    <td width="28" valign="middle" style="width:28px;"><div style="height:1px;line-height:1px;font-size:1px;background:${C.gold};">&nbsp;</div></td>
    <td style="padding:0 12px;font:600 11px/1 ${SANS};letter-spacing:4px;text-transform:uppercase;color:${C.gold};white-space:nowrap;">${esc(label)}</td>
    <td width="28" valign="middle" style="width:28px;"><div style="height:1px;line-height:1px;font-size:1px;background:${C.gold};">&nbsp;</div></td>
  </tr></table>
</td></tr>
<tr><td bgcolor="${C.paper}" style="background:${C.paper};border-radius:0 0 14px 14px;padding:0;">${body}</td></tr>
<tr><td align="center" style="padding:22px 20px 0;font:400 12px/1.6 ${SANS};color:${C.mute};">
  Sent from the form on <a href="${abs("/")}" style="color:${C.goldDark};text-decoration:none;">J.Pickles Coaching</a>. Hit reply to answer the client directly.
</td></tr>
</table></td></tr></table></body></html>`;
}

const hero = (title: string, sub: string) => `
<tr><td style="padding:30px 32px 6px;">
  <div style="font:400 34px/1.1 ${SERIF};color:${C.ink};letter-spacing:-0.3px;">${title}</div>
  <div style="font:400 14px/1.5 ${SANS};color:${C.mute};padding-top:8px;">${sub}</div>
</td></tr>`;

/** A row of 3 stat tiles. Each tile: [label, value, small] */
const tiles = (items: [string, string, string?][]) => {
  const rows: string[] = [];
  for (let i = 0; i < items.length; i += 3) {
    const cells = items.slice(i, i + 3).map(([l, v, s]) => `
      <td width="33%" valign="top" style="padding:5px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${C.line};border-radius:10px;"><tr><td style="padding:14px 14px 13px;">
          <div style="font:600 10px/1 ${SANS};letter-spacing:2px;text-transform:uppercase;color:${C.mute};">${esc(l)}</div>
          <div style="font:400 26px/1.15 ${SERIF};color:${C.ink};padding-top:8px;">${v || "&ndash;"}</div>
          ${s ? `<div style="font:600 12px/1.3 ${SANS};color:${C.goldDark};padding-top:3px;">${s}</div>` : ""}
        </td></tr></table>
      </td>`).join("");
    rows.push(`<tr>${cells}</tr>`);
  }
  return `<tr><td style="padding:14px 27px 4px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows.join("")}</table></td></tr>`;
};

const flags = (title: string, list: string[]) =>
  list.length
    ? `<tr><td style="padding:12px 32px 4px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.warnBg}" style="background:${C.warnBg};border-left:3px solid ${C.warn};border-radius:6px;"><tr><td style="padding:12px 16px;font:400 14px/1.5 ${SANS};color:${C.ink};">
        <span style="font:700 11px/1 ${SANS};letter-spacing:2px;text-transform:uppercase;color:${C.warn};">${esc(title)}</span><br>${list.map(esc).join(" &nbsp;&middot;&nbsp; ")}
      </td></tr></table></td></tr>`
    : "";

const buttons = (items: [string, string, boolean?][]) => `
<tr><td style="padding:18px 32px 4px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${items
  .map(([label, href, primary]) => `<td style="padding:0 8px 8px 0;"><a href="${esc(href)}" style="display:inline-block;padding:11px 20px;border-radius:999px;font:600 14px/1 ${SANS};text-decoration:none;${primary ? `background:${C.gold};color:${C.ink};border:1px solid ${C.gold};` : `background:${C.paper};color:${C.ink};border:1px solid ${C.line};`}">${esc(label)}</a></td>`)
  .join("")}</tr></table></td></tr>`;

/** Every answer, grouped by the form's sections, in the same order as the form. */
function answers(sections: Section[], v: Values, skip: string[] = []) {
  return sections
    .map((s) => {
      const rows = s.fields
        .filter((f) => !skip.includes(f.id) && val(v[f.id]) !== "")
        .map((f) => `
          <tr><td style="padding:12px 0;border-top:1px solid ${C.line};">
            <div style="font:400 12px/1.4 ${SANS};color:${C.mute};padding-bottom:4px;">${esc(f.label)}</div>
            <div style="font:400 15px/1.55 ${SANS};color:${C.ink};white-space:pre-wrap;">${esc(val(v[f.id]))}${f.unit ? ` ${esc(f.unit)}` : ""}</div>
          </td></tr>`)
        .join("");
      if (!rows) return "";
      return `<tr><td style="padding:22px 32px 0;">
        <div style="font:600 11px/1 ${SANS};letter-spacing:3px;text-transform:uppercase;color:${C.goldDark};padding-bottom:10px;">${esc(s.title)}</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
      </td></tr>`;
    })
    .join("");
}

const textVersion = (heading: string, sections: Section[], v: Values) =>
  [heading, "", ...sections.flatMap((s) => [s.title.toUpperCase(), ...s.fields.filter((f) => val(v[f.id]) !== "").map((f) => `${f.label}: ${val(v[f.id])}`), ""])].join("\n");

const table = (inner: string) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${inner}<tr><td style="padding:0 0 30px;"></td></tr></table>`;

/* ---------- Weekly check-in ---------- */
export function checkinEmail(v: Values, prevWeight?: number): EmailParts {
  const name = val(v.name) || "Client";
  const w = Number(v.weight_kg);
  const delta = prevWeight && w ? w - prevWeight : null;
  const deltaTxt = delta != null && Math.abs(delta) >= 0.05 ? `${delta > 0 ? "+" : "&minus;"}${Math.abs(delta).toFixed(1)} kg vs last week` : "";
  const score = (k: string) => (val(v[k]) ? `${esc(val(v[k]))}<span style="font:400 13px ${SANS};color:${C.mute};">/10</span>` : "");

  const issues: string[] = [];
  const pain = val(v.pain).toLowerCase();
  if (pain && !/^(no|none|nope|n\/a|na|no\.?)$/.test(pain)) issues.push("Pain or injury mentioned");
  if (v.difficulty === "Too hard") issues.push("Workouts felt too hard");
  if (v.difficulty === "Too easy") issues.push("Workouts felt too easy");
  if (v.nutrition === "Poor") issues.push("Nutrition: poor week");
  if (Number(v.sleep) && Number(v.sleep) <= 4) issues.push("Low sleep");
  if (Number(v.energy) && Number(v.energy) <= 4) issues.push("Low energy");

  const body = table(
    hero(esc(name), `${esc(niceDate(val(v.checkin_date)))} &nbsp;&middot;&nbsp; <a href="mailto:${esc(val(v.email))}" style="color:${C.goldDark};text-decoration:none;">${esc(val(v.email))}</a>`) +
      tiles([
        ["Weight", w ? `${esc(w)}<span style="font:400 13px ${SANS};color:${C.mute};"> kg</span>` : "", deltaTxt],
        ["Workouts", esc(val(v.workouts))],
        ["Nutrition", `<span style="font-size:20px;">${esc(val(v.nutrition))}</span>`],
        ["Felt", score("physical")],
        ["Energy", score("energy")],
        ["Sleep", score("sleep")],
      ]) +
      flags("Needs a look", issues) +
      answers(checkin, v, ["name", "email", "checkin_date", "weight_kg"]) +
      buttons([[`Reply to ${first(name)}`, `mailto:${val(v.email)}?subject=${encodeURIComponent("Your check-in")}`, true], ["Open coach dashboard", abs("/coach")]])
  );
  const wt = w ? ` · ${w} kg${delta != null && Math.abs(delta) >= 0.05 ? ` (${delta > 0 ? "+" : "-"}${Math.abs(delta).toFixed(1)})` : ""}` : "";
  return {
    subject: `Check-in: ${name}${wt}${issues.length ? " · needs a look" : ""}`,
    html: shell("Weekly check-in", body, `${name} checked in${wt}. ${issues.join(", ")}`),
    text: textVersion(`Weekly check-in from ${name}`, checkin, v),
    replyTo: val(v.email),
    fromName: `${name} via J.Pickles Coaching`,
  };
}

/* ---------- New client (onboarding & consultation) ---------- */
export function onboardingEmail(v: Values): EmailParts {
  const name = val(v.name) || "New client";
  const phone = val(v.phone);
  const wa = phone.replace(/\D/g, "").replace(/^0/, "44");
  const conditions = (Array.isArray(v.conditions) ? v.conditions : [v.conditions]).filter((c) => c && c !== "None") as string[];
  const health = [...conditions, ...(v.medication === "Yes" ? ["Takes medication"] : [])];

  const body = table(
    hero(esc(name), `${esc(val(v.plan) || "Plan to agree")}`) +
      buttons([
        ...(wa.length >= 10 ? ([["WhatsApp", `https://wa.me/${wa}`, true]] as [string, string, boolean][]) : []),
        ["Email", `mailto:${val(v.email)}`],
        ...(phone ? ([["Call", `tel:${phone.replace(/\s/g, "")}`]] as [string, string][]) : []),
      ]) +
      tiles([
        ["Age", esc(val(v.age))],
        ["Weight", val(v.weight_kg) ? `${esc(val(v.weight_kg))}<span style="font:400 13px ${SANS};color:${C.mute};"> kg</span>` : ""],
        ["Height", val(v.height_cm) ? `${esc(val(v.height_cm))}<span style="font:400 13px ${SANS};color:${C.mute};"> cm</span>` : ""],
        ["Days a week", esc(val(v.days_per_week))],
        ["Experience", `<span style="font-size:20px;">${esc(val(v.experience))}</span>`],
        ["Style", `<span style="font-size:20px;">${esc(val(v.coaching_style))}</span>`],
      ]) +
      (val(v.goal) ? `<tr><td style="padding:10px 32px 0;font:400 14px/1.5 ${SANS};color:${C.ink};"><span style="font:600 10px/1 ${SANS};letter-spacing:2px;text-transform:uppercase;color:${C.mute};">Goals</span><br>${esc(val(v.goal))}</td></tr>` : "") +
      flags("Health", health) +
      answers(onboarding, v, ["name", "age", "weight_kg", "height_cm", "plan", "confirm"]) +
      buttons([[`Reply to ${first(name)}`, `mailto:${val(v.email)}?subject=${encodeURIComponent("Your coaching with J.Pickles")}`, true], ["Open coach dashboard", abs("/coach")]])
  );
  return {
    subject: `New client: ${name}${val(v.plan) ? ` · ${val(v.plan).replace(/\s*\(.*\)$/, "")}` : ""}`,
    html: shell("New client", body, `${name} filled in the onboarding form. ${val(v.goal)}`),
    text: textVersion(`New client: ${name}`, onboarding, v),
    replyTo: val(v.email),
    fromName: `${name} via J.Pickles Coaching`,
  };
}
