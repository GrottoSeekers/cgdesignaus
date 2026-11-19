// Engine for the multi-step client forms. Validates each step before moving on,
// keeps a draft in this browser (so a closed tab doesn't lose answers), and saves
// to Supabase. Works without animation when Reduce Motion is on.
import { gsap } from "gsap";
import { dbReady, insert } from "../lib/db";

const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => Array.from(el.querySelectorAll<T>(s));
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

type Values = Record<string, string | string[]>;

const store = {
  get<T>(k: string): T | null { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } },
  set(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
  del(k: string) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

/* Thank-you screen: the gold ring draws, the tick snaps in, speed lines burst out
   (like the logo's trails), then the rest of the screen rises in. */
function celebrate(done: HTMLElement) {
  const mark = $("[data-done-mark]", done);
  const parts = Array.from(done.children).filter((c) => c !== mark && !(c as HTMLElement).hidden);
  if (reduce || !mark) {
    mark?.classList.add("is-drawn");
    return;
  }
  const ring = $("circle", mark)!;
  const tick = $("path", mark)!;
  const lines = $$("i", mark);
  gsap.set([ring, tick], { strokeDashoffset: 1 });
  gsap.set(parts, { autoAlpha: 0, y: 24 });
  gsap.timeline({ defaults: { ease: "expo.out" } })
    .from(mark, { scale: 0.6, autoAlpha: 0, duration: 0.6 }, 0)
    .to(ring, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" }, 0.1)
    .to(mark, { "--fill": 1, duration: 0.5, ease: "power2.out" }, 0.75)
    .to(tick, { strokeDashoffset: 0, duration: 0.5, ease: "power3.out" }, 0.8)
    .fromTo(lines, { scaleX: 0, autoAlpha: 1, x: 0 }, { scaleX: 1, x: 26, autoAlpha: 0, duration: 0.9, stagger: 0.02, ease: "power3.out" }, 0.85)
    .to(parts, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08 }, 1);
}

export function initFlow(opts: {
  prefill?: Values;
  remember?: string[]; // fields kept for next time (e.g. name + email on the weekly check-in)
  toRow: (v: Values) => Record<string, unknown>;
  table: "onboarding" | "check_ins";
  onDone?: (v: Values) => void; // fill in the thank-you screen (e.g. the week's summary)
}) {
  const flow = $("[data-flow]");
  const form = $<HTMLFormElement>("[data-form]");
  if (!flow || !form) return;
  const kind = flow.dataset.flow!;
  const draftKey = `jp-draft-${kind}`;
  const rememberKey = "jp-client";
  const steps = $$<HTMLFieldSetElement>("[data-step]", form);
  const back = $<HTMLButtonElement>("[data-back]", form)!;
  const next = $<HTMLButtonElement>("[data-next]", form)!;
  const submit = $<HTMLButtonElement>("[data-submit]", form)!;
  const bar = $("[data-progress]")!;
  const count = $("[data-count]")!;
  const subErr = $("[data-submit-error]", form)!;
  let i = 0;

  /* ---------- Values ---------- */
  const read = (): Values => {
    const out: Values = {};
    const fd = new FormData(form);
    for (const key of new Set(Array.from(fd.keys()))) {
      const all = fd.getAll(key).map(String).filter((x) => x.trim() !== "");
      const field = $(`[data-field="${key}"]`, form);
      const multi = !!field && $$<HTMLInputElement>("input[type=checkbox]", field).length > 0;
      if (multi) out[key] = all;
      else if (all[0] !== undefined) out[key] = all[0].trim();
    }
    return out;
  };
  const write = (v: Values) => {
    Object.entries(v).forEach(([k, val]) => {
      const vals = Array.isArray(val) ? val : [val];
      $$<HTMLInputElement | HTMLTextAreaElement>(`[name="${CSS.escape(k)}"]`, form).forEach((el) => {
        if (el instanceof HTMLInputElement && (el.type === "radio" || el.type === "checkbox")) el.checked = vals.includes(el.value);
        else el.value = vals[0] ?? "";
      });
    });
  };

  /* ---------- Validation ---------- */
  const fieldError = (field: HTMLElement): string => {
    const id = field.dataset.field!;
    const required = field.hasAttribute("data-required");
    const inputs = $$<HTMLInputElement | HTMLTextAreaElement>("input, textarea", field);
    const choice = inputs.some((x) => x instanceof HTMLInputElement && (x.type === "radio" || x.type === "checkbox"));
    if (choice) {
      const any = inputs.some((x) => (x as HTMLInputElement).checked);
      if (required && !any) return inputs[0] instanceof HTMLInputElement && inputs[0].type === "checkbox" ? "Pick at least one." : "Pick one.";
      return "";
    }
    const el = inputs[0];
    const val = el.value.trim();
    if (required && !val) return "This one's needed.";
    if (!val) return "";
    if (el instanceof HTMLInputElement) {
      if (el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) return "That email doesn't look right.";
      if (el.type === "tel" && val.replace(/\D/g, "").length < 10) return "Add the full number.";
      if (el.type === "number") {
        const n = Number(val);
        if (Number.isNaN(n)) return "Numbers only.";
        if (el.min && n < Number(el.min)) return `That looks low. Check the number.`;
        if (el.max && n > Number(el.max)) return `That looks high. Check the number.`;
      }
    }
    void id;
    return "";
  };
  const showError = (field: HTMLElement, msg: string) => {
    const err = $("[data-err]", field)!;
    field.classList.toggle("is-invalid", !!msg);
    err.hidden = !msg;
    err.textContent = msg;
    $$("input, textarea", field).forEach((x) => (msg ? x.setAttribute("aria-invalid", "true") : x.removeAttribute("aria-invalid")));
  };
  const validateStep = (n: number) => {
    let first: HTMLElement | null = null;
    $$("[data-field]", steps[n]).forEach((f) => {
      const msg = fieldError(f);
      showError(f, msg);
      if (msg && !first) first = f;
    });
    if (first) {
      (first as HTMLElement).scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      $<HTMLElement>("input, textarea", first)?.focus({ preventScroll: true });
      if (!reduce) gsap.fromTo(first, { x: -6 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
      return false;
    }
    return true;
  };
  // Clear an error as soon as it's fixed.
  form.addEventListener("input", (e) => {
    const field = (e.target as HTMLElement).closest<HTMLElement>("[data-field]");
    if (field?.classList.contains("is-invalid")) showError(field, fieldError(field));
    store.set(draftKey, { step: i, values: read() });
  });
  form.addEventListener("change", (e) => {
    const t = e.target as HTMLInputElement;
    // "None" style options clear the rest, and picking anything else clears "None".
    if (t.type === "checkbox") {
      const field = t.closest<HTMLElement>("[data-field]")!;
      const boxes = $$<HTMLInputElement>("input[type=checkbox]", field);
      if (t.hasAttribute("data-exclusive") && t.checked) boxes.forEach((b) => b !== t && (b.checked = false));
      else if (t.checked) boxes.forEach((b) => b.hasAttribute("data-exclusive") && (b.checked = false));
    }
    const field = t.closest<HTMLElement>("[data-field]");
    if (field?.classList.contains("is-invalid")) showError(field, fieldError(field));
    store.set(draftKey, { step: i, values: read() });
  });

  /* ---------- Steps ---------- */
  const render = (to: number, dir = 1) => {
    const from = i;
    i = to;
    steps.forEach((s, n) => (s.hidden = n !== i));
    back.hidden = i === 0;
    const last = i === steps.length - 1;
    next.hidden = last;
    submit.hidden = !last;
    count.textContent = `Step ${i + 1} of ${steps.length}`;
    const p = (i + 1) / steps.length;
    if (reduce) bar.style.transform = `scaleX(${p})`;
    else gsap.to(bar, { scaleX: p, duration: 0.6, ease: "expo.out" });
    if (from !== to) {
      scrollTo({ top: 0, behavior: "auto" });
      const title = $<HTMLElement>(".step-title", steps[i]);
      title?.setAttribute("tabindex", "-1");
      title?.focus({ preventScroll: true });
      if (!reduce) {
        gsap.fromTo(steps[i], { autoAlpha: 0, x: 28 * dir }, { autoAlpha: 1, x: 0, duration: 0.55, ease: "expo.out" });
        gsap.fromTo($$(".field", steps[i]), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "expo.out", stagger: 0.04, delay: 0.05 });
      }
    }
    store.set(draftKey, { step: i, values: read() });
  };
  next.addEventListener("click", () => validateStep(i) && render(i + 1, 1));
  back.addEventListener("click", () => render(i - 1, -1));
  // Enter in a single-line input moves forward instead of submitting early.
  form.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
      e.preventDefault();
      if (!next.hidden) next.click();
    }
  });

  /* ---------- Textareas grow with their content ---------- */
  const grow = (t: HTMLTextAreaElement) => { t.style.height = "auto"; t.style.height = `${t.scrollHeight + 2}px`; };
  $$<HTMLTextAreaElement>("[data-autosize]", form).forEach((t) => t.addEventListener("input", () => grow(t)));

  /* ---------- Submit ---------- */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    for (let n = 0; n < steps.length; n++) {
      if (!validateStep(n)) { if (n !== i) render(n, -1); validateStep(n); return; }
    }
    const values = read();
    subErr.hidden = true;
    submit.setAttribute("aria-busy", "true");
    const label = submit.innerHTML;
    submit.textContent = "Sending…";
    try {
      if (dbReady) await insert(opts.table, opts.toRow(values));
      else console.info("[J.Pickles] Supabase not configured. Answers:", values);
      store.del(draftKey);
      if (opts.remember) store.set(rememberKey, Object.fromEntries(opts.remember.map((k) => [k, values[k]])));
      form.hidden = true;
      $("[data-preview-note]")!.hidden = dbReady;
      const done = $("[data-done]")!;
      done.hidden = false;
      bar.style.transform = "scaleX(1)";
      count.textContent = "Sent";
      opts.onDone?.(values);
      scrollTo({ top: 0 });
      done.focus();
      celebrate(done);
    } catch {
      subErr.textContent = "That didn't send. Check your signal and try again. Your answers are still here.";
      subErr.hidden = false;
      subErr.scrollIntoView({ block: "center" });
    } finally {
      submit.removeAttribute("aria-busy");
      submit.innerHTML = label;
    }
  });

  /* ---------- Start: draft, remembered details, prefill ---------- */
  const draft = store.get<{ step: number; values: Values }>(draftKey);
  const remembered = opts.remember ? store.get<Values>(rememberKey) : null;
  write({ ...(remembered || {}), ...(draft?.values || {}), ...(opts.prefill || {}) });
  $$<HTMLTextAreaElement>("[data-autosize]", form).forEach(grow);
  render(Math.min(draft?.step ?? 0, steps.length - 1));
  if (!reduce) gsap.from([".flow-top", steps[i]], { autoAlpha: 0, y: 16, duration: 0.8, ease: "expo.out", stagger: 0.1 });
}
