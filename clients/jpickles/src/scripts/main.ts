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
// James wants the full animated experience on every phone, including iPhones with
// "Reduce Motion" switched on (which used to turn most of it off). So animations always run.
const reduce = false;
// Pause button (footer): stops the motion that loops on its own (marquee, speed lines,
// reels, story autoplay). Everything runs by default; the choice is remembered on this device.
let motionPaused = (() => { try { return localStorage.getItem("jp-motion") === "paused"; } catch { return false; } })();
const motionHooks: ((paused: boolean) => void)[] = [];
const onMotion = (fn: (paused: boolean) => void) => { motionHooks.push(fn); fn(motionPaused); };
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
/** Resolves once an image is downloaded and decoded (or after `maxMs`, or on error). */
function imageReady(img: HTMLImageElement, maxMs = 4000) {
  const done = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve());
  const loaded = img.complete && img.naturalWidth
    ? done()
    : new Promise<void>((res) => {
        img.addEventListener("load", () => done().then(() => res()), { once: true });
        img.addEventListener("error", () => res(), { once: true });
      });
  return Promise.race([loaded, new Promise((res) => setTimeout(res, maxMs))]);
}

function intro() {
  if (reduce) return;
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  // The photo's wipe only starts once the photo is fully downloaded and decoded, so it
  // never wipes in half-drawn (gives up waiting after 2.5s).
  if (heroPhoto && heroImg) {
    gsap.set(heroPhoto, { clipPath: "inset(100% 0% 0% 0%)" });
    gsap.set(heroImg, { scale: 1.25 });
    imageReady(heroImg as HTMLImageElement, 2500).then(() => {
      gsap.to(heroPhoto, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut" });
      gsap.to(heroImg, { scale: 1, duration: 2, ease: "expo.out" });
    });
  }
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

  // Three-line menu (phones): fades up full screen, links slide in one after another.
  const burger = $<HTMLButtonElement>("[data-burger]");
  const menu = $("[data-menu]");
  if (!burger || !menu) return;
  const links = $$<HTMLAnchorElement>("[data-menu-link]", menu);
  const texts = links.map((a) => $(".ml-text", a)!);
  const notes = links.map((a) => $(".ml-note", a)!);
  const rules = links.map((a) => $(".ml-rule", a)!);
  const extras = $$("[data-menu-item]", menu);
  const bg = $("[data-menu-bg]", menu);
  let open = false;
  let tl: gsap.core.Timeline | null = null;

  // The section you're currently looking at is shown in gold italic in the menu.
  const markCurrent = () => {
    let current = "";
    links.forEach((a) => {
      const sec = document.querySelector(a.getAttribute("href")!);
      if (sec && sec.getBoundingClientRect().top < innerHeight * 0.45) current = a.getAttribute("href")!;
    });
    links.forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === current));
  };

  const set = (on: boolean, jumpTo?: string) => {
    if (on === open) return;
    open = on;
    burger.setAttribute("aria-expanded", String(on));
    burger.setAttribute("aria-label", on ? "Close menu" : "Open menu");
    tl?.kill();
    if (on) {
      markCurrent();
      menu.hidden = false;
      root.classList.add("menu-open");
      // Open: backdrop fades, photo drifts in, each word rises out of its own mask,
      // the dividing lines draw left to right, then the buttons settle.
      tl = gsap.timeline({ defaults: { ease: "expo.out" } })
        .fromTo(menu, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: "power2.out" }, 0)
        .fromTo(bg, { scale: 1.12, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.6, ease: "power3.out" }, 0)
        .fromTo(texts, { yPercent: 115 }, { yPercent: 0, duration: 0.9, stagger: 0.06 }, 0.08)
        .fromTo(rules, { scaleX: 0 }, { scaleX: 1, duration: 1, stagger: 0.06, ease: "expo.inOut" }, 0.1)
        .fromTo(notes, { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 0.6, stagger: 0.06 }, 0.35)
        .fromTo(extras, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.08 }, 0.4);
    } else {
      // Close: words drop back behind their masks, then the screen fades.
      tl = gsap.timeline({
        onComplete: () => {
          menu.hidden = true;
          root.classList.remove("menu-open");
          if (jumpTo) document.querySelector(jumpTo)?.scrollIntoView({ behavior: "smooth" });
        },
      })
        .to([...extras, ...notes], { autoAlpha: 0, duration: 0.2, ease: "power2.in" }, 0)
        .to(texts, { yPercent: -110, duration: 0.35, stagger: 0.03, ease: "power3.in" }, 0)
        .to(menu, { autoAlpha: 0, duration: 0.3, ease: "power2.in" }, 0.22);
    }
  };
  burger.addEventListener("click", () => set(!open));
  $$<HTMLAnchorElement>("[data-menu-link]", menu).forEach((a) =>
    a.addEventListener("click", (e) => { e.preventDefault(); set(false, a.getAttribute("href")!); })
  );
  addEventListener("keydown", (e) => e.key === "Escape" && set(false));
  matchMedia("(min-width: 960px)").addEventListener("change", (e) => e.matches && set(false));
}

/* ---------- Goals marquee: drifts left, scroll speed pushes it ---------- */
function marquee() {
  const track = $("[data-marquee]");
  if (!track) return;
  // Always drifting left from page load, never stops or reverses. Scrolling speeds it up
  // for a moment; with Reduce Motion on it drifts more slowly and ignores scrolling.
  const loop = gsap.to(track, { xPercent: -50, ease: "none", duration: reduce ? 70 : 38, repeat: -1 });
  onMotion((p) => (p ? loop.pause() : loop.play()));
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

  // Only swap to a photo once it's fully loaded, so a slide can't fade in half-drawn.
  let pending = -1;
  const show = (n: number) => {
    if (n === i || n === pending) return;
    pending = n;
    imageReady(slides[n], 3000).then(() => { if (pending === n) { pending = -1; swap(n); } });
  };
  const swap = (n: number) => {
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
    if (visible && !motionPaused && !document.hidden && slides.length > 1) timer = window.setInterval(() => next(), MS);
  };
  const restartFill = () => { const d = dots[i]; d.classList.remove("on"); void d.offsetWidth; d.classList.add("on"); };

  dots.forEach((d) => d.addEventListener("click", () => { show(Number(d.dataset.fdot)); run(); }));
  motionHooks.push(() => run());

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
        start: desk ? "top 75%" : "top 80%",
        end: desk ? "bottom 55%" : "bottom 45%",
        scrub: 0.4,
        onUpdate: (self) => {
          const n = stepsEls.length;
          const lit = Math.floor(self.progress * n + 0.15);
          stepsEls.forEach((s, i) => {
            s.classList.toggle("is-on", i < lit);
            // Phones (2x2 grid): each step has its own gold line that fills in turn.
            s.style.setProperty("--fill", String(Math.min(1, Math.max(0, self.progress * n - i))));
          });
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
  // Phones: no dragging. Each package list gets a row of chips (Bronze, Silver...) above it;
  // one card shows at a time and tapping a chip fades the next one in. The chip row follows
  // its list's hidden state, so switching Online / 1:1 PT swaps the chips too.
  $$("[data-plans]").forEach((panel) => {
    const cards = $$("[data-plan]", panel);
    const pick = document.createElement("div");
    pick.className = "plan-pick";
    pick.setAttribute("role", "group");
    pick.setAttribute("aria-label", "Choose a package");
    const start = Math.max(0, cards.findIndex((c) => c.classList.contains("is-featured")));
    const chips = cards.map((c, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = $(".plan-name", c)?.textContent?.trim() || `Plan ${i + 1}`;
      b.setAttribute("aria-pressed", String(i === start));
      b.addEventListener("click", () => show(i));
      pick.append(b);
      return b;
    });
    const show = (n: number) => {
      cards.forEach((c, i) => c.classList.toggle("is-active", i === n));
      chips.forEach((b, i) => b.setAttribute("aria-pressed", String(i === n)));
      gsap.fromTo(cards[n], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.55, ease: "expo.out", overwrite: true });
    };
    cards.forEach((c, i) => c.classList.toggle("is-active", i === start));
    pick.hidden = panel.hidden;
    new MutationObserver(() => (pick.hidden = panel.hidden)).observe(panel, { attributes: true, attributeFilter: ["hidden"] });
    panel.before(pick);
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
  const inView = new Set<HTMLVideoElement>();
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      const v = e.target as HTMLVideoElement;
      const on = e.isIntersecting && e.intersectionRatio >= 0.4;
      inView[on ? "add" : "delete"](v);
      if (on && !motionPaused) {
        if (v.preload !== "auto") v.preload = "auto";
        v.play().catch(() => {});
      } else v.pause();
    }),
    { threshold: [0, 0.4] }
  );
  vids.forEach((v) => io.observe(v));
  motionHooks.push((p) => vids.forEach((v) => (p || !inView.has(v) ? v.pause() : v.play().catch(() => {}))));
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
      let seen = true;
      const sync = () => (seen && !motionPaused ? fx.play() : fx.pause());
      sync();
      motionHooks.push(sync);
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(([e]) => { seen = e.isIntersecting; sync(); }).observe(canvas);
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

// Before/after card: Front / Side switch (tap, no dragging). The gold pill slides to the choice.
function results() {
  $$("[data-result]").forEach((card) => {
    const btns = $$<HTMLButtonElement>("[data-show]", card);
    const pill = $(".result-switch-pill", card);
    const place = (b: HTMLElement) => {
      if (!pill) return;
      pill.style.width = `${b.offsetWidth}px`;
      pill.style.transform = `translateX(${b.offsetLeft}px)`;
    };
    const select = (b: HTMLButtonElement) => {
      card.dataset.view = b.dataset.show!;
      btns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      place(b);
    };
    btns.forEach((b) => b.addEventListener("click", () => select(b)));
    const current = () => btns.find((b) => b.getAttribute("aria-pressed") === "true") ?? btns[0];
    place(current());
    document.fonts?.ready.then(() => place(current()));
    addEventListener("resize", () => place(current()));
  });
}

function motionToggle() {
  $$<HTMLButtonElement>("[data-motion]").forEach((b) => {
    const paint = () => {
      b.setAttribute("aria-pressed", String(motionPaused));
      b.textContent = motionPaused ? "Play animations" : "Pause animations";
    };
    paint();
    b.addEventListener("click", () => {
      motionPaused = !motionPaused;
      try { localStorage.setItem("jp-motion", motionPaused ? "paused" : "on"); } catch { /* private mode */ }
      motionHooks.forEach((fn) => fn(motionPaused));
      paint();
    });
  });
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
results();
motionToggle();
planHover();
lines();
document.fonts?.ready.then(() => ScrollTrigger.refresh());
