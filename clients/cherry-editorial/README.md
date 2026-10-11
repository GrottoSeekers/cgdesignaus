# Cherry Candy & Gift Store — editorial homepage

Editorial, image-led homepage for Cherry Candy & Gift Store (Dynamic Mall, Nairobi), with GSAP, Three.js and Lenis motion.
Built by CG Design & Co. The earlier multi-page site is in `clients/cherry-gift-store`.

```bash
cd clients/cherry-editorial
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
```

## Swapping in the real photography

Everything (images, videos, copy) lives in **`src/data/content.ts`**.

1. Put files in `public/media/` (WebP or JPG, ~2400px wide for the hero, ~1500px for the rest).
2. Add or edit entries in `products` in `content.ts` (`image` or `video`, `category`, optional `price`). Tiles are 4:5, so portrait photos work best.
3. Hero slides can be videos: `{ type: "video", src: "/media/hero.mp4", poster: "/media/hero-1.webp", alt, caption }`.
   Use short, muted, web-encoded MP4s (H.264, ~1920px, under ~8 MB).

Photos supplied by the client (originals in `assets/originals/`): Love Box (KSh 3,800), Roses & Rocher,
Lilac Pamper Box, Care & Period Pack, plus the cherry-and-bow logo. More photos = a fuller gallery and hero sequence.
**The testimonials are samples** and show a "Sample review" note until replaced.

## How it moves

| Where | What | Code |
| --- | --- | --- |
| Whole page | Lenis momentum scroll synced to GSAP ScrollTrigger; cherry-red progress hairline | `src/scripts/main.ts` |
| Loader → hero | Counter, curtain wipe, masked headline lines | `main.ts` |
| Hero | Three.js ambient sequence: noise-displacement dissolve, slow zoom; pinned on scroll while the image settles into an inset frame | `gl.ts` `createHero` |
| Statement | Words light up as you read (SplitText, scrubbed) | `main.ts` |
| Collection | The one product showcase: hairline-ruled grid, category filter, plain `<img>` tiles with a clip-path reveal and gentle scroll parallax (no hover effects), video tiles that play only on screen, "Order" prefills the form | `main.ts` |
| Marquee | Speed and direction follow scroll velocity, with skew | `main.ts` |
| About / inquiry | Clip-path reveal, parallax depth, magnetic send button | `main.ts` |
| Testimonials | Masked line crossfade, autoplay while in view | `main.ts` |
| Footer | Wordmark rises letter by letter | `main.ts` |

Three.js is loaded on demand (separate chunk), so the page never waits for it. WebGL is used only for the hero
sequence and falls back to a CSS crossfade when unavailable. Images and product cards have no hover effects.
`prefers-reduced-motion` turns off smooth scroll, the loader, pins and WebGL, and shows everything statically.

Type: Bodoni Moda (display, optical sizes) + Inter Tight, self-hosted via Fontsource.
Palette: warm whites `#f7f2ee / #efebe4`, soft greys, ink `#1d1b18`, one cherry accent `#a8172d` (`src/styles/main.css`).

## Before launch
- More photos/videos in `content.ts`; real testimonials; set `brand.whatsappNumber` so orders arrive pre-typed.
- `site` in `astro.config.mjs` → real domain.
- The order form sends to WhatsApp (copies the order to paste in until the number is set).
- Deploy like the other client sites: Vercel, Root Directory `clients/cherry-editorial`.
