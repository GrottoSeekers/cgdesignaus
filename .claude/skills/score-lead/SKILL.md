---
name: score-lead
description: Read lead CSVs in leads/raw/, score each lead against the CG Design & Co. ICP, filter out poor fits (large enterprises, modern tech companies, recent rebuilds) and save strong candidates to leads/qualified/. Use when the user says "score leads", "qualify leads", "filter my lead list" or drops a new CSV into leads/raw/.
---

# score-lead

Qualify raw leads so only realistic, high-intent prospects reach the audit and drafting stages.

## Inputs
- All `*.csv` files in `leads/raw/` (or a specific file if the user names one).
- Expected columns: `company_name, website, contact_name, role, email, industry, notes`.
- The ICP section of `CLAUDE.md` (always re-read it first; it overrides the defaults below).

## Steps

1. **Read** `CLAUDE.md` (ICP + disqualifiers) and the raw CSV(s). Skip leads already present in `leads/qualified/qualified_leads.csv` (match on `website`, else `company_name`).
2. **Hard disqualify** (score = 0, status `rejected`) if any apply:
   - Large enterprise: notes/role suggest 200+ staff, listed company, "Head of Marketing/Digital" titles, in-house digital team, franchise head office.
   - Already-modern tech company: SaaS, software, startup, agency, or notes mention a recent professional rebuild / modern framework.
   - No usable contact: no email and no contact name.
   - Industry outside the ICP niche (once the ICP is defined).
3. **Score the rest out of 10** using the rubric:

   | Signal | Points |
   | --- | --- |
   | Fits target niche / industry | +3 |
   | Small, owner-operated, decision maker is the contact (Owner, Founder, Director, Principal, Practice Manager) | +2 |
   | Clear website pain in notes (outdated, no mobile, PDF menu, free-plan ads, no booking/ordering) | +2 |
   | No website at all (good fit for the "get found online" quick jobs or a starter build) | +2 (instead of the pain signal) |
   | Evidence they're active and growing (good reviews, social following, second location, new practice) | +2 |
   | Website reachable and in target location (if checkable from domain/notes) | +1 |

   Optionally do a quick `curl -sIL --max-time 10 <website>` to confirm the site resolves. Don't do full audits here; that's `audit-website`.
4. **Threshold:** score >= 6 -> `qualified`. 4–5 -> `maybe` (keep in output, flagged). <= 3 -> `rejected`.
5. **Write outputs:**
   - Append qualified + maybe rows to `leads/qualified/qualified_leads.csv` with the original columns plus `score, fit_status, fit_reasons, next_step, scored_on` (date YYYY-MM-DD). `next_step` = `audit-website`, or `quick-job-pitch` for leads with no site.
   - Write `leads/qualified/scoring_log_<YYYY-MM-DD>.md`: a short table of every lead (including rejected) with score and a one-line reason.
6. **Report** to the user: counts (qualified / maybe / rejected), the top 3 leads, and any rows with missing data.

## Rules
- Never invent data to fill gaps. Mark unknowns as `unknown` in `fit_reasons`.
- Don't contact anyone. This skill only reads and writes local files.
