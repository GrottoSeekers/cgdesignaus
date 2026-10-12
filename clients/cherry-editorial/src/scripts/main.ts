import { animate, inView, scroll, stagger } from "motion";

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s)!;
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)];

// Same soft ease-out curve as the other client builds.
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/*
 * Motion plays for every visitor, including devices with Reduce Motion on.
 * That matches the other client builds (Nigel's: the motion is gentle and part
 * of the brand). Nothing here flashes, loops endlessly or moves the whole page.
 */
export function boot() {
  heroIntro();
  carousel();
  reveals();
  highlightIcons();
  statementWords();
  collection();
  faq();
  productVideos();
  orderForm();
}

/* ---------------- Hero: copy rises in, stage settles and grows on scroll ---------------- */
function heroIntro() {
  const items = $$("[data-in]");
  items.forEach((el) => (el.style.opacity = "0"));
  animate(items, { opacity: [0, 1], y: [24, 0] }, { duration: 0.9, delay: stagger(0.08, { startDelay: 0.1 }), ease: EASE_OUT });
  const stage = $(".stage");
  stage.style.opacity = "0";
  animate(stage, { opacity: [0, 1], y: [40, 0] }, { duration: 1.1, delay: 0.4, ease: EASE_OUT });

  // The photo grows to full size as it scrolls up into view.
  scroll(animate(".stage-media", { scale: [0.93, 1] }, { ease: "linear" }), {
    target: stage, offset: ["start end", "start 0.2"],
  });
}

/* ---------------- Hero carousel: autoplay with progress dots, swipe, pause off-screen ---------------- */
function carousel() {
  const SLIDE_MS = 5000;
  const stage = $(".stage");
  const media = $(".stage-media");
  const slides = $$<HTMLImageElement | HTMLVideoElement>("[data-slide]");
  const dots = $$<HTMLButtonElement>("[data-dot]");
  const caption = $(".stage-caption");
  const captions = dots.map((d) => (d.getAttribute("aria-label") ?? "").replace(/^Show /, ""));
  if (slides.length < 2) return;
  stage.style.setProperty("--slide-ms", `${SLIDE_MS}ms`);

  let current = 0;
  let timer: number | undefined;
  let visible = true;

  const show = (i: number) => {
    const next = (i + slides.length) % slides.length;
    if (next === current) return;
    slides[current].classList.remove("active");
    slides[current].setAttribute("aria-hidden", "true");
    dots[current].setAttribute("aria-pressed", "false");
    current = next;
    slides[current].classList.add("active");
    slides[current].removeAttribute("aria-hidden");
    dots[current].setAttribute("aria-pressed", "true");
    animate(caption, { opacity: [0, 1], y: [6, 0] }, { duration: 0.5, ease: EASE_OUT });
    caption.textContent = captions[current];
  };
  const play = () => {
    clearTimeout(timer);
    stage.classList.remove("is-playing");
    if (!visible || document.hidden) return;
    void stage.offsetWidth; // restart the dot's progress fill
    stage.classList.add("is-playing");
    timer = window.setTimeout(() => { show(current + 1); play(); }, SLIDE_MS);
  };

  dots.forEach((d, i) => d.addEventListener("click", () => { show(i); play(); }));
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; play(); }, { threshold: 0.25 }).observe(stage);
  document.addEventListener("visibilitychange", play);

  // Swipe between photos on touch screens (and drag with a mouse).
  let startX = 0, startY = 0, tracking = false;
  media.addEventListener("pointerdown", (e) => { tracking = true; startX = e.clientX; startY = e.clientY; });
  media.addEventListener("pointerup", (e) => {
    if (!tracking) return;
    tracking = false;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { show(current + (dx < 0 ? 1 : -1)); play(); }
  });
  media.addEventListener("pointercancel", () => (tracking = false));
}

/* ---------------- Sections and cards fade up as they arrive ---------------- */
function reveals() {
  const groups = new Map<Element, HTMLElement[]>();
  $$("[data-reveal]").forEach((el) => {
    const parent = el.parentElement!;
    groups.set(parent, [...(groups.get(parent) ?? []), el]);
  });
  groups.forEach((els) => {
    els.forEach((el) => (el.style.opacity = "0"));
    // Siblings (cards in a row, FAQ items) cascade one after another.
    inView(els[0].parentElement!, () => {
      animate(els, { opacity: [0, 1], y: [32, 0] }, { duration: 0.9, delay: stagger(0.08), ease: EASE_OUT });
    }, { margin: "0px 0px -12% 0px" });
  });

  const tiles = $$(".tile");
  tiles.forEach((t) => (t.style.opacity = "0"));
  inView(".tiles", () => {
    animate(tiles, { opacity: [0, 1], y: [36, 0] }, { duration: 0.9, delay: stagger(0.07), ease: EASE_OUT });
  }, { margin: "0px 0px -10% 0px" });
}

/* ---------------- Highlight icons draw themselves in ---------------- */
function highlightIcons() {
  $$(".highlight").forEach((card, i) => {
    inView(card, () => { setTimeout(() => card.classList.add("drawn"), 250 + i * 120); });
  });
}

/* ---------------- Statement: words darken as you read ---------------- */
function statementWords() {
  const words = $$(".statement-text .w");
  scroll((progress: number) => {
    const lit = Math.round(progress * words.length * 1.15);
    words.forEach((w, i) => w.classList.toggle("lit", i < lit));
  }, { target: $(".statement-text"), offset: ["start 0.85", "end 0.5"] });
}

/* ---------------- Collection: sliding segmented control + filter ---------------- */
function collection() {
  const bar = $(".segmented");
  const indicator = $(".seg-indicator");
  const segments = $$<HTMLButtonElement>("[data-filter]");
  const tiles = $$("[data-product]");
  const grid = $(".tiles");

  const moveIndicator = (btn: HTMLElement) => {
    indicator.style.width = `${btn.offsetWidth}px`;
    indicator.style.transform = `translateX(${btn.offsetLeft}px)`;
  };
  const active = () => segments.find((b) => b.getAttribute("aria-pressed") === "true") ?? segments[0];
  requestAnimationFrame(() => { moveIndicator(active()); bar.classList.add("has-indicator"); });
  addEventListener("resize", () => moveIndicator(active()));
  document.fonts?.ready.then(() => moveIndicator(active()));

  const applyFilter = (f: string) => {
    const btn = segments.find((b) => b.dataset.filter === f)!;
    segments.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    moveIndicator(btn);
    animate(grid, { opacity: 0 }, { duration: 0.18 }).then(() => {
      tiles.forEach((t) => (t.hidden = !(f === "all" || t.dataset.category === f)));
      grid.scrollLeft = 0;
      animate(grid, { opacity: 1 }, { duration: 0.3 });
      const shown = tiles.filter((t) => !t.hidden);
      animate(shown, { opacity: [0, 1], y: [18, 0] }, { duration: 0.6, delay: stagger(0.05), ease: EASE_OUT });
    });
  };
  segments.forEach((b) => b.addEventListener("click", () => applyFilter(b.dataset.filter!)));
  $$<HTMLAnchorElement>("[data-footer-filter]").forEach((a) => a.addEventListener("click", () => applyFilter(a.dataset.footerFilter!)));

  // "Order" on a product fills in the gift field and nudges the form into view.
  $$<HTMLAnchorElement>("[data-order]").forEach((a) => a.addEventListener("click", () => {
    const gift = document.querySelector<HTMLInputElement>('[data-inquiry] input[name="gift"]');
    if (!gift) return;
    gift.value = a.dataset.order!;
    setTimeout(() => animate(gift, { scale: [1, 1.03, 1] }, { duration: 0.5, ease: EASE_OUT }), 700);
  }));
}

/* ---------------- FAQ: one open at a time ---------------- */
function faq() {
  const items = $$(".faq-item");
  items.forEach((item) => {
    $(".faq-q", item).addEventListener("click", () => {
      const wasOpen = item.classList.contains("open");
      items.forEach((o) => { o.classList.remove("open"); $(".faq-q", o).setAttribute("aria-expanded", "false"); });
      if (!wasOpen) { item.classList.add("open"); $(".faq-q", item).setAttribute("aria-expanded", "true"); }
    });
  });
}

/* ---------------- Product videos play only while on screen ---------------- */
function productVideos() {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    const v = e.target as HTMLVideoElement;
    if (e.isIntersecting) { v.preload = "auto"; v.play().catch(() => {}); } else v.pause();
  }), { threshold: 0.4 });
  $$<HTMLVideoElement>("[data-product-video]").forEach((v) => io.observe(v));
}

/* ---------------- Order form → WhatsApp ---------------- */
function orderForm() {
  const form = $<HTMLFormElement>("[data-inquiry]");
  const send = $(".btn-lg", form);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const note = $(".form-note", form);
    if (!form.reportValidity()) {
      animate(send, { x: [0, -8, 8, -5, 5, 0] }, { duration: 0.4 });
      return;
    }
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
    } else {
      // The shop's short WhatsApp link can't carry text, so copy the order to paste in.
      navigator.clipboard?.writeText(message).catch(() => {});
      window.open(form.dataset.waLink, "_blank", "noopener");
      note.textContent = "Your order is copied. Paste it into the WhatsApp chat and press send.";
    }
    animate(note, { opacity: [0, 1], y: [8, 0] }, { duration: 0.5, ease: EASE_OUT });
  });
}

