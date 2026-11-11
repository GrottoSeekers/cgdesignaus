# Kettlebaz

One-page site for Ryan Horne ([@kettlebaz](https://www.instagram.com/kettlebaz/)), selling his
rolling 4-week training and nutrition plan at £30 a month. Built by CG Design & Co.

## Develop

```bash
cd clients/kettlebaz
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
```

- Page and all copy: `src/pages/index.astro` (plan items, workouts, steps, FAQs are plain data at the top)
- Styles and colour tokens: `src/styles/global.css`
- Motion: `src/scripts/main.ts` (GSAP + ScrollTrigger + SplitText)
- 3D kettlebell: `src/scripts/kettlebell.ts` (Three.js, lazy-loaded near the price section)
- Fonts: Bodoni Moda (headlines) and Archivo (text), self-hosted via Fontsource
- Media: `public/media/`. Photos and reels come from Ryan's Instagram, graded black and white; originals (in colour) are in `assets/originals/`.

## Buttons

Every "Start for £30" button opens WhatsApp (07780 479139) with a message ready to send.
Phones get an app-style tab bar (Home, Plan, Start, Workouts, More); "More" opens a sheet with his Instagram, TikTok and YouTube. Change links at the top of `index.astro`.

## Motion

- Cover: nameplate letters rise, photo wipes in, headline lines slide up.
- Story: words light up as you scroll past them.
- Plan: tiles wipe in, photos drift inside them.
- Workouts: reels play only while on screen (and swipe sideways on phones).
- How it works: a rail fills as you move down the steps (desktop).
- Price: number counts up; the kettlebell turns with the scroll and can be flicked round.

Everything runs on phones. With Reduce Motion on, the page shows without animation and the reels show posters.

## Deploy (Vercel)

Same as Nigel's: import the repo, set **Root Directory** to `clients/kettlebaz`, deploy, then add the domain.
`astro.config.mjs` and the canonical/sitemap use `www.kettlebaz.co.uk` as a placeholder; change it once a domain is bought.
