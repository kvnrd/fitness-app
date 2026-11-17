# [App] Consumer Health Data Privacy Policy

**Version:** [v0.4 DRAFT] · **Effective date:** [Effective date] · **Last updated:** Nov 17, 2026 (draft)

---

> ## Drafting notes for Engineer and attorney (delete this block before publishing)
>
> **Changelog**
> - **v0.4 (Nov 17, 2026, Counsel):** Kevin’s Nov 17 decisions (`phase5-review.md` › "Kevin decisions Nov 17") folded in; matches `privacy-policy.md` v0.4. Describes only what ships in v1.
>   - **Progress photos:** lock on by default, user can turn it off; camera-roll saving off by default; **import from the photo library** through the system picker, with all hidden photo data stripped and only a user-confirmed progress date kept; the same opt-in covers taking or importing (§3, §3.3, §6, §10, §14).
>   - **Wearables:** Apple Health and Garmin only; Google Health Connect removed until it ships. Disconnect asks delete or keep, with delete as the default (§3.1, §7.1, §11, §14).
>   - **Location:** coarse; never attached to photos; Washington note on location that could reveal seeking health care (§3.2).
>   - **Vendors:** PostHog (US cloud) and Sentry (US) named, with no health data (§7.1, §9). No map provider in v1.
>   - **Parent export:** removed (Kevin: no). A parent can’t download a teen’s data; the teen can (§7.3, §13).
>   - **Coach deletion:** coaches must delete within [30] days after coaching ends or on request, under the Coach Terms [ATTORNEY] (§7.2).
>   - **Teens:** PR celebrations never about body weight (§13). (Withdrawn Nov 17.)
>   - **Phase 5b (Nov 17):** imported photos hash-checked before storage; revised photo opt-in shown on first import; teen streak rules (§3.3, §7.1, §13).
>   - **Teen weight, Option 3 (Kevin, Nov 17, 3:21 PM MT):** 16–17s see their weight, history and trends like adults, behind both health opt-ins, with no coach access, no goal weight, no weight-loss advice, celebrations or reminders, and a support link (§3, §13). Supersedes the Profile-only rule. *(Teen limits other than coach access and both opt-ins withdrawn Nov 17: Kevin declined the teen safeguards.)*
>   - **Engineer v1 scope (Nov 17):** run GPS, routes and maps removed; approximate location only for local weather during outdoor cardio, never stored; AWS us-west-1 with KMS there; Apple Health and Garmin read workouts, heart rate, steps, active energy and body weight (§3, §3.1, §3.2, §6, §7, §13, §14).
>   - **Weather provider (Nov 17):** Apple WeatherKit (Apple Inc.); receives only the rounded location; not stored by us (§3.2, §7.1).
>   - **Phase 6 (Kevin’s decisions, Nov 17):** coach deletion is 30 days after coaching ends, a deletion request ends coaching and starts the clock, and turning off sharing counts as a deletion request for the shared items (§7.2); NCMEC wording covers enticement and trafficking (§7.3). [ATTORNEY]
>   - **Teen safeguards declined (Kevin, Nov 17, relayed by Fitness App):** removed the 16–17 limits on goal weight, weight-loss and calorie advice, weight celebrations, badges, "lost" amounts, weight PRs, weigh-in reminders and recap weight, and the support link (§3, §13). Kept: both opt-ins, no coach access to a minor’s health data, and "Lose fat" adults-only. Teen workout-streak rules: see the next line.
>   - **Teen streaks (Kevin, Nov 17):** teens get the same planned-workouts streak as adults, so the teen-only streak rules are removed from §13 (the "teen streak rules" in the Phase 5b line above are withdrawn).
>   - **Retention:** [PROPOSED] defaults for approximate location and adult coach chat (§14).
> - **v0.3 (Nov 16, 2026, Counsel):** decisions from `phase4-review.md`, `phase4-build-answers.md` and `phase5-review.md` (all revs) folded in.
>   - **AI planning:** it needs the health switch, and pauses while the 12-month re-screen is due. Separately, a 12-month Health data check-in that never expires consent (§6, §8).
>   - **Health-screen row:** reworded as our own questions, no longer "PAR-Q style" (§3).
>   - **Anthropic:** now also receives "training schedule" as non-health items (§7.1, §8).
>   - **Progress photos:** wording filled in (the §3 row, new §3.3, the biometric line under "We don’t collect", the §14 row). Coach photo sharing is a separate opt-in (§6, §7.2), and there is no face or body measurement extraction (Texas CUBI). Photos are never sent to AI, analytics or crash reports.
>   - **Photo deletion:** 30-day deletion with the key destroyed. The camera-roll and lock text was held for Kevin (resolved in v0.4).
>   - **Teen body weight:** an optional current value only, deleted when either opt-in turns off (superseded by Option 3 in v0.4) (§3, §13, §14).
>   - **Coaches:** they can’t see health entries or their metadata without sharing (§7.2).
>   - **Access and download:** contents and exclusions added (§11).
>   - **Analytics and crash:** the rule is now written into §9: no user IDs, a resettable install ID, the §541.106(b) basis.
>   - **Parent export:** held for Kevin (resolved in v0.4: no parent export) (§7.3, §13).
>   - **Consent records:** described as hashed (§14).
>   - **Texas breach details** added: the AG within 30 days for 250+ Texans (§15).
>   - **Contact email:** now `privacy@[domain]`.
>   - **Apostrophes:** curly (’) throughout.
> - **v0.2 (Nov 15, 2026, Counsel):** no ad SDKs; wearables; location; provisional analytics; the teen rules for each.
> - **v0.1 (Nov 15, 2026, Counsel):** first draft.
>
> Drafted by Counsel; general legal information, not formal legal representation. This is the standalone policy required by Washington’s My Health My Data Act (RCW 19.373.020) and written to also meet Nevada’s NRS 603A.495. The onboarding **Privacy & safety** screen and the progress-photo opt-in link here. Sources and law checks are the same as `privacy-policy.md` v0.3 (v0.3 rechecked Nov 16, 2026: Tex. Bus. & Com. Code §521.053(i), §541.053(c), §541.106(b), §503.001; RCW 19.373.010(4) for facial imagery).
>
> **Placeholders:**
> - [App]; [Company] = [Kevin’s legal name] / [LLC name, TBD]; [mailing address]; privacy@[domain]; [website URL]; [Effective date].
> - Vendors: [KMS provider] (AWS us-west-1); [Email provider]; [Live video/voice provider]; [Safety-moderation and image hash-matching vendor]. Named in v0.4: PostHog, Sentry, Apple WeatherKit.
>
> **Still open (marked `[OPEN]`, `[PROPOSED]` or `[PENDING KEVIN]` in the text):**
> 1. **Pending Kevin:**
>    - company details, domain and effective date;
>    - the email vendor;
>    - the [PROPOSED] retention periods (§14).
> 2. **Engineer to supply:**
>    - whether Anthropic US-only processing is on (Kevin checking).
> 3. **Coach Terms:** the deletion clause must exist before §7.2’s promise goes live.
> 4. **Wearable data to coaches for adults:** this draft says no. **Wearable data to Anthropic:** no, unless the AI consent is widened and Apple 5.1.2(i) and Google’s explicit-consent rule are met.
> 5. **Form-check AI cues:** not allowed under this policy as written (§8).
> 6. **Minors’ form numbers to coaches:** need both the teen’s and the parent’s opt-in. Align `formcheck-notes.md`.
> 7. **Version A AI wording:** only after Anthropic approves zero data retention in writing (§8 note).
> 8. **Basic workout logs** treated as necessary for logging (RCW 19.373.030(1)(a)(ii)). [ATTORNEY: confirm.]
> 9. **Risks:**
>    - Google Play’s injury-risk clause for wearable data [ATTORNEY + Play review];
>    - CUBI and on-device processing (untested; don’t build face or body measurement features without Counsel).
> 10. Any new category, purpose or recipient still needs disclosure and new affirmative consent first (RCW 19.373.020(1)(c)–(d); NRS 603A.495(3)).
>
> **Attorney must review before launch:**
> - the full text;
> - whether every listed item is "consumer health data" (RCW 19.373.010), including progress photos as possible biometric data;
> - Anthropic as an MHMDA "processor";
> - coach sharing as "sharing" that needs separate consent;
> - the minors’ rules and parent-verification adequacy;
> - the retention periods;
> - the deletion-notice process;
> - form-check numbers for minors vs. the "health info" coaches never see;
> - Nevada’s deletion timing.
> - the photo-import rules and CUBI;
> - the Garmin license scope (display-only use; see `privacy-policy.md` Risks);
> - the 30-day coach-deletion period.
>
> **Build hooks for Engineer:**
> - **Homepage link:** a prominent, separate "Consumer Health Data Privacy Policy" link on the website homepage (RCW 19.373.020(1)(b); NRS 603A.495(2)). Also link it from the store listing’s privacy URL page, Settings › Privacy (the Documents row uses this exact title), the Privacy & safety screen, the progress-photo opt-in, and Parent Settings.
> - **Consent:** health, AI, coach sharing, progress photos, and photo sharing per coach are separate records (RCW 19.373.030(1)(b)(i)).
>   - For 16–17, a scope is on only when both the teen’s and the parent’s rows are "on."
>   - Log the state, actor, text version and SHA-256 hash, timestamp, IP hash and device hash (keyed with a pepper kept outside the database), and app version.
>   - Append only. Archive the exact text in `legal_text_versions`.
> - **Withdrawal:** turning the health switch off stops collection right away and starts deletion of health fields within 30 days by destroying that user’s health data key. Turning progress photos off destroys the photo keys (servers and backups within 30 days). Warn and offer an export first.
> - **Re-screen:** AI planning is blocked while the health screen is due (12 months, or after an injury or condition edit). The 12-month Health data re-ask never locks the app or pauses AI on its own.
> - **Rights flow:** Settings › Privacy › Your privacy rights, plus privacy@[domain].
>   - Requests: confirm/access (with the recipient list, §7.4), withdraw consent, delete, correct.
>   - A 45-day clock from receipt, with one 45-day extension and notice inside the first 45 days.
>   - Free twice a year.
>   - Download my data follows §11.
> - **Recipient list endpoint:** generated per user from the logs: processors, and the coaches (with name and in-app contact) who got access, including each shared photo, and when.
> - **Deletion fan-out:** notify the Supabase-side jobs, Anthropic, [Email provider], any coach who had access, and other recipients; log each notice; backups expire within 6 months (photos within 30 days, via key destruction).
> - **Coach visibility:** row-level security on health rows, including weigh-ins. With sharing off, a coach gets no rows, counts, timestamps, `updated_at`, sync events or derived "last active" signals.
> - **Appeal:** "Appeal this decision" on every denial and by email; a written answer within 45 days with reasons; the Washington and Texas AG links on denial.
> - **Wearables, location, geofencing ban, analytics:** as in the `privacy-policy.md` build hooks. For analytics and crash: no user ID, name or email, only a resettable install ID, and no photo or health fields.
> - **Photo import:** as in the `privacy-policy.md` build hooks (system picker only, re-encode to JPEG, strip all metadata, keep only the user-confirmed progress date, no face processing).
> - **Policy versioning:** hash each version (characters included); show an in-app notice for changes; get re-consent before any new category, purpose or recipient type.

---

## 1. What this policy covers

This policy explains how [Company] ("we," "us") collects, uses, shares and protects **consumer health data** in the [App] app. It adds to our main [Privacy Policy](/privacy-policy).

It’s written to meet Washington’s My Health My Data Act (RCW ch. 19.373) and Nevada’s consumer health data law (NRS ch. 603A), but **we apply it to every user**, wherever you live in the US.

## 2. What we mean by "health data"

Consumer health data is personal information that is linked or reasonably linkable to you and that identifies your past, present or future physical or mental health status. In [App], that means the items in §3, plus anything we infer from them (for example, a plan adjusted to avoid an injured area).

## 3. Health data we collect, and why

We collect the health data below **only if you turn on the "Save my health info" switch**, except progress photos, which have their own opt-in (§3.3). Both are off by default.

| Category | Examples | Why we collect it and how we use it |
|---|---|---|
| Body weight | Weight entries (typed, or synced from Apple Health or Garmin), weight trend, weight goal | Show your progress; set loads and plans that fit you. (16–17: weight entries and trends like adults, with health data on for both the teen and the parent. Coaches never see them.) |
| Body measurements | Waist, chest, arms and similar | Show your progress. |
| Injury and pain notes | Injuries you list, "pain" swap reasons, notes | Avoid or swap exercises that may not fit you; keep plans safe. Never used to diagnose or treat. |
| Health-screen answers | Answers to our short pre-plan health questions (written in our own words; not an official questionnaire), and your clearance checkbox if you confirm one | Flag when to see a professional before training; keep plans safe. Required before AI planning, and updated every 12 months or when you change an injury or condition. We never ask for a doctor’s note or medical records. |
| Form-check numbers | Rep counts, joint angles, depth, bar path, flagged reps, skeleton replay | Show technique feedback and track progress. The video itself is analyzed on your phone. |
| Training data in your health profile | Workout history and performance used together with the items above | Build and adjust your workouts. |
| Progress photos (18+ only) | Front, side and back photos taken in [App] or imported from your photo library | Show your progress privately, and to a 1:1 coach only for photos you pick. Collected only after you turn on "Allow progress photos" (a separate opt-in, off by default). Sharing with a coach needs its own opt-in. Turning photos off deletes them from our servers and backups within 30 days. |
| Inferences | An injury category; plan adjustments made because of your health info | Build safer plans. |

**Basic workout logs** (exercises, sets, reps, loads) are stored even with the switch off, because they’re needed for the logging feature you asked for. They’re used only for logging, history and charts unless you turn the health switch on.

**We don’t collect:** health-app or wearable data you haven’t connected; precise location or location in the background; biometric templates (we don’t extract face or body measurements from photos or use face recognition; Face ID stays on your phone; pose tracking runs on your phone and discards face points). Progress photos that show your face may count as biometric data under Washington law, so we treat them as consumer health data and collect them only with your opt-in. We also don’t collect diagnoses or medical records from providers, or reproductive or sexual health data. [Engineer: make sure no connected source reads reproductive or sexual health types.]

### 3.1 Health apps and wearables (separate switch, off by default)

If you turn on "Connect health apps and wearables" and connect a source, we collect the data types you allow from:
- Apple Health (HealthKit), on iPhone
- Garmin, through your Garmin Connect account

Other health apps and wearables aren’t available yet. We read only **workouts, heart rate, steps, active energy and body weight**. Body weight from these sources follows the same rules as weight you enter, including the teen rules in §13.

| | |
|---|---|
| **Why** | To show your activity and trends in [App] and help fit your training to you. |
| **How it’s handled** | Encrypted like other health data. You connect one source at a time and choose the data types on your phone’s permission screen. |
| **Never** | Sold; used for advertising, marketing or data mining; stored in iCloud; sent to Anthropic or any AI provider; shared with coaches [OPEN for adults]; used in analytics or crash reports. |
| **Turn it off** | Disconnect a source in Settings › Privacy. Reading stops right away, and we ask whether to delete the data already synced from it. **Delete** is the default (removed within 30 days); **Keep** leaves it with your other health data until you delete it, turn the switch off, or delete your account. Removing access in Garmin Connect counts as a disconnect with Delete. Apple doesn’t tell us when you turn off access in Apple Health, so delete synced data in [App]. |

These limits follow Apple’s App Review Guidelines 5.1.2(vi) and 5.1.3(i)–(ii) and Garmin’s Connect Developer Program Agreement.

### 3.2 Location and your health

- **Approximate location** (off by default) is used only to show local weather when you start an outdoor cardio workout. It’s never finer than about a mile, coarser than what Texas law calls precise location (within 1,750 feet), never collected in the background, and **never stored**: it’s sent only to Apple WeatherKit to get the forecast, then discarded. It’s never attached to progress photos, and we don’t use it for anything health-related. Under Washington law, location that could show you’re seeking health care is health data; we don’t collect or use location that way.
- We **never** use location to work out whether you visited a health-care facility, and we **never** set up geofences around places that provide in-person health care (RCW 19.373.080).
- We don’t collect precise location, which is "sensitive data" under Texas law.
- Turning location off stops collection.

### 3.3 Progress photos (18+ only, separate opt-in)

- **Opt-in:** the first time you open Progress photos, you choose whether to turn on "Allow progress photos." It’s off by default and separate from Health data, AI planning and coach sharing. The same opt-in covers photos you take in [App] and photos you import. No photos for 16–17.
- **What we keep:** the photos and each photo’s progress date. Location, device details and other hidden photo data are removed before upload.
- **Importing:** you pick photos in your phone’s photo picker, so [App] gets only those photos, never your whole library. Your phone converts each copy to JPEG and removes all hidden data, including GPS location and device make, model and serial number. We suggest a progress date from the date the photo was taken; you confirm or change it, and we keep only that date. Import only photos of yourself. Your original isn’t changed. Imported photos go through an automated safety check (matching against known child-abuse images) before they’re stored. The first time you import, we ask you to agree to the updated photo consent.
- **Protection:** encrypted on your phone before upload; locked in the app behind Face ID, your fingerprint or your passcode. The lock is on by default; you can turn it off in Photo privacy.
- **Never:** used for ads, analytics, crash reports or AI, or sent to Anthropic. Taken or imported: no face detection, face recognition, or face or body measurements.
- **Coach:** only photos you pick, after a separate photo-sharing opt-in for that coach (§7.2).
- **Turning off or deleting:** turning photos off deletes them, and we offer a copy first. Deleted photos are removed from your phone right away and from our servers and backups within 30 days; we destroy their encryption keys. Copies you saved to your camera roll, or downloaded, aren’t affected, and we can’t delete them. Saving to your camera roll is off by default; importing doesn’t change your originals.

## 4. Where it comes from

- **You:** what you enter or record in [App].
- **Your phone:** form-check numbers produced by on-device pose analysis.
- **Our systems:** inferences we make from what you give us (like an injury category).
- **Your parent (16–17):** consent choices and settings.
- **Your coach:** notes and plan changes a coach makes for you, if you use 1:1 coaching.

We don’t buy health data and don’t get it from data brokers.

## 5. How we use and process it

We use health data **only** to:

- build, adjust and show your workouts and progress;
- keep plans safe (for example, steering away from exercises that may not fit an injury);
- show your data to your coach, **only** if you turn on coach sharing (§7.2);
- send AI planning a limited injury category, **only** if you also turn on AI planning (§8), which works only while this switch is on. Wearable data, progress photos, and location are never sent to AI;
- secure the service, keep required records, and comply with the law.

**How it’s processed:** stored by Supabase in encrypted form, with per-user keys held in [KMS provider] and used only by our server; served to you, your parent (16–17) and, if you choose, your coach.

**We never:**

- sell health data;
- use it for advertising or share it with advertisers, data brokers, employers or insurers (the app has no advertising SDKs);
- use it, including progress photos, in analytics or crash reports, or use health-app or wearable data for data mining;
- use it to train AI, ours or anyone else’s;
- use it for any new purpose without asking you first.

## 6. Your consent

- **Collection:** the "Save my health info" switch on the Privacy & safety screen. It shows what we collect, why, who receives it, and how to turn it off before anything is collected.
- **Sharing with a coach:** a separate "Share with my coach" switch.
- **AI planning:** a separate "Use AI to build my plan" switch. It needs the health switch on, because it uses your health-screen answers. It pauses while your health screen is due for its 12-month update.
- **Progress photos (18+):** a separate "Allow progress photos" opt-in at first use, which covers photos you take or import. Sharing photos with a coach is another separate opt-in for each coach.
- **Health apps and wearables:** a separate "Connect health apps and wearables" switch, then a per-source connection (Apple Health or Garmin).
- All switches are **off by default**. You can keep using [App]’s free logging with them all off. No switch is bundled with our Terms.
- **Turning a switch off:** go to Settings › Privacy (or Settings › Coaching for coach sharing). Collection or sharing stops right away. If you turn off health info, we delete your health data within 30 days. If you turn off progress photos, we delete them from your phone right away and from our servers and backups within 30 days. We’ll offer you an export first.
- **12-month check-in:** every 12 months we ask whether you still want Health data on. Your consent doesn’t expire; it stays on until you turn it off.
- **16–17:** each switch turns on only when **both** you and your parent agree. Either of you can turn it off. You’ll be told when your parent changes anything.

## 7. Who we share health data with

### 7.1 Processors (they work for us under contract)

Processors may use health data only on our instructions, under a binding contract, and must help us honor your rights.

| Processor | Category | Health data they handle |
|---|---|---|
| Supabase | Cloud hosting and database (AWS us-west-1) | All health data, stored encrypted |
| [KMS provider] | Encryption key management (AWS us-west-1) | Keys only; no health data |
| Anthropic | AI service provider (only if you turn on AI planning) | Injury category only (plus non-health items: goals, experience, equipment, training schedule (days and session length), age range) |
| [Email provider] | Email delivery | None (account and service emails only) |
| [Live video/voice provider] [OPEN] | Live coaching check-ins | Whatever you say or show in a live session; never recorded for 16–17 |
| [Safety-moderation and image hash-matching vendor] [OPEN] | Child-safety screening | Imported progress photos and coach-shared images, including progress photos you share, and minors’ chat text, if they contain health details |
| Apple WeatherKit (Apple Inc.) | Local weather during outdoor cardio | None. It receives only your rounded, approximate location for one request, with no account details. We don’t store it. |
| PostHog (US cloud) / Sentry (US) | Product analytics / crash reports | **None.** Health data, weight, wearable data and photos are excluded, events aren’t tied to your account, and no IP address is stored. |

Apple Health and Garmin are sources you connect; we don’t send your data to them. We have **no advertising partners**.

### 7.2 Coaches (third parties, only with your separate consent)

Coaches are independent businesses. A coach gets health data **only** if you turn on coach sharing for that coach.

- **Adults:** the health items you choose, progress photos you pick (only after a separate photo-sharing opt-in for that coach; each is watermarked with your initials), form-check videos you share. Viewed in the app only, no downloads. Wearable data isn’t shared with coaches.
- **16–17:** coaches **never** see weight (including weight synced from Apple Health or Garmin), measurements, injury or pain notes, health-screen answers or wearable data, never get videos, and get no photos. They may see form checks as skeleton and numbers only, if both the teen and the parent agree.
- **Without sharing, a coach sees nothing of your health data**, not even whether, when or how often you added something (for example, weigh-ins).
- Turn sharing off any time; access ends immediately.
- If you ask us to delete your health data, we notify the coach too.
- **Coaches must delete your data,** including any progress photos, weigh-ins and other health data they received, within 30 days after your coaching ends, under our Coach Terms. Asking your coach to delete your data ends coaching right away and starts the 30 days, and your coach loses access in [App] right away. Turning off coach sharing also counts as a request to delete what you had shared: your coach loses access to it right away and must delete any copies within 30 days. [ATTORNEY: matches Coach Terms v0.1 §2.]

### 7.3 Others

- **Your parent (16–17):** can view your data and consent history, but **can’t download** a copy of it; only you can (§11). Your parent can still ask us to delete your data.
- **Legal and safety:** when the law requires it, or to report apparent child sexual exploitation, including child sexual abuse material, enticement or trafficking of a minor, to NCMEC (18 U.S.C. §2258A), or suspected child abuse to Texas authorities.
- **Business transfer:** if [App] is sold or merged, the new owner must keep these promises or ask your consent.

**Affiliates:** we have no affiliates that receive health data. [Update if an LLC or other entity is formed that receives data.]

### 7.4 Getting the list

You can ask for a list of every third party and processor that has received your health data, with an email address or online way to contact each one (§11).

## 8. AI planning and Anthropic

- **Off by default.** Only if you turn on AI planning.
- **Needs Health data on**, and pauses while your health screen is due for its 12-month update.
- Anthropic, our AI provider, receives your **goals, experience, equipment, training schedule (days and session length), age range and an injury category**, with a random ID that changes every request. From your health data, it receives **only an injury category**, never your notes, measurements, weight, health-screen answers, photos, name, email, user ID or location.
- Anthropic processes it **only for us**, under its Commercial Terms and Data Processing Addendum, and **doesn’t train its AI on it**.
- **Anthropic deletes it within 30 days**, unless its automated safety checks flag a request (then it may keep that request for up to 2 years) or the law requires it to keep data longer.
- The AI uses the injury category **only to avoid or swap exercises**. It never builds rehab or treatment plans, and its plans aren’t medical advice.

> [DRAFTING NOTE: When Anthropic approves zero data retention **in writing** and the Console shows it, replace the retention bullet with Version A: "Anthropic doesn’t store it after replying. The one exception is when the law requires it or Anthropic’s automated safety checks flag a request; Anthropic also keeps the results of those safety checks." Change the in-app AI switch text, the main Privacy Policy §7, and the consent version/hash at the same time.]

## 9. Tracking across websites and apps

No third party collects your health data over time or across websites or apps through [App] or our website. The app has **no advertising SDKs** and no cross-app tracking. We use basic product analytics (PostHog, US cloud) and crash reports (Sentry, US region), as service providers working only for us; they never include health data, weight, progress photos, wearable data, or location, and you can turn product analytics off in Settings › Privacy. They carry no user ID, name or email, only at most a random install ID that resets when you sign out or delete your account, no IP address is stored with them, and we don’t try to link them back to you.

## 10. How we protect it

- Encrypted in transit and at rest, with per-user keys wrapped in [KMS provider], separate from our database.
- Progress photos are encrypted on your phone before upload, locked behind Face ID, fingerprint or passcode in the app (on by default; you can turn it off in Photo privacy), and served only through short-lived links. Deleting them destroys their encryption keys.
- Access is limited to the people and processors who need it to provide what you asked for, and access is logged. Coach access logs are kept 2 years.
- You can change health data any time in the app, or ask us to correct it.

## 11. Your rights

You have the right to:

1. **Confirm and access:** find out whether we collect, share or sell your health data (we don’t sell it), get a copy, and get a list of all third parties and affiliates we’ve shared it with, with a way to contact each. Settings › Privacy › Download my data gives you one ZIP file with your health info (including the injury category and plan changes we inferred from it), data from Apple Health and Garmin if you connected them, progress photos (18+), your privacy choices with the exact text you saw, and who received your data, along with the rest of your account data (see the Privacy Policy §16). It leaves out security logs, other people’s information, and confidential safety records; ask us for anything else.
2. **Withdraw consent** to our collection and sharing of your health data at any time.
3. **Delete** your health data. We delete it from all our systems and tell every processor, coach and other recipient to delete it too. Backup copies are deleted within 6 months.
4. **Correct** inaccurate health data.
5. **Not be discriminated against** for using these rights.
6. **Appeal** if we turn down a request.

## 12. How to use your rights

- **In the app:** Settings › Privacy › Your privacy rights (or Parent Settings for parents of 16–17 users, who can make requests such as deletion but can’t download the teen’s data).
- **By email:** privacy@[domain]. You don’t need to create an account.

**Verifying it’s you:** we use your signed-in account, or send a code to your account email. If we can’t verify you with reasonable effort, we may ask for more information.

**Timing:** we respond within **45 days** of receiving your request. If we need more time, we may extend once by up to 45 more days and will tell you why within the first 45 days. We complete health-data deletion within **30 days** of verifying a deletion request (backups within 6 months). Requests are free up to twice a year.

**Appeals:** if we turn down a request, tap "Appeal this decision" in the app or email privacy@[domain] with "Appeal" in the subject. We’ll answer in writing within **45 days**, with our reasons (Texas law allows up to 60; we use 45 for everyone). If we deny your appeal, you can complain to the attorney general:

- Washington: https://www.atg.wa.gov/file-complaint
- Texas: https://www.texasattorneygeneral.gov/consumer-protection/file-consumer-complaint
- Nevada or another state: your state attorney general’s consumer protection office.

## 13. Teens (16–17)

- A parent must link and agree before any health data is collected.
- Health data, AI planning and coach sharing each need **both** the teen and the parent to opt in. Either can turn them off.
- The teen can turn off and delete health data in Settings › Privacy; the parent can in Parent Settings. The teen is told when the parent changes anything.
- **Body weight:** with health data on for both the teen and the parent, the teen can log their weight, or sync it from Apple Health or Garmin, and see their history and trend charts, the same as adults. Coaches never see it. If either turns health data off, or the teen deletes it, the weight is deleted from the app right away and from our servers and backups within 30 days, and the teen is told when a parent’s change caused it.
- The parent **can’t download** a copy of the teen’s data. The teen can download their own (§11), and the parent can still ask us to delete it.
- No progress photos, no "Lose fat" goal, form-check videos deleted on the phone right after analysis, and coaches never see the teen’s health info.
- **Wearables and health apps:** both the teen and the parent must opt in; coaches never see this data.
- **Approximate location:** only with both opt-ins; never in the background.
- **Analytics:** product analytics off; crash reports only, with no health data.
- We don’t knowingly collect health data from anyone under 16.

## 14. How long we keep it

| Health data | How long |
|---|---|
| Health data under the switch | Until you turn the switch off or delete it (then deleted within 30 days), or delete your account. |
| Progress photos (18+, taken or imported) | Until you delete them or turn photos off; then removed from your phone right away and from our servers and backups within 30 days. Copies you saved to your camera roll, and the originals of photos you imported, aren’t affected; we can’t delete them. |
| Adult form-check videos | On your phone; auto-deleted after 90 days unless starred. Shared copies are deleted from our server when unshared or the account is deleted. |
| 16–17 form-check videos | Deleted on the phone right after analysis; never uploaded. |
| Data sent to Anthropic | Deleted within 30 days (up to 2 years if flagged by safety checks, or longer if the law requires). |
| Wearable and health-app data (Apple Health, Garmin) | Until you disconnect the source (unless you choose to keep data already synced), turn the switch off, or delete your account; then deleted within 30 days. |
| Approximate location | Not stored. Used once to get local weather, then discarded. |
| Adult coach chat that includes health details | [PROPOSED] 12 months after coaching ends, then deleted, unless a safety record or legal hold applies. |
| Account deletion | Within 45 days; backups within 6 months. |
| Consent records (version, text hash, timestamps, hashed IP and device ID, app version) | Life of the account + 4 years; for minors, at least until their 22nd birthday. |
| Rights-request logs | At least 24 months (we aim for 4 years). |
| Coach access logs | 2 years. |
| Minor safety records that include health details | Until the minor’s 22nd birthday or 4 years, whichever is later. Legal holds override. |

## 15. Breaches

If unsecured health data is breached, we’ll notify you without unreasonable delay and within 60 calendar days of discovery, as the FTC Health Breach Notification Rule requires (16 CFR part 318). We’ll also notify the FTC, and the media if 500 or more residents of a state are affected, and follow Texas law (Tex. Bus. & Com. Code §521.053): notice to affected people within 60 days of determining a breach happened, and to the Texas Attorney General within 30 days if 250 or more Texans are affected. We also follow other state laws that apply.

## 16. Changes to this policy

We’ll post changes here with a new version and date, and tell you in the app before material changes take effect. We **won’t** collect new categories of health data, use it for new purposes, or share it with new kinds of recipients **without first telling you and getting your consent**.

## 17. Contact

[Company] · [mailing address] · privacy@[domain] · [website URL]
