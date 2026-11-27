# Curly's Kitchen

One-page site for Curly's Kitchen ([@curlyskitchen1](https://www.instagram.com/curlyskitchen1/)), steak
and chicken boxes in Walkden, Worsley. Built by CG Design & Co.

## Develop

```bash
cd clients/curlys-kitchen
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
```

- Page and all copy: `src/pages/index.astro`. Phone, address, hours, menu, reviews and reels are plain data at the top.
- Styles and colour tokens: `src/styles/global.css` (orange `#f0511e` and cream from their logo, warm espresso black).
- Motion: `src/scripts/main.ts` (GSAP + ScrollTrigger + SplitText).
- 3D takeaway box: `src/scripts/box.ts` (Three.js, loaded after the first paint, pauses when off screen).
- Fonts: Fraunces (headings) and Schibsted Grotesk (text), self-hosted via Fontsource.
- Logo: cut from their Instagram profile picture (`assets/originals/`).

## Buttons

Every "Call to order" button rings 07309 449502. The closing section also links to their Instagram DMs.
Phones get an app-style tab bar (Menu, Reviews, Order, Find us, Instagram).

The "Open now / Opens 5pm" badge works out UK time in the browser from `hours` in `index.astro`.
Change the hours there and the badge, table and Google data all follow.

## Photos and reels

The page is designed to look finished without photos. Each photo or reel appears once its file is in
`public/media/`:

| File | Where it shows |
| --- | --- |
| `menu-steak-box.webp`, `menu-surf-n-turf.webp`, `menu-crispy-chicken.webp`, `menu-wraps.webp`, `menu-burrito.webp`, `menu-shakes.webp` | Menu: a thumbnail on phones, a photo that follows the cursor on desktop |
| `reel-big-boxes.mp4/.webp`, `reel-surf-n-turf.mp4/.webp`, `reel-eighteen.mp4/.webp` | "Straight off the grill" (silent loops that play while on screen) |

Keep originals in `assets/originals/`, then:

```bash
tools/media.sh menu assets/originals/steak.jpg steak-box
tools/media.sh reel assets/originals/big-boxes.mp4 big-boxes 2   # 2 = start the loop 2s in
```

Then `npm run build`, check it, commit and merge to `main`.

## Motion

- Hero: headline rises line by line, the orange disc springs in, the 3D box's lid peeks open with steam, and it opens fully as you scroll. Drag to spin it.
- Ticker: dish names scroll on their own and speed up with your scroll.
- Menu: rules draw across, dishes rise in.
- The sauce: the quote's words light up as you read.
- Reviews: the 5.0 counts up; two rows of reviews drift in opposite directions (tap and hold to pause).
- Reels: rise in; loops play only while on screen.
- Footer: the wordmark rises word by word.

All of it runs on phones, and it plays with Reduce Motion on too (studio convention).

## Deploy (Vercel)

Same as the other clients: import the repo, set **Root Directory** to `clients/curlys-kitchen`, deploy,
then add the domain. `astro.config.mjs`, `robots.txt` and `sitemap.xml` use `www.curlyskitchen.co.uk`
as a placeholder; change them once a domain is bought. No environment variables are needed.

## To confirm with Curly's

- When the move to Boothstown Precinct happens: update `address`, the hero ribbon and the "Moving soon" card.
- Address: Google says M28 3TR, the Food Standards Agency says First Floor, Linnyshaw Mill, M28 3WR. The site uses the Google postcode.
- Is "Free shake Thursdays before 6pm" still running? (Not on the site yet.)
- Prices for the menu, if they want them shown.
