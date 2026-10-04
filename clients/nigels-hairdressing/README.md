# Nigel's Hairdressing

One-page site for Nigel's Hairdressing, a mobile hairdresser covering Wigan and Rochdale.
Built by CG Design & Co. from the client-approved build pack.

Live at **https://www.nigelshairdressingwiganandrochdale.com** (hosted on Vercel).

## Develop

```bash
cd clients/nigels-hairdressing
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
```

- Page: `src/pages/index.astro` (copy, prices, FAQ and photo crops are plain data at the top)
- Styles and design tokens: `src/styles/global.css`
- Fonts: Gloock and Hanken Grotesk, self-hosted copies of the Google Fonts files (`public/fonts`, `src/styles/fonts.css`)
- Photos: `public/images/*.webp`. Originals are in `assets/images/`.
- No JavaScript ships: hover effects, hero strand animation and FAQ are all CSS / `<details>`.
- Floating chat button (bottom right) replaces the old Wix chat. It opens a native `popover` card with Text / Call / Instagram message links.

## Fidelity check

`reference/index.html` is the approved design and `qa/verify.cjs` is the build pack's checker.
Don't edit either one to make a check pass.

```bash
npm run build && npx astro preview --port 4321 &
cd qa && npm install && cd ..
node qa/verify.cjs --impl http://localhost:4321   # writes qa/report/
```

The machine running it needs internet access so the reference page can load Google Fonts.
Last result: **203/205 checks.** Pixel diff is 0.02% on desktop and 0.45% on mobile.
The two failures are expected. The reference's "Website by CG Design & Co." line was replaced,
at the client's request, by a CG Design credit strip under the footer (logo plus website, email,
WhatsApp, Instagram and Facebook links), so the checker can't find the "Website by" text.

## Deploy (Vercel)

1. Vercel → **Add New → Project** → import `GrottoSeekers/cgdesignaus`.
2. Set **Root Directory** to `clients/nigels-hairdressing`. The framework is detected as Astro, and `vercel.json` sets the build.
3. Deploy. `ignoreCommand` in `vercel.json` skips rebuilds when a commit doesn't touch this folder.
4. **Settings → Domains**: add `www.nigelshairdressingwiganandrochdale.com` (primary) and
   `nigelshairdressingwiganandrochdale.com` (redirect to www).
5. Add the DNS records Vercel shows to the domain's DNS at Wix (Domains → Manage DNS Records):
   - `A` record, host `@` → `76.76.21.21`
   - `CNAME` record, host `www` → the value Vercel shows (e.g. `cname.vercel-dns.com`)

   First disconnect the domain from the old Wix site. Keep the domain registered with Wix.
