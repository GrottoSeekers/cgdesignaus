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
- Styles and colour tokens: `src/styles/global.css` (black + orange; orange always carries black text)
- Motion: `src/scripts/main.ts` (GSAP + ScrollTrigger + SplitText)
- 3D kettlebell: `src/scripts/kettlebell.ts` (Three.js, lazy-loaded near the price section)
- Fonts: Archivo (condensed heavy for headings), self-hosted via Fontsource
- Media: `public/media/`. Photos and reels come from Ryan's Instagram, graded black and white; originals (in colour) are in `assets/originals/`.

## Buttons and links

Every "Start for £30" button opens WhatsApp (07780 479139) with a message ready to send.
Phones get an app-style tab bar (Home, Plan, Start, Workouts, More); "More" opens a sheet with his Instagram, TikTok and YouTube. Change links at the top of `index.astro`.

## Updating the site

Ryan doesn't edit the site himself. He sends new photos, reels or wording to CG Design (or posts
them on Instagram), and we update the code and push. Vercel redeploys from `main`.

**New workout:**

1. Keep the original in `assets/originals/`.
2. Run `tools/grade.sh reel assets/originals/<file>.mp4 <name> [preview-start-seconds]`. That writes
   `public/media/full-<name>.mp4` (full reel with sound), `reel-<name>.mp4` (9-second silent loop)
   and `reel-<name>.webp` (cover).
3. Add an entry to `workouts` at the top of `src/pages/index.astro`: `video` (the loop), `full`, `poster`,
   `ig` (the Instagram post link), `name`, `note` and `moves`. Order in the list is order on the page.

**New photo:** `tools/grade.sh photo assets/originals/<file>.jpg <name> [width]` writes
`public/media/<name>.webp`. The hero uses `ryan-hero-720.webp` and `ryan-hero-1200.webp` (run it twice,
widths 720 and 1200); the plan tiles use `gym-thursday.webp` and `ryan-portrait.webp`.

Then `npm run build`, check it, commit and merge to `main`.

## Motion

- Hero: headline lines slide up, photo wipes in.
- Story: words light up as you scroll past them.
- Plan: tiles wipe in, photos drift inside them.
- Workouts: silent previews play only while on screen; the play button plays the full reel with sound (no controls; tap to pause). Sound stops when you scroll out of the section.
- How it works: a rail fills as you move down the steps (desktop).
- Price: number counts up; the kettlebell turns with the scroll and can be flicked round.
- Footer: the KETTLEBAZ wordmark builds letter by letter.

Everything runs on phones. With Reduce Motion on, the page shows without animation and the reels show posters.

## Deploy (Vercel)

Same as Nigel's: import the repo, set **Root Directory** to `clients/kettlebaz`, deploy, then add the domain.
`astro.config.mjs` and the canonical/sitemap use `www.kettlebaz.co.uk` as a placeholder; change it once a domain is bought.
No environment variables are needed.
