// Page motion. Two libraries, each doing what it's best at:
//  - Anime.js: the choreographed pieces. Hero timeline (headline split into
//    words, highlight bar), section headings rising word by word, number
//    counters, the outcome numbers, the guarantee seal, price scramble and the
//    tick marks drawing in.
//  - Motion: everything driven by the browser. Scroll reveals (inView +
//    springs), the story line, glows, the ticker and review-wall marquees,
//    spring hover/press, card tilt, the magnetic hero button, FAQ, the
//    hide-on-scroll top bar and the phone sticky CTA.
//
// Phones get the same page as laptops. Where an effect needs a mouse (hover
// lift, tilt, magnetic pull, slowing the review wall) touch gets its own
// version: cards tilt up as they scroll in, taps squash and spring back, a
// finger on the review wall slows it down.
//
// Reveals are triggered by IntersectionObserver (Motion's inView), not by
// scroll position, so they also play when the page sits inside a preview frame.
// Only transform and opacity animate. Under Reduce Motion things fade in
// place instead of moving, and nothing loops.
import {
  animate as anime,
  createTimeline,
  createDrawable,
  scrambleText,
  splitText,
  stagger as animeStagger,
  utils,
} from "animejs";
import { animate, hover, inView, press, scroll } from "motion";

declare global {
  interface Window {
    __bwReady?: boolean;
  }
}

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const SPRING = { type: "spring" as const, stiffness: 380, damping: 22, mass: 1 };
// Under Reduce Motion, distances collapse to 0 so every entrance is a plain fade.
const d = (px: number) => (reduce ? 0 : px);
const $ = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = document) => scope.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = document) =>
  Array.from(scope.querySelectorAll<T>(sel));
// Fire a little before the element is fully on screen, so phones never wait on a blank gap.
const SOON = { amount: 0, margin: "0px 0px -12% 0px" } as const;

window.__bwReady = true;

// ---------------------------------------------------------------------------
// Videos (VSL + client videos): click-to-load so the page stays fast until
// someone presses play.
// ---------------------------------------------------------------------------
$$("[data-video]").forEach((frame) => {
  const btn = $<HTMLButtonElement>("button", frame);
  if (!btn) return;
  const { video: type, embed, src } = frame.dataset;
  if (type === "none") {
    btn.setAttribute("aria-disabled", "true");
    return;
  }
  btn.addEventListener("click", () => {
    if (type === "youtube" || type === "vimeo") {
      const iframe = document.createElement("iframe");
      iframe.src = embed || "";
      iframe.title = "Broghan's video";
      iframe.allow = "autoplay; fullscreen; picture-in-picture; encrypted-media";
      iframe.allowFullscreen = true;
      frame.append(iframe);
    } else if (type === "mp4" && src) {
      const video = document.createElement("video");
      video.src = src;
      video.controls = true;
      video.playsInline = true;
      video.autoplay = true;
      frame.append(video);
      video.focus();
    }
    frame.classList.add("playing");
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const countUp = (el: HTMLElement) => {
  const to = Number(el.dataset.count);
  if (!to) return;
  const state = { v: 0 };
  anime(state, {
    v: to,
    duration: reduce ? 900 : 1600,
    ease: "outExpo",
    modifier: utils.round(0),
    onUpdate: () => {
      el.textContent = state.v.toLocaleString();
    },
  });
};

// Split a heading into words held in clipped lines. Returns the words.
const splitWords = (el: HTMLElement) => {
  const words = splitText(el, { words: { wrap: "clip" } }).words as HTMLElement[];
  utils.set(words, reduce ? { opacity: 0 } : { y: "105%" });
  el.classList.add("split");
  return words;
};
const wordsIn = (words: HTMLElement[]) =>
  reduce
    ? { opacity: [0, 1], duration: 600, delay: animeStagger(30) }
    : { y: ["105%", "0%"], duration: 1000, delay: animeStagger(words.length > 8 ? 35 : 50) };

// ---------------------------------------------------------------------------
// Hero: Anime.js timeline.
// ---------------------------------------------------------------------------
const headline = $("[data-hero='headline']");
const heroWords = headline ? splitWords(headline) : [];
const tl = createTimeline({ defaults: { ease: "outExpo", duration: 900 } });
tl.add(".topbar-inner", { opacity: [0, 1], y: [d(-16), 0], duration: 700 }, 0)
  .add("[data-hero='proof']", { opacity: [0, 1], y: [d(16), 0], duration: 700 }, 60)
  .add("[data-hero='eyebrow']", { opacity: [0, 1], y: [d(12), 0], duration: 700 }, 120)
  .add(heroWords, { ...wordsIn(heroWords), ease: "outExpo" }, 180)
  .add(".hl-bar", { scaleX: [0, 1], duration: reduce ? 1 : 700, ease: "inOutQuart" }, "-=450")
  .add("[data-hero='uppercut']", { opacity: [0, 1], y: [d(18), 0], delay: animeStagger(90) }, "-=700")
  .add("[data-hero='vsl']", { opacity: [0, 1], y: [d(40), 0], scale: [reduce ? 1 : 0.96, 1], duration: 1100 }, "-=700")
  .add("[data-hero='cta']", { opacity: [0, 1], y: [d(16), 0] }, "-=800")
  .call(() => {
    const badge = $(".proof .count");
    if (badge) countUp(badge);
  }, 300);

// ---- Section headings rise word by word when they arrive ----
$$("[data-split]").forEach((h) => {
  const w = splitWords(h);
  inView(h, () => void anime(w, { ...wordsIn(w), ease: "outExpo" }), SOON);
});

// ---- Scroll reveals: spring up into place, staggered among siblings ----
$$("[data-reveal]").forEach((el) => {
  const siblings = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.hasAttribute("data-reveal")) : [];
  const delay = Math.min(Math.max(siblings.indexOf(el), 0), 5) * 0.08;
  const tiltIn = !finePointer && !reduce && el.hasAttribute("data-tilt");
  // items in a sideways swipe row (client videos on phones) come in with their row
  const parent = el.parentElement;
  const watch = parent && getComputedStyle(parent).overflowX === "auto" ? parent : el;
  inView(
    watch,
    () => {
      if (tiltIn) {
        // touch version of the cursor tilt: the card swings up flat as it arrives
        animate(el, { opacity: [0, 1], y: [48, 0], rotateX: [18, 0] }, { type: "spring", stiffness: 220, damping: 20, delay, opacity: { duration: 0.5, delay } });
      } else {
        animate(el, { opacity: [0, 1], y: [d(36), 0] }, { ...SPRING, delay, opacity: { duration: 0.5, delay, ease: EASE } });
      }
    },
    SOON
  );
});

// ---- Stats count up as the row arrives ----
const stats = $(".stats");
if (stats) inView(stats, () => void $$("[data-count]", stats).forEach(countUp), SOON);

// ---- Outcome numbers flip up and scramble in ----
$$("[data-num]").forEach((n) => {
  inView(
    n,
    () => {
      anime(n, { opacity: [0, 1], rotateX: [reduce ? 0 : -90, 0], duration: 900, ease: "outBack(1.6)" });
      if (!reduce) anime(n, { innerHTML: scrambleText({ chars: "0-9", settleDuration: 400 }) });
    },
    SOON
  );
});

// ---- Story: the line fills down to each step as it arrives ----
const steps = $$(".story-steps li");
const line = $(".story-line i");
if (line && steps.length) {
  let reached = 0;
  steps.forEach((step, i) => {
    inView(
      step,
      () => {
        if (i + 1 <= reached) return;
        reached = i + 1;
        animate(line, { scaleY: reached / steps.length }, { duration: reduce ? 0.01 : 0.9, ease: EASE });
      },
      { amount: 0.6 }
    );
  });
}

// ---- Guarantee seal: the ring turns, the core pops in ----
const seal = $(".seal");
if (seal) {
  if (!reduce) anime(".seal-ring", { rotate: 360, duration: 26000, ease: "linear", loop: true });
  inView(
    seal,
    () => {
      animate(".seal-core", reduce ? { opacity: [0, 1] } : { scale: [0.4, 1], rotate: [-20, 0] }, { type: "spring", stiffness: 260, damping: 14, delay: 0.15 });
    },
    SOON
  );
}

// ---- Pricing: cards rise in sequence; prices scramble, ticks draw ----
const plans = $$("[data-plan]");
if (plans.length) {
  plans.forEach((plan, i) => {
    inView(
      plan,
      () => {
        const delay = finePointer ? i * 0.12 : 0; // stacked on phones, so each card times itself
        animate(plan, { opacity: [0, 1], y: [d(48), 0] }, { ...SPRING, delay, opacity: { duration: 0.5, delay } });
        const price = $(".price", plan);
        if (price && !reduce) anime(price, { innerHTML: scrambleText({ chars: "0-9$", delay: 250 + delay * 1000, settleDuration: 260 }) });
        const ticks = createDrawable($$(".plan-features path", plan));
        anime(ticks, { draw: ["0 0", "0 1"], duration: reduce ? 1 : 500, ease: "outQuad", delay: animeStagger(90, { start: 450 + delay * 1000 }) });
      },
      SOON
    );
  });
}

// ---- FAQ: answers ease in when opened ----
$$<HTMLDetailsElement>(".faq details").forEach((det) => {
  det.addEventListener("toggle", () => {
    const a = $(".faq-a", det);
    if (det.open && a) animate(a, { opacity: [0, 1], y: [d(-8), 0] }, { duration: 0.4, ease: EASE });
  });
});

if (!reduce) {
  // ---- Glows drift against the scroll for depth ----
  const heroGlow = $(".glow-hero");
  if (heroGlow) scroll(animate(heroGlow, { y: [0, 180], opacity: [1, 0.35] }, { ease: "linear" }), { target: $(".hero")!, offset: ["start start", "end start"] });
  const priceGlow = $(".glow-pricing");
  if (priceGlow) scroll(animate(priceGlow, { y: [-80, 80] }, { ease: "linear" }), { target: $(".pricing")!, offset: ["start end", "end start"] });

  // ---- "Join today" arrows nudge toward the pricing ----
  animate(".nudge", { x: [0, 6, 0] }, { duration: 1.1, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.6, delay: 2 });

  // ---- Marquees (ticker + review wall): endless loop; mouse or finger slows them ----
  $$("[data-marquee]").forEach((track) => {
    const dir = Number(track.dataset.marquee) || -1;
    const seconds = Number(track.dataset.speed) || 40;
    const loop = animate(track, { x: dir < 0 ? ["0%", "-50%"] : ["-50%", "0%"] }, { duration: seconds, ease: "linear", repeat: Infinity });
    const slow = () => (loop.speed = 0.25);
    const fast = () => (loop.speed = 1);
    track.addEventListener("pointerenter", slow);
    track.addEventListener("pointerleave", fast);
    track.addEventListener("touchstart", slow, { passive: true });
    track.addEventListener("touchend", fast, { passive: true });
    track.addEventListener("touchcancel", fast, { passive: true });
    inView(track, () => {
      loop.play();
      return () => loop.pause();
    });
  });

  // ---- Mouse: hover lift, tilt toward the cursor, magnetic hero button ----
  if (finePointer) {
    hover(".btn", (el) => {
      animate(el, { y: -3, scale: 1.02 }, SPRING);
      return () => animate(el, { y: 0, scale: 1 }, SPRING);
    });
    hover(".vsl-play:not([aria-disabled]), .vid-play:not([aria-disabled])", (el) => {
      animate(el, { scale: 1.1 }, SPRING);
      return () => animate(el, { scale: 1 }, SPRING);
    });
    hover(".vid-frame", (el) => {
      animate(el, { scale: 1.02 }, SPRING);
      return () => animate(el, { scale: 1 }, SPRING);
    });
    $$("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        animate(card, { rotateY: px * 8, rotateX: -py * 8, y: -6 }, { type: "spring", stiffness: 260, damping: 20 });
      });
      card.addEventListener("pointerleave", () => animate(card, { rotateY: 0, rotateX: 0, y: 0 }, SPRING));
    });
    $$("[data-magnetic]").forEach((el) => {
      const pull = 0.25;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        animate(el, { x: (e.clientX - (r.left + r.width / 2)) * pull, y: (e.clientY - (r.top + r.height / 2)) * pull }, { type: "spring", stiffness: 300, damping: 18 });
      });
      el.addEventListener("pointerleave", () => animate(el, { x: 0, y: 0 }, SPRING));
    });
  }

  // ---- Every device: tap/click squash and spring back ----
  press(".btn, .vsl-play, .vid-play, .vid-frame, .inc", (el) => {
    animate(el, { scale: el.matches(".btn, .vsl-play, .vid-play") ? 0.95 : 0.98 }, { type: "spring", stiffness: 600, damping: 30 });
    return () => animate(el, { scale: 1 }, SPRING);
  });
}

// ---------------------------------------------------------------------------
// Top bar hides while you scroll down and comes back when you scroll up,
// so it never eats into a phone screen while reading.
// Phone sticky CTA: shows once the hero button is above the screen, hides
// while pricing is on screen (that's where it points). Worked out from
// positions on every scroll, so it's right even after a reload mid-page.
// ---------------------------------------------------------------------------
const bar = $(".topbar");
const sticky = $(".sticky-cta");
const heroCta = $("[data-hero='cta']");
const pricing = $("#pricing");
// the sticky button stands down while any other "Join today" (or the final yellow band) is on screen
const otherCtas = $$(".cta-row .btn, .final");
let lastY = window.scrollY;
let barHidden = false;
let ctaShown = false;
let ticking = false;

const setBar = (hide: boolean) => {
  if (!bar || hide === barHidden) return;
  barHidden = hide;
  animate(bar, { y: hide ? "-120%" : "0%" }, reduce ? { duration: 0.01 } : { type: "spring", stiffness: 420, damping: 36 });
};
const setCta = (show: boolean) => {
  if (!sticky || show === ctaShown) return;
  ctaShown = show;
  sticky.classList.toggle("on", show);
  sticky.toggleAttribute("aria-hidden", !show);
  sticky.tabIndex = show ? 0 : -1;
  animate(sticky, show ? { opacity: 1, y: "0%" } : { opacity: 0, y: "140%" }, reduce ? { duration: 0.2 } : SPRING);
};
const onScroll = () => {
  ticking = false;
  const y = window.scrollY;
  const delta = y - lastY;
  if (y < 80) setBar(false);
  else if (delta > 6) setBar(true);
  else if (delta < -6) setBar(false);
  lastY = y;
  if (heroCta && pricing) {
    const vh = window.innerHeight;
    const heroGone = heroCta.getBoundingClientRect().bottom < 0;
    const p = pricing.getBoundingClientRect();
    const pricingIn = p.top < vh * 0.9 && p.bottom > vh * 0.1;
    const ctaOnScreen = otherCtas.some((el) => {
      const r = el.getBoundingClientRect();
      return r.top < vh && r.bottom > 0;
    });
    setCta(heroGone && !pricingIn && !ctaOnScreen);
  }
};
window.addEventListener(
  "scroll",
  () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  },
  { passive: true }
);
window.addEventListener("resize", onScroll, { passive: true });
onScroll();
