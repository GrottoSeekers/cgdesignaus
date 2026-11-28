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

- Page and all copy: `src/pages/index.astro`. Phone, address, hours, the spin ring, menu and reviews are plain data at the top.
- Styles and colour tokens: `src/styles/global.css` (orange `#f0511e` and cream from their logo, warm near-black). Bold and playful: chunky headings on tilted "sticker" blocks, slanted section edges, photo panels.
- Motion: `src/scripts/main.ts` (GSAP + ScrollTrigger + SplitText).
- Drag-to-spin ring of real dishes: `src/scripts/spin.ts` (Three.js, loaded after the first paint, pauses when off screen). The dishes, names and one-liners are the `spin` list in `index.astro`.
- Fonts: Grandstander (headings) and Barlow (text), self-hosted via Fontsource.
- Logo: cut from their Instagram profile picture (`assets/originals/`).

## Buttons

Every "Call to order" button rings 07309 449502. The closing section also links to their Instagram DMs.
Phones get an app-style tab bar (Menu, Reviews, Order, Find us, Instagram).

The "Open now / Opens 5pm" badge works out UK time in the browser from `hours` in `index.astro`.
Change the hours there and the badge, table and Google data all follow.

## Photos

All food photos are Curly's own, from their Instagram (`assets/originals/ig-*.jpg`). The site uses:

- `public/media/spin-<name>.webp` (512x683): cards on the 3D ring
- `public/media/photo-<name>.webp` (720x900): menu cards
- `public/media/boxes-four-tall.webp`, `new-shop.webp`: the two photo panels. `new-shop` is their own image of how the Boothstown shop will look.

To add or swap a photo, keep the original in `assets/originals/`, then:

```bash
convert assets/originals/ig-NAME.jpg -resize 512x683^ -gravity center -extent 512x683 -quality 78 public/media/spin-NAME.webp
convert assets/originals/ig-NAME.jpg -resize 720x900^ -gravity center -extent 720x900 -quality 78 public/media/photo-NAME.webp
```

and reference `NAME` in the `spin` or `menu` list. `tools/media.sh` still makes silent reel loops if they send videos.

## Motion

- Hero: stickers slap on, then the ring of real dishes fades in. Drag or flick it (or use the arrows); it settles on a dish and the label swaps. Idle, it moves on every few seconds; scrolling turns it too.
- Stickers across the page pop in as they arrive.
- Menu cards rise in; photos drift slightly as you scroll.
- The sauce quote rises line by line.
- Reviews: the 5.0 counts up; two rows drift in opposite directions (tap and hold to pause).
- Photo panels wipe up.
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
