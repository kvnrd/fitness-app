# Phase 6: Coach Studio

Local branch `phase-6-coach-studio`. Product copy is from Counsel’s Phase 6 string table and rev 3, word for word. Do not invent UI or legal strings.

## Flags (off until the vendor or agent is live)

- `DMCA_FORM_ENABLED` / `app.dmca_form_enabled()`: screens 53 and 53b stay out of production navigation until the designated agent is registered (17 U.S.C. §512(c)(2)) and real 5.11 details replace the placeholder. 5.11 and “NOT SHIPPABLE” are not in the product string table.
- `HASH_MATCHING_LIVE` / `app.hash_matching_live()`: hash-matching enqueue for photos and demo videos is a no-op until the vendor is live. 5.18’s hash sentence and 5.20 are omitted until then.

## Deletion calendar

`app.deletion_schedule` uses `date + integer` (not timestamptz intervals), in America/Denver. Sample trigger Tue Nov 17, 2026: reminder Dec 10, due Dec 17, day-31 pause Dec 18, day-45 suspend Jan 1, 2027. Coach-facing copy uses the 30-day due date only. Day 45 is Kevin’s enforcement step, not Tex. Bus. & Com. Code §541.052(b).

## Other rules

- Apply requires `consent_events` kind `coach_terms`. Review is manual: “[Company] reviews every application.”
- Stripe Identity is document-only, restricted keys on the server, never `EXPO_PUBLIC_*`.
- 70e: parent approval alone does not start sharing. The coach sees nothing until Sam also agrees.
- After a teen block/report, the parent product label is only “Coaching ended.” A T&S note is admin-only and is not product copy.
- Coaches never see a minor’s weight, health, or photos.
- Three upheld copyright notices in 12 calendar months (inclusive window) close the account. Screen 54 keeps 5.13 exact.

Coach Terms, ToS, and policies remain [ATTORNEY] drafts.
