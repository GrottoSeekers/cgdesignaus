# Homepage redesign — implementation handoff

This folder holds the approved redesign of the cgdesignaus.com homepage, made with
Callum in a design session. The job now is to rebuild the real Astro site so it
looks and behaves **exactly** like the reference, on laptop and phone.

## What's in here

| Path | What it is |
| --- | --- |
| `../redesign-preview/index.html` | **The reference.** A standalone build of the final design with its images. Open it in a browser; match it pixel for pixel. |
| `canvas/Main.dc.html` | The design source (a Claude Design canvas artboard). Same design, with the interactive logic in a `class Component` script at the bottom. Holds all the data (clients, FAQ, prices). |
| `canvas/canvas.json` | Canvas index (only needed to reopen the canvas). |
| `tools/build_preview.py` | Turns `canvas/Main.dc.html` into the standalone preview. Usage: `python3 design/tools/build_preview.py design/canvas/Main.dc.html /tmp/frag.html redesign-preview/index.html` (needs `redesign-preview/images/`). |

Online copies (private to Callum's account): canvas https://claude.ai/artifact/7UAcdMmtMZknnfF6NASBeD,
preview https://claude.ai/artifact/G1N29UKZXTMNETM5DRErLo. Phone-friendly link to the
pushed preview: https://raw.githack.com/GrottoSeekers/cgdesignaus/claude/laughing-maxwell-iea975/redesign-preview/index.html

## Ground rules

- Follow `CLAUDE.md`: animations use the patterns in `./Anime JS` and `./Motion.dev`
  (the site already depends on `motion`; see `src/lib/motion-utils.js`).
- Keep everything that isn't part of the redesign: SEO meta and JSON-LD schemas in
  `src/pages/index.astro`, the Web3Forms contact form submission, hCaptcha, cookie
  consent, legal pages, `public/CNAME`.
- Every scroll effect must work in **iOS Safari**. Do not rely on CSS
  `animation-timeline: view()/scroll()` (unsupported on many iPhones). Use
  IntersectionObserver / scroll listeners / Motion's `inView` + `scroll`. The preview
  already does this; copy its approach.
- Content must be visible if JS fails or the user prefers reduced motion
  (`prefers-reduced-motion: reduce` → no animation, everything shown).
- **Callum reported that animations in the preview still didn't seem to work on his
  iPhone.** That was not reproduced (only Chromium was available, including mobile
  emulation, where everything worked). Treat real iOS Safari as the acceptance test:
  run Playwright **WebKit** (`npx playwright install webkit`) with an iPhone device
  profile, and fix anything that doesn't animate there.
- No pills/bubble labels except the hero badge. No AI-sounding copy. Keep copy
  exactly as below unless Callum changes it.

## Brand tokens (unchanged from the current site)

Ink `#14111a` · deep plum `#2f1147` · purple `#5b2a96` · violet `#7c4fc7` ·
lilac `#b58cf0` / `#d8bff0` · lavender ground `#f3f0f8` · hero/footer ground `#12071c` ·
live green `#7cd68c`. Fonts: **Fraunces** (headings, italic accents) + **Plus Jakarta
Sans** (body). Section headings are `font-weight: 500; clamp(2.2rem, 4.4vw, 3.6rem);
letter-spacing: -0.03em` with the second phrase in italic 600 purple.

## Section by section (top to bottom)

Order on the page: Header → Hero → Work (`#client`) → Before & after (`#before-after`)
→ Pricing (`#pricing`) → How it works (`#process`) → FAQ (`#faq`) → Contact (`#contact`)
→ Footer. Section backgrounds: hero dark, work white, before & after white, pricing
lavender, process white, FAQ lavender, contact lavender, footer dark.

### Header (`Header.astro`)
- Frosted white sticky bar (`backdrop-filter: blur(16px) saturate(1.4)`), slides down on load.
- Links in a soft rounded tray, **in page order**: Work, Redesign, Pricing, Process, FAQ.
  The link for the section in view is a dark plum pill (`#2f1147`, white text).
- CTA "Free website check →" (arrow slides on hover).
- 2px purple gradient reading-progress line along the bottom edge, filled by scroll.
- Phone: unchanged burger + drawer.

### Section dot rail (`SectionNav.astro`) — Callum loves this, keep it
- Labels: Work, Redesign, Pricing, Process, FAQ, Contact. Active dot grows and turns purple.
- **New:** while the rail's vertical middle is over a dark section (hero, footer) it
  switches to white (line `rgba(243,238,250,.28)`, dots `.5`, active dot solid white
  with faint ring), fading over ~0.4s.

### In-page link behaviour (all `href="#..."` links)
- Custom eased glide (easeInOutQuint, 650–1300ms by distance, offset 78px for the header).
- Clicked nav link: press squish + purple ring pulse; becomes active immediately.
- On arrival the target section's eyebrow + h2 "land" (lift in, eyebrow line draws).
- Reduced motion: jump.

### Hero (`Hero.astro`) — dark
- Background `#12071c` with three slowly drifting blurred purple glows and a faint
  64px grid masked to the centre. Padding top 48px.
- Badge (pill, the only one allowed): green pulsing dot · "WEB DESIGN STUDIO" | divider |
  "SYDNEY, AUSTRALIA" (softer). Plum fill, lilac gradient hairline border, purple
  glow, one light sheen sweep on load.
- H1 lines rise in one by one: "Your business" / "online in" / *"under a week."* — the
  italic part has a slow shimmer gradient, plus a hand-drawn lilac underline that draws in.
- Lead: "Fast, mobile-first websites for local businesses — with a fixed price and a
  launch date agreed in writing before any work begins."
- Buttons: "Get your free website check →" (violet, glow, repeating light sweep) and
  "See our work" (outline).
- Stats row (3 cols): **<7 days** From go-ahead to live · **Fixed** Price agreed up front ·
  **100%** Yours to own.
- Visual: browser mockup tilts in (3D), then floats; straightens on hover. Phone
  mockup bottom-left floats. Use the **base** screenshots
  (`nigels-desktop-base.webp`, `nigels-hero-base.webp`) with `NigelStrands`
  overlays — the hair strands **must draw in on first page load** (desktop box
  `left 42 / top 9.382 / w 58 / h 70.977`, phone box `left 0 / top 8.2324 / w 100 / h 36.3196`),
  delayed ~0.9s / 1.3s so they start after the tilt-in. No floating labels on the mockups.
- Bottom marquee strip (services only, no client names): Custom website builds ✦
  Website redesigns ✦ Local SEO ✦ Online booking systems ✦ Online stores ✦
  Maintenance & hosting ✦ Copywriting & images included.

### Work (`Client.astro`) — white
- Eyebrow "Our work"; h2 "A few of the businesses we've helped *get online.*"
- Side text: "We designed, wrote and launched every one of these ourselves. Tap any
  phone to see the live site." + "Start your project →".
- Clients render from **one data list** (name, kicker, blurb, href, link label,
  screenshots, scroll speed). Layout by count: 1 → single centred, 2 → two centred,
  3 → row with middle raised 56px, **4+ → swipeable track, three per view, prev/next
  arrows + dots** (active dot stretches to a pill). Phones: always a swipe row
  (82% cards, snap) with "Swipe to see more →".
- Each client is a dark phone frame (276px, notch) whose screenshot column
  **auto-scrolls** down and back (keyframe with pauses; durations 20s / 34s / 18s,
  Rochses delay −6s). Hover pauses and lifts.
- Data: NIR-MA-TA (Espresso cart · Lombok; hero + menu shots), Nigel's Hairdressing
  (Mobile hairdresser · Wigan & Rochdale; `nigels-after-mobile.webp` full page),
  Rochses (Womenswear label · Launching soon; hero + signup shots). Blurbs in the canvas data.

### Before & after (`BeforeAfter.astro`) — white
- Eyebrow "Before & after"; h2 "This is what your website *could become.*"; side text
  "Same business, same name, a completely different first impression. Drag the handle
  and see the difference for yourself."
- Frame (600px desktop / 420px phone) with a light browser bar showing the domain; no
  labels/pills. Pages scroll **only when the user scrolls inside** (no auto scroll).
- Handle demo: swings 46% → 18% → 82% → 46% over 10s, repeating, **until the visitor
  first drags**, then it stays where they leave it.
- Drag anywhere on the frame with mouse or finger (horizontal drag moves the handle,
  vertical swipe still scrolls inside). Keep a range input for keyboard users.
- Caption: "Drag the handle to compare · Scroll inside the frame to read both pages ·
  See the live site →".
- Three cards, identical layout (old crossed out on line 1, arrow + new on line 2,
  description): Dated Wix template → Fast custom build; Stock photos → Your real work;
  Plain price list → Clear prices, one-tap booking. Phone: one compact row of three,
  descriptions hidden.

### Pricing (`Pricing.astro`) — lavender
- Eyebrow "Pricing"; h2 "Three packages. *One fixed price.*"; side text "The price you
  see is the price you pay."
- Founding banner: big "50% off", pulsing green dot "FOUNDING CLIENT OFFER", text,
  slow sheen.
- Cards as now (prices from the existing calculation), bigger Fraunces prices. On
  scroll-in each price **counts down** from full to founding price, then a line draws
  through the RRP, then ticks pop in one by one. Cards fade up staggered, lift on hover.
- Growth: "Recommended" small text label (not a pill) + slowly rotating conic-gradient
  glowing border.
- **Phone:** the three packages sit side by side as compact blocks (name + price +
  RRP only). Tap a block to select it (ring) and show its tagline, ticks (2 columns)
  and "Start with …" button in one panel below. Growth selected by default.
- Footnote + "Or build your own quote" bar: shows the running total while closed, opens
  smoothly (grid-rows transition), chips toggle, total / RRP / monthly update live.
  Same prices as the current estimator. Keep it feeding the contact form as now.

### How it works (`Process.astro`) — white
- Eyebrow "How it works"; h2 "You deal with the designer. *Start to finish.*"
- Intro: "I'm Callum Disley, founder of CG Design & Co. I'll design your site myself,
  and I'm the one you'll talk to the whole way through."
- Three perk cards with icons (globe, person, document-tick): Sydney-based, working
  worldwide / One point of contact / Fixed pricing (+ descriptions). Hover slides right,
  icon fills plum. Phone: a row of three icon tiles, titles only.
- Timeline: vertical line that **fills with scroll**, numbered nodes 01–03 pop in,
  step cards slide in. Labels Day one / Before we start / Within a week (hidden on
  phone; Callum may still change "Day one"). Step 3 is the dark card with a pulsing node.

### FAQ (`FAQ.astro`) — lavender
- Eyebrow "FAQ"; h2 "The questions you're *probably asking.*"; "Anything else, just
  ask — we answer WhatsApp faster than email." + dark "Ask a question / Message us on
  WhatsApp" card. Intro column is sticky on desktop.
- Numbered white question cards; one open at a time, first open; smooth height
  animation; + rotates to × on a plum circle.
- Answer change: "Do you only work with Australian businesses?" → "Not at all. As you
  can see from our work, we're worldwide — we've worked with clients in Indonesia and
  the UK, with more to come. Everything happens over WhatsApp, email and video."
  (Update the FAQ JSON-LD too — it reads from the same list.)

### Contact (`Contact.astro`) — lavender
- Eyebrow "Get in touch"; h2 "Get your free *website check.*"; existing intro text.
- WhatsApp / email method cards (icons, slide on hover). "What happens next" 1–3 list
  (hidden on phone). ABN line.
- Form card: "Tell us about your business" / "Takes about a minute.", taller fields
  with purple focus ring, selectable service chips, full-width "Send it over →".
  **Keep the real Web3Forms submission, validation, consent and hCaptcha.**
- Phone: WhatsApp + email side by side, name + email on one row, smaller fields
  (16px input text so iOS doesn't zoom).

### Footer (`Footer.astro`) — dark like the hero
- Same glows + grid as the hero. **No CTA block** (Callum removed "Ready when you are").
- Logo + blurb, Explore / Legal / Contact columns (underline slides in on hover),
  copyright + "Back to top ↑", then a large outlined italic "CG Design & Co."
  wordmark (stroke `rgba(216,191,240,.38)`) fully visible, rising in on scroll.

## Phone rules (≤640px)

Each section should fit roughly one screen. Section padding ~46/44px, gutters 18px,
h2 1.85rem, hero h1 2.55rem. All grids use `minmax(min(Npx, 100%), 1fr)` so nothing is
ever wider than the screen; no horizontal scroll at 360px. The full list of phone
overrides is the `PHONE` media block in `canvas/Main.dc.html`; copy it.

## Scored pass check (out of 100)

After implementing, score the build against the reference with this rubric, at
1440px, 390px and 360px, in Chromium **and** WebKit (iPhone profile). Take
screenshots of each section side by side with `redesign-preview/index.html` to judge.
Report a table: category, score / max, what lost points. Then fix everything that
lost points and score again. Repeat until it passes.

| # | Category | Max | Full marks when |
| --- | --- | --- | --- |
| 1 | Visual match, desktop | 15 | Every section matches the reference: layout, spacing, colours, type sizes, copy. |
| 2 | Visual match, phone | 15 | Every section matches at 390px and 360px, including the compact rules (3 pricing blocks + tap panel, perk tiles, compact FAQ/contact). |
| 3 | Copy accuracy | 10 | All wording exactly as in this document and the reference; no leftover old copy. |
| 4 | Animations, desktop | 10 | Every animation listed in this document runs as described (load sequence, strands, reveals, count-down, timeline, progress line, glide, rail switch, auto-scroll phones, slider demo). |
| 5 | Animations, iOS Safari | 15 | The same list works in WebKit / real iPhone Safari. Any one missing costs at least 3. |
| 6 | Interactions | 10 | Nav glide + active pill, dot rail, before/after drag (mouse and finger), pricing tap panel, quote builder, FAQ accordion, service chips, work carousel at 4+ clients. |
| 7 | Responsiveness | 5 | No horizontal scroll at 360px; nothing clipped or overlapping at any width from 360 to 1440. |
| 8 | Functionality kept | 10 | Contact form submits via Web3Forms with validation, consent and hCaptcha; quote details reach the form; JSON-LD schemas valid; cookie consent and legal pages work. |
| 9 | Accessibility + reduced motion | 5 | Keyboard focus visible, slider usable by keyboard, buttons/labels correct, `prefers-reduced-motion` shows everything without movement. |
| 10 | Quality | 5 | `npm run build` passes, no console errors, Lighthouse performance/accessibility/SEO not lower than the current site. |
|  | **Total** | **100** | |

**Pass = 95 or more, with full marks in categories 5 (iOS Safari animations) and 8
(functionality kept).** Anything below that is not done.

## Acceptance checklist

- [ ] Side-by-side with `redesign-preview/index.html` at 1440, 390 and 360px: identical.
- [ ] iOS Safari (real device or Playwright WebKit iPhone profile): hero load
      sequence and hair strands, scroll reveals, price count-down, timeline fill,
      reading-progress line, dot rail colour switch, auto-scrolling work phones,
      before/after demo + finger drag, link glide, FAQ and quote builder all work.
- [ ] No horizontal scroll at 360px; no console errors.
- [ ] Reduced motion: everything visible, nothing moves.
- [ ] Contact form still submits through Web3Forms; schemas valid; Lighthouse not worse.
- [ ] `npm run build` passes. Nothing goes to `main` until Callum approves.
