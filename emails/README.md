# Client emails

## Job agreement email (`job-agreement.html`)

The "agree the job in writing" email sent to every new client. It confirms
the package and price, the launch date, the 50% deposit / 50% balance split
(from the Terms), and links to cgdesignaus.com/terms-and-conditions.

### How to use it

1. In a Claude session, say who the client is, e.g.
   *"New client: Sarah Jones, Sarah's Florist, Growth package, launching
   Friday 14 November."*
2. Claude copies the template to `emails/clients/<business-name>.html` and
   fills it in.
3. Open that file in a browser, press **Copy subject** and **Copy email**,
   paste both into a new email, and send.

### Filling it in (instructions for Claude)

Copy `job-agreement.html` to `emails/clients/<business-slug>.html`. Replace
every highlighted `<span class="fill">[...]</span>` with the real value, and
remove the span itself so nothing is highlighted. Also update the subject in
the toolbar. Leave the template untouched.

- **First name / business name** as given.
- **Signature**: none in the template; the user's email client adds it.
- **Package**: name plus its four "includes" lines, from the table below.
- **Price / RRP**: from the table below (or a custom figure if quoted).
- **Deposit / balance**: half of the price each, rounded to the dollar.
- **Launch date**: written out in full, e.g. "Friday 14 November 2026".
- **Next step 2**: if a Stripe payment link is supplied, replace the
  bracketed sentence with `<a href="LINK" style="color: #5b2695; font-weight: bold;">Pay your deposit here</a>.`
  Otherwise use "I'll send you a secure payment link next."
- **Extras** (add-ons, maintenance at $60/month): add them as extra lines
  under the package, and add the cost to the price row, e.g.
  "plus $60/month hosting and maintenance".

Prices come from `src/components/Pricing.astro`. Check there if they change.

| Package | Price (founding) | RRP | Includes |
|---|---|---|---|
| Essentials | $290 | $580 | Home + Contact pages · Copywriting and images sourced · Mobile-first build · Live in under a week |
| Growth | $590 | $1,180 | Everything in Essentials · About, Services / Menu, Gallery · Enquiry form to your inbox · Google Business profile tidy-up |
| Complete | $890 | $1,780 | Everything in Growth · Online booking system · Local SEO package · Dedicated booking page |

The logo loads from `https://cgdesignaus.com/logo-full.png`, so it shows up
in the client's inbox without attaching anything.
