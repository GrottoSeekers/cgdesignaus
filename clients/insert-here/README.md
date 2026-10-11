# Insert here — gift studio homepage

Editorial, image-led homepage for a gift store (working name "Insert here"). Built by CG Design & Co.

```bash
cd clients/insert-here
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
```

## Swapping in the real photography

Everything (images, videos, copy) lives in **`src/data/content.ts`**.

1. Put files in `public/media/` (WebP or JPG, ~2400px wide for the hero, ~1500px for the rest).
2. Change the `src` values in `content.ts`. Keep each gallery item's `ratio` (`portrait` 4:5, `landscape` 3:2, `square`) matching the photo.
3. Hero slides can be videos: `{ type: "video", src: "/media/hero.mp4", poster: "/media/hero-1.webp", alt, caption }`.
   Use short, muted, web-encoded MP4s (H.264, ~1920px, under ~8 MB).

The files currently in `public/media/` are **generated stand-in plates** for layout and motion only.
The testimonials, email, address and Instagram are placeholders too.

## How it moves

| Where | What | Code |
| --- | --- | --- |
| Whole page | Lenis momentum scroll synced to GSAP ScrollTrigger; brass progress hairline | `src/scripts/main.ts` |
| Loader → hero | Counter, curtain wipe, masked headline lines | `main.ts` |
| Hero | Three.js ambient sequence: noise-displacement dissolve, slow zoom, pointer drift; pinned on scroll while the image settles into an inset frame | `gl.ts` `createHero` |
| Statement | Words light up as you read (SplitText, scrubbed) | `main.ts` |
| Collection | WebGL planes synced to the DOM grid: wipe-up mask reveal, parallax, scroll-velocity bend + chromatic split, hover magnify/ripple, "View" cursor | `gl.ts` `createGallery` |
| Marquee | Speed and direction follow scroll velocity, with skew | `main.ts` |
| Services | Pinned; each image clip-reveals over the last while the list advances | `main.ts` |
| About / inquiry | Clip-path reveal, parallax depth, magnetic send button | `main.ts` |
| Testimonials | Masked line crossfade, autoplay while in view | `main.ts` |
| Footer | Wordmark rises letter by letter | `main.ts` |

Three.js is loaded on demand (separate chunk), so the page never waits for it. WebGL falls back to plain
images with CSS/GSAP clip reveals when unavailable, on touch devices (gallery) and below 900px.
`prefers-reduced-motion` turns off smooth scroll, the loader, pins and WebGL, and shows everything statically.

Type: Bodoni Moda (display, optical sizes) + Inter Tight, self-hosted via Fontsource.
Palette: warm whites `#f6f3ee / #efebe4`, soft greys, ink `#1d1b18`, one brass accent `#9a6d43` (`src/styles/main.css`).

## Before launch
- Real photos/videos in `content.ts`; real testimonials; studio email/address/Instagram in `brand`.
- `site` in `astro.config.mjs` → real domain.
- The inquiry form opens the visitor's email app (`mailto:`). Swap for a form service if preferred.
- Deploy like the other client sites: Vercel, Root Directory `clients/insert-here`.
