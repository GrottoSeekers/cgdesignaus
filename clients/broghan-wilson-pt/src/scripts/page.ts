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
// Phones get the same page as laptops, and the client wants every visitor to
// see the full motion, so it plays regardless of the Reduce Motion setting.
// Where an effect needs a mouse (hover lift, tilt, magnetic pull, slowing the
// review wall) touch gets its own version: cards tilt up as they scroll in,
// taps squash and spring back, a finger on the review wall slows it down.
//
// Reveals and the sticky CTA run off IntersectionObserver (Motion's inView),
// not scroll events, so they also work inside preview frames on phones. Each
// effect is set up on its own (safe()), so one unsupported feature on an old
// phone can't stop the rest. Only transform and opacity animate.
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

const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const SPRING = { type: "spring" as const, stiffness: 380, damping: 22, mass: 1 };
const $ = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = document) => scope.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = document) =>
  Array.from(scope.querySelectorAll<T>(sel));
// Fire a little before the element is fully on screen, so phones never wait on a blank gap.
const SOON = { amount: 0, margin: "0px 0px -12% 0px" } as const;

// Set one effect up; if it throws, show what it would have animated and carry on.
const safe = (name: string, fn: () => void, reveal?: string) => {
  try {
    fn();
  } catch (err) {
    console.warn(`[motion] ${name} skipped`, err);
    if (reveal) $$(reveal).forEach((el) => ((el.style.opacity = "1"), (el.style.transform = "none"), (el.style.visibility = "visible")));
  }
};

window.__bwReady = true;

// ---------------------------------------------------------------------------
// Videos (VSL + client videos): click-to-load so the page stays fast until
// someone presses play.
// ---------------------------------------------------------------------------
safe("videos", () => {
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
    duration: 1600,
    ease: "outExpo",
    modifier: utils.round(0),
    onUpdate: () => {
      el.textContent = state.v.toLocaleString();
    },
  });
};

// Split a heading into words held in clipped lines, parked below the line. Returns the words.
const splitWords = (el: HTMLElement) => {
  const words = splitText(el, { words: { wrap: "clip" } }).words as HTMLElement[];
  utils.set(words, { y: "105%" });
  el.classList.add("split");
  return words;
};
const riseWords = (words: HTMLElement[]) =>
  anime(words, { y: ["105%", "0%"], duration: 1000, ease: "outExpo", delay: animeStagger(words.length > 8 ? 35 : 50) });

// ---------------------------------------------------------------------------
// Hero: Anime.js timeline.
// ---------------------------------------------------------------------------
safe(
  "hero",
  () => {
    const headline = $("[data-hero='headline']");
    const heroWords = headline ? splitWords(headline) : [];
    createTimeline({ defaults: { ease: "outExpo", duration: 900 } })
      .add(".topbar-inner", { opacity: [0, 1], y: [-16, 0], duration: 700 }, 0)
      .add("[data-hero='proof']", { opacity: [0, 1], y: [16, 0], duration: 700 }, 60)
      .add("[data-hero='eyebrow']", { opacity: [0, 1], y: [12, 0], duration: 700 }, 120)
      .add(heroWords, { y: ["105%", "0%"], duration: 1000, delay: animeStagger(55) }, 180)
      .add(".hl-bar", { scaleX: [0, 1], duration: 700, ease: "inOutQuart" }, "-=450")
      .add("[data-hero='uppercut']", { opacity: [0, 1], y: [18, 0], delay: animeStagger(90) }, "-=700")
      .add("[data-hero='vsl']", { opacity: [0, 1], y: [40, 0], scale: [0.96, 1], duration: 1100 }, "-=700")
      .add("[data-hero='cta']", { opacity: [0, 1], y: [16, 0] }, "-=800")
      .call(() => {
        const badge = $(".proof .count");
        if (badge) countUp(badge);
      }, 300);
  },
  ".topbar-inner, [data-hero], .hl-bar, [data-hero='headline'] span"
);

// ---- Section headings rise word by word when they arrive ----
$$("[data-split]").forEach((h) =>
  safe(
    "heading",
    () => {
      const w = splitWords(h);
      inView(h, () => void riseWords(w), SOON);
    },
    "[data-split], [data-split] span"
  )
);

// ---- Scroll reveals: spring up into place, staggered among siblings ----
safe(
  "reveals",
  () => {
    $$("[data-reveal]").forEach((el) => {
      const siblings = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.hasAttribute("data-reveal")) : [];
      const delay = Math.min(Math.max(siblings.indexOf(el), 0), 5) * 0.08;
      const tiltIn = !finePointer && el.hasAttribute("data-tilt");
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
            animate(el, { opacity: [0, 1], y: [36, 0] }, { ...SPRING, delay, opacity: { duration: 0.5, delay, ease: EASE } });
          }
        },
        SOON
      );
    });
  },
  "[data-reveal]"
);

// ---- Stats count up as the row arrives ----
safe("stats", () => {
  const stats = $(".stats");
  if (stats) inView(stats, () => void $$("[data-count]", stats).forEach(countUp), SOON);
});

// ---- Outcome numbers flip up and scramble in ----
safe("outcome numbers", () => {
  $$("[data-num]").forEach((n) => {
    inView(
      n,
      () => {
        anime(n, { opacity: [0, 1], rotateX: [-90, 0], duration: 900, ease: "outBack(1.6)" });
        anime(n, { innerHTML: scrambleText({ chars: "0-9", settleDuration: 400 }) });
      },
      SOON
    );
  });
});

// ---- Story: the line fills down to each step as it arrives ----
safe(
  "story line",
  () => {
    const steps = $$(".story-steps li");
    const line = $(".story-line i");
    if (!line || !steps.length) return;
    let reached = 0;
    steps.forEach((step, i) => {
      inView(
        step,
        () => {
          if (i + 1 <= reached) return;
          reached = i + 1;
          animate(line, { scaleY: reached / steps.length }, { duration: 0.9, ease: EASE });
        },
        { amount: 0.6 }
      );
    });
  },
  ".story-line i"
);

// ---- Guarantee seal: the ring turns, the core pops in ----
safe("seal", () => {
  const seal = $(".seal");
  if (!seal) return;
  anime(".seal-ring", { rotate: 360, duration: 26000, ease: "linear", loop: true });
  inView(seal, () => void animate(".seal-core", { scale: [0.4, 1], rotate: [-20, 0] }, { type: "spring", stiffness: 260, damping: 14, delay: 0.15 }), SOON);
});

// ---- Pricing: cards rise in sequence; prices scramble, ticks draw ----
safe(
  "pricing",
  () => {
    $$("[data-plan]").forEach((plan, i) => {
      inView(
        plan,
        () => {
          const delay = finePointer ? i * 0.12 : 0; // stacked on phones, so each card times itself
          animate(plan, { opacity: [0, 1], y: [48, 0] }, { ...SPRING, delay, opacity: { duration: 0.5, delay } });
          const price = $(".price", plan);
          if (price) anime(price, { innerHTML: scrambleText({ chars: "0-9$", delay: 250 + delay * 1000, settleDuration: 260 }) });
          const ticks = createDrawable($$(".plan-features path", plan));
          anime(ticks, { draw: ["0 0", "0 1"], duration: 500, ease: "outQuad", delay: animeStagger(90, { start: 450 + delay * 1000 }) });
        },
        SOON
      );
    });
  },
  "[data-plan]"
);

// ---- FAQ: answers ease in when opened ----
safe("faq", () => {
  $$<HTMLDetailsElement>(".faq details").forEach((det) => {
    det.addEventListener("toggle", () => {
      const a = $(".faq-a", det);
      if (det.open && a) animate(a, { opacity: [0, 1], y: [-8, 0] }, { duration: 0.4, ease: EASE });
    });
  });
});

// ---- Glows drift against the scroll for depth ----
safe("glows", () => {
  const heroGlow = $(".glow-hero");
  if (heroGlow) scroll(animate(heroGlow, { y: [0, 180], opacity: [1, 0.35] }, { ease: "linear" }), { target: $(".hero")!, offset: ["start start", "end start"] });
  const priceGlow = $(".glow-pricing");
  if (priceGlow) scroll(animate(priceGlow, { y: [-80, 80] }, { ease: "linear" }), { target: $(".pricing")!, offset: ["start end", "end start"] });
});

// ---- "Join today" arrows nudge toward the pricing ----
safe("nudge", () => {
  animate(".nudge", { x: [0, 6, 0] }, { duration: 1.1, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.6, delay: 2 });
});

// ---- Marquees (ticker + review wall): endless loop; mouse or finger slows them ----
safe("marquees", () => {
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
  });
});

// ---- Mouse: hover lift, tilt toward the cursor, magnetic hero button ----
if (finePointer) {
  safe("hover", () => {
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
  });
  safe("tilt", () => {
    $$("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        animate(card, { rotateY: px * 8, rotateX: -py * 8, y: -6 }, { type: "spring", stiffness: 260, damping: 20 });
      });
      card.addEventListener("pointerleave", () => animate(card, { rotateY: 0, rotateX: 0, y: 0 }, SPRING));
    });
  });
  safe("magnetic", () => {
    $$("[data-magnetic]").forEach((el) => {
      const pull = 0.25;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        animate(el, { x: (e.clientX - (r.left + r.width / 2)) * pull, y: (e.clientY - (r.top + r.height / 2)) * pull }, { type: "spring", stiffness: 300, damping: 18 });
      });
      el.addEventListener("pointerleave", () => animate(el, { x: 0, y: 0 }, SPRING));
    });
  });
}

// ---- Every device: tap/click squash and spring back ----
safe("press", () => {
  press(".btn, .vsl-play, .vid-play, .vid-frame, .inc", (el) => {
    animate(el, { scale: el.matches(".btn, .vsl-play, .vid-play") ? 0.95 : 0.98 }, { type: "spring", stiffness: 600, damping: 30 });
    return () => animate(el, { scale: 1 }, SPRING);
  });
});

// ---------------------------------------------------------------------------
// Phone sticky CTA: shows once the hero button is above the screen, and
// stands down while pricing, another "Join today" or the final yellow band is
// on screen. Driven by IntersectionObserver so it works with or without
// scroll events.
// ---------------------------------------------------------------------------
safe("sticky cta", () => {
  const sticky = $(".sticky-cta");
  const heroCta = $("[data-hero='cta']");
  if (!sticky || !heroCta) return;
  let shown = false;
  let heroVisible = true;
  let heroAbove = false;
  const blockers = new Set<Element>();
  const update = () => {
    const show = !heroVisible && heroAbove && blockers.size === 0;
    if (show === shown) return;
    shown = show;
    sticky.classList.toggle("on", show);
    sticky.toggleAttribute("aria-hidden", !show);
    sticky.tabIndex = show ? 0 : -1;
    animate(sticky, show ? { opacity: 1, y: "0%" } : { opacity: 0, y: "140%" }, SPRING);
  };
  new IntersectionObserver(([e]) => {
    heroVisible = e.isIntersecting;
    // above the screen = its top is above the observed area's top (or the page's top edge)
    heroAbove = !e.isIntersecting && e.boundingClientRect.top < (e.rootBounds ? e.rootBounds.top : 0);
    update();
  }).observe(heroCta);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? blockers.add(e.target) : blockers.delete(e.target)));
    update();
  });
  $$("#pricing, .cta-row .btn, .final").forEach((el) => io.observe(el));
});

// ---------------------------------------------------------------------------
// Top bar hides while you scroll down and comes back when you scroll up,
// so it never eats into a phone screen while reading.
// ---------------------------------------------------------------------------
safe("top bar", () => {
  const bar = $(".topbar");
  if (!bar) return;
  let lastY = window.scrollY;
  let hidden = false;
  let ticking = false;
  const set = (hide: boolean) => {
    if (hide === hidden) return;
    hidden = hide;
    animate(bar, { y: hide ? "-120%" : "0%" }, { type: "spring", stiffness: 420, damping: 36 });
  };
  const onScroll = () => {
    ticking = false;
    const y = window.scrollY;
    if (y < 80) set(false);
    else if (y - lastY > 6) set(true);
    else if (y - lastY < -6) set(false);
    lastY = y;
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
});
