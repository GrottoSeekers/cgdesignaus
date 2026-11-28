// Curly's Kitchen page motion. GSAP + ScrollTrigger + SplitText for the page;
// Three.js for the ring of real food in the hero (its own chunk, loaded after
// the first paint). Everything works on touch screens; only the magnetic
// buttons need a mouse. Animations also play with Reduce Motion on (studio
// convention, see the CG Design site history); nothing flashes or loops fast.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

const root = document.documentElement;
const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) =>
  Array.from(el.querySelectorAll<T>(s));
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ---------- Initial states ---------- */
const reveals = $$("[data-reveal]");
const heroFades = $$("[data-hero-fade]");
const heroLines = $$("[data-hero-line]");
const heroPops = $$(".hero [data-pop]");
const pops = $$("[data-pop]").filter((el) => !el.closest(".hero"));

gsap.set([...reveals, ...heroFades], { autoAlpha: 0, y: 26 });
gsap.set(heroLines, { autoAlpha: 0, xPercent: -18, rotation: -9 });
gsap.set([...heroPops, ...pops], { autoAlpha: 0, scale: 0.5 });

/* ---------- Hero intro: stickers slap on ---------- */
function intro() {
  const tl = gsap.timeline({ delay: 0.1 });
  tl.to(heroPops, { autoAlpha: 1, scale: 1, duration: 0.7, ease: "back.out(2.4)" }, 0);
  tl.to(heroLines, { autoAlpha: 1, xPercent: 0, rotation: (i) => (i ? 1.6 : -2), duration: 0.8, ease: "back.out(1.8)", stagger: 0.14 }, 0.12);
  tl.to(heroFades, { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.07 }, 0.45);
}

/* ---------- Stickers pop in as they arrive ---------- */
function stickers() {
  ScrollTrigger.batch(pops, {
    start: "top 88%",
    once: true,
    onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, scale: 1, duration: 0.7, ease: "back.out(2.2)", stagger: 0.12, overwrite: true }),
  });
}

/* ---------- Big quote: lines rise out of a mask ---------- */
function splits() {
  $$("[data-split]").forEach((el) => {
    SplitText.create(el, {
      type: "lines",
      mask: "lines",
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 110,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.1,
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        }),
    });
  });
}

/* ---------- General reveals ---------- */
function revealsIn() {
  ScrollTrigger.batch(reveals, {
    start: "top 90%",
    once: true,
    onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.08, overwrite: true }),
  });
}

/* ---------- Eat in / Collect / Hours ---------- */
function ways() {
  gsap.from("[data-way]", {
    y: 40,
    autoAlpha: 0,
    duration: 0.9,
    ease: "expo.out",
    stagger: 0.1,
    scrollTrigger: { trigger: ".ways", start: "top 85%", once: true },
  });
}

/* ---------- Menu cards rise; photos settle as you scroll ---------- */
function cards() {
  gsap.set("[data-card]", { y: 60, autoAlpha: 0, rotation: (i: number) => (i % 2 ? 2 : -2) });
  ScrollTrigger.batch("[data-card]", {
    start: "top 92%",
    once: true,
    onEnter: (batch) => gsap.to(batch, { y: 0, autoAlpha: 1, rotation: 0, duration: 1, ease: "expo.out", stagger: 0.1 }),
  });
  // Photos inside cards and panels drift slightly against the scroll.
  $$("[data-zoom]").forEach((img) => {
    gsap.fromTo(
      img,
      { yPercent: -5 },
      {
        yPercent: 5,
        ease: "none",
        scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true },
      }
    );
  });
}

/* ---------- Split panels wipe up ---------- */
function panels() {
  $$("[data-panel]").forEach((p) => {
    gsap.fromTo(
      p,
      { clipPath: "inset(18% 0% 0% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: p, start: "top bottom", end: "top 45%", scrub: 0.5 } }
    );
  });
}

/* ---------- Open / closed badge (UK time) ---------- */
type Day = { day: string; d: number; open: string | null; close: string | null };

function status() {
  const raw = $("#hours-data")?.textContent;
  if (!raw) return;
  const hours: Day[] = JSON.parse(raw);
  const badges = $$("[data-status]");
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const nice = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 || 12}${m ? ":" + String(m).padStart(2, "0") : ""}${h < 12 ? "am" : "pm"}`;
  };
  const short = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const update = () => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    const day = short.indexOf(get("weekday").slice(0, 3));
    const now = Number(get("hour")) * 60 + Number(get("minute"));
    const today = hours.find((h) => h.d === day);

    let text = "";
    let state = "closed";
    if (today?.open && today.close && now >= toMin(today.open) && now < toMin(today.close)) {
      const left = toMin(today.close) - now;
      text = left <= 30 ? `Closing soon · ${nice(today.close)}` : `Open now · till ${nice(today.close)}`;
      state = left <= 30 ? "soon" : "open";
    } else if (today?.open && now < toMin(today.open)) {
      text = `Opens today ${nice(today.open)}`;
      state = toMin(today.open) - now <= 60 ? "soon" : "closed";
    } else {
      for (let i = 1; i <= 7; i++) {
        const next = hours.find((h) => h.d === (day + i) % 7);
        if (next?.open) {
          text = `Opens ${i === 1 ? "tomorrow" : short[next.d]} ${nice(next.open)}`;
          break;
        }
      }
    }
    badges.forEach((b) => {
      b.hidden = !text;
      b.classList.toggle("is-open", state === "open");
      b.classList.toggle("is-soon", state === "soon");
      const t = $("[data-status-text]", b);
      if (t) t.textContent = text;
    });
    $$<HTMLTableRowElement>("tr[data-days]").forEach((tr) =>
      tr.classList.toggle("is-today", (tr.dataset.days ?? "").split(",").map(Number).includes(day))
    );
  };
  update();
  setInterval(update, 60_000);
}

/* ---------- Nav + tab bar ---------- */
function chrome() {
  const nav = $("[data-nav]");
  if (nav) {
    ScrollTrigger.create({
      start: 8,
      onEnter: () => nav.classList.add("is-solid"),
      onLeaveBack: () => nav.classList.remove("is-solid"),
    });
  }
  const tabs = $$("[data-tab]");
  const setTab = (id: string) => tabs.forEach((t) => t.classList.toggle("is-current", t.dataset.tab === id));
  [
    ["#menu", "menu"],
    ["#reviews", "reviews"],
    ["#visit", "visit"],
  ].forEach(([sel, id]) => {
    ScrollTrigger.create({ trigger: sel, start: "top 55%", end: "bottom 55%", onToggle: (self) => setTab(self.isActive ? id : "") });
  });
}

/* ---------- Reviews: score counts up; belts pause while touched ---------- */
function reviews() {
  const score = $("[data-score]");
  if (score) {
    const obj = { v: 0 };
    score.textContent = "0.0";
    gsap.to(obj, {
      v: 5,
      duration: 1.4,
      ease: "power3.out",
      onUpdate: () => (score.textContent = obj.v.toFixed(1)),
      scrollTrigger: { trigger: score, start: "top 88%", once: true },
    });
  }
  const belts = $("[data-belts]");
  if (!belts) return;
  belts.addEventListener("touchstart", () => belts.classList.add("is-held"), { passive: true });
  const release = () => belts.classList.remove("is-held");
  belts.addEventListener("touchend", release);
  belts.addEventListener("touchcancel", release);
}

/* ---------- Footer wordmark rises word by word ---------- */
function footWord() {
  const el = $("[data-foot-word]");
  if (!el) return;
  const split = SplitText.create(el, { type: "words", mask: "words", wordsClass: "fw" });
  gsap.from(split.words, {
    yPercent: 110,
    rotation: 6,
    ease: "none",
    stagger: 0.25,
    scrollTrigger: { trigger: el, start: "top bottom", end: "bottom 80%", scrub: 0.5 },
  });
}

/* ---------- Magnetic buttons (mouse only) ---------- */
function magnetic() {
  if (!finePointer) return;
  $$("[data-magnetic]").forEach((btn) => {
    const xTo = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3.out" });
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.18);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.28);
    });
    btn.addEventListener("pointerleave", () => {
      xTo(0);
      yTo(0);
    });
  });
}

/* ---------- Ring of real food, loaded once the page has painted ---------- */
type Dish = { name: string; line: string; src: string };

function spin() {
  const wrap = $("[data-spin]");
  const canvas = $<HTMLCanvasElement>("[data-spin-canvas]");
  const raw = $("#spin-data")?.textContent;
  if (!wrap || !canvas || !raw) return;
  const dishes: Dish[] = JSON.parse(raw);
  const nameEl = $("[data-spin-name]");
  const lineEl = $("[data-spin-line]");

  // Swap the label like a sticker being slapped on.
  const show = (i: number) => {
    const d = dishes[i];
    if (!d || !nameEl || !lineEl) return;
    gsap
      .timeline()
      .to([nameEl, lineEl], { autoAlpha: 0, y: -8, duration: 0.15, ease: "power2.in" })
      .add(() => {
        nameEl.textContent = d.name;
        lineEl.textContent = d.line;
      })
      .fromTo(nameEl, { autoAlpha: 0, scale: 0.6, rotation: -10, y: 0 }, { autoAlpha: 1, scale: 1, rotation: -3, duration: 0.5, ease: "back.out(2.4)" })
      .fromTo(lineEl, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" }, "<0.08");
  };

  const start = async () => {
    try {
      const { createSpin } = await import("./spin");
      let first = true;
      const ring = createSpin(canvas, {
        images: dishes.map((d) => d.src),
        onFront: (i) => {
          if (first) {
            first = false;
            return;
          }
          show(i);
        },
      });
      if (!ring) {
        wrap.classList.add("no-webgl");
        return;
      }
      gsap.fromTo(canvas, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 1.3, ease: "expo.out" });
      $("[data-spin-next]")?.addEventListener("click", () => ring.next());
      $("[data-spin-prev]")?.addEventListener("click", () => ring.prev());
      ScrollTrigger.create({ trigger: ".hero", start: "top top", end: "bottom top", onUpdate: (self) => ring.setScroll(self.progress) });
    } catch {
      wrap.classList.add("no-webgl");
    }
  };
  const go = () => ("requestIdleCallback" in window ? requestIdleCallback(() => start(), { timeout: 700 }) : setTimeout(start, 150));
  if (document.readyState === "complete") go();
  else window.addEventListener("load", go, { once: true });
}

splits();
root.classList.add("motion-ready");
intro();
stickers();
revealsIn();
ways();
cards();
panels();
status();
chrome();
reviews();
footWord();
magnetic();
spin();

// Fonts change line lengths; measure again once they've landed.
document.fonts?.ready.then(() => ScrollTrigger.refresh());
