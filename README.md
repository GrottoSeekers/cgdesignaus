# CG Design & Co.

Marketing site for CG Design & Co., a web-design studio helping local
businesses that either don't have a website yet, or have one that badly
needs an upgrade. Australia-based, open to clients anywhere.

Built with [Astro](https://astro.build/) — a lightweight stack, cheap to
host and easy to hand-edit later.

Live at **https://cgdesignaus.com**.

---

## Status

Everything below is live and configured with real business details —
this is not a placeholder build:

- [x] **Name & logo**: "CG Design & Co." with the pixel-block `CGDesign`
      lockup (`public/logo-full.png`, `public/favicon.png`), in the
      Purple, Black & White palette (`src/styles/global.css`).
- [x] **Contact email/phone**: `info@cgdesignaus.com` /
      WhatsApp `+44 7306 100251`, in `src/components/Contact.astro`.
- [x] **Contact form endpoint**: wired up to [Web3Forms](https://web3forms.com)
      in `src/components/Contact.astro` (the `access_key` hidden input). To
      change the destination email, generate a new access key at
      web3forms.com and swap that value.
- [x] **Pricing**: real AUD figures in `src/components/Pricing.astro`.
- [x] **Domain**: `astro.config.mjs` points at `https://cgdesignaus.com`;
      `public/CNAME` holds the custom domain for GitHub Pages.
- [x] **Legal pages**: Privacy, Terms & Conditions, Cookies, Refund Policy
      — all filled in with the real ABN, address, and NSW governing law.
- [x] **Real client work**: `src/components/Client.astro` is a carousel of
      real client sites (Nigel's Hairdressing, NIR-MA-TA, Rochses) with real
      screenshots. `src/components/BeforeAfter.astro` is a drag-to-compare
      slider of Nigel's old Wix site vs. the rebuild. The fictional concept
      demos have been removed.

---

## Getting Started (Local Development)

### Prerequisites

You need **Node.js** installed (version 18 or higher). Download it from
[nodejs.org](https://nodejs.org/).

```bash
node --version
```

### Install & Run

```bash
npm install
npm run dev
```

This starts a local server (usually at `http://localhost:4321`).

### Build for Production

```bash
npm run build
```

Creates a `dist/` folder with the final site.

---

## Deploying with GitHub Pages

This repo already includes `.github/workflows/deploy.yml`, which builds and
deploys on every push to `main`.

1. Go to the repo on GitHub → **Settings → Pages**
2. Under **Source**, select **GitHub Actions**
3. Push to `main` — the site will build and deploy automatically

The site is already configured for its custom domain via `public/CNAME`
and `astro.config.mjs`'s `site` value — live at https://cgdesignaus.com.

---

## Project Structure

```
/
├── public/              # Static assets (favicon, images)
├── src/
│   ├── components/      # Header, Hero, Services, Pricing, Contact, etc.
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   └── index.astro
│   └── styles/
│       └── global.css   # Colours, type, and shared design tokens
├── astro.config.mjs
└── package.json
```

## Design tokens

Colours, fonts, and spacing live at the top of `src/styles/global.css` as
CSS variables (`--ink`, `--accent`, `--paper`, etc.) — change them there
once you've settled on real branding and every section updates.

---

## Reusing this for client sites

This project doubles as a starting template: for each local-business
client, copy this repo, swap the copy/branding/colours for their business,
replace the sections that don't apply (e.g. drop Pricing for a client
site), and point the GitHub Pages / custom domain setup at their domain
instead.
