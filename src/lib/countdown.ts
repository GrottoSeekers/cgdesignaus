// Live countdown to the end of the founding client offer (FOUNDING_ENDS in pricing.ts).
//
// Markup: any element with [data-countdown="<ISO end time>"] holding children marked
// [data-cd="d" | "h" | "m" | "s"]. Each one gets its number every second. When the time
// runs out, every [data-offer] element on the page is hidden. The next build turns the offer
// off for good; this covers a page someone left open past midnight.
import { animate } from "motion";
import { prefersReducedMotion } from "./motion-utils.js";

const pad = (n: number) => String(n).padStart(2, "0");

let started = false;

export function startCountdowns() {
  if (started) return; // the bar and the pricing banner both call this
  started = true;
  const timers = Array.from(document.querySelectorAll<HTMLElement>("[data-countdown]"));
  if (!timers.length) return;

  const ends = new Date(timers[0].dataset.countdown ?? "").getTime();
  if (Number.isNaN(ends)) return;
  const reduce = prefersReducedMotion();

  const tick = () => {
    const left = Math.max(0, ends - Date.now());
    if (left === 0) {
      document.querySelectorAll<HTMLElement>("[data-offer]").forEach((el) => (el.hidden = true));
      window.clearInterval(id);
      return;
    }
    const s = Math.floor(left / 1000);
    const parts: Record<string, string> = {
      d: String(Math.floor(s / 86400)),
      h: pad(Math.floor((s % 86400) / 3600)),
      m: pad(Math.floor((s % 3600) / 60)),
      s: pad(s % 60),
    };
    timers.forEach((t) =>
      t.querySelectorAll<HTMLElement>("[data-cd]").forEach((el) => {
        const next = parts[el.dataset.cd ?? ""];
        if (next === undefined || el.textContent === next) return;
        el.textContent = next;
        // Big boxes on the pricing page give each new number a small drop-in.
        if (!reduce && el.closest(".cd-boxes")) {
          animate(el, { y: [-6, 0], opacity: [0.35, 1] }, { duration: 0.35, ease: [0.16, 1, 0.3, 1] });
        }
      })
    );
  };

  const id = window.setInterval(tick, 1000);
  tick();
}
