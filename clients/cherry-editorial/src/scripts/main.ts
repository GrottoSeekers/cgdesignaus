import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s)!;
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)];
// Apple's standard easing, as a GSAP-friendly curve.
const EASE = "power3.out";

export function boot() {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Hero carousel: crossfade, dots, caption ---------------- */
  const slides = $$<HTMLImageElement | HTMLVideoElement>("[data-slide]");
  const dots = $$<HTMLButtonElement>("[data-dot]");
  const caption = $(".stage-caption");
  const captions = dots.map((d) => (d.getAttribute("aria-label") ?? "").replace(/^Show /, ""));
  let current = 0;
  let timer: number | undefined;
  let heroVisible = true;
  const show = (i: number) => {
    if (i === current) return;
    slides[current].classList.remove("active");
    slides[current].setAttribute("aria-hidden", "true");
    dots[current].setAttribute("aria-pressed", "false");
    current = (i + slides.length) % slides.length;
    slides[current].classList.add("active");
    slides[current].removeAttribute("aria-hidden");
    dots[current].setAttribute("aria-pressed", "true");
    caption.textContent = captions[current];
  };
  const autoplay = () => {
    clearInterval(timer);
    if (reduce || slides.length < 2) return;
    timer = window.setInterval(() => heroVisible && !document.hidden && show(current + 1), 5000);
  };
  dots.forEach((d, i) => d.addEventListener("click", () => { show(i); autoplay(); }));
  new IntersectionObserver(([e]) => (heroVisible = e.isIntersecting), { threshold: 0.2 }).observe($(".stage"));
  autoplay();

  /* ---------------- Product videos play only while on screen ---------------- */
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    const v = e.target as HTMLVideoElement;
    if (e.isIntersecting && !reduce) { v.preload = "auto"; v.play().catch(() => {}); } else v.pause();
  }), { threshold: 0.4 });
  $$<HTMLVideoElement>("[data-product-video]").forEach((v) => {
    io.observe(v);
    v.addEventListener("click", () => (v.paused ? v.play().catch(() => {}) : v.pause()));
  });

  /* ---------------- Collection filter (segmented control) ---------------- */
  const tiles = $$("[data-product]");
  const segments = $$<HTMLButtonElement>("[data-filter]");
  const applyFilter = (f: string) => {
    segments.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === f)));
    const swap = () => {
      tiles.forEach((t) => (t.hidden = !(f === "all" || t.dataset.category === f)));
      ScrollTrigger.refresh();
    };
    if (reduce) return swap();
    gsap.to(".tiles", { opacity: 0, duration: 0.2, ease: "power1.in", onComplete: () => {
      swap();
      gsap.fromTo(".tiles", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: EASE });
    } });
  };
  segments.forEach((b) => b.addEventListener("click", () => applyFilter(b.dataset.filter!)));
  $$<HTMLAnchorElement>("[data-footer-filter]").forEach((a) => a.addEventListener("click", () => applyFilter(a.dataset.footerFilter!)));

  /* ---------------- "Order" on a product fills in the gift field ---------------- */
  $$<HTMLAnchorElement>("[data-order]").forEach((a) => a.addEventListener("click", () => {
    const gift = document.querySelector<HTMLInputElement>('[data-inquiry] input[name="gift"]');
    if (gift) gift.value = a.dataset.order!;
  }));

  /* ---------------- Order form → WhatsApp ---------------- */
  const form = $<HTMLFormElement>("[data-inquiry]");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const note = $(".form-note", form);
    if (!form.reportValidity()) return;
    const d = new FormData(form);
    const v = (k: string) => String(d.get(k) ?? "").trim();
    const message = [
      "Hi Cherry Gift Store! I'd like to place an order 🍒", "",
      v("gift") && `Gift: ${v("gift")}`, `Occasion: ${v("occasion")}`, `Name: ${v("name")}`, `Phone: ${v("phone")}`,
      v("date") && `Date needed: ${v("date")}`, v("budget") && `Budget: KSh ${v("budget")}`,
      v("area") && `Delivery area: ${v("area")}`, v("message") && `Card message / notes: ${v("message")}`,
    ].filter((l, i) => l || i === 1).join("\n");
    const number = form.dataset.waNumber;
    if (number) {
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
      note.textContent = "Opening WhatsApp with your order. We'll reply shortly.";
      return;
    }
    // The shop's short WhatsApp link can't carry text, so copy the order to paste in.
    navigator.clipboard?.writeText(message).catch(() => {});
    window.open(form.dataset.waLink, "_blank", "noopener");
    note.textContent = "Your order is copied. Paste it into the WhatsApp chat and press send.";
  });

  if (reduce) return;

  /* ================= Motion (restrained, Apple-style) ================= */

  // Hero copy rises in on load.
  gsap.from("[data-in]", { opacity: 0, y: 24, duration: 1.1, stagger: 0.09, ease: EASE, delay: 0.1 });
  gsap.from(".stage", { opacity: 0, y: 40, duration: 1.3, ease: EASE, delay: 0.35 });

  // The photo stage grows slightly as you scroll into it.
  gsap.fromTo(".stage-media", { scale: 0.94 }, {
    scale: 1, ease: "none",
    scrollTrigger: { trigger: ".stage", start: "top 85%", end: "top 15%", scrub: true },
  });

  // Statement: words darken as you read.
  document.fonts.ready.then(() => {
    const words = SplitText.create("[data-words]", { type: "words" });
    gsap.fromTo(words.words, { color: "#d2d2d7" }, {
      color: "#1d1d1f", stagger: 0.1, ease: "none",
      scrollTrigger: { trigger: "[data-words]", start: "top 80%", end: "bottom 50%", scrub: true },
    });
  });

  // Sections and cards fade up as they arrive.
  $$("[data-reveal]").forEach((el) =>
    gsap.from(el, { opacity: 0, y: 32, duration: 1, ease: EASE, scrollTrigger: { trigger: el, start: "top 88%", once: true } }),
  );
  ScrollTrigger.batch(".tile", {
    start: "top 90%", once: true,
    onEnter: (batch) => gsap.from(batch, { opacity: 0, y: 32, duration: 0.9, stagger: 0.08, ease: EASE }),
  });

  addEventListener("load", () => ScrollTrigger.refresh());
}
