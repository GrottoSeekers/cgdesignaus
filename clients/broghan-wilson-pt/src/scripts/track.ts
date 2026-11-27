// Conversion tracking for the A/B test (and the page in general).
//
// Every event is sent three ways:
//  1. A Vercel Analytics custom event (name + variant). These appear under
//     Analytics → Events, which needs a Vercel Pro plan.
//  2. A "virtual page" view at /ab/<test id>/<variant>/<event>. These show up
//     in the free Hobby plan's Analytics → Pages list, so the two variants can
//     be compared there without upgrading. Conversion rate for an event =
//     its visitors ÷ visitors on /ab/<id>/<variant>/experiment_view.
//  3. window.dataLayer, ready for Google Tag Manager / GA4 if added later.
//
// Events: experiment_view (once per page load), click_join_today,
// click_select_monthly_plan, click_select_3month_plan, click_book_call, vsl_play.
// Buttons opt in with data-track="<event>" (and data-where="<place on page>").
import { inject, pageview, track } from "@vercel/analytics";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

const root = document.documentElement;
const variant = root.dataset.variant || "a";
const experimentId = root.dataset.experiment || "none";
const abOn = root.dataset.ab === "on";

inject({ framework: "astro" });

export function trackEvent(name: string, props: Record<string, string> = {}) {
  const data = { variant, experiment: experimentId, ...props };
  try {
    track(name, data);
  } catch {}
  try {
    const path = abOn ? `/ab/${experimentId}/${variant}/${name}` : `/events/${name}`;
    pageview({ route: path, path });
  } catch {}
  try {
    (window.dataLayer = window.dataLayer || []).push({ event: name, ...data });
  } catch {}
}

export function initTracking() {
  if (abOn) trackEvent("experiment_view");
  // one listener for every tracked button, including ones that leave the page (Stripe, Calendly)
  document.addEventListener(
    "click",
    (e) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-track]");
      if (!el) return;
      trackEvent(el.dataset.track!, el.dataset.where ? { where: el.dataset.where } : {});
    },
    { capture: true }
  );
}
