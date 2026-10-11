import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import type { FrameState, HeroSlide } from "./gl";

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

gsap.registerPlugin(ScrollTrigger, SplitText);

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s)!;
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)];
const EASE = "expo.out";

export async function boot() {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const gl = !reduce && webglAvailable();

  /* ---------------- Smooth momentum scroll ---------------- */
  let lenis: Lenis | null = null;
  if (!reduce) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis!.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  $$<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const target = a.hash === "#top" ? 0 : document.querySelector(a.hash);
      if (target === null) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target as HTMLElement | number, { duration: 1.8, easing: (x) => 1 - Math.pow(1 - x, 4) });
      else (target === 0 ? window.scrollTo(0, 0) : (target as HTMLElement).scrollIntoView());
    }),
  );

  /* ---------------- Hero media ---------------- */
  const heroEl = $(".hero");
  const slides = $$<HTMLImageElement | HTMLVideoElement>("[data-hero-slide]");
  const heroData: HeroSlide[] = slides.map((s) =>
    s instanceof HTMLVideoElement ? { type: "video", src: s.src, poster: s.poster } : { type: "image", src: s.src },
  );
  const captions = JSON.parse(heroEl.dataset.captions ?? "[]") as string[];
  const heroIndex = $(".hero-index");
  const heroCaption = $(".hero-caption");
  const setSlideMeta = (i: number) => {
    const label = String(i + 1).padStart(2, "0");
    gsap.to([heroIndex, heroCaption], {
      yPercent: -100, opacity: 0, duration: 0.5, ease: "power2.in",
      onComplete: () => {
        heroIndex.textContent = label;
        if (captions[i]) heroCaption.textContent = captions[i];
        gsap.fromTo([heroIndex, heroCaption], { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, ease: EASE });
      },
    });
  };

  // Three.js is loaded on demand so the page and its motion never wait for it.
  const glModule = gl ? import("./gl").catch(() => null) : Promise.resolve(null);
  let hero: ReturnType<typeof import("./gl").createHero> | null = null;
  let introDone = false;
  const heroReady = glModule.then((m) => {
    if (!m) return;
    try {
      hero = m.createHero($<HTMLCanvasElement>(".hero-canvas"), heroData, { interval: 7, onChange: setSlideMeta });
      document.documentElement.classList.add("gl-hero");
      if (introDone) hero.start(gsap);
    } catch { hero = null; }
  });
  if (!gl && slides.length > 1 && !reduce) {
    // CSS crossfade fallback
    let i = 0;
    setInterval(() => {
      slides[i].classList.remove("active");
      i = (i + 1) % slides.length;
      slides[i].classList.add("active");
      setSlideMeta(i);
    }, 7000);
  }

  /* ---------------- Split text (after fonts, so line breaks are final) ---------------- */
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);
  const heroLines = $$(".hero-title .line-inner");
  const lineSplits = $$("[data-lines]").map((el) => SplitText.create(el, { type: "lines", mask: "lines", linesClass: "split-line" }));
  const statement = $("[data-words]");
  const words = SplitText.create(statement, { type: "words", wordsClass: "word" });
  const footerWord = SplitText.create(".footer-word", { type: "chars", mask: "chars" });

  if (reduce) {
    $(".loader")?.remove();
    document.documentElement.classList.remove("js");
    return;
  }

  /* ---------------- Loader → intro ---------------- */
  gsap.set(heroLines, { yPercent: 110 });
  gsap.set("[data-hero-in]", { opacity: 0, y: 16 });
  gsap.set(".hero-media", { scale: 1.12 });

  const loaderNum = $(".loader-num");
  const counter = { v: 0 };
  const firstImg = slides[0] as HTMLImageElement;
  const ready = new Promise<void>((res) => {
    if (firstImg instanceof HTMLImageElement && !firstImg.complete) {
      firstImg.addEventListener("load", () => res(), { once: true });
      firstImg.addEventListener("error", () => res(), { once: true });
    } else res();
    setTimeout(res, 3500);
  });
  const countTween = gsap.to(counter, {
    v: 92, duration: 1.4, ease: "power2.out",
    onUpdate: () => (loaderNum.textContent = String(Math.round(counter.v)).padStart(2, "0")),
  });

  Promise.all([ready, Promise.race([heroReady, new Promise((r) => setTimeout(r, 2500))])]).then(() => {
    countTween.kill();
    const intro = gsap.timeline({ defaults: { ease: EASE } });
    intro
      .to(counter, { v: 100, duration: 0.5, ease: "power2.out", onUpdate: () => (loaderNum.textContent = String(Math.round(counter.v)).padStart(2, "0")) })
      .to(".loader-inner > *", { yPercent: -110, duration: 0.9, ease: "power3.in", stagger: 0.06 }, "+=0.15")
      .to(".loader", { clipPath: "inset(0% 0% 100% 0%)", duration: 1.3, ease: "expo.inOut" }, "-=0.25")
      .to(".hero-media", { scale: 1, duration: 2.4 }, "<0.1")
      .to(heroLines, { yPercent: 0, duration: 1.6, stagger: 0.12 }, "<0.45")
      .to("[data-hero-in]", { opacity: 1, y: 0, duration: 1.2, stagger: 0.08 }, "<0.4")
      .add(() => {
        $(".loader")?.remove();
        lenis?.start();
        introDone = true;
        hero?.start(gsap);
      }, "<");
    gsap.set(".loader", { clipPath: "inset(0% 0% 0% 0%)" });
  });

  /* ---------------- Hero scroll: pinned, image settles into a frame ---------------- */
  gsap.timeline({
    scrollTrigger: { trigger: heroEl, start: "top top", end: "+=75%", scrub: true, pin: true, pinSpacing: true },
  })
    .to(".hero-media", { clipPath: "inset(7% 6% 7% 6%)", ease: "none" }, 0)
    .to(".hero-canvas, .hero-fallback", { scale: 1.08, ease: "none" }, 0)
    .to(".hero-copy", { yPercent: -40, opacity: 0, ease: "none" }, 0)
    .to(".hero-meta, .scroll-cue", { opacity: 0, ease: "none" }, 0);
  gsap.set(".hero-media", { clipPath: "inset(0% 0% 0% 0%)" });

  ScrollTrigger.create({ trigger: heroEl, start: "top top", end: "bottom top", onToggle: (s) => hero?.setActive(s.isActive) });
  heroEl.addEventListener("pointermove", (e) => {
    hero?.setMouse((e.clientX / innerWidth - 0.5) * 2, (0.5 - e.clientY / innerHeight) * 2);
  });

  /* ---------------- Statement: words light up as you read ---------------- */
  gsap.fromTo(words.words, { opacity: 0.14 }, {
    opacity: 1, stagger: 0.1, ease: "none",
    scrollTrigger: { trigger: statement, start: "top 78%", end: "bottom 45%", scrub: true },
  });

  /* ---------------- Headings: masked line reveals ---------------- */
  lineSplits.forEach((split) => {
    gsap.from(split.lines, {
      yPercent: 110, duration: 1.5, stagger: 0.1, ease: EASE,
      scrollTrigger: { trigger: split.elements[0] as Element, start: "top 85%", once: true },
    });
  });
  $$("[data-fade]").forEach((el) =>
    gsap.from(el, { y: 36, opacity: 0, duration: 1.4, ease: EASE, scrollTrigger: { trigger: el, start: "top 88%", once: true } }),
  );

  /* ---------------- Collection: image-mask reveals + parallax (+ WebGL) ---------------- */
  const useGalleryGL = gl && finePointer && innerWidth > 900;
  const frames = $$("[data-gl-image]").map((el) => ({
    el,
    src: el.dataset.glImage!,
    state: { reveal: 0, parallax: 0, hover: 0, mouse: { x: 0.5, y: 0.5 } } as FrameState,
  }));

  // If WebGL can't start, show the plain images (already revealed state carries over).
  const fallbackGallery = () => {
    document.documentElement.classList.remove("gl-on");
    frames.forEach(({ el, state }) => gsap.set(el, { clipPath: `inset(${(1 - state.reveal) * 100}% 0% 0% 0%)` }));
    frames.forEach(({ el, state }) => gsap.to(el, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: EASE, scrollTrigger: { trigger: el, start: "top 88%", once: true } }));
  };

  frames.forEach(({ el, state }) => {
    const img = $("img", el);
    const cap = $$("figcaption > *", el.parentElement!);
    gsap.set(cap, { opacity: 0, y: 14 });
    const trigger = { trigger: el, start: "top 88%", once: true };
    if (useGalleryGL) {
      gsap.to(state, { reveal: 1, duration: 1.8, ease: "expo.inOut", scrollTrigger: trigger });
    } else {
      gsap.fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut", scrollTrigger: trigger });
      gsap.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 2.2, ease: EASE, scrollTrigger: trigger });
    }
    gsap.to(cap, { opacity: 1, y: 0, duration: 1.2, stagger: 0.08, ease: EASE, delay: 0.6, scrollTrigger: { ...trigger } });
    ScrollTrigger.create({
      trigger: el, start: "top bottom", end: "bottom top", scrub: true,
      onUpdate: (s) => {
        state.parallax = (s.progress - 0.5) * 2;
        if (!useGalleryGL) gsap.set(img, { yPercent: -state.parallax * 7 });
      },
    });
  });

  if (useGalleryGL) glModule.then((m) => {
    if (!m) return fallbackGallery();
    try {
      const gallery = m.createGallery($<HTMLCanvasElement>(".gl-gallery"), frames);
      document.documentElement.classList.add("gl-on");
      let vel = 0;
      gsap.ticker.add((t) => {
        const target = gsap.utils.clamp(-1, 1, (lenis?.velocity ?? 0) / 60);
        vel += (target - vel) * 0.08;
        gallery.render(t, vel);
      });
      frames.forEach(({ el, state }) => {
        el.addEventListener("pointerenter", () => gsap.to(state, { hover: 1, duration: 0.9, ease: "power3.out" }));
        el.addEventListener("pointerleave", () => gsap.to(state, { hover: 0, duration: 1.1, ease: "power3.out" }));
        el.addEventListener("pointermove", (e) => {
          const r = el.getBoundingClientRect();
          gsap.to(state.mouse, { x: (e.clientX - r.left) / r.width, y: 1 - (e.clientY - r.top) / r.height, duration: 0.6, ease: "power3.out" });
        });
      });
    } catch {
      fallbackGallery();
    }
  });

  /* ---------------- Velocity marquee ---------------- */
  const track = $(".marquee-track");
  const loop = gsap.to(track, { xPercent: -50, duration: 38, ease: "none", repeat: -1 });
  const skew = gsap.quickTo(track, "skewX", { duration: 0.6, ease: "power3.out" });
  let dir = 1;
  lenis?.on("scroll", ({ velocity }: { velocity: number }) => {
    if (Math.abs(velocity) > 0.4) dir = velocity > 0 ? 1 : -1;
    const boost = 1 + Math.min(Math.abs(velocity) * 0.18, 5);
    gsap.to(loop, { timeScale: dir * boost, duration: 0.4, overwrite: true, onComplete: () => { gsap.to(loop, { timeScale: dir, duration: 1.4, ease: "power2.out" }); } });
    skew(gsap.utils.clamp(-6, 6, -velocity * 0.25));
  });

  /* ---------------- Services: pinned, images reveal over each other ---------------- */
  const mm = gsap.matchMedia();
  mm.add("(min-width: 901px)", () => {
    const items = $$("[data-service]");
    const imgs = $$("[data-service-img]");
    const counterEl = $(".services-index");
    let active = 0;
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: ".services-pin", start: "center center", end: () => `+=${innerHeight * (imgs.length - 0.2)}`,
        scrub: 0.6, pin: true,
        onUpdate: (s) => {
          const i = Math.min(imgs.length - 1, Math.floor(s.progress * imgs.length * 0.999));
          if (i === active) return;
          active = i;
          items.forEach((it, k) => it.classList.toggle("active", k === i));
          counterEl.textContent = String(i + 1).padStart(2, "0");
        },
      },
    });
    imgs.forEach((wrap, i) => {
      const img = $("img", wrap);
      if (i === 0) {
        tl.fromTo(img, { scale: 1.15 }, { scale: 1, duration: 1 }, 0);
        return;
      }
      tl.fromTo(wrap, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1 }, i - 0.6)
        .fromTo(img, { scale: 1.3, yPercent: 8 }, { scale: 1, yPercent: 0, duration: 1 }, "<")
        .to($("img", imgs[i - 1]), { scale: 0.92, yPercent: -6, duration: 1 }, "<");
    });
    tl.to({}, { duration: 0.4 });
    return () => items.forEach((it, k) => it.classList.toggle("active", k === 0));
  });

  /* ---------------- About + inquiry: clip reveal and parallax depth ---------------- */
  $$("[data-clip]").forEach((el) =>
    gsap.fromTo(el, { clipPath: "inset(0% 0% 100% 0%)" }, {
      clipPath: "inset(0% 0% 0% 0%)", duration: 1.8, ease: "expo.inOut", scrollTrigger: { trigger: el, start: "top 80%", once: true },
    }),
  );
  $$<HTMLElement>("[data-parallax]").forEach((img) => {
    const amt = parseFloat(img.dataset.parallax!) * 100;
    gsap.fromTo(img, { yPercent: -amt / 2 }, {
      yPercent: amt / 2, ease: "none",
      scrollTrigger: { trigger: img.parentElement!, start: "top bottom", end: "bottom top", scrub: true },
    });
  });
  gsap.from(".facts > div", { y: 24, opacity: 0, stagger: 0.1, duration: 1.2, ease: EASE, scrollTrigger: { trigger: ".facts", start: "top 90%", once: true } });

  /* ---------------- Testimonials: masked crossfade ---------------- */
  const quotes = $$(".quote");
  const quoteSplits = quotes.map((q) => SplitText.create($("blockquote", q), { type: "lines", mask: "lines" }));
  let qi = 0;
  let qTimer: number | undefined;
  const quoteIndex = $(".quote-index");
  const showQuote = (to: number) => {
    if (to === qi) return;
    const from = qi;
    qi = (to + quotes.length) % quotes.length;
    gsap.to(quoteSplits[from].lines, { yPercent: -110, duration: 0.8, stagger: 0.05, ease: "power3.in" });
    gsap.to($("figcaption", quotes[from]), { opacity: 0, duration: 0.5, onComplete: () => {
      quotes[from].classList.remove("active");
      quotes[from].setAttribute("aria-hidden", "true");
    } });
    quotes[qi].classList.add("active");
    quotes[qi].removeAttribute("aria-hidden");
    gsap.fromTo(quoteSplits[qi].lines, { yPercent: 110 }, { yPercent: 0, duration: 1.3, stagger: 0.08, ease: EASE, delay: 0.7 });
    gsap.fromTo($("figcaption", quotes[qi]), { opacity: 0 }, { opacity: 1, duration: 1, delay: 1.1 });
    quoteIndex.textContent = String(qi + 1).padStart(2, "0");
  };
  const autoplay = () => { clearInterval(qTimer); qTimer = window.setInterval(() => showQuote(qi + 1), 7000); };
  $("[data-quote-next]").addEventListener("click", () => { showQuote(qi + 1); autoplay(); });
  $("[data-quote-prev]").addEventListener("click", () => { showQuote(qi - 1); autoplay(); });
  ScrollTrigger.create({ trigger: ".words", start: "top 70%", end: "bottom 20%", onToggle: (s) => (s.isActive ? autoplay() : clearInterval(qTimer)) });
  gsap.from(quoteSplits[0].lines, { yPercent: 110, duration: 1.4, stagger: 0.08, ease: EASE, scrollTrigger: { trigger: ".quotes", start: "top 80%", once: true } });

  /* ---------------- Footer wordmark rises letter by letter ---------------- */
  gsap.from(footerWord.chars, {
    yPercent: 100, ease: "none", stagger: 0.04,
    scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true },
  });

  /* ---------------- Page progress ---------------- */
  gsap.to(".progress span", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

  /* ---------------- Cursor + magnetic button ---------------- */
  if (finePointer) {
    document.documentElement.classList.add("has-cursor");
    const cursor = $(".cursor");
    const label = $(".cursor-label");
    const cx = gsap.quickTo(cursor, "x", { duration: 0.5, ease: "power3.out" });
    const cy = gsap.quickTo(cursor, "y", { duration: 0.5, ease: "power3.out" });
    addEventListener("pointermove", (e) => { cx(e.clientX); cy(e.clientY); });
    $$("[data-cursor]").forEach((el) => {
      el.addEventListener("pointerenter", () => {
        gsap.to(cursor, { width: 84, height: 84, margin: "-42px 0 0 -42px", duration: 0.6, ease: EASE });
        gsap.to(label, { opacity: 1, duration: 0.4, delay: 0.1 });
      });
      el.addEventListener("pointerleave", () => {
        gsap.to(cursor, { width: 10, height: 10, margin: "-5px 0 0 -5px", duration: 0.6, ease: EASE });
        gsap.to(label, { opacity: 0, duration: 0.2 });
      });
    });
    $$("a, button, input, textarea, label").forEach((el) => {
      if (el.closest("[data-cursor]")) return;
      el.addEventListener("pointerenter", () => gsap.to(cursor, { scale: 2.6, opacity: 0.35, duration: 0.4 }));
      el.addEventListener("pointerleave", () => gsap.to(cursor, { scale: 1, opacity: 1, duration: 0.4 }));
    });
    $$("[data-magnetic]").forEach((el) => {
      const mx = gsap.quickTo(el, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      const my = gsap.quickTo(el, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * 0.3);
        my((e.clientY - r.top - r.height / 2) * 0.4);
      });
      el.addEventListener("pointerleave", () => { mx(0); my(0); });
    });
  }

  /* ---------------- Inquiry form → email ---------------- */
  const form = $<HTMLFormElement>("[data-inquiry]");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const note = $(".form-note", form);
    if (!form.reportValidity()) return;
    const d = new FormData(form);
    const v = (k: string) => String(d.get(k) ?? "").trim();
    const body = [
      `Occasion: ${v("occasion")}`, `Name: ${v("name")}`, `Email: ${v("email")}`,
      v("date") && `Date needed: ${v("date")}`, v("budget") && `Budget: ${v("budget")}`, "", v("message"),
    ].filter((l, i) => l || i === 5).join("\n");
    location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(`Inquiry — ${v("occasion")} — ${v("name")}`)}&body=${encodeURIComponent(body)}`;
    note.textContent = "Opening your email app. Thank you, we'll be in touch within a day.";
  });

  addEventListener("load", () => ScrollTrigger.refresh());
}
