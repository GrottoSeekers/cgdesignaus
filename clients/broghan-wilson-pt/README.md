# Broghan Wilson PT

Long-form, one-page sales funnel for Broghan Wilson PT (1:1 & online coaching). Built by CG Design & Co.

The layout follows jamessmith.business, the page Broghan called "perfect": hero with VSL, client
results, credibility stats and story, what's included, outcomes, video testimonials, a scrolling
review wall, the money-back guarantee, pricing, FAQ and a final CTA, with "Join today" buttons
repeated down the page. It stays inside the rules of his own sales-page brief (see `reference/`):
promise and VSL first, transparent pricing, a bold guarantee, **direct checkout with no sales
calls**, and **no social links**. Every button scrolls to pricing, so nothing leads off the page.

## Develop

```bash
cd clients/broghan-wilson-pt
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
```

## Where things live

- **All copy, prices, checkout links, the VSL and contact details**: the config block at the top
  of `src/pages/index.astro`. Anything in `[BRACKETS]` is still a placeholder from Broghan.
  - `clientsCoached`: set a number and the badge counts up to it.
  - `vsl`: `{ type: "youtube", id }`, `{ type: "vimeo", id }` or `{ type: "mp4", src: "/video/vsl.mp4" }`.
    The video only loads when someone presses play, so the page stays fast.
  - `plans[].checkoutUrl`: Stripe (or similar) payment links. Empty links fall back to `#pricing`.
  - Photos and videos (`results[].photo`, `portrait`, `included[].media`, `videoTestimonials[].src`):
    put files in `public/images` / `public/video` and set the paths. Empty paths show a labelled placeholder.
- **Styles and tokens**: `src/styles/global.css` (accent `--accent: #d4f21c`, Broghan's volt yellow).
- **Fonts**: Anton (headings) and Inter (body), self-hosted via Fontsource.
- **Motion**: `src/scripts/page.ts`.
  - Anime.js: hero timeline (headline split into words rising out of clipped lines, highlight bar
    under "lifetime."), section headings rising word by word, number counters, outcome numbers
    flipping in, rotating guarantee seal, price scramble, tick marks drawing in.
  - Motion: scroll reveals (`inView` + springs), scroll-linked glows and story progress line,
    ticker and review-wall marquees (slow down on hover, pause off screen), spring hover/press on
    buttons, card tilt, magnetic hero button, FAQ answers easing in, and the phone sticky
    "Join today" bar (shows after the hero button scrolls away, hides while pricing is on screen).
  - Only transform/opacity animate. Reduce Motion gets a static page. If the script hasn't run
    within 3s, everything shows as-is.
- **Legal**: `src/pages/privacy.astro`, `src/pages/terms.astro` are placeholders for Broghan's text.
- **Reference recordings**: `reference/` (the recordings themselves live in the client's Google Drive).

## Still needed from Broghan

Domain, final headline/subheading, client results, quotes, photos and videos, his story and stats, VSL file or link, guarantee length and terms, plan names,
prices, features and checkout links, contact email/phone, privacy policy and terms.
