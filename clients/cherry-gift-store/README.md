# Cherry Candy & Gift Store

Website for Cherry Candy & Gift Store ([@cherry_gift_store](https://www.instagram.com/cherry_gift_store/)), a gift shop in
Dynamic Mall, Nairobi. Built by CG Design & Co.

Pages: Home · Shop · Custom orders · About (with FAQ) · Contact & order form · 404.

## Develop

```bash
cd clients/cherry-gift-store
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
```

## Editing content (no coding needed)

**Everything the client will want to change is in `src/data/site.ts`:** products and prices, categories, the
announcement bar, perks, occasions, FAQ, reviews, WhatsApp settings and social links. Edit, save, redeploy.

- **Add a product:** copy an entry in `products`, change the `slug`, `name`, `price` (`null` = "Price on request",
  `from: true` = "From KSh …"), `category` and `contents`. `featured: true` puts it on the homepage.
- **Add or swap a photo:** put a square-ish `.webp`/`.jpg` in `public/images/` and set `image: "/images/name.webp"`
  plus an `imageAlt` description. Products without a photo show a branded gift-box illustration.
- **Shop notice:** `announcement` (set `show: false` to hide).

## Before launch: checklist

1. **WhatsApp number.** Set `whatsapp.number` in `src/data/site.ts` (e.g. `"254712345678"`). With it, every Order
   button and the order form open WhatsApp with the order already typed. Without it they open the shop's existing
   `wa.me/message/…` link and copy the order to the clipboard for the customer to paste.
2. **Real reviews.** The three reviews in `reviews` are layout samples and show a yellow "Sample" tag. Replace them
   with real customer words (WhatsApp/IG DMs, Google reviews) and remove `sample: true`. Don't launch with samples.
3. **Product photos.** Only the three bouquets have photos (cropped from the Instagram grid, so they're small). Get the
   original photos from the client for every package and add them, ideally 1000px+ and square.
4. **Domain.** Change `site` in `astro.config.mjs` (currently `https://www.cherrygiftstore.co.ke`). It feeds canonical
   URLs, the sitemap, robots.txt and social previews.
5. **Socials.** Add TikTok/Facebook URLs in `business` if they have them (empty ones are hidden).
6. **Shop status.** The announcement bar and About page mention the Dynamic Mall shop being refreshed (from their
   pinned "Note from Cherry" post). Update both when it reopens.

## Google (SEO)

Built in:
- Unique title + description on each page targeting "gift shop / gift packages / flowers Nairobi" searches
- `Store`/`Florist` LocalBusiness schema (address, area served, socials), `Product` + `Offer` schema with KES prices on
  the shop, `FAQPage` schema, `Service` and breadcrumb schema
- `sitemap.xml` and `robots.txt` (generated from `site`), canonical URLs, Open Graph/Twitter cards (`public/images/og.jpg`)
- Fast static pages: self-hosted fonts, small WebP images, almost no JavaScript

After launch (this is what actually gets them found on Google Maps):
1. Create/claim a **Google Business Profile** for "Cherry Candy & Gift Store" at Dynamic Mall, category "Gift shop"
   (secondary: "Florist"), add the website URL, WhatsApp number, photos, and ask happy customers for Google reviews.
2. Add the site to **Google Search Console**, verify the domain, and submit `https://<domain>/sitemap.xml`.
3. Put the website link in the Instagram bio next to the WhatsApp link.

## Deploy (Vercel)

1. Vercel → **Add New → Project** → import `GrottoSeekers/cgdesignaus`.
2. Set **Root Directory** to `clients/cherry-gift-store`. `vercel.json` sets the build and skips rebuilds for commits
   that don't touch this folder.
3. Deploy, then add the client's domain under **Settings → Domains** and set the DNS records Vercel shows.

## Notes

- Fonts: Fraunces + DM Sans, self-hosted via Fontsource (no Google Fonts request).
- Motion: scroll reveals and hero entrance use [Motion](https://motion.dev) (`inView`, `animate`, `stagger`) in
  `src/layouts/Base.astro` and `src/pages/index.astro`. Content is visible without JS and motion is skipped for
  `prefers-reduced-motion`.
- Order form (`src/components/OrderForm.astro`) needs no server; it builds a WhatsApp message.
- `assets/` holds the source crops and the Instagram profile screenshot they came from.
