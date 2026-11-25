# J.Pickles Coaching

Website for James Pickles ([@jamespickles_fitness](https://www.instagram.com/jamespickles_fitness/)):
online coaching and 1:1 PT around Leigh, Wigan, Westhoughton and Bolton. Built by CG Design & Co.

Structure follows the two sites James likes: Hybrid365 (story, Test/Train/Progress system, coaching
pathways, FAQ) and Red On (choose your level of coaching, credentials, one clear CTA).

## Pages

| Page | What it is |
| --- | --- |
| `/` | Landing page: hero, story (47:37 to 40:15 10K), how coaching works, prices (online / 1:1 tabs), reels + next event, results, coach, FAQ |
| `/start` | "Start coaching": name, number and which coaching option, then WhatsApp opens with that message ready to send to James. Every Start / Choose button links here (`?plan=silver` pre-picks the plan) |
| `/onboarding` | Full onboarding & consultation form (replaces the Google Form) for James to send new clients after the first chat. Every question kept, 8 short steps, saves a draft as you go. Not linked from the site or shown in Google |
| `/check-in` | Weekly check-in (replaces the Google Form). 5 steps, under 5 minutes, remembers the client's name and email for next Friday |
| `/privacy`, `/terms` | Privacy policy (UK GDPR) and terms of coaching, filled in from James's answers (Nov 2026). Update if he changes payment, refunds, apps or insurance |
| `/404` | Custom not-found page |
| `/coach` | James's private dashboard: check-ins grouped by client, weight trend, 4-week averages, flags (pain, too hard, poor food, low sleep), new-client forms, CSV export |

## Develop

```bash
cd clients/jpickles
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
```

- Prices, offer dates, FAQs, partners, placeholders: `src/lib/site.ts`
- Form questions (both forms): `src/lib/forms.ts`
- Styles: `src/styles/global.css` (site), `forms.css`, `coach.css`. Black, bone and one gold (#c9a45c)
- Type: Bodoni Moda (headlines, magazine feel), Hanken Grotesk (body), Michroma (small labels, matches the logo)
- Motion: `src/scripts/main.ts` (GSAP + ScrollTrigger + SplitText), `src/scripts/speedlines.ts` (Three.js hero, lazy-loaded)
- Logo: traced to vector from James's original (`assets/originals/logo-original.png`) into `public/media/logo-*.svg`, background removed
- Photos and reels: from James's Instagram, graded black and white. Colour originals in `assets/originals/instagram/`

## Things still to add (placeholders on the page)

1. **Qualifications** (`qualifications` in `site.ts`): done (PT Level 3, HYROX Foundation & Level 1, England Boxing Level 2, FREC 3).
2. **Client reviews** (`reviews` in `site.ts`): Jilly and Alex are live. Add new ones from the testimonial form in their own words, with the name the way they chose (full or first name) and their star rating.
3. **Client before/after photos**: Jilly is live (`results` in `site.ts`). For the next client, split their photos into before/after halves, grade black and white and save as `public/media/<slug>-<front|side>-<before|after>-<480|720>.webp`, then add them to `results` (originals go in `assets/originals/clients/`).

The Black Friday banner (50% off online, 16-27 Nov) and the HYROX simulation card (2 Jan 2027)
hide themselves after their end dates. Change or add offers in `site.ts`.

## Domain

**www.jpicklesfitnesscoaching.com** (bought on Namecheap, Nov 2026). Vercel project `jpickles-coaching`:
`www` is the main address; `jpicklesfitnesscoaching.com` redirects to it. Namecheap DNS (Advanced DNS):

| Type | Host | Value |
| --- | --- | --- |
| A Record | `@` | `216.198.79.1` |
| CNAME Record | `www` | `70206afedcdc7e97.vercel-dns-017.com.` |

The domain is set in `astro.config.mjs`, `src/lib/site.ts`, `public/robots.txt` and `public/sitemap.xml`.

## Form emails (EmailJS, free): every form goes to jpickles.coaching@outlook.com

Like his old Google Forms, but the full answers arrive as a branded email (built in
`src/lib/email.ts`): a summary at the top (weight and change, workouts, scores, anything that
"needs a look" such as pain or a poor week), then every answer in form order. New-client emails
have WhatsApp / Email / Call buttons. Hitting **Reply** answers the client directly.

1. Sign up free at [emailjs.com](https://www.emailjs.com) (200 emails a month on the free plan).
2. **Email Services > Add New Service > Outlook**, sign in as **jpickles.coaching@outlook.com**. Copy the **Service ID**.
3. **Email Templates > Create New Template**:
   - To Email: type `jpickles.coaching@outlook.com` (never `{{to_email}}`: a fixed address means the public key can't be used to email anyone else) · From Name: `{{from_name}}` · Reply To: `{{reply_to}}` · Subject: `{{subject}}`
   - Content: open the code editor (`<>`), delete everything and paste exactly `{{{html}}}` (three braces). Save, copy the **Template ID**.
4. **Account > General**: copy the **Public Key**. Under **Security**, add the live domain to the allowed list. Under **Account > Security** also turn on the limit on requests per IP address.
5. Add `PUBLIC_EMAILJS_SERVICE_ID`, `PUBLIC_EMAILJS_TEMPLATE_ID` and `PUBLIC_EMAILJS_PUBLIC_KEY` in Vercel (Settings > Environment Variables), then **Redeploy**. (Optional: the IDs for James's account are already built into `src/lib/send.ts`; Vercel values override them.)

The logo in the email loads from `https://<domain>/media/email-logo.png`, so it appears once the site is live on its domain.

## One-time setup: saving forms for the dashboard (Supabase, free, optional)

Emails work on their own. Add this as well if James wants the `/coach` dashboard (weight
charts, all check-ins in one place). Until either is set up, the forms show "Preview: not connected".

1. Create a project at [supabase.com](https://supabase.com) (region: London). Use a new project, not another client's.
2. **SQL Editor > New query**: paste all of `supabase/setup.sql`, **Run**.
3. **Authentication > Sign In / Providers**: turn **off** "Allow new users to sign up".
4. **Authentication > Users > Add user**: James's email and a temporary password (tick "Auto confirm").
5. **Authentication > URL Configuration**: Site URL = the live site; add `https://<domain>/coach` to Redirect URLs.
6. **Project Settings > API**: copy the Project URL and the anon public key.
7. In Vercel (**Settings > Environment Variables**) add `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`, then **Redeploy**.
   For local work put the same two lines in `clients/jpickles/.env` (git-ignored).

The website's key can only **add** forms; it can't read them back. Only James, signed in at `/coach`, can read them.

## MyFitnessPal and meal plans

MyFitnessPal doesn't give coaches API access any more (partner-only), so nothing can pull a client's diary automatically.
What's built in now:

- Onboarding asks for the client's **MyFitnessPal username** so James can view a shared diary.
- The weekly check-in asks for **average calories and protein** for the week (optional), so it shows on the dashboard.

If James wants clients to log food and receive meal plans in one app, the next step is a coaching
platform with MyFitnessPal sync built in (Everfit or Trainerize are the usual picks for UK PTs). The site's
forms and dashboard can sit alongside it or link to it.

## Security and privacy (built in)

- `vercel.json` sends security headers on every page (HTTPS-only, no framing, nosniff, referrer policy, and a content security policy allowing only this site, EmailJS and Supabase). If a new outside service is added (analytics, a booking widget), add its address to the CSP or it will be blocked.
- Forms: a hidden spam-trap field plus a minimum fill time. Bots see the thank-you screen but nothing is sent.
- The onboarding and check-in forms end with a required consent tickbox for health details (UK GDPR special category data). The answer is included in the email, as a record.
- Unfinished form drafts are kept in the browser for 7 days at most.
- The site sets no cookies and loads no trackers, so no cookie banner is needed. Adding analytics or a pixel changes that.
- Footer "Pause animations" stops the looping motion (accessibility rule WCAG 2.2.2). Everything still runs by default.

## Deploy (Vercel)

Import the repo, set **Root Directory** to `clients/jpickles`, deploy, then add the domain.
