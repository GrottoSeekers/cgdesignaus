// J.Pickles landing page motion. GSAP + ScrollTrigger + SplitText; Three.js speed lines
// in the hero are loaded after first paint. Everything works on touch screens; only the
// magnetic buttons need a mouse. Reduce Motion shows the page without animation.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { offer, event } from "../lib/site";

gsap.registerPlugin(ScrollTrigger, SplitText);

const root = document.documentElement;
const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => Array.from(el.querySelectorAll<T>(s));
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const mm = gsap.matchMedia();

/* ---------- Offer and event expiry (the build may be older than today) ---------- */
function expiry() {
  const now = Date.now();
  if (now >= Date.parse(offer.ends)) {
    $$("[data-offer-only]").forEach((el) => el.remove());
    $$("[data-offer-off]").forEach((el) => (el.hidden = false));
    $("[data-prices]")?.classList.remove("has-offer");
  }
  if (now >= Date.parse(event.ends)) $$("[data-event]").forEach((el) => el.remove());
}

/* ---------- Initial states ---------- */
const reveals = $$("[data-reveal]");
const heroFades = $$("[data-hero-fade]").filter((el) => !el.hidden);
const heroLines = $$(".hero-title .line > span");
const heroPhoto = $("[data-hero-photo]");
const heroImg = heroPhoto ? $("img", heroPhoto) : null;

if (!reduce) {
  gsap.set([...reveals, ...heroFades], { autoAlpha: 0, y: 26 });
  gsap.set(heroLines, { yPercent: 112 });
}
root.classList.add("motion-ready");

/* ---------- Hero intro ---------- */
function intro() {
  if (reduce) return;
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  if (heroPhoto) tl.fromTo(heroPhoto, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut" }, 0);
  if (heroImg) tl.from(heroImg, { scale: 1.25, duration: 2 }, 0);
  tl.to(heroFades[0], { autoAlpha: 1, y: 0, duration: 0.9 }, 0.25);
  tl.to(heroLines, { yPercent: 0, duration: 1.2, stagger: 0.12 }, 0.3);
  tl.to(heroFades.slice(1), { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1 }, 0.75);
  if (heroImg) {
    gsap.to(heroImg, { yPercent: 9, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  }
}

/* ---------- Nav, tab bar, sheet ---------- */
function chrome() {
  const nav = $("[data-nav]");
  if (nav) ScrollTrigger.create({ start: 10, onToggle: (s) => nav.classList.toggle("is-solid", s.isActive) });

  const tabs = $$("[data-tab]");
  const setTab = (id: string) => tabs.forEach((t) => t.classList.toggle("is-current", t.dataset.tab === id));
  setTab("top");
  ([["#top", "top"], ["#story", "top"], ["#how", "top"], ["#prices", "prices"], ["#results", "more"], ["#coach", "more"], ["#faq", "more"]] as const).forEach(([sel, id]) => {
    if (!$(sel)) return;
    ScrollTrigger.create({ trigger: sel, start: "top 55%", end: "bottom 55%", onToggle: (s) => s.isActive && setTab(id) });
  });
  const sheet = $<HTMLElement & { hidePopover?: () => void }>("#more");
  $$("[data-sheet-link]").forEach((a) => a.addEventListener("click", () => sheet?.hidePopover?.()));
}

/* ---------- Goals marquee: drifts left, scroll speed pushes it ---------- */
function marquee() {
  const track = $("[data-marquee]");
  if (!track || reduce) return;
  const loop = gsap.to(track, { xPercent: -50, ease: "none", duration: 38, repeat: -1 });
  let dir = 1;
  ScrollTrigger.create({
    trigger: track,
    start: "top bottom",
    end: "bottom top",
    onUpdate: (self) => {
      const v = self.getVelocity();
      dir = self.direction;
      const boost = gsap.utils.clamp(1, 6, 1 + Math.abs(v) / 400);
      gsap.to(loop, { timeScale: boost * dir, duration: 0.2, overwrite: true });
      gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.2, ease: "power2.out" });
    },
  });
}

/* ---------- Story: the 10K time counts down as you scroll ---------- */
const toSecs = (t: string) => { const [m, s] = t.split(":").map(Number); return m * 60 + s; };
const fmt = (n: number) => `${Math.floor(n / 60)}:${String(Math.round(n) % 60).padStart(2, "0")}`;

function story() {
  const time = $("[data-time]");
  const to = $("[data-count-time]");
  const words = $("[data-scrub-words]");
  if (reduce || !time || !to || !words) return;
  const from = toSecs(to.dataset.fromTime!);
  const target = toSecs(to.dataset.countTime!);
  const obj = { s: from, strike: 0 };
  const paint = () => {
    to.textContent = fmt(obj.s);
    time.style.setProperty("--strike", String(obj.strike));
  };
  paint();
  const split = SplitText.create(words, { type: "words", wordsClass: "word" });
  // The caption and signature fade in with the story, not with the page-wide reveals.
  const extras = $$("[data-reveal]", $("#story")!);
  gsap.set(extras, { autoAlpha: 1, y: 0 });
  extras.forEach((el) => el.removeAttribute("data-reveal"));

  // Desktop: pin the whole story. The time counts down, the words light up and the
  // text drifts up while each photo wipes in over the last, always fully in view.
  mm.add("(min-width: 900px) and (min-height: 600px)", () => {
    const items = $$("[data-stack-item]");
    const copy = time.parentElement!;
    gsap.set(items.slice(1), { clipPath: "inset(100% 0% 0% 0%)" });
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: "#story", start: "top top", end: () => `+=${innerHeight * 1.5}`, pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true },
    });
    tl.to(obj, { s: target, strike: 1, duration: 0.8, onUpdate: paint }, 0);
    tl.fromTo(split.words, { opacity: 0.16 }, { opacity: 1, stagger: 0.04, duration: 0.3 }, 0.2);
    tl.fromTo(copy, { y: 24 }, { y: -24, duration: 3 }, 0);
    items.slice(1).forEach((el, i) => {
      const at = 0.35 + i * 0.85;
      tl.to(el, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7 }, at);
      tl.fromTo($("img", el), { scale: 1.15 }, { scale: 1, duration: 0.7 }, at);
    });
  });

  // Phones and short screens: no pin; the time and words follow the scroll.
  mm.add("(max-width: 899px), (max-height: 599px)", () => {
    gsap.to(obj, { s: target, strike: 1, ease: "none", onUpdate: paint, scrollTrigger: { trigger: time, start: "top 85%", end: "top 35%", scrub: 0.5 } });
    gsap.fromTo(split.words, { opacity: 0.16 }, { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: words, start: "top 80%", end: "bottom 55%", scrub: 0.6 } });
  });
}

/* ---------- Method rail ---------- */
function rail() {
  const wrap = $("[data-rail]");
  const fill = $("[data-rail-fill]");
  const stepsEls = $$("[data-rail-step]");
  if (!wrap || !fill) return;
  if (reduce) {
    gsap.set(fill, { scale: 1 });
    stepsEls.forEach((s) => s.classList.add("is-on"));
    return;
  }
  mm.add({ desk: "(min-width: 900px)", phone: "(max-width: 899px)" }, (ctx) => {
    const desk = ctx.conditions!.desk;
    gsap.fromTo(fill, desk ? { scaleX: 0, scaleY: 1 } : { scaleY: 0, scaleX: 1 }, {
      [desk ? "scaleX" : "scaleY"]: 1,
      ease: "none",
      scrollTrigger: {
        trigger: wrap,
        start: desk ? "top 75%" : "top 70%",
        end: desk ? "bottom 55%" : "bottom 60%",
        scrub: 0.4,
        onUpdate: (self) => {
          const lit = Math.floor(self.progress * stepsEls.length + 0.15);
          stepsEls.forEach((s, i) => s.classList.toggle("is-on", i < lit));
        },
      },
    });
  });
  gsap.from(stepsEls, { autoAlpha: 0, y: 30, duration: 0.9, ease: "expo.out", stagger: 0.12, scrollTrigger: { trigger: wrap, start: "top 80%", once: true } });
}

/* ---------- Price tabs ---------- */
function tabs() {
  const box = $("[data-tabs]");
  if (!box) return;
  const btns = $$<HTMLButtonElement>("[role=tab]", box);
  const pill = $("[data-tabs-pill]", box)!;
  const place = (b: HTMLElement) => {
    pill.style.width = `${b.offsetWidth}px`;
    pill.style.transform = `translateX(${b.offsetLeft - 4}px)`;
  };
  const select = (b: HTMLButtonElement, focus = false) => {
    btns.forEach((x) => {
      const on = x === b;
      x.setAttribute("aria-selected", String(on));
      x.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(x.getAttribute("aria-controls")!)!;
      panel.hidden = !on;
    });
    const kind = b.id === "tab-pt" ? "pt" : "online";
    $$("[data-prices-foot]").forEach((f) => (f.hidden = f.dataset.pricesFoot !== kind));
    place(b);
    if (focus) b.focus();
    const panel = document.getElementById(b.getAttribute("aria-controls")!)!;
    panel.scrollLeft = 0;
    if (!reduce) gsap.fromTo($$("[data-plan]", panel), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "expo.out", stagger: 0.06, overwrite: true });
    ScrollTrigger.refresh();
  };
  btns.forEach((b, i) => {
    b.addEventListener("click", () => select(b));
    b.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      select(btns[(i + (e.key === "ArrowRight" ? 1 : btns.length - 1)) % btns.length], true);
    });
  });
  place(btns[0]);
  document.fonts?.ready.then(() => place(btns.find((b) => b.getAttribute("aria-selected") === "true")!));
  addEventListener("resize", () => place(btns.find((b) => b.getAttribute("aria-selected") === "true")!));

  if (!reduce) {
    gsap.from($$("[data-plan]", $("#plans-online")!), { autoAlpha: 0, y: 40, duration: 1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: "#plans-online", start: "top 85%", once: true } });
  }
}

/* ---------- Reels: play only while on screen ---------- */
function reels() {
  const vids = $$<HTMLVideoElement>("video[data-autoplay]");
  if (!reduce) {
    // One fade-in, then the reels sit still (no scroll-linked movement).
    gsap.from("[data-reel]", { autoAlpha: 0, duration: 0.9, ease: "power2.out", stagger: 0.08, scrollTrigger: { trigger: "[data-reels]", start: "top 85%", once: true } });
  }
  if (reduce || !("IntersectionObserver" in window)) return; // posters only
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      const v = e.target as HTMLVideoElement;
      if (e.isIntersecting && e.intersectionRatio >= 0.4) {
        if (v.preload !== "auto") v.preload = "auto";
        v.play().catch(() => {});
      } else v.pause();
    }),
    { threshold: [0, 0.4] }
  );
  vids.forEach((v) => io.observe(v));
  document.addEventListener("visibilitychange", () => document.hidden && vids.forEach((v) => v.pause()));
}

/* ---------- General reveals, parallax, close, footer ---------- */
function revealsIn() {
  if (reduce) return;
  ScrollTrigger.batch(reveals, {
    start: "top 90%",
    once: true,
    onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.08, overwrite: true }),
  });
  $$("[data-parallax]").forEach((img) => {
    gsap.fromTo(img, { yPercent: -5, scale: 1.1 }, { yPercent: 5, scale: 1.1, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
  });
  const closeImg = $("[data-close-img]");
  if (closeImg) gsap.fromTo(closeImg, { yPercent: -10 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".close", start: "top bottom", end: "bottom bottom", scrub: true } });
  const foot = $("[data-foot-logo]");
  if (foot) {
    // Footer logo builds in three slow beats: the runner sprints in from the left,
    // J.PICKLES rises up, then the COACHING line opens out from the centre.
    const [runner, name, sub] = ["runner", "name", "sub"].map((p) => $(`[data-logo-part="${p}"]`, foot));
    gsap.set(runner, { clipPath: "inset(0% 100% 44% 0%)", x: -60 });
    gsap.set(name, { clipPath: "inset(86% 0% 14% 0%)", y: 40 });
    gsap.set(sub, { clipPath: "inset(86% 50% 0% 50%)" });
    gsap.timeline({ scrollTrigger: { trigger: foot, start: "top 88%", once: true } })
      .to(runner, { clipPath: "inset(0% 0% 44% 0%)", x: 0, duration: 2.2, ease: "power3.out" })
      .to(name, { clipPath: "inset(56% 0% 14% 0%)", y: 0, duration: 1.8, ease: "expo.out" }, 0.9)
      .to(sub, { clipPath: "inset(86% 0% 0% 0%)", duration: 1.8, ease: "expo.inOut" }, 1.7);
  }
}

/* ---------- Magnetic buttons (mouse only) ---------- */
function magnetic() {
  if (!finePointer || reduce) return;
  $$("[data-magnetic]").forEach((btn) => {
    const xTo = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3.out" });
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.22);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.32);
    });
    btn.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
  });
}

/* ---------- Price cards: spotlight follows the cursor, card lifts and tilts (mouse only) ---------- */
function planHover() {
  if (!finePointer) return;
  $$("[data-plan]").forEach((card) => {
    const rx = reduce ? null : gsap.quickTo(card, "rotationX", { duration: 0.6, ease: "power3.out" });
    const ry = reduce ? null : gsap.quickTo(card, "rotationY", { duration: 0.6, ease: "power3.out" });
    const lift = reduce ? null : gsap.quickTo(card, "y", { duration: 0.6, ease: "power3.out" });
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", `${px * 100}%`);
      card.style.setProperty("--my", `${py * 100}%`);
      rx?.((0.5 - py) * 6);
      ry?.((px - 0.5) * 8);
      lift?.(-8);
    });
    card.addEventListener("pointerleave", () => { rx?.(0); ry?.(0); lift?.(0); });
  });
}

/* ---------- Three.js speed lines behind the hero ---------- */
function lines() {
  const canvas = $<HTMLCanvasElement>("[data-lines]");
  if (!canvas) return;
  const start = async () => {
    try {
      const { createSpeedLines } = await import("./speedlines");
      const fx = createSpeedLines(canvas, { reduce });
      if (!fx) return;
      ScrollTrigger.create({
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        onToggle: (s) => (s.isActive ? fx.play() : fx.pause()),
        onUpdate: (s) => fx.setBoost(Math.min(4, Math.abs(s.getVelocity()) / 600)),
      });
      if (!reduce) gsap.from(canvas, { autoAlpha: 0, duration: 1.6, ease: "power2.out" });
    } catch {
      /* no WebGL: the hero still looks right without it */
    }
  };
  // Wait for first paint so the hero photo wins the race (LCP).
  if ("requestIdleCallback" in window) (window as any).requestIdleCallback(start, { timeout: 1500 });
  else setTimeout(start, 600);
}

expiry();
intro();
chrome();
marquee();
story();
rail();
tabs();
reels();
revealsIn();
magnetic();
planHover();
lines();
document.fonts?.ready.then(() => ScrollTrigger.refresh());
