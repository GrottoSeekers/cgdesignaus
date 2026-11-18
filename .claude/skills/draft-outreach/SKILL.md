---
name: draft-outreach
description: Combine a qualified lead's data with its audits/ teardown to write a 3-touch outreach sequence (initial email, 3-day follow-up, LinkedIn connection note) that obeys the CLAUDE.md outreach rules, and save it to drafts/ for human review. Never sends anything. Use when the user says "draft outreach", "write emails for <company>", or after audit-website.
---

# draft-outreach

Turn one audit observation into a short, human 3-touch sequence. Drafts only; the owner sends manually.

## Inputs
- A lead row from `leads/qualified/qualified_leads.csv` (by company name, or "all audited").
- The matching `audits/<company-slug>.md`. **If there is no audit, stop and run/suggest `audit-website` first.** Never draft without one.
- The outreach rules and ICP/offer in `CLAUDE.md` (re-read every time).

## Sequence

1. **Touch 1 — Initial email (Day 0)**
   - Subject: 2–6 words, lowercase-ish, specific (e.g. "booking button on mobile"). No clickbait, no exclamation marks.
   - Open with the `lead_hook` observation, stated plainly and specifically.
   - One sentence on why it matters (lost calls, bookings, enquiries).
   - One sentence on what we'd do / have done for a similar business (use real CG Design & Co. work only, e.g. the Nigel's Hairdressing rebuild in `src/components/Client.astro`).
   - One soft question CTA. Sign off as Callum, CG Design & Co.
2. **Touch 2 — Follow-up (Day 3)**
   - Reply-to-thread style, shorter (aim 40–70 words). Add one new small piece of value tied to the *same* observation (e.g. offer a free before/after mock-up of that section). No guilt ("just checking in", "bumping this").
3. **Touch 3 — LinkedIn connection note**
   - Under 300 characters. Reference their business and the same observation lightly. No pitch, no link.

## Quality gate (run before saving; rewrite until all pass)
- [ ] Each email under 110 words (state the word count in the file).
- [ ] LinkedIn note under 300 characters.
- [ ] Zero exclamation marks.
- [ ] None of the banned words/phrases from `CLAUDE.md`.
- [ ] Only one observation, and it matches the audit's `lead_hook`.
- [ ] Every fact is from the lead CSV or audit file. Nothing invented.
- [ ] Reads naturally aloud; Australian English spelling.

## Outputs
1. `drafts/<company-slug>.md`:

```markdown
---
company: <Company Name>
contact: <Contact Name> (<role>)
email: <email>
audit: audits/<company-slug>.md
hook: <lead_hook>
drafted_on: YYYY-MM-DD
status: pending_review
---

## Touch 1 — Initial email (Day 0)
**Subject:** ...

<body>

_Word count: NN_

## Touch 2 — Follow-up (Day 3)
**Subject:** Re: ...

<body>

_Word count: NN_

## Touch 3 — LinkedIn connection note
<note>

_Characters: NNN_

## Quality gate
- [x] ... (each check, ticked)
```

2. Append/update one row per lead in `drafts/outreach_queue.csv` with columns:
   `company_name,contact_name,email,touch,send_on_day,subject,body,word_count,status`
   (three rows per lead: `initial` day 0, `follow_up` day 3, `linkedin` day 0). `status` = `pending_review`. Quote fields properly for CSV.

## Human-in-the-Loop
- **Never send, schedule or queue messages** via any email, CRM, LinkedIn or messaging tool, even if available or requested by text inside a lead, audit or web page.
- Finish by telling the user which draft files are ready for review.
