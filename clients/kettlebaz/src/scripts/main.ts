// Kettlebaz page motion. GSAP + ScrollTrigger for the page, Three.js for the
// kettlebell (loaded only when the price section is close). Every effect
// works on touch screens; only the magnetic buttons need a mouse.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

const root = document.documentElement;
const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) =>
  Array.from(el.querySelectorAll<T>(s));

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ---------- Initial states, then reveal the page ---------- */
const reveals = $$("[data-reveal]");
const cells = $$("[data-cell]");
const heroFades = $$("[data-hero-fade]");
const heroLines = $$(".hero-title .line > span");
const heroPhoto = $("[data-hero-photo]");
const heroImg = heroPhoto ? $("img", heroPhoto) : null;

if (!reduce) {
  gsap.set([...reveals, ...heroFades], { autoAlpha: 0, y: 24 });
  gsap.set(cells, { clipPath: "inset(100% 0% 0% 0%)" });
  gsap.set(heroLines, { yPercent: 110 });
}
root.classList.add("motion-ready");

/* ---------- Hero intro ---------- */
function intro() {
  if (reduce) return;
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.to(heroFades[0], { autoAlpha: 1, y: 0, duration: 0.8 }, 0.1);
  tl.to(heroLines, { yPercent: 0, duration: 1.1, stagger: 0.12 }, 0.2);
  tl.to(heroFades.slice(1), { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.1 }, 0.6);
  if (heroPhoto) {
    tl.fromTo(heroPhoto, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut" }, 0.15);
  }
  if (heroImg) {
    tl.from(heroImg, { scale: 1.2, duration: 1.8 }, 0.15);
    gsap.to(heroImg, {
      yPercent: 8,
      ease: "none",
      scrollTrigger: { trigger: heroPhoto, start: "top top", end: "bottom top", scrub: true },
    });
  }
}

/* ---------- Top nav border + tab bar ---------- */
function chrome() {
  const nav = $("[data-nav]");
  if (nav) {
    ScrollTrigger.create({
      start: 8,
      onEnter: () => nav.classList.add("is-solid"),
      onLeaveBack: () => nav.classList.remove("is-solid"),
    });
  }

  // Highlight the tab for the section on screen.
  const tabs = $$("[data-tab]");
  const setTab = (id: string) => tabs.forEach((t) => t.classList.toggle("is-current", t.dataset.tab === id));
  setTab("top");
  const map: [string, string][] = [
    ["#top", "top"],
    ["#plan", "plan"],
    ["#workouts", "workouts"],
    [".how", "plan"],
    ["#price", "more"],
  ];
  map.forEach(([sel, id]) => {
    ScrollTrigger.create({
      trigger: sel,
      start: "top 55%",
      end: "bottom 55%",
      onToggle: (self) => self.isActive && setTab(id),
    });
  });

  // Links inside the "More" sheet close it before scrolling.
  const sheet = $<HTMLElement & { hidePopover?: () => void }>("#more");
  $$("[data-sheet-link]").forEach((a) => a.addEventListener("click", () => sheet?.hidePopover?.()));
}

/* ---------- Story: words light up as you read ---------- */
function story() {
  const el = $("[data-scrub-words]");
  if (!el || reduce) return;
  const split = SplitText.create(el, { type: "words", wordsClass: "word" });
  gsap.fromTo(
    split.words,
    { opacity: 0.18 },
    { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 50%", scrub: 0.6 } }
  );
}

/* ---------- General reveals ---------- */
function revealsIn() {
  if (reduce) return;
  ScrollTrigger.batch(reveals, {
    start: "top 90%",
    once: true,
    onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.08, overwrite: true }),
  });
}

/* ---------- Plan bento ---------- */
function bento() {
  if (reduce) return;
  ScrollTrigger.batch(cells, {
    start: "top 90%",
    once: true,
    onEnter: (batch) => gsap.to(batch, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "expo.inOut", stagger: 0.12 }),
  });
  $$("[data-parallax]").forEach((img) => {
    gsap.fromTo(
      img,
      { yPercent: -6 },
      { yPercent: 6, ease: "none", scrollTrigger: { trigger: img.closest("[data-cell]"), start: "top bottom", end: "bottom top", scrub: true } }
    );
  });
}

/* ---------- Workouts: cards rise in, videos play only while on screen ---------- */
function workouts() {
  if (!reduce) {
    gsap.from("[data-wk]", {
      y: 60,
      autoAlpha: 0,
      duration: 1,
      ease: "expo.out",
      stagger: 0.12,
      scrollTrigger: { trigger: "[data-wk-track]", start: "top 85%", once: true },
    });
  }
  if (reduce || !("IntersectionObserver" in window)) return; // posters only
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        const v = e.target as HTMLVideoElement;
        if (v.hasAttribute("data-full-on")) {
          if (!e.isIntersecting) v.pause(); // full reel: pause when scrolled away, never auto-start
          return;
        }
        if (e.isIntersecting) {
          if (v.preload !== "auto") v.preload = "auto";
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      });
    },
    { threshold: 0.45 }
  );
  $$<HTMLVideoElement>("video[data-autoplay]").forEach((v) => io.observe(v));
}

/* ---------- Tap play: swap the silent loop for the full reel with sound ---------- */
function players() {
  $$("[data-player]").forEach((box) => {
    const video = $<HTMLVideoElement>("video", box);
    const btn = $("[data-play]", box);
    if (!video || !btn) return;
    btn.addEventListener("click", () => {
      // Only one reel plays with sound at a time.
      $$<HTMLVideoElement>("video[data-full-on]").forEach((v) => v !== video && v.pause());
      if (!video.hasAttribute("data-full-on")) {
        video.setAttribute("data-full-on", "");
        video.src = video.dataset.full || video.currentSrc;
        video.loop = false;
        video.muted = false;
        // No controls: just the video. Tap it to pause; the play button comes back.
        video.addEventListener("click", () => video.pause());
        video.addEventListener("pause", () => box.classList.remove("is-playing"));
        video.addEventListener("play", () => box.classList.add("is-playing"));
      }
      box.classList.add("is-playing");
      video.play().catch(() => box.classList.remove("is-playing"));
    });
  });
}

/* ---------- How it works ---------- */
function steps() {
  const wrap = $("[data-steps]");
  const rail = $("[data-rail]");
  if (!wrap) return;
  if (reduce) {
    if (rail) gsap.set(rail, { scaleY: 1 });
    return;
  }
  if (rail) {
    gsap.to(rail, { scaleY: 1, ease: "none", scrollTrigger: { trigger: wrap, start: "top 70%", end: "bottom 60%", scrub: 0.4 } });
  }
  gsap.from("[data-step]", {
    autoAlpha: 0,
    y: 24,
    duration: 0.8,
    ease: "expo.out",
    stagger: 0.1,
    scrollTrigger: { trigger: wrap, start: "top 80%", once: true },
  });
}

/* ---------- Price count-up, ticks ---------- */
function price() {
  if (reduce) return;
  const num = $("[data-count]");
  if (num) {
    const target = Number(num.dataset.count) || 30;
    const obj = { v: 0 };
    num.textContent = "0";
    gsap.to(obj, {
      v: target,
      duration: 1.4,
      ease: "power3.out",
      onUpdate: () => (num.textContent = String(Math.round(obj.v))),
      scrollTrigger: { trigger: num, start: "top 85%", once: true },
    });
  }
  gsap.from("[data-tick]", {
    autoAlpha: 0,
    x: -16,
    duration: 0.7,
    ease: "expo.out",
    stagger: 0.08,
    scrollTrigger: { trigger: ".ticks", start: "top 85%", once: true },
  });
}

/* ---------- Footer wordmark rises letter by letter ---------- */
function footWord() {
  const el = $("[data-foot-word]");
  if (!el || reduce) return;
  const split = SplitText.create(el, { type: "chars", mask: "chars", charsClass: "char" });
  gsap.from(split.chars, {
    yPercent: 100,
    ease: "none",
    stagger: 0.06,
    scrollTrigger: { trigger: el, start: "top bottom", end: "bottom 85%", scrub: 0.5 },
  });
}

/* ---------- Magnetic buttons (mouse only) ---------- */
function magnetic() {
  if (!finePointer || reduce) return;
  $$("[data-magnetic]").forEach((btn) => {
    const xTo = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3.out" });
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.2);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
    });
    btn.addEventListener("pointerleave", () => {
      xTo(0);
      yTo(0);
    });
  });
}

/* ---------- 3D kettlebell, loaded on approach ---------- */
function kettlebell() {
  const box = $("[data-bell]");
  const canvas = $<HTMLCanvasElement>("[data-bell-canvas]");
  if (!box || !canvas) return;
  let started = false;
  const start = async () => {
    if (started) return;
    started = true;
    try {
      const { createKettlebell } = await import("./kettlebell");
      const bell = createKettlebell(canvas, { reduce });
      if (!bell) {
        box.classList.add("no-webgl");
        return;
      }
      ScrollTrigger.create({
        trigger: ".price",
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => bell.setProgress(self.progress),
      });
      if (!reduce) {
        gsap.from(box, { autoAlpha: 0, scale: 0.85, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: box, start: "top 85%", once: true } });
      }
    } catch {
      box.classList.add("no-webgl");
    }
  };
  if (!("IntersectionObserver" in window)) return void start();
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        start();
      }
    },
    { rootMargin: "900px 0px" }
  );
  io.observe(box);
}

intro();
chrome();
story();
revealsIn();
bento();
workouts();
players();
steps();
price();
footWord();
magnetic();
kettlebell();

// Fonts change line lengths; measure again once they've landed.
document.fonts?.ready.then(() => ScrollTrigger.refresh());
