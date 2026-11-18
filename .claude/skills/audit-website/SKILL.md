---
name: audit-website
description: Inspect a prospect's website URL for slow-load indicators, outdated design, missing mobile responsiveness, weak calls to action and SEO gaps, then save a concise 3-bullet teardown to audits/<company-slug>.md. Use when the user says "audit <url>", "teardown this site", or after score-lead produces qualified leads.
---

# audit-website

Produce a short, evidence-backed teardown that gives `draft-outreach` one strong, specific observation to open with.

## Inputs
- A URL, a company name, or "all qualified" (read `leads/qualified/qualified_leads.csv` and audit rows whose `next_step` is `audit-website` and that have no file in `audits/` yet).

## Tools (use what's available, in this order)
1. A headless browser (Playwright/Chromium is pre-installed in cloud sessions) for mobile + desktop rendering and screenshots.
2. A scrape/fetch tool (Firecrawl, WebFetch) for HTML/markdown.
3. `curl` as the fallback:
   - `curl -sL -o page.html -w "%{http_code} %{time_total}s %{size_download}B %{url_effective}\n" --max-time 20 <url>`
   - `curl -sIL <url>` for redirects, HTTPS, caching headers, server.

Save any raw HTML/screenshots to the scratchpad, not the repo.

## Checklist

**Speed indicators**
- Total load/TTFB from curl or browser timing; HTML weight; number and size of images; unminified/render-blocking scripts; no lazy-loading; no caching/compression headers; slow page builders or heavy sliders.

**Outdated design**
- Copyright year in footer; table/Flash-era layouts; builder free-plan ads (Wix, Weebly, etc.); stock template look; low-res or stretched images; tiny fonts; generator meta tag (old WordPress/Joomla versions).

**Mobile responsiveness**
- Missing `<meta name="viewport">`; fixed-width containers; render at 390px wide and check for horizontal scroll, tap targets under ~44px, text under 16px, phone number not tappable (`tel:` link).

**Calls to action**
- Is there one obvious primary action above the fold (book, call, quote, order)? Visible on mobile without scrolling? Contact form working? Booking/ordering via phone or PDF only?

**SEO gaps**
- `<title>` and meta description missing/generic/duplicate; no or multiple `<h1>`; images without `alt`; no LocalBusiness schema; suburb/service keywords missing; no Google Business Profile link; `robots` noindex; missing sitemap.xml / robots.txt; not HTTPS.

## Output: `audits/<company-slug>.md`

```markdown
---
company: <Company Name>
website: <url>
audited_on: YYYY-MM-DD
method: browser | fetch | curl
lead_hook: <the single strongest observation, one sentence, plain English an owner understands>
---

# <Company Name> — Website Teardown

- **<Area>:** <specific, verifiable finding> — <why it costs them customers>.
- **<Area>:** <finding> — <impact>.
- **<Area>:** <finding> — <impact>.

<details><summary>Evidence</summary>

- HTTP status / load time / page weight: ...
- Notable raw findings: ...
</details>
```

## Rules
- **Exactly 3 bullets**, ordered by business impact. Each must be specific and checkable by the owner (quote the element, number or page). No vague "design feels dated" without a concrete detail.
- `lead_hook` is the observation the outreach will use. Choose the one most tied to lost customers or bookings.
- If the site is down, redirects to a parked domain, or there's no website, write a teardown saying so (that *is* the hook) and suggest the quick-job or starter-build angle.
- Plain, non-technical language. No buzzwords (see `CLAUDE.md`).
- Only fetch the prospect's own public site. Don't submit forms or log in.
