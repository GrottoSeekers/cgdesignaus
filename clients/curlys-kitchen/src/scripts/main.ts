// Curly's Kitchen page motion. GSAP + ScrollTrigger + SplitText for the page,
// Three.js for the takeaway box in the hero (its own chunk, loaded after the
// first paint). Every effect runs on touch screens; only the magnetic
// buttons and the menu photo that follows the cursor need a mouse.
// Animations also play with Reduce Motion on (studio convention, see the
// CG Design site history); nothing here flashes or loops fast.
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
const heroLines = $$(".hero-title .line > span");
const disc = $("[data-disc]");

gsap.set([...reveals, ...heroFades], { autoAlpha: 0, y: 28 });
gsap.set(heroLines, { yPercent: 115 });
if (disc) gsap.set(disc, { scale: 0.55, autoAlpha: 0 });

/* ---------- Headings: lines rise out of a mask ---------- */
function splits() {
  $$("[data-split]").forEach((el) => {
    SplitText.create(el, {
      type: "lines",
      mask: "lines",
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 110,
          duration: 1.15,
          ease: "expo.out",
          stagger: 0.1,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        }),
    });
  });
}

/* ---------- Hero intro ---------- */
function intro() {
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.to(heroFades[0], { autoAlpha: 1, y: 0, duration: 0.8 }, 0.05);
  tl.to(heroFades[1], { autoAlpha: 1, y: 0, duration: 0.8 }, 0.15);
  tl.to(heroLines, { yPercent: 0, duration: 1.25, stagger: 0.12 }, 0.2);
  tl.to(heroFades.slice(2), { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08 }, 0.55);
  if (disc) tl.to(disc, { scale: 1, autoAlpha: 1, duration: 1.6, ease: "elastic.out(1, 0.75)" }, 0.25);

  // The orange disc drifts up and the stage eases back as you leave the hero.
  const stage = $("[data-stage]");
  if (stage && disc) {
    gsap.to(disc, {
      yPercent: -14,
      scale: 0.92,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
  }
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
    ScrollTrigger.create({
      trigger: sel,
      start: "top 55%",
      end: "bottom 55%",
      onToggle: (self) => setTab(self.isActive ? id : ""),
    });
  });
}

/* ---------- Ticker: always moving, pushed along by your scroll ---------- */
function ticker() {
  const track = $("[data-ticker]");
  if (!track) return;
  const loop = gsap.to(track, { xPercent: -50, duration: 26, ease: "none", repeat: -1 });
  const boost = { v: 1 };
  ScrollTrigger.create({
    trigger: track,
    start: "top bottom",
    end: "bottom top",
    onUpdate: (self) => {
      const v = self.getVelocity() / 260;
      const dir = self.direction;
      gsap.to(boost, {
        v: Math.max(1, Math.min(5, Math.abs(v))) * dir,
        duration: 0.25,
        overwrite: true,
        onUpdate: () => loop.timeScale(boost.v),
        onComplete: () => gsap.to(boost, { v: dir, duration: 1.2, ease: "power2.out", onUpdate: () => loop.timeScale(boost.v) }),
      });
    },
  });
}

/* ---------- General reveals ---------- */
function revealsIn() {
  ScrollTrigger.batch(reveals, {
    start: "top 90%",
    once: true,
    onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.08, overwrite: true }),
  });
}

/* ---------- Menu: rules draw, dishes rise; photo follows the cursor ---------- */
function dishes() {
  const rows = $$("[data-dish]");
  rows.forEach((row) => {
    const rule = $(".dish-rule", row);
    // Animate wrappers, not the h3 itself: the h3 has its own CSS hover move.
    const bits = [$(".dish-no", row), $(".dish-copy", row), $(".dish-thumb", row)].filter(Boolean);
    const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: "top 90%", once: true } });
    if (rule) tl.from(rule, { scaleX: 0, duration: 1.2, ease: "expo.inOut" }, 0);
    tl.from(bits, { y: 26, autoAlpha: 0, duration: 0.9, ease: "expo.out", stagger: 0.06 }, 0.15);
  });

  const float = $("[data-float]");
  const img = float ? $<HTMLImageElement>("img", float) : null;
  if (!finePointer || !float || !img || !rows.some((r) => r.dataset.img)) return;
  const xTo = gsap.quickTo(float, "x", { duration: 0.6, ease: "power3.out" });
  const yTo = gsap.quickTo(float, "y", { duration: 0.6, ease: "power3.out" });
  const rTo = gsap.quickTo(float, "rotation", { duration: 0.8, ease: "power3.out" });
  let lastX = 0;
  window.addEventListener("pointermove", (e) => {
    xTo(e.clientX + 40);
    yTo(e.clientY);
    rTo(Math.max(-10, Math.min(10, (e.clientX - lastX) * 0.6)));
    lastX = e.clientX;
  });
  rows.forEach((row) => {
    const src = row.dataset.img;
    if (!src) return;
    row.addEventListener("pointerenter", () => {
      img.src = src;
      gsap.to(float, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "expo.out", overwrite: "auto" });
    });
    row.addEventListener("pointerleave", () => gsap.to(float, { autoAlpha: 0, scale: 0.6, duration: 0.4, ease: "power3.in", overwrite: "auto" }));
  });
}

/* ---------- The sauce: words light up as you read ---------- */
function sauce() {
  const el = $("[data-scrub-words]");
  if (!el) return;
  SplitText.create(el, {
    type: "words",
    wordsClass: "word",
    autoSplit: true,
    onSplit: (self) =>
      gsap.fromTo(
        self.words,
        { opacity: 0.16 },
        { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: 0.6 } }
      ),
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
      duration: 1.6,
      ease: "power3.out",
      onUpdate: () => (score.textContent = obj.v.toFixed(1)),
      scrollTrigger: { trigger: score, start: "top 85%", once: true },
    });
  }
  const belts = $("[data-belts]");
  if (belts) {
    belts.addEventListener("touchstart", () => belts.classList.add("is-held"), { passive: true });
    const release = () => belts.classList.remove("is-held");
    belts.addEventListener("touchend", release);
    belts.addEventListener("touchcancel", release);
    gsap.from(".belt", {
      xPercent: (i) => (i ? -8 : 8),
      autoAlpha: 0,
      duration: 1.4,
      ease: "expo.out",
      stagger: 0.12,
      scrollTrigger: { trigger: belts, start: "top 88%", once: true },
    });
  }
}

/* ---------- Reels: rise in, play only while on screen ---------- */
function reels() {
  gsap.from("[data-reel]", {
    y: 70,
    autoAlpha: 0,
    duration: 1.1,
    ease: "expo.out",
    stagger: 0.12,
    scrollTrigger: { trigger: "[data-reel-track]", start: "top 85%", once: true },
  });
  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        const v = e.target as HTMLVideoElement;
        if (e.isIntersecting && e.intersectionRatio >= 0.45) {
          if (v.preload !== "auto") v.preload = "auto";
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      });
    },
    { threshold: [0, 0.45] }
  );
  $$<HTMLVideoElement>("video[data-autoplay]").forEach((v) => io.observe(v));
}

/* ---------- Footer wordmark rises word by word ----------
   (Splitting into words, not letters, keeps the italic's kerning and apostrophe.) */
function footWord() {
  const el = $("[data-foot-word]");
  if (!el) return;
  const split = SplitText.create(el, { type: "words", mask: "words", wordsClass: "fw" });
  gsap.from(split.words, {
    yPercent: 110,
    rotation: 4,
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

/* ---------- 3D takeaway box, loaded once the page has painted ---------- */
function box() {
  const stage = $("[data-stage]");
  const canvas = $<HTMLCanvasElement>("[data-box-canvas]");
  if (!stage || !canvas) return;
  const start = async () => {
    try {
      const { createBox } = await import("./box");
      const b = createBox(canvas);
      if (!b) {
        stage.classList.add("no-webgl");
        return;
      }
      gsap.fromTo(canvas, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: "expo.out" });
      // Lid pops open a little and the steam starts.
      gsap.to(b.state, { intro: 1, duration: 1.6, ease: "elastic.out(1, 0.6)", delay: 0.35 });
      // Scrolling past the hero opens the lid the rest of the way.
      ScrollTrigger.create({
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => b.setProgress(self.progress),
      });
    } catch {
      stage.classList.add("no-webgl");
    }
  };
  const go = () => ("requestIdleCallback" in window ? requestIdleCallback(() => start(), { timeout: 900 }) : setTimeout(start, 200));
  if (document.readyState === "complete") go();
  else window.addEventListener("load", go, { once: true });
}

splits();
root.classList.add("motion-ready");
intro();
status();
chrome();
ticker();
revealsIn();
dishes();
sauce();
reviews();
reels();
footWord();
magnetic();
box();

// Fonts change line lengths; measure again once they've landed.
document.fonts?.ready.then(() => ScrollTrigger.refresh());
