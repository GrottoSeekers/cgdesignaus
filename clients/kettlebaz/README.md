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

## Ryan's editing page (`/admin`)

Ryan signs in at **/admin** (email + password) and can:

- **Workouts:** add (name, time/format, moves, video, Instagram link), edit, reorder, hide/show, delete. A cover image is taken from the video on his phone.
- **Photos:** replace the main photo, the training tile and his portrait (resized on his phone before upload), or go back to the original.

Changes show on the landing page straight away: the page loads them when it opens, so no rebuild is needed.
Uploads show in black and white to match. If Supabase is down or not set up, the page shows the built-in content.

How it fits together:

- `src/pages/admin.astro`, `src/scripts/admin.ts`, `src/styles/admin.css`: the editing page (uses `@supabase/supabase-js`)
- `src/lib/content.ts`: shared types; the landing page reads with plain `fetch`, so the public page doesn't ship the Supabase library
- `supabase/setup.sql`: tables, security rules and storage bucket. Anyone can read published content; only a signed-in user can change anything.

### One-time setup

1. Create a free project at [supabase.com](https://supabase.com) (region: London).
2. **SQL Editor → New query**, paste all of `supabase/setup.sql`, **Run**. This also adds the three current workouts so Ryan can edit them.
3. **Authentication → Sign In / Providers:** turn **off** "Allow new users to sign up". Ryan's account is then the only one.
4. **Authentication → Users → Add user → Create new user:** Ryan's email and a temporary password (tick "Auto confirm"). He can change it with "Forgot password?" on /admin.
5. **Authentication → URL Configuration:** set **Site URL** to the live site (e.g. `https://www.kettlebaz.co.uk`) and add `https://www.kettlebaz.co.uk/admin` to **Redirect URLs** (password-reset emails link there).
6. **Project Settings → API:** copy the **Project URL** and the **anon public** key.
7. In Vercel (**Project → Settings → Environment Variables**) add:
   - `PUBLIC_SUPABASE_URL` = the Project URL
   - `PUBLIC_SUPABASE_ANON_KEY` = the anon public key

   Then **Redeploy**. (The anon key is meant to be public; the security rules in `setup.sql` decide what it can do. Never put the `service_role` key here.)

For local work, put the same two lines in `clients/kettlebaz/.env` (git-ignored).

Videos: 50 MB per file on Supabase's free plan. iPhones usually compress a clip when it's picked for upload; if one is too big, the page says so.

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
