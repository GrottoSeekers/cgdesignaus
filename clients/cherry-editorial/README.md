# Cherry Candy & Gift Store — homepage

Homepage for Cherry Candy & Gift Store (Dynamic Mall, Nairobi). Built by CG Design & Co.
The earlier multi-page site is in `clients/cherry-gift-store`.

```bash
cd clients/cherry-editorial
npm install
npm run dev -- --host   # http://localhost:4321
npm run build           # static site in dist/
```

## Design

Follows Apple's design language (apple.com / Human Interface Guidelines):

- **Type:** one sans-serif. SF Pro on Apple devices via the system font stack, Inter Tight (self-hosted) elsewhere.
  Large bold headlines with tight tracking, short copy, balanced line breaks.
- **Colour:** white and `#f5f5f7` sections, `#1d1d1f` text, `#6e6e73` secondary text. Cherry red `#b3122e`
  is the single accent, used only for actions and links.
- **Shape:** 22–28px rounded tiles and media, pill buttons, frosted-glass sticky nav (52px).
- **Motion ([Motion](https://motion.dev), restrained, like the other client builds):** hero copy rises in; the photo
  carousel autoplays with progress dots and swipes on touch; the stage grows slightly as it scrolls in; highlight icons
  draw in; the statement darkens word by word; sections, cards and tiles cascade up; the segmented control has a sliding
  indicator; FAQ accordion; floating WhatsApp chat card; buttons lift on hover and press in on tap; highlight and review
  cards lift on hover. Product photos and tiles stay still. Native scrolling.
- **Reduce Motion:** like Nigel's, the gentle motion plays for every visitor (client decision); only jump-scrolling is
  made instant.

Page order: nav · hero (headline, subhead, two CTAs, photo carousel with dots) · highlights · statement ·
the collection (segmented filter, product tiles, horizontal scroller on phones) · about · reviews · FAQ · order form · footer
· floating chat button.

## Editing content

Everything lives in **`src/data/content.ts`**: hero copy and slides, highlights, products (`image` or `video`,
`category`, optional `price`), about, testimonials, order form options, and `brand` details.

- Photos go in `public/media/` (originals in `assets/originals/`). Product tiles are 4:5, so portrait photos work best.
- Product videos: short muted MP4 + WebM fallback + a poster image. They play only while on screen.

## Before launch
- Prices for products that show "Ask for price".
- **The testimonials are samples** and show a "Sample review" note until replaced with real ones.
- Set `brand.whatsappNumber` so orders open WhatsApp already typed (until then the order is copied for pasting).
- `site` in `astro.config.mjs` → the real domain.
- Deploy like the other client sites: Vercel, Root Directory `clients/cherry-editorial`.
