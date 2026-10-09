// Page-wide motion for the homepage: active section, scroll reveals, reading
// progress, timeline fill, dot-rail colour and the eased in-page link glide.
// Everything runs on IntersectionObserver (Motion's inView) and plain scroll
// listeners, so it works in iOS Safari; no CSS scroll-driven animations.
import { animate, inView } from "motion";
import { prefersReducedMotion } from "../lib/motion-utils.js";

const reduce = prefersReducedMotion();
const SECTION_IDS = ["client", "before-after", "pricing", "process", "faq", "contact"];
const HEADER_OFFSET = 78;

const root = () => document.scrollingElement || document.documentElement;
const vh = () => window.innerHeight || document.documentElement.clientHeight;

// ---- Header pill + dot rail follow the section in view ----
function setActive(id: string) {
  document.querySelectorAll<HTMLElement>("[data-section]").forEach((el) => {
    el.classList.toggle("active", el.dataset.section === id);
  });
}

const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
inView(
  sections,
  (el) => {
    setActive(el.id);
    return () => {};
  },
  { margin: "-45% 0px -45% 0px" }
);

// ---- Fade/slide items up as they arrive. Anything already on screen at load stays put. ----
const ITEM_SEL =
  ".work-card, .ba-fact, .tier, .step, .perk, .faq-item, .way, .next-steps > li, .contact-form, .foot-word";

const isOnScreen = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.top < vh() * 0.92 && r.bottom > 0;
};

if (!reduce) {
  const targets: HTMLElement[] = [];
  document.querySelectorAll<HTMLElement>(".cg section:not(#hero) .wrap > *, .site-footer .wrap > *").forEach((el) => {
    if (!el.querySelector(ITEM_SEL) && !el.matches(ITEM_SEL)) targets.push(el);
  });
  document.querySelectorAll<HTMLElement>(ITEM_SEL).forEach((el) => targets.push(el));

  const pending = targets.filter((el) => {
    if (isOnScreen(el)) return false;
    const siblings = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.matches(ITEM_SEL)) : [];
    const index = siblings.indexOf(el);
    el.classList.add("rv");
    if (el.matches(".step")) el.classList.add("rv-x");
    if (index > 0) el.style.transitionDelay = `${Math.min(index, 5) * 0.09}s`;
    return true;
  });

  inView(
    pending,
    (el) => {
      const item = el as HTMLElement;
      item.classList.add("in");
      window.setTimeout(() => {
        item.classList.remove("rv", "rv-x", "in");
        item.style.transitionDelay = "";
      }, 1400);
    },
    { margin: "0px 0px -8% 0px" }
  );
}

// ---- Reading-progress line, "How it works" timeline fill, dot-rail colour ----
const bar = document.querySelector<HTMLElement>(".scroll-bar");
const fill = document.querySelector<HTMLElement>(".timeline-fill");
const timeline = document.querySelector<HTMLElement>(".timeline");
const snav = document.getElementById("snav");
const darkZones = Array.from(document.querySelectorAll<HTMLElement>("#hero, .site-footer"));

function onScrollFx() {
  const r = root();
  const max = r.scrollHeight - vh();
  if (bar) bar.style.transform = `scaleX(${max > 0 ? r.scrollTop / max : 0})`;

  if (fill && timeline) {
    const t = timeline.getBoundingClientRect();
    const p = (vh() * 0.7 - t.top) / t.height;
    fill.style.transform = `scaleY(${reduce ? 1 : Math.max(0, Math.min(1, p))})`;
  }

  // The rail turns white while its vertical middle sits over a dark section (hero, footer).
  if (snav) {
    const mid = window.innerHeight / 2;
    const dark = darkZones.some((el) => {
      const z = el.getBoundingClientRect();
      return z.top <= mid && z.bottom >= mid;
    });
    snav.classList.toggle("on-dark", dark);
  }
}

let ticking = false;
const requestFx = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    onScrollFx();
  });
};
window.addEventListener("scroll", requestFx, { passive: true });
window.addEventListener("resize", requestFx);
window.addEventListener("load", onScrollFx);
onScrollFx();

// ---- In-page links glide to their section, then the section "lands" ----
const easeInOutQuint = (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2);
let glide: { stop: () => void } | null = null;
let landTimer = 0;

function land(target: HTMLElement) {
  target.classList.remove("landed");
  void target.offsetWidth;
  target.classList.add("landed");
  window.clearTimeout(landTimer);
  landTimer = window.setTimeout(() => target.classList.remove("landed"), 1400);
}

function glideTo(target: HTMLElement) {
  const r = root();
  const start = r.scrollTop;
  const end = Math.max(0, Math.min(r.scrollHeight - vh(), start + target.getBoundingClientRect().top - HEADER_OFFSET));
  const dist = end - start;
  glide?.stop();
  if (reduce || Math.abs(dist) < 4) {
    r.scrollTop = end;
    land(target);
    return;
  }
  const duration = Math.min(1300, Math.max(650, Math.abs(dist) * 0.35)) / 1000;
  glide = animate(start, end, {
    duration,
    ease: easeInOutQuint,
    onUpdate: (v) => {
      r.scrollTop = v;
    },
    onComplete: () => {
      glide = null;
      land(target);
    },
  });
}

// A new touch or wheel during the glide hands control back to the visitor.
const cancelGlide = () => {
  glide?.stop();
  glide = null;
};
window.addEventListener("wheel", cancelGlide, { passive: true });
window.addEventListener("touchstart", cancelGlide, { passive: true });

document.addEventListener("click", (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute("href")!.slice(1);
  const target = id ? document.getElementById(id) : null;
  if (!target) return;
  e.preventDefault();
  if (SECTION_IDS.includes(id)) {
    setActive(id);
    document.querySelectorAll(".nav-link").forEach((n) => n.classList.remove("clicked"));
    const link = document.querySelector<HTMLElement>(`.nav-link[data-section="${id}"]`);
    if (link) {
      void link.offsetWidth;
      link.classList.add("clicked");
    }
  }
  if (history.replaceState) history.replaceState(null, "", `#${id}`);
  glideTo(target);
});
