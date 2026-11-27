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

## Content

Copy, prices, Stripe checkout links, the Calendly link, the two client testimonials, the
included list, the 4-step "How it works" and the 12-week results guarantee all come from
Broghan's own draft at broghanwilson.com.

## Still needed from Broghan

The VSL, photos (clients, a portrait of him, screenshots/GIFs for the included cards), more
written reviews (add them to `reviews` in `SalesPage.astro`; the wall goes to two rows at 6), his 3-part story, privacy policy and terms, and an
answer for "Do I need a gym?".

## A/B testing

Visitors to `/` are split 50/50 between **Variant A** (the page as written) and **Variant B**
(A plus a few overrides) before the page loads, so nobody sees it swap. Each visitor keeps their
variant for 30 days (cookie `bw_ab_<test id>`). Search engines, link previews and site checkers
always get A, and Variant B's page is marked noindex, so SEO only ever sees A.

**Preview links** (they also stick on refresh, on phone or laptop):
- `https://broghan-wilson-pt.vercel.app/?variant=a`
- `https://broghan-wilson-pt.vercel.app/?variant=b`
- `?variant=reset` forgets your variant and re-rolls 50/50.

### Deploying

Build Vercel's output locally, then deploy exactly that, so what's tested is what goes live:

```bash
npx vercel pull --yes --environment=production
npx vercel build --prod
npx vercel deploy --prebuilt --prod
```

`middleware.ts` imports the config as `./src/ab-test.config.js` (with `.js`). Vercel runs the
middleware without bundling, so leaving the extension off breaks the homepage with a 500.

### Files

| File | What it does |
| --- | --- |
| `src/ab-test.config.ts` | **The only file to edit.** Test id, on/off, split, and what Variant B changes. |
| `middleware.ts` | Vercel Routing Middleware. Picks the variant, sets the cookie, serves `/v/b/` to group B. |
| `src/components/SalesPage.astro` | The whole page. Takes `variant` and applies the config's overrides. |
| `src/pages/index.astro` | Variant A at `/`. |
| `src/pages/v/b.astro` | Variant B (only reached through the middleware; noindex). |
| `src/scripts/track.ts` | Exposure and conversion tracking. |

### Editing Variant B

Everything is in `variants.b` in `src/ab-test.config.ts`:
- `hero.headline`, `hero.uppercut`: swap the headline or subheading.
- `hero.cta`: button label, and `action: "pricing"` (scroll to plans, direct checkout) or `"call"` (open the free-call booking).
- `pricing.featured` (`"monthly"` / `"3months"`), `featuredFirst`, `flag`, `ctaLabels`: how the plans are presented.
- `pricing.callFirst`, `callTitle`: move the book-a-call box above the plans and make it the yellow button.

The current test (`lead-first-01`) asks whether leading with a free call beats direct checkout:
B's hero button books a call, and the call box sits above the plans. Change one idea per test.

### Reading the results

Events: `experiment_view` (every page load), `click_join_today`, `click_select_monthly_plan`,
`click_select_3month_plan`, `click_book_call`, `vsl_play`. Each carries the variant and where on
the page it was clicked.

- **Free (Hobby plan):** Vercel → broghan-wilson-pt → Analytics → **Pages**. Each event shows as a
  page path `/ab/<test id>/<variant>/<event>`, e.g. `/ab/lead-first-01/b/click_select_3month_plan`.
  Conversion rate = that row's **Visitors** ÷ the Visitors on `/ab/<test id>/<variant>/experiment_view`.
  Compare A's rate with B's for the same event. Use the time filter to cover the whole test.
- **Pro plan:** the same events also appear under Analytics → **Events**, filterable by `variant`.
- `window.dataLayer` gets every event too, ready for Google Tag Manager / GA4.

Rough guide: wait for a few hundred visitors per variant and at least a week before calling it.
Stripe and Calendly are the real finish line; compare these clicks with actual sign-ups there.

### Ending a test

1. Set `enabled: false` in `src/ab-test.config.ts` and deploy. Everyone sees A, nothing else changes.
2. If B won, copy B's settings into the page itself (the matching defaults in
   `src/components/SalesPage.astro`), then empty `variants.b`.
3. To start the next test, put the new idea in `variants.b`, give it a new `id`, set `enabled: true`.

To remove A/B testing completely: delete `middleware.ts`, `src/ab-test.config.ts` and
`src/pages/v/`, then in `SalesPage.astro` remove the config import and replace `ov.…` /
`shownPlans` / `heroCta` / `callFirst` with the plain values. Keep `src/scripts/track.ts` if you
still want the click tracking.

## Client videos

The "Hear it from my clients" video section is built but switched off (`showVideoTestimonials`
in `src/components/SalesPage.astro`), because Broghan only has written testimonials so far.
Set it to `true` and fill in `videoTestimonials` when he has videos.
