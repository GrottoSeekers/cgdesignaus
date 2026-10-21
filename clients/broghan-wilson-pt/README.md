# Broghan Wilson PT

One-page sales funnel for Broghan Wilson PT (1:1 & online coaching). Built by CG Design & Co.

The structure follows Broghan's own brief ("Anatomy of a Highly Efficient Sales Page", in the
reference recordings): a minimal top bar, a specific promise, a subheading "uppercut", the VSL,
a money-back guarantee, pricing with direct checkout, and a footer. On purpose there are **no
testimonials, no sales-call booking and no social links** — the page's only job is to get a
visitor from the video to checkout. The finish (floating top bar, avatar badge, glows, glowing
featured plan, instalment button) takes its cues from jamessmith.business, which he likes.

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
- **Styles and tokens**: `src/styles/global.css` (accent `--accent: #d4f21c`, Broghan's volt yellow).
- **Fonts**: Anton (headings) and Inter (body), self-hosted via Fontsource.
- **Motion**: `src/scripts/page.ts`.
  - Anime.js: hero timeline (headline split into words rising out of clipped lines, highlight bar
    under "lifetime."), client counter, rotating guarantee seal, price scramble, tick marks drawing in.
  - Motion: scroll reveals (`inView` + springs), scroll-linked glows, spring hover/press on
    buttons, magnetic hero button, and the phone sticky "Choose your plan" bar (shows after the
    hero button scrolls away, hides once pricing is on screen).
  - Only transform/opacity animate. Reduce Motion gets a static page. If the script hasn't run
    within 3s, everything shows as-is.
- **Legal**: `src/pages/privacy.astro`, `src/pages/terms.astro` are placeholders for Broghan's text.
- **Reference recordings**: `reference/` (the recordings themselves live in the client's Google Drive).

## Still needed from Broghan

Domain, final headline/subheading, VSL file or link, guarantee length and terms, plan names,
prices, features and checkout links, contact email/phone, privacy policy and terms.
