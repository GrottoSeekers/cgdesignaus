// Page motion. Two libraries, each doing what it's best at:
//  - Anime.js: the choreographed pieces. Hero timeline (headline split into
//    words, highlight bar), section headings rising word by word, number
//    counters, the outcome numbers, the guarantee seal, price scramble and the
//    tick marks drawing in.
//  - Motion: everything driven by the browser. Scroll reveals (inView +
//    springs), scroll-linked glows and story line, the ticker and review-wall
//    marquees, spring hover/press on buttons, card tilt, the magnetic hero
//    button, FAQ open, and the phone sticky CTA.
// Only transform and opacity animate. Under Reduce Motion nothing moves and
// the page renders as-is (the start states in global.css only apply with .anim).
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

const root = document.documentElement;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const SPRING = { type: "spring" as const, stiffness: 380, damping: 22, mass: 1 };
const $ = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = document) => scope.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = document) =>
  Array.from(scope.querySelectorAll<T>(sel));

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
// Number counters (badge + stats). Only run when a real number is set.
// ---------------------------------------------------------------------------
const countUp = (el: HTMLElement) => {
  const to = Number(el.dataset.count);
  if (!to || reduce) return;
  const state = { v: 0 };
  anime(state, {
    v: to,
    duration: 1600,
    ease: "outExpo",
    modifier: utils.round(0),
    onUpdate: () => {
      el.textContent = state.v.toLocaleString();
    },
  });
};

// Split a heading into words that rise out of clipped lines. Returns the words.
const splitWords = (el: HTMLElement) => {
  const words = splitText(el, { words: { wrap: "clip" } }).words as HTMLElement[];
  utils.set(words, { y: "105%" });
  el.classList.add("split");
  return words;
};

if (reduce) {
  root.classList.remove("anim");
} else {
  // ---- Top bar slides down ----
  const bar = $(".topbar-inner");
  if (bar) animate(bar, { opacity: [0, 1], y: [-16, 0] }, { duration: 0.7, ease: EASE });

  // -------------------------------------------------------------------------
  // Hero: Anime.js timeline.
  // -------------------------------------------------------------------------
  const headline = $("[data-hero='headline']");
  const words = headline ? splitWords(headline) : [];
  const tl = createTimeline({ defaults: { ease: "outExpo", duration: 900 } });
  tl.add("[data-hero='proof']", { opacity: [0, 1], y: [16, 0], duration: 700 }, 0)
    .add("[data-hero='eyebrow']", { opacity: [0, 1], y: [12, 0], duration: 700 }, 80)
    .add(words, { y: ["105%", "0%"], duration: 1000, delay: animeStagger(55) }, 160)
    .add(".hl-bar", { scaleX: [0, 1], duration: 700, ease: "inOutQuart" }, "-=450")
    .add("[data-hero='uppercut']", { opacity: [0, 1], y: [18, 0], delay: animeStagger(90) }, "-=700")
    .add("[data-hero='vsl']", { opacity: [0, 1], y: [40, 0], scale: [0.96, 1], duration: 1100 }, "-=700")
    .add("[data-hero='cta']", { opacity: [0, 1], y: [16, 0] }, "-=800")
    .call(() => {
      const badge = $(".proof .count");
      if (badge) countUp(badge);
    }, 300);

  // ---- Section headings: split now, rise word by word when they arrive ----
  $$("[data-split]").forEach((h) => {
    const w = splitWords(h);
    inView(
      h,
      () => {
        anime(w, { y: ["105%", "0%"], duration: 1000, ease: "outExpo", delay: animeStagger(45) });
      },
      { amount: 0.5 }
    );
  });

  // ---- Scroll reveals: Motion inView + spring, staggered among siblings ----
  $$("[data-reveal]").forEach((el) => {
    const siblings = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.hasAttribute("data-reveal")) : [];
    const delay = Math.min(Math.max(siblings.indexOf(el), 0), 5) * 0.08;
    inView(
      el,
      () => {
        animate(el, { opacity: [0, 1], y: [36, 0] }, { ...SPRING, delay, opacity: { duration: 0.5, delay, ease: EASE } });
      },
      { amount: 0.2 }
    );
  });

  // ---- Stats count up as the row arrives ----
  const stats = $(".stats");
  if (stats) inView(stats, () => $$("[data-count]", stats).forEach(countUp), { amount: 0.6 });

  // ---- Outcome numbers flip up and scramble in ----
  $$("[data-num]").forEach((n) => {
    inView(
      n,
      () => {
        anime(n, { rotateX: [-90, 0], opacity: [0, 1], duration: 900, ease: "outBack(1.6)" });
        anime(n, { innerHTML: scrambleText({ chars: "0-9", settleDuration: 400 }) });
      },
      { amount: 0.8 }
    );
  });

  // ---- Story: the progress line fills as you scroll through it ----
  const story = $(".story-steps");
  const line = $(".story-line i");
  if (story && line) {
    scroll(animate(line, { scaleY: [0, 1] }, { ease: "linear" }), { target: story, offset: ["start 75%", "end 55%"] });
  }

  // ---- Guarantee seal: the ring turns (Anime loop), the core pops in (Motion spring) ----
  const seal = $(".seal");
  if (seal) {
    anime(".seal-ring", { rotate: 360, duration: 26000, ease: "linear", loop: true });
    inView(
      seal,
      () => {
        animate(".seal-core", { scale: [0.4, 1], rotate: [-20, 0] }, { type: "spring", stiffness: 260, damping: 14, delay: 0.15 });
      },
      { amount: 0.6 }
    );
  }

  // ---- Pricing: cards rise in sequence; prices scramble, ticks draw ----
  const plans = $$("[data-plan]");
  if (plans.length) {
    inView(
      ".plans",
      () => {
        plans.forEach((plan, i) => {
          animate(plan, { opacity: [0, 1], y: [48, 0] }, { ...SPRING, delay: i * 0.12, opacity: { duration: 0.5, delay: i * 0.12 } });
          const price = $(".price", plan);
          if (price) anime(price, { innerHTML: scrambleText({ chars: "0-9$", delay: 250 + i * 120, settleDuration: 260 }) });
          const ticks = createDrawable($$(".plan-features path", plan));
          anime(ticks, { draw: ["0 0", "0 1"], duration: 500, ease: "outQuad", delay: animeStagger(90, { start: 450 + i * 120 }) });
        });
      },
      { amount: 0.2 }
    );
  }

  // ---- Glows drift against the scroll for depth ----
  const heroGlow = $(".glow-hero");
  if (heroGlow) scroll(animate(heroGlow, { y: [0, 180], opacity: [1, 0.35] }, { ease: "linear" }), { target: $(".hero")!, offset: ["start start", "end start"] });
  const priceGlow = $(".glow-pricing");
  if (priceGlow) scroll(animate(priceGlow, { y: [-80, 80] }, { ease: "linear" }), { target: $(".pricing")!, offset: ["start end", "end start"] });

  // ---- Marquees (ticker + review wall): endless loop, slows on hover ----
  $$("[data-marquee]").forEach((track) => {
    const dir = Number(track.dataset.marquee) || -1;
    const seconds = Number(track.dataset.speed) || 40;
    const loop = animate(track, { x: dir < 0 ? ["0%", "-50%"] : ["-50%", "0%"] }, { duration: seconds, ease: "linear", repeat: Infinity });
    if (finePointer) {
      track.addEventListener("pointerenter", () => (loop.speed = 0.25));
      track.addEventListener("pointerleave", () => (loop.speed = 1));
    }
    // pause while off screen
    inView(track, () => {
      loop.play();
      return () => loop.pause();
    });
  });

  // ---- FAQ: answers fade/slide in when opened ----
  $$<HTMLDetailsElement>(".faq details").forEach((d) => {
    d.addEventListener("toggle", () => {
      const a = $(".faq-a", d);
      if (d.open && a) animate(a, { opacity: [0, 1], y: [-8, 0] }, { duration: 0.4, ease: EASE });
    });
  });

  // -------------------------------------------------------------------------
  // Pointer-only flourishes.
  // -------------------------------------------------------------------------
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

    // Included cards tilt toward the cursor.
    $$("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        animate(card, { rotateY: px * 8, rotateX: -py * 8, y: -6 }, { type: "spring", stiffness: 260, damping: 20 });
      });
      card.addEventListener("pointerleave", () => animate(card, { rotateY: 0, rotateX: 0, y: 0 }, SPRING));
    });

    // Magnetic hero button.
    $$("[data-magnetic]").forEach((el) => {
      const pull = 0.25;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        animate(el, { x: (e.clientX - (r.left + r.width / 2)) * pull, y: (e.clientY - (r.top + r.height / 2)) * pull }, { type: "spring", stiffness: 300, damping: 18 });
      });
      el.addEventListener("pointerleave", () => animate(el, { x: 0, y: 0 }, SPRING));
    });
  }

  press(".btn, .vsl-play, .vid-play", (el) => {
    animate(el, { scale: 0.96 }, { type: "spring", stiffness: 600, damping: 30 });
    return () => animate(el, { scale: 1 }, SPRING);
  });
}

// ---------------------------------------------------------------------------
// Phone sticky CTA: shows once the hero button has scrolled away, hides again
// while pricing is on screen (that's where it points).
// ---------------------------------------------------------------------------
const sticky = $(".sticky-cta");
const heroCta = $("[data-hero='cta']");
const pricing = $("#pricing");
if (sticky && heroCta && pricing) {
  let heroGone = false;
  let pricingIn = false;
  let shown = false;
  const update = () => {
    const show = heroGone && !pricingIn;
    if (show === shown) return;
    shown = show;
    sticky.classList.toggle("on", show);
    sticky.toggleAttribute("aria-hidden", !show);
    sticky.tabIndex = show ? 0 : -1;
    if (reduce) {
      sticky.style.opacity = show ? "1" : "0";
      sticky.style.transform = show ? "none" : "translateY(140%)";
    } else {
      animate(sticky, show ? { opacity: 1, y: "0%" } : { opacity: 0, y: "140%" }, SPRING);
    }
  };
  inView(heroCta, () => {
    heroGone = false;
    update();
    return (entry) => {
      // only counts as gone when it left off the top, not before reaching it
      heroGone = entry.boundingClientRect.top < 0;
      update();
    };
  });
  inView(
    pricing,
    () => {
      pricingIn = true;
      update();
      return () => {
        pricingIn = false;
        update();
      };
    },
    { amount: 0.1 }
  );
}
