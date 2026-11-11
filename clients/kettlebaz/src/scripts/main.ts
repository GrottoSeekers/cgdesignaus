// Kettlebaz page motion. GSAP + ScrollTrigger for the page, Three.js for the
// kettlebell (loaded only when the price section is close). Every effect
// works on touch screens; nothing relies on hover except the magnetic buttons.
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
const masthead = $("[data-masthead]");
const heroPhoto = $("[data-hero-photo]");
const heroImg = $("img", heroPhoto ?? document);

if (!reduce) {
  gsap.set([...reveals, ...heroFades], { autoAlpha: 0, y: 28 });
  gsap.set(cells, { clipPath: "inset(100% 0% 0% 0%)" });
  gsap.set(heroLines, { yPercent: 110 });
}
root.classList.add("motion-ready");

/* ---------- Cover intro ---------- */
function intro() {
  if (reduce) {
    gsap.from([masthead, ".hero-title", ...heroFades], { autoAlpha: 0, duration: 0.6, stagger: 0.08 });
    return;
  }
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  if (masthead) {
    const split = SplitText.create(masthead, { type: "chars", mask: "chars", charsClass: "char" });
    tl.from(split.chars, { yPercent: 105, duration: 1.2, stagger: 0.045 }, 0);
  }
  if (heroPhoto) {
    tl.fromTo(
      heroPhoto,
      { clipPath: "inset(100% 0% 0% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut" },
      0.05
    );
  }
  if (heroImg) tl.from(heroImg, { scale: 1.25, duration: 1.8 }, 0.05);
  tl.to(heroLines, { yPercent: 0, duration: 1.1, stagger: 0.1 }, 0.55);
  tl.to(heroFades, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.1 }, 0.85);

  // Scroll away from the cover: the nameplate lifts, the photo drifts.
  gsap.to(masthead, {
    yPercent: -35,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });
  if (heroImg) {
    gsap.to(heroImg, {
      yPercent: 8,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
  }
}

/* ---------- Nav + phone dock ---------- */
function chrome() {
  const nav = $("[data-nav]");
  const dock = $("[data-dock]");
  if (!nav) return;
  ScrollTrigger.create({
    trigger: ".hero",
    start: "30% top",
    onEnter: () => nav.classList.add("is-solid"),
    onLeaveBack: () => nav.classList.remove("is-solid"),
  });
  if (!dock) return;
  const setDock = (on: boolean) => {
    dock.classList.toggle("is-on", on);
    dock.setAttribute("aria-hidden", String(!on));
    $("a", dock)?.setAttribute("tabindex", on ? "0" : "-1");
    nav.classList.toggle("dock-on", on);
  };
  // On from the end of the cover until the price section, which has its own button.
  ScrollTrigger.create({
    trigger: ".hero",
    start: "bottom 70%",
    endTrigger: ".price",
    end: "top 60%",
    onToggle: (self) => setDock(self.isActive),
  });
}

/* ---------- Story: words light up as you read ---------- */
function story() {
  const el = $("[data-scrub-words]");
  if (!el || reduce) return;
  const split = SplitText.create(el, { type: "words", wordsClass: "word" });
  gsap.fromTo(
    split.words,
    { opacity: 0.16 },
    {
      opacity: 1,
      ease: "none",
      stagger: 0.1,
      scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 50%", scrub: 0.6 },
    }
  );
}

/* ---------- General reveals ---------- */
function revealsIn() {
  if (reduce) return;
  ScrollTrigger.batch(reveals, {
    start: "top 88%",
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.08, overwrite: true }),
  });
}

/* ---------- Plan bento ---------- */
function bento() {
  if (reduce) return;
  ScrollTrigger.batch(cells, {
    start: "top 90%",
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1.1,
        ease: "expo.inOut",
        stagger: 0.12,
      }),
  });
  $$("[data-parallax]").forEach((img) => {
    gsap.fromTo(
      img,
      { yPercent: -6 },
      {
        yPercent: 6,
        ease: "none",
        scrollTrigger: { trigger: img.closest("[data-cell]"), start: "top bottom", end: "bottom top", scrub: true },
      }
    );
  });
}

/* ---------- Workouts: cards rise in, videos play only while on screen ---------- */
function workouts() {
  const cards = $$("[data-wk]");
  if (!reduce) {
    gsap.from(cards, {
      y: 60,
      autoAlpha: 0,
      duration: 1,
      ease: "expo.out",
      stagger: 0.12,
      scrollTrigger: { trigger: "[data-wk-track]", start: "top 85%", once: true },
    });
  }
  const videos = $$<HTMLVideoElement>("video[data-autoplay]");
  if (reduce || !("IntersectionObserver" in window)) return; // posters only
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        const v = e.target as HTMLVideoElement;
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
  videos.forEach((v) => io.observe(v));
}

/* ---------- How it works: a rail fills as you go down the steps ---------- */
function steps() {
  const wrap = $("[data-steps]");
  const rail = $("[data-rail]");
  if (!wrap || !rail) return;
  if (reduce) {
    gsap.set(rail, { scaleY: 1 });
    return;
  }
  gsap.to(rail, {
    scaleY: 1,
    ease: "none",
    scrollTrigger: { trigger: wrap, start: "top 70%", end: "bottom 60%", scrub: 0.4 },
  });
  $$("[data-step]").forEach((step) => {
    gsap.from(step, {
      autoAlpha: 0.2,
      x: 18,
      duration: 0.8,
      ease: "expo.out",
      scrollTrigger: { trigger: step, start: "top 78%", toggleActions: "play none none reverse" },
    });
  });
}

/* ---------- Price: count up, ticks, close glow ---------- */
function price() {
  const num = $("[data-count]");
  if (num && !reduce) {
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
  if (!reduce) {
    gsap.from("[data-tick]", {
      autoAlpha: 0,
      x: -16,
      duration: 0.7,
      ease: "expo.out",
      stagger: 0.08,
      scrollTrigger: { trigger: ".ticks", start: "top 85%", once: true },
    });
    gsap.fromTo(
      "[data-glow]",
      { scale: 0.55, opacity: 0.4 },
      {
        scale: 1.1,
        opacity: 1,
        ease: "none",
        scrollTrigger: { trigger: ".close", start: "top bottom", end: "center center", scrub: true },
      }
    );
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
      xTo((e.clientX - (r.left + r.width / 2)) * 0.25);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
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
        gsap.from(box, {
          autoAlpha: 0,
          scale: 0.85,
          duration: 1.2,
          ease: "expo.out",
          scrollTrigger: { trigger: box, start: "top 85%", once: true },
        });
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
steps();
price();
magnetic();
kettlebell();

// Fonts change line lengths; measure again once they've landed.
document.fonts?.ready.then(() => ScrollTrigger.refresh());
