# [App] Consumer Health Data Privacy Policy

**Version:** [v0.3 DRAFT] · **Effective date:** [Effective date] · **Last updated:** Nov 16, 2026 (draft)

---

> ## Drafting notes for Engineer and attorney (delete this block before publishing)
>
> **Changelog**
> - **v0.3 (Nov 16, 2026, Counsel):** decisions from `phase4-review.md`, `phase4-build-answers.md` and `phase5-review.md` (all revs) folded in.
>   - **AI planning:** it needs the health switch, and pauses while the 12-month re-screen is due. Separately, a 12-month Health data check-in that never expires consent (§6, §8).
>   - **Health-screen row:** reworded as our own questions, no longer "PAR-Q style" (§3).
>   - **Anthropic:** now also receives "training schedule" as non-health items (§7.1, §8).
>   - **Progress photos:** wording filled in (the §3 row, new §3.3, the biometric line under "We don’t collect", the §14 row). Coach photo sharing is a separate opt-in (§6, §7.2), and there is no face or body measurement extraction (Texas CUBI). Photos are never sent to AI, analytics or crash reports.
>   - **Photo deletion:** 30-day deletion with the key destroyed. The camera-roll and lock text is marked [PENDING KEVIN].
>   - **Teen body weight:** an optional current value only, deleted when either opt-in turns off [PENDING KEVIN: teen weight] (§3, §13, §14).
>   - **Coaches:** they can’t see health entries or their metadata without sharing (§7.2).
>   - **Access and download:** contents and exclusions added (§11).
>   - **Analytics and crash:** the rule is now written into §9: no user IDs, a resettable install ID, the §541.106(b) basis.
>   - **Parent export:** [PENDING KEVIN] (§7.3, §13).
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
> - Vendors: [KMS provider]; [Email provider]; [Live video/voice provider]; [Safety-moderation and image hash-matching vendor]; [Analytics vendor] / [Crash-reporting vendor]; [Map provider].
>
> **Still open (marked `[OPEN]` or `[PENDING KEVIN]` in the text):**
> 1. **Pending Kevin:**
>    - the photo lock;
>    - the camera-roll option (if it’s dropped, remove the camera-roll sentences and bump the opt-in hash);
>    - teen weight;
>    - parent export;
>    - the coach-deletion clause in the Coach Terms (unlocks the §7.2 line);
>    - company details, domain and effective date;
>    - the email vendor.
> 2. **Engineer to supply:**
>    - wearable sources and data types (Apple 5.1.3(i));
>    - the approximate-location features;
>    - the analytics, crash and map vendors.
> 3. **Retention:**
>    - run routes and approximate location (proposals in §14);
>    - adult coach chat after coaching ends.
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
| Body weight | Weight entries, weight trend, weight goal | Show your progress; set loads and plans that fit you. (16–17: only an optional current value in Profile, with no goal, trend or chart, and no weight-loss or calorie goals [PENDING KEVIN: teen weight].) |
| Body measurements | Waist, chest, arms and similar | Show your progress. |
| Injury and pain notes | Injuries you list, "pain" swap reasons, notes | Avoid or swap exercises that may not fit you; keep plans safe. Never used to diagnose or treat. |
| Health-screen answers | Answers to our short pre-plan health questions (written in our own words; not an official questionnaire), and your clearance checkbox if you confirm one | Flag when to see a professional before training; keep plans safe. Required before AI planning, and updated every 12 months or when you change an injury or condition. We never ask for a doctor’s note or medical records. |
| Form-check numbers | Rep counts, joint angles, depth, bar path, flagged reps, skeleton replay | Show technique feedback and track progress. The video itself is analyzed on your phone. |
| Training data in your health profile | Workout history and performance used together with the items above | Build and adjust your workouts. |
| Progress photos (18+ only) | Front, side and back photos taken in [App] | Show your progress privately, and to a 1:1 coach only for photos you pick. Collected only after you turn on "Allow progress photos" (a separate opt-in, off by default). Sharing with a coach needs its own opt-in. Turning photos off deletes them from our servers and backups within 30 days. |
| Inferences | An injury category; plan adjustments made because of your health info | Build safer plans. |

**Basic workout logs** (exercises, sets, reps, loads) are stored even with the switch off, because they’re needed for the logging feature you asked for. They’re used only for logging, history and charts unless you turn the health switch on.

**We don’t collect:** health-app or wearable data you haven’t connected; location in the background except during a run you’re recording (when available); biometric templates (we don’t extract face or body measurements from photos or use face recognition; Face ID stays on your phone; pose tracking runs on your phone and discards face points). Progress photos that show your face may count as biometric data under Washington law, so we treat them as consumer health data and collect them only with your opt-in. We also don’t collect diagnoses or medical records from providers, or reproductive or sexual health data. [Engineer: make sure no connected source reads reproductive or sexual health types.]

### 3.1 Health apps and wearables (separate switch, off by default)

If you turn on "Connect health apps and wearables" and connect a source, we collect the data types you allow from:
- Apple Health (HealthKit)
- Google Health Connect
- connected wearables

[OPEN: Engineer to list the exact sources and data types, for example workouts, heart rate, steps, active energy, sleep.]

| | |
|---|---|
| **Why** | To show your activity and trends in [App] and help fit your training to you. |
| **How it’s handled** | Encrypted like other health data. You connect one source at a time and choose the data types on your phone’s permission screen. |
| **Never** | Sold; used for advertising, marketing or data mining; stored in iCloud; sent to Anthropic or any AI provider; shared with coaches [OPEN for adults]; used in analytics. |
| **Turn it off** | Disconnect a source in Settings › Privacy (or in Apple Health / Health Connect). Reading stops right away; that source’s data is deleted within 30 days. |

These limits follow Apple’s App Review Guidelines 5.1.2(vi) and 5.1.3 and Google Play’s policy on Android health permissions.

### 3.2 Location and your health

- **Approximate location** (off by default) is used only when you open a feature that needs it, never in the background, and is never finer than about a mile. We don’t treat it as health data, and we don’t use it for anything health-related.
- **Precise GPS for run tracking (when available)** will be a separate opt-in for precise and background location, used only while you record a run. Privacy zones hide each route’s start and end, and routes are private unless you choose to share them. Routes can show your workouts, so we protect them like health data: encrypted, never sold, never used for ads, never sent to Anthropic.
- We **never** use location or routes to work out whether you visited a health-care facility, and we **never** set up geofences around places that provide in-person health care (RCW 19.373.080).
- Precise location is "sensitive data" under Texas law and is used only with your consent.
- Turning location off stops collection. You can delete one route or all routes any time.

### 3.3 Progress photos (18+ only, separate opt-in)

- **Opt-in:** the first time you open Progress photos, you choose whether to turn on "Allow progress photos." It’s off by default and separate from Health data, AI planning and coach sharing. No photos for 16–17.
- **What we keep:** the photos and the date you took them. Location and device details are removed before upload.
- **Protection:** encrypted on your phone before upload; locked in the app behind Face ID, your fingerprint or your passcode [PENDING KEVIN: photo lock].
- **Never:** used for ads, analytics, crash reports or AI, or sent to Anthropic. No face detection, face recognition, or face or body measurements.
- **Coach:** only photos you pick, after a separate photo-sharing opt-in for that coach (§7.2).
- **Turning off or deleting:** turning photos off deletes them, and we offer a copy first. Deleted photos are removed from your phone right away and from our servers and backups within 30 days; we destroy their encryption keys. Copies you saved to your camera roll, or downloaded, aren’t affected, and we can’t delete them [PENDING KEVIN: camera-roll option].

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
- send AI planning a limited injury category, **only** if you also turn on AI planning (§8), which works only while this switch is on. Wearable data, progress photos, location and routes are never sent to AI;
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
- **Progress photos (18+):** a separate "Allow progress photos" opt-in at first use. Sharing photos with a coach is another separate opt-in for each coach.
- **Health apps and wearables:** a separate "Connect health apps and wearables" switch, then a per-source connection.
- **Precise run GPS (when available):** a separate opt-in for precise and background location.
- All switches are **off by default**. You can keep using [App]’s free logging with them all off. No switch is bundled with our Terms.
- **Turning a switch off:** go to Settings › Privacy (or Settings › Coaching for coach sharing). Collection or sharing stops right away. If you turn off health info, we delete your health data within 30 days. If you turn off progress photos, we delete them from your phone right away and from our servers and backups within 30 days. We’ll offer you an export first.
- **12-month check-in:** every 12 months we ask whether you still want Health data on. Your consent doesn’t expire; it stays on until you turn it off.
- **16–17:** each switch turns on only when **both** you and your parent agree. Either of you can turn it off. You’ll be told when your parent changes anything.

## 7. Who we share health data with

### 7.1 Processors (they work for us under contract)

Processors may use health data only on our instructions, under a binding contract, and must help us honor your rights.

| Processor | Category | Health data they handle |
|---|---|---|
| Supabase | Cloud hosting and database | All health data, stored encrypted |
| [KMS provider] | Encryption key management | Keys only; no health data |
| Anthropic | AI service provider (only if you turn on AI planning) | Injury category only (plus non-health items: goals, experience, equipment, training schedule (days and session length), age range) |
| [Email provider] | Email delivery | None (account and service emails only) |
| [Live video/voice provider] [OPEN] | Live coaching check-ins | Whatever you say or show in a live session; never recorded for 16–17 |
| [Safety-moderation and image hash-matching vendor] [OPEN] | Child-safety screening | Coach-shared images, including progress photos you share, and minors’ chat text, if they contain health details |
| [Map provider] [OPEN] (when run tracking is available) | Route maps | Map area only; route points inside privacy zones are never sent |
| [Analytics vendor] / [Crash-reporting vendor] [OPEN] [PROVISIONAL] | Product analytics and crash reports | **None.** Health data and photos are excluded from analytics and crash reports, which aren’t tied to your account. |

Apple Health, Health Connect and wearables are sources you connect; we don’t send your data to them. We have **no advertising partners**.

### 7.2 Coaches (third parties, only with your separate consent)

Coaches are independent businesses. A coach gets health data **only** if you turn on coach sharing for that coach.

- **Adults:** the health items you choose, progress photos you pick (only after a separate photo-sharing opt-in for that coach; each is watermarked with your initials), form-check videos you share, and run routes you choose to share (zones applied, when available). Viewed in the app only, no downloads. Wearable data isn’t shared with coaches.
- **16–17:** coaches **never** see weight, measurements, injury or pain notes, health-screen answers or wearable data, never get videos, and get no photos. Run routes (when available) only if the teen and parent both opt in, and only distance, pace and a zoned map, never the start or end point. They may see form checks as skeleton and numbers only, if both the teen and the parent agree.
- **Without sharing, a coach sees nothing of your health data**, not even whether, when or how often you added something (for example, weigh-ins).
- Turn sharing off any time; access ends immediately.
- If you ask us to delete your health data, we notify the coach too.
- [OPEN: only if coach terms require it, add: "Coaches must delete your data when asked, under our coach terms."]

### 7.3 Others

- **Your parent (16–17):** can view your data and consent history. [PENDING KEVIN: parent export] Your parent can also download a copy of your data from Parent Settings, and you’ll be told.
- **Legal and safety:** when the law requires it, or to report child sexual abuse material to NCMEC or suspected child abuse to Texas authorities.
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

No third party collects your health data over time or across websites or apps through [App] or our website. The app has **no advertising SDKs** and no cross-app tracking. [PROVISIONAL] We use crash reports and basic product analytics, handled by us or by a service provider working only for us [OPEN: vendors]; they never include health data, progress photos, wearable data, precise location or routes, and you can turn product analytics off in Settings › Privacy. They carry no user ID, name or email, only at most a random install ID that resets when you sign out or delete your account, and we don’t try to link them back to you.

## 10. How we protect it

- Encrypted in transit and at rest, with per-user keys wrapped in [KMS provider], separate from our database.
- Progress photos are encrypted on your phone before upload, locked behind Face ID, fingerprint or passcode in the app [PENDING KEVIN: photo lock], and served only through short-lived links. Deleting them destroys their encryption keys.
- Access is limited to the people and processors who need it to provide what you asked for, and access is logged. Coach access logs are kept 2 years.
- You can change health data any time in the app, or ask us to correct it.

## 11. Your rights

You have the right to:

1. **Confirm and access:** find out whether we collect, share or sell your health data (we don’t sell it), get a copy, and get a list of all third parties and affiliates we’ve shared it with, with a way to contact each. Settings › Privacy › Download my data gives you one ZIP file with your health info (including the injury category and plan changes we inferred from it), data from connected health apps, progress photos (18+), your privacy choices with the exact text you saw, and who received your data, along with the rest of your account data (see the Privacy Policy §16). It leaves out security logs, other people’s information, and confidential safety records; ask us for anything else.
2. **Withdraw consent** to our collection and sharing of your health data at any time.
3. **Delete** your health data. We delete it from all our systems and tell every processor, coach and other recipient to delete it too. Backup copies are deleted within 6 months.
4. **Correct** inaccurate health data.
5. **Not be discriminated against** for using these rights.
6. **Appeal** if we turn down a request.

## 12. How to use your rights

- **In the app:** Settings › Privacy › Your privacy rights (or Parent Settings for parents of 16–17 users).
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
- **Body weight** [PENDING KEVIN: teen weight]: no weight card, trend or chart. Only an optional current value in Profile while both the teen and the parent have health data on, with no goal. If either turns health data off, or the teen clears it, the weight is deleted from the app right away and from our servers and backups within 30 days, and the teen is told when a parent’s change caused it.
- [PENDING KEVIN: parent export] The parent can download a copy of the teen’s data; the teen is told.
- No progress photos, no weight-loss or calorie goals, form-check videos deleted on the phone right after analysis, and coaches never see the teen’s health info.
- **Wearables and health apps:** both the teen and the parent must opt in; coaches never see this data.
- **Approximate location:** only with both opt-ins; never in the background.
- **Precise run GPS (when available):** both the teen and the parent must opt in. Used only during an active run, with no background location at any other time. Privacy zones are always on and can’t be turned off. No public or social route sharing and no route maps on profiles. A coach sees routes only if both opt in to coach sharing, and then only distance, pace and a zoned map, never the start or end point. The parent can view routes, and the teen is told this.
- **Analytics:** product analytics off; crash reports only, with no health data.
- We don’t knowingly collect health data from anyone under 16.

## 14. How long we keep it

| Health data | How long |
|---|---|
| Health data under the switch | Until you turn the switch off or delete it (then deleted within 30 days), or delete your account. |
| Progress photos (18+) | Until you delete them or turn photos off; then removed from your phone right away and from our servers and backups within 30 days. Copies you saved to your camera roll aren’t affected. [PENDING KEVIN: camera-roll option] |
| Adult form-check videos | On your phone; auto-deleted after 90 days unless starred. Shared copies are deleted from our server when unshared or the account is deleted. |
| 16–17 form-check videos | Deleted on the phone right after analysis; never uploaded. |
| Data sent to Anthropic | Deleted within 30 days (up to 2 years if flagged by safety checks, or longer if the law requires). |
| Wearable and health-app data | Until you disconnect the source, turn the switch off, or delete your account; then deleted within 30 days. |
| Run routes (when available) | [OPEN: proposed: kept while your account is active; deleted within 30 days after you delete the route or your account.] |
| Approximate location | [OPEN: proposed: not stored on our servers beyond the request; cached on your phone at most 24 hours.] |
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
