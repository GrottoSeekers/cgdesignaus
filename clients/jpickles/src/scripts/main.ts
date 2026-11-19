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
  // Solid header background anywhere below the very top. Based on the live scroll
  // position (not a trigger range), so pinned sections can't switch it off.
  if (nav) {
    const solid = () => nav.classList.toggle("is-solid", scrollY > 10);
    solid();
    ScrollTrigger.create({ start: 0, end: "max", onUpdate: solid, onRefresh: solid });
  }

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
  if (!track) return;
  // Always drifting left from page load, never stops or reverses. Scrolling speeds it up
  // for a moment; with Reduce Motion on it drifts more slowly and ignores scrolling.
  const loop = gsap.to(track, { xPercent: -50, ease: "none", duration: reduce ? 70 : 38, repeat: -1 });
  if (reduce) return;
  const settle = gsap.quickTo(loop, "timeScale", { duration: 1.2, ease: "power2.out" });
  ScrollTrigger.create({
    trigger: track,
    start: "top bottom",
    end: "bottom top",
    onUpdate: (self) => {
      const boost = gsap.utils.clamp(1, 5, 1 + Math.abs(self.getVelocity()) / 400);
      loop.timeScale(Math.max(loop.timeScale(), boost));
      settle(1);
    },
  });
}

/* ---------- Story: the 10K time counts down as you scroll ---------- */
const toSecs = (t: string) => { const [m, s] = t.split(":").map(Number); return m * 60 + s; };
const fmt = (n: number) => `${Math.floor(n / 60)}:${String(Math.round(n) % 60).padStart(2, "0")}`;

function story() {
  // No scroll-linked motion here: the time counts down once when it comes into view,
  // and the photos run as a carousel on their own (see storyCarousel).
  const time = $("[data-time]");
  const to = $("[data-count-time]");
  if (reduce || !time || !to) return;
  const obj = { s: toSecs(to.dataset.fromTime!), strike: 0 };
  const paint = () => {
    to.textContent = fmt(obj.s);
    time.style.setProperty("--strike", String(obj.strike));
  };
  paint();
  gsap.to(obj, { s: toSecs(to.dataset.countTime!), strike: 1, duration: 2.2, ease: "power3.inOut", onUpdate: paint, scrollTrigger: { trigger: time, start: "top 80%", once: true } });
}

/* ---------- Story photos: carousel like the MYAH "Who we are" frame ----------
   Cross-fades every 5.5s (soft blur + slow zoom-out), the dots fill as a timer,
   tap a dot to jump, swipe on phones. Pauses when off screen or the tab is hidden. */
function storyCarousel() {
  const frame = $("[data-frame]");
  if (!frame) return;
  const slides = $$<HTMLImageElement>("[data-fslide]", frame);
  const dots = $$<HTMLButtonElement>("[data-fdot]");
  const dotsBox = dots[0]?.parentElement;
  const cap = $("[data-fcap]");
  const MS = 5500;
  let i = 0;
  let timer = 0;
  let visible = false;

  const show = (n: number) => {
    if (n === i) return;
    const old = slides[i];
    old.classList.remove("on");
    old.classList.add("out");
    old.setAttribute("aria-hidden", "true");
    setTimeout(() => old.classList.remove("out"), 1400);
    i = n;
    slides[i].classList.add("on");
    slides[i].removeAttribute("aria-hidden");
    dots.forEach((d, k) => {
      d.classList.remove("on");
      if (k === i) { void d.offsetWidth; d.classList.add("on"); } // restart the fill
    });
    if (cap) {
      cap.classList.add("is-swap");
      setTimeout(() => { cap.textContent = slides[i].dataset.cap || ""; cap.classList.remove("is-swap"); }, 350);
    }
  };
  const next = (step = 1) => show((i + step + slides.length) % slides.length);
  const run = () => {
    clearInterval(timer);
    dotsBox?.classList.toggle("is-paused", !visible);
    if (visible && !document.hidden && slides.length > 1) timer = window.setInterval(() => next(), MS);
  };
  const restartFill = () => { const d = dots[i]; d.classList.remove("on"); void d.offsetWidth; d.classList.add("on"); };

  dots.forEach((d) => d.addEventListener("click", () => { show(Number(d.dataset.fdot)); run(); }));

  // Swipe left/right on touch screens.
  let sx: number | null = null;
  frame.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
  frame.addEventListener("touchend", (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    sx = null;
    if (Math.abs(dx) > 40) { next(dx < 0 ? 1 : -1); run(); }
  });

  // Only tick while the carousel is on screen.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => {
      const was = visible;
      visible = e.isIntersecting;
      if (visible && !was) restartFill();
      run();
    }, { threshold: 0.25 }).observe(frame);
  } else { visible = true; run(); }
  document.addEventListener("visibilitychange", run);

  // First photo eases in once (zoom-out from 1.12) when the page has painted.
  const first = slides[0];
  first.classList.remove("on");
  requestAnimationFrame(() => requestAnimationFrame(() => first.classList.add("on")));
  frame.style.setProperty("--frame-ms", `${MS}ms`);
  dotsBox?.style.setProperty("--frame-ms", `${MS}ms`);
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
    // Footer: the logo is revealed by a soft-edged sweep (left to right, like the runner's
    // trails) while it settles from a slight blur; then the gold hairline draws out from
    // the centre and the three columns rise in. One calm sequence, about 3 seconds.
    const img = $("img", foot)!;
    const rule = $("[data-foot-rule]");
    const cols = $$("[data-foot-col]");
    const sweep = "linear-gradient(90deg, #000 40%, transparent 60%)";
    gsap.set(img, { webkitMaskImage: sweep, maskImage: sweep, webkitMaskSize: "250% 100%", maskSize: "250% 100%",
      webkitMaskPosition: "100% 0", maskPosition: "100% 0", webkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
      filter: "blur(6px)", y: 18, autoAlpha: 0.4 });
    if (rule) gsap.set(rule, { scaleX: 0 });
    gsap.set(cols, { autoAlpha: 0, y: 20 });
    gsap.timeline({ scrollTrigger: { trigger: foot, start: "top 85%", once: true } })
      .to(img, { webkitMaskPosition: "0% 0", maskPosition: "0% 0", duration: 2.4, ease: "power2.inOut" }, 0)
      .to(img, { filter: "blur(0px)", y: 0, autoAlpha: 1, duration: 1.8, ease: "power3.out" }, 0.2)
      .to(rule, { scaleX: 1, duration: 1.4, ease: "expo.inOut" }, 1.2)
      .to(cols, { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.12 }, 1.7)
      .set(img, { clearProps: "maskImage,webkitMaskImage,filter" });
  }
}

/* ---------- FAQ: one answer open at a time, smooth open/close, and the list keeps a
   fixed height (room for the longest answer) so nothing below it ever moves. ---------- */
function faq() {
  const list = $("[data-faq]");
  if (!list) return;
  const items = $$<HTMLDetailsElement>("details", list);

  const reserve = () => {
    const was = items.find((d) => d.open);
    list.style.minHeight = "";
    let max = 0;
    items.forEach((d) => {
      items.forEach((x) => (x.open = x === d));
      max = Math.max(max, list.offsetHeight);
    });
    items.forEach((x) => (x.open = x === was));
    list.style.minHeight = `${max}px`;
    ScrollTrigger.refresh();
  };

  const close = (d: HTMLDetailsElement) => {
    const a = $(".faq-a", d)!;
    if (reduce) { d.open = false; return; }
    gsap.fromTo(a, { height: a.offsetHeight }, { height: 0, duration: 0.45, ease: "power3.inOut", onComplete: () => { d.open = false; gsap.set(a, { clearProps: "height" }); } });
  };
  const open = (d: HTMLDetailsElement) => {
    d.open = true;
    if (reduce) return;
    const a = $(".faq-a", d)!;
    gsap.fromTo(a, { height: 0 }, { height: "auto", duration: 0.55, ease: "power3.out", clearProps: "height" });
    gsap.fromTo($("p", a), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.1, ease: "power2.out" });
  };

  items.forEach((d) => {
    $("summary", d)!.addEventListener("click", (e) => {
      e.preventDefault();
      if (d.open) close(d);
      else {
        items.forEach((x) => x !== d && x.open && close(x));
        open(d);
      }
    });
  });

  reserve();
  document.fonts?.ready.then(reserve);
  let t = 0;
  addEventListener("resize", () => { clearTimeout(t); t = window.setTimeout(reserve, 200); });
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
      // Runs all the time while the hero is on screen (from page load, no scroll needed);
      // only pauses when scrolled fully out of view or the tab is hidden, to save battery.
      fx.play();
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(([e]) => (e.isIntersecting ? fx.play() : fx.pause())).observe(canvas);
      }
      // Steady speed: scrolling doesn't change it.
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
storyCarousel();
rail();
tabs();
reels();
revealsIn();
magnetic();
faq();
planHover();
lines();
document.fonts?.ready.then(() => ScrollTrigger.refresh());
