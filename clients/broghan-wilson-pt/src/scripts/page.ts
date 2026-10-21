// Page motion. Two libraries, each doing what it's best at:
//  - Anime.js: the choreographed pieces — the hero headline timeline (split into
//    words), the highlight bar, the client counter, the guarantee seal, price
//    scramble and the tick marks drawing in.
//  - Motion: everything driven by the browser — scroll reveals (inView), the
//    scroll-linked glows, spring hover/press on buttons, the magnetic hero
//    button and the phone sticky CTA.
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
// VSL: click-to-load so the page stays fast until someone presses play.
// ---------------------------------------------------------------------------
const frame = $(".vsl-frame");
const play = frame && $<HTMLButtonElement>(".vsl-play", frame);
if (frame && play) {
  const { vslType, vslEmbed, vslSrc } = frame.dataset;
  if (vslType === "none") {
    play.setAttribute("aria-disabled", "true");
    play.setAttribute("aria-label", "Video coming soon");
  }
  play.addEventListener("click", () => {
    if (vslType === "youtube" || vslType === "vimeo") {
      const iframe = document.createElement("iframe");
      iframe.src = vslEmbed || "";
      iframe.title = "Broghan's video";
      iframe.allow = "autoplay; fullscreen; picture-in-picture; encrypted-media";
      iframe.allowFullscreen = true;
      frame.append(iframe);
      frame.classList.add("playing");
    } else if (vslType === "mp4" && vslSrc) {
      const video = document.createElement("video");
      video.src = vslSrc;
      video.controls = true;
      video.playsInline = true;
      video.autoplay = true;
      frame.append(video);
      frame.classList.add("playing");
      video.focus();
    }
  });
}

// ---------------------------------------------------------------------------
// Client counter (only when a real number is set).
// ---------------------------------------------------------------------------
const counter = $(".count");
const countTo = Number(counter?.dataset.count);
const runCounter = () => {
  if (!counter || !countTo) return;
  if (reduce) return;
  const state = { v: 0 };
  anime(state, {
    v: countTo,
    duration: 1600,
    ease: "outExpo",
    modifier: utils.round(0),
    onUpdate: () => {
      counter.textContent = String(state.v);
    },
  });
};

if (reduce) {
  root.classList.remove("anim");
} else {
  // -------------------------------------------------------------------------
  // Hero: Anime.js timeline. Headline words rise out of clipped lines, the
  // highlight bar wipes under "lifetime.", then the rest follows.
  // -------------------------------------------------------------------------
  const headline = $("[data-hero='headline']");
  const words = headline ? splitText(headline, { words: { wrap: "clip" } }).words : [];
  if (words.length) utils.set(words, { y: "105%" });
  headline?.classList.add("split");

  const tl = createTimeline({ defaults: { ease: "outExpo", duration: 900 } });
  tl.add("[data-hero='proof']", { opacity: [0, 1], y: [16, 0], duration: 700 }, 0)
    .add(words, { y: ["105%", "0%"], duration: 1000, delay: animeStagger(55) }, 120)
    .add(".hl-bar", { scaleX: [0, 1], duration: 700, ease: "inOutQuart" }, "-=450")
    .add("[data-hero='uppercut']", { opacity: [0, 1], y: [18, 0] }, "-=700")
    .add("[data-hero='vsl']", { opacity: [0, 1], y: [40, 0], scale: [0.96, 1], duration: 1100 }, "-=700")
    .add("[data-hero='cta']", { opacity: [0, 1], y: [16, 0] }, "-=800")
    .call(runCounter, 300);

  // -------------------------------------------------------------------------
  // Scroll reveals: Motion inView + spring.
  // -------------------------------------------------------------------------
  $$("[data-reveal]").forEach((el) => {
    if (el.closest(".topbar")) {
      animate(el, { opacity: [0, 1], y: [-12, 0] }, { duration: 0.6, ease: EASE });
      return;
    }
    inView(
      el,
      () => {
        animate(el, { opacity: [0, 1], y: [32, 0] }, { ...SPRING, opacity: { duration: 0.5, ease: EASE } });
      },
      { amount: 0.25 }
    );
  });

  // Guarantee seal: the core pops in (Motion spring) and the ring turns slowly (Anime loop).
  const seal = $(".seal");
  if (seal) {
    anime(".seal-ring", { rotate: 360, duration: 24000, ease: "linear", loop: true });
    inView(
      seal,
      () => {
        animate(".seal-core", { scale: [0.4, 1], rotate: [-20, 0] }, { type: "spring", stiffness: 260, damping: 14, delay: 0.15 });
      },
      { amount: 0.6 }
    );
  }

  // Pricing cards rise in sequence; then Anime scrambles the price and draws each tick.
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

  // Glows drift a little against the scroll for depth (Motion scroll-linked).
  const heroGlow = $(".glow-hero");
  if (heroGlow) scroll(animate(heroGlow, { y: [0, 160], opacity: [1, 0.4] }, { ease: "linear" }), { target: $(".hero")!, offset: ["start start", "end start"] });
  const priceGlow = $(".glow-pricing");
  if (priceGlow) scroll(animate(priceGlow, { y: [-80, 80] }, { ease: "linear" }), { target: $(".pricing")!, offset: ["start end", "end start"] });
}

// ---------------------------------------------------------------------------
// Buttons: spring hover + press (Motion). Pointer devices get the lift; every
// device gets the press.
// ---------------------------------------------------------------------------
if (!reduce) {
  if (finePointer) {
    hover(".btn", (el) => {
      animate(el, { y: -3, scale: 1.02 }, SPRING);
      return () => animate(el, { y: 0, scale: 1 }, SPRING);
    });
    hover(".vsl-play:not([aria-disabled])", (el) => {
      animate(el, { scale: 1.08 }, SPRING);
      return () => animate(el, { scale: 1 }, SPRING);
    });
  }
  press(".btn, .vsl-play", (el) => {
    animate(el, { scale: 0.96 }, { type: "spring", stiffness: 600, damping: 30 });
    return () => animate(el, { scale: 1 }, SPRING);
  });

  // Magnetic hero button: follows the cursor a few px while it's near.
  if (finePointer) {
    $$("[data-magnetic]").forEach((el) => {
      const pull = 0.25;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * pull;
        const y = (e.clientY - (r.top + r.height / 2)) * pull;
        animate(el, { x, y }, { type: "spring", stiffness: 300, damping: 18 });
      });
      el.addEventListener("pointerleave", () => animate(el, { x: 0, y: 0 }, SPRING));
    });
  }
}

// ---------------------------------------------------------------------------
// Phone sticky CTA: shows once the hero button has scrolled away, hides again
// when pricing is on screen (they're already where it points).
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
      // only count it as gone when it left off the top, not before reaching it
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
    { amount: 0.15 }
  );
}
