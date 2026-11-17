# [App] Privacy Policy

**Version:** [v0.4 DRAFT] · **Effective date:** [Effective date] · **Last updated:** Nov 17, 2026 (draft)

---

> ## Drafting notes for Engineer and attorney (delete this block before publishing)
>
> **Changelog**
> - **v0.4 (Nov 17, 2026, Counsel):** Kevin’s Nov 17 decisions (`phase5-review.md` › "Kevin decisions Nov 17") folded in. The policy now describes only what ships in v1.
>   - **Progress photos:** the lock is on by default and can be turned off in Photo privacy; saving to the camera roll stays off by default; new **import from the photo library** through the system picker only, with all hidden photo data (EXIF/XMP, GPS location, device make, model and serial) stripped and only a user-confirmed progress date kept (§2, §4.1, §4.4, §5.2, §14, §15). Imported photos get the same opt-in, lock, storage, coach sharing, export and deletion as photos taken in the app.
>   - **Wearables:** v1 sources are Apple Health (HealthKit) and Garmin Connect only. Google Health Connect and other wearables are removed until they ship (§2, §4.3, §5.1, §8.1, §16). New: on disconnect, the user chooses whether to delete or keep data already synced, and delete is the default (§5.1, §15).
>   - **Approximate location:** coarse, never attached to photos (§4.5); purpose and retention set by the Engineer v1 scope below.
>   - **Vendors named:** PostHog (US cloud) for product analytics and Sentry (US) for crash reports (§4.2, §8.1, §19). No map provider in v1.
>   - **Region:** AWS us-west-1, with KMS in the same region (§8.1, §20).
>   - **Parent export:** Kevin said no. A parent can’t download a teen’s data, the teen can download their own, and parent deletion requests stay (§8.3, §9, §16).
>   - **Coach deletion:** unlocked. Coaches must delete client data within [30] days after coaching ends or when asked, under the Coach Terms [ATTORNEY] (§8.2).
>   - **Teens:** a one-time note at 18; "Lose fat" never offered (§9). (The "PR celebrations never body weight" rule was withdrawn Nov 17.)
>   - **Phase 5b (Nov 17):** imported photos are hash-checked before storage; the revised photo opt-in is shown just in time on first import (existing camera consent stays valid); the "we use only photos you take" line is replaced; teen streak rules; the turned-18 note shows once (§4.4, §5.2, §8.1, §9, §13).
>   - **Teen weight, Option 3 (Kevin, Nov 17, 3:21 PM MT):** 16–17s see their weight, history and trends like adults, still behind both health opt-ins, with no coach access, no goal weight, no weight-loss advice, celebrations or reminders, and a support link (§9, §15). Supersedes the Profile-only rule. *(Teen limits other than coach access and both opt-ins withdrawn Nov 17: Kevin declined the teen safeguards.)*
>   - **Engineer v1 scope (Nov 17):** run GPS, routes and maps removed (not in v1); approximate location only for local weather during outdoor cardio, never stored; region AWS us-west-1 with KMS there; Apple Health and Garmin read workouts, heart rate, steps, active energy and body weight; PostHog 12 months and Sentry 90 days confirmed (§2, §4, §5.1, §8, §9, §15, §16, §20).
>   - **Weather provider (Nov 17):** Apple WeatherKit (Apple Inc.), REST API on iOS and Android; receives only the rounded location; not stored by us (§4.5, §8.1).
>   - **Phase 6 (Kevin’s decisions, Nov 17):** coach deletion is 30 days after coaching ends, a deletion request ends coaching and starts the clock, and turning off sharing counts as a deletion request for the shared items (§8.2); NSOPW checks for coaches of 16–17 users, and the parent sees only "Coaching ended" after a block or report (§9); coach section adds "[Company] reviews every application," the document-only identity check (no selfie), registry-search records and deletion confirmations (§12); NCMEC wording covers enticement and trafficking (§13); new retention rows (§15); demo videos in the hash-matching row (§8.1). [ATTORNEY]
>   - **Teen safeguards declined (Kevin, Nov 17, relayed by Fitness App):** removed the 16–17 limits on goal weight, weight-loss rate, calorie-deficit and target-weight advice, weight celebrations, badges, "lost" amounts, weight PRs, weigh-in reminders, body-weight PRs and recap weight, and the support link (§9). Kept: both opt-ins gate weight, coaches never see a minor’s weight or health info, and "Lose fat" stays adults-only. Teen workout-streak rules: see the next line.
>   - **Teen streaks and parent safety exception (Kevin, Nov 17):** teens get the same planned-workouts streak as adults, so the teen-only streak rules are removed from §9 (the "teen streak rules" in the Phase 5b line above are withdrawn). Kevin kept the trust-and-safety exception to the "Coaching ended" parent view (§9). [ATTORNEY]
>   - **Retention:** [PROPOSED] defaults for approximate location, analytics (12 months), crash reports (90 days), adult coach chat (12 months after coaching ends), payment and tax records (7 years) and support emails (2 years) (§15).
>   - **Law checked Nov 17, 2026:** Tex. Bus. & Com. Code §541.001(21) and (29), §509.002 and §509.053; RCW 19.373.080; Apple App Review Guidelines 5.1.2(vi) and 5.1.3(i)–(ii) (last updated Oct 16, 2026); Google Play Photo and Video Permissions policy; Garmin Connect Developer Program Agreement (template on Garmin’s developer portal); PostHog and Sentry privacy-setting documentation; Fifth Circuit en banc order of Oct 28, 2026 (Nos. 24-50721, 25-50096).
> - **v0.3 (Nov 16, 2026, Counsel):** decisions from `phase4-review.md`, `phase4-build-answers.md` and `phase5-review.md` (all revs) folded in.
>   - **AI planning:** it now needs the health switch on (§2, §5.3, §7, §9).
>   - **Health screen:** a 12-month re-screen, also after an injury or condition edit, and AI planning pauses while it’s due. Separately, a 12-month Health data check-in that never expires consent (§5.3). The questions are our own wording and are never called PAR-Q+.
>   - **Anthropic:** now also receives "training schedule" (days and session length) (§2, §7, §8.1).
>   - **Consent records:** described as keyed hashes of IP and device ID, plus provider security logs [OPEN: Supabase log retention] (§4.2, §14, §15).
>   - **Progress photos:** wording filled in (§4.1 row, new §5.2, the §4.4 biometrics bullet, the §15 row). Coach photo sharing is a separate opt-in (§8.2), and there is no face or body measurement extraction (Texas CUBI). Photos are never sent to AI, analytics or crash reports.
>   - **Photo deletion:** off the phone right away, and off servers and backups within 30 days by destroying the photo key. Camera-roll copies are marked (camera-roll option: resolved in v0.4); the lock is marked (photo lock: resolved in v0.4).
>   - **Teen body weight:** an optional current value only, deleted when either opt-in turns off (superseded by Option 3 in v0.4) (§9).
>   - **Coaches:** they can’t see health entries or their metadata, such as weigh-ins, without sharing (§8.2).
>   - **Download my data:** contents and exclusions added (§16).
>   - **Crash and analytics:** not tied to the account; at most a resettable install ID; Tex. Bus. & Com. Code §541.106(b) (§4.2, §19).
>   - **Parent export** of a teen’s data, with the teen notified; held for Kevin (resolved in v0.4: no parent export) (§8.3, §9).
>   - **Contact email:** now `privacy@[domain]`, replacing the provisional Gmail address.
>   - **Corrections confirmed in the text:** the Texas AG breach notice is due within 30 days if 250+ Texans are affected (§521.053(i)), and the TDPSA appeal deadline is 60 days (§541.053(c)). We commit to 45.
>   - **Apostrophes:** curly (’) throughout, as converted by Engineer.
> - **v0.2 (Nov 15, 2026, Counsel):** Kevin’s answers on ad SDKs (none), wearables, location (approximate now, precise run GPS later), provisional analytics, and the teen rules for each.
> - **v0.1 (Nov 15, 2026, Counsel):** first draft.
>
> Drafted by Counsel; this is general legal information, not formal legal representation.
> - **Sources:** `legal/phase2-legal-answers.md`, `phase3-review.md`, `phase3-build-answers.md`, `phase4-review.md`, `phase4-build-answers.md`, `phase5-review.md`, `onboarding-notes.md`, `monetization-notes.md`, `photos-notes.md`, `formcheck-notes.md`, `messaging-notes.md`.
> - **Law checked Nov 15, 2026:** RCW 19.373.010–.050 and .080; Tex. Bus. & Com. Code §§541.001, .051–.055, .102, .107 and §521.053; 16 CFR 318.4–318.6; NRS 603A.495; Apple App Review Guidelines 5.1.1–5.1.5; Google Play "Android Health Permissions"; Anthropic Commercial Terms and API retention article.
> - **v0.3 rechecked Nov 16, 2026:** Tex. Bus. & Com. Code §521.053(i), §541.053(c), §541.106(b), §503.001.
>
> **Placeholders to fill:**
> - [App]; [Company] = [Kevin’s legal name] now, [LLC name] once formed; [mailing address]; privacy@[domain]; [website URL]; [Effective date].
> - Vendors: [KMS provider] (AWS us-west-1, same region as Supabase); [Email provider] (Kevin to choose; launch blocker for the parent-invite email); [Live video/voice provider]; [Push notification provider]; [Safety-moderation and image hash-matching vendor]; [Subscription-management vendor, if used]. Named in v0.4: PostHog (analytics), Sentry (crash reports), Apple WeatherKit (weather).
>
> **Still open (each is marked `[OPEN]`, `[PROPOSED]` or `[PENDING KEVIN]` in the text):**
> 1. **Pending Kevin:**
>    - the app name, company and LLC details, address, domain and effective date;
>    - the email vendor;
>    - the [PROPOSED] retention periods in §15 (Kevin may change any of them; payment and tax records with the CPA).
> 2. **Engineer to supply:**
>    - the Supabase log retention for our plan (§4.2, §15);
>    - whether Anthropic US-only processing is on for our account (§20; Kevin is checking his console);
>    - set PostHog to 12 months and Sentry to 90 days (confirmed), to match §15.
> 3. **Coach Terms:** add the deletion clause (text in `phase5-review.md` › "Kevin decisions Nov 17" (d)) before §8.2 goes live.
> 4. **Wearable data to coaches (adults):** this draft says no. Adding it would need a per-item coach-sharing choice and updates to §5.1 and health policy §3.1 and §7.2. Never for 16–17.
> 5. **Form-check "AI cues":** a server LLM writing cues from form metrics would send data the AI consent doesn’t list. Keep the cues rule-based or on-device, or widen the AI consent and both policies first.
> 6. **Minors’ form numbers to coaches:** need both the teen’s and the parent’s opt-in. Confirm `formcheck-notes.md` is aligned.
> 7. **Version A AI wording** (no retention after the reply): only after Anthropic approves zero data retention in writing (§7 note).
> 8. **Basic workout logs** with the health switch off: treated as needed for logging (RCW 19.373.030(1)(a)(ii)). [ATTORNEY: confirm.]
> 9. **Launch blockers that the text relies on:**
>    - the email sender (the parent invite and the day 3 and day 7 reminders);
>    - Parent Settings (view and withdraw each scope, re-ask, re-screen; no export, per Kevin Nov 17);
>    - the full Settings › Privacy rights rows;
>    - the daily photo and health purge job, with alerts.
>
> **Risks to watch:**
> - **Google Play’s injury-risk clause:** Google bars using health data where its use "could reasonably be expected to lead to ... personal injury." Keep wearable data to display, trends and gentle suggestions. [ATTORNEY + Play review]
> - **Analytics opt-out vs. opt-in under MHMDA** for non-health events. [ATTORNEY]
> - **CUBI and transient on-device processing:** untested in court. Don’t build any face landmarks, face matching or body-measurement extraction from photos without coming back to Counsel.
> - **Garmin license scope:** the Garmin Connect Developer Program Agreement (§4.1) licenses Garmin data for internal business purposes, "only to the extent necessary to format and display such data," and in line with each user’s consent; §15.4 requires notice and consent under data-protection law. Using Garmin data to "help fit your training" may go beyond display. Read the version Kevin actually signs; until then, use Garmin data for display and trends only. [ATTORNEY]
> - **SCOPE Act (Tex. Bus. & Com. Code ch. 509):** likely doesn’t apply (no public profiles or user-posted feed, §509.002(a); SBA small-business exemption, §509.002(b)(4)). Its §509.053 duty to block content that promotes eating disorders is also under a district-court preliminary injunction for the CCIA and NetChoice plaintiffs, and the Fifth Circuit vacated its July 24, 2026 panel opinion and granted rehearing en banc on Oct 28, 2026. We follow the eating-disorder rule as a design benchmark anyway. [ATTORNEY: confirm applicability and injunction status.]
>
> **Attorney must review before launch:**
> - the whole policy and the health policy;
> - TDPSA applicability (Kevin is likely an SBA small business, §541.002; we honor the rights anyway);
> - MHMDA processor adequacy of Anthropic’s DPA;
> - parent-verification adequacy;
> - the retention table;
> - consent wording;
> - the KMS design (with security sign-off);
> - FTC HBNR applicability;
> - the minors’ sections against COPPA, SB 2420 and SCOPE;
> - the "health info" coaches of minors never see vs. the form-check numbers they may see;
> - the wearable, location and photo sections;
> - the provisional analytics opt-out.
> - the photo-import rules and CUBI;
> - the Garmin license scope;
> - the coach-deletion period (30 days proposed) and the Coach Terms clause;
> - parent access without a download (§8.3, §16).
>
> **Build hooks for Engineer:**
> - **Links:** the website homepage footer links both policies, with "Consumer Health Data Privacy Policy" as its own link (RCW 19.373.020(1)(b); NRS 603A.495(2)). The store listings link this policy. In-app: Settings › Privacy shows both policies (Documents row titled "Consumer Health Data Privacy Policy"), the Privacy & safety screen links the health policy, the paywall links Terms and Privacy, and Parent Settings links both.
> - **Rights-request flow:** Settings › Privacy › "Your privacy rights" (access/export, correct, delete, withdraw consent, list of recipients, appeal), plus email to privacy@[domain] for people without the app (two methods, §541.055(a); no new account required).
>   - Authenticate through the signed-in session; for email, use a one-time code to the account email.
>   - Parent requests run from Parent Settings.
>   - The Terms re-accept gate never blocks Settings › Privacy, export or account deletion.
> - **Request log:** ticket ID, type, date received, authentication result, 45-day due date, extension notice (sent inside the first 45 days, with the reason), outcome, recipients notified. Keep it at least 24 months (4 years recommended). Log every Download my data request here.
> - **Appeal path:** an "Appeal this decision" button on every denial and an appeal email address. Answer in writing within 45 days with reasons. On denial, include the Washington AG link (https://www.atg.wa.gov/file-complaint) and the Texas AG link (https://www.texasattorneygeneral.gov/consumer-protection/file-consumer-complaint).
> - **Deletion fan-out:** a job that crypto-shreds the user’s data key, deletes rows, queues backup expiry (max 6 months, except photos, below), and sends deletion notices to every processor and to any coach who received data (RCW 19.373.040(1)(c)). Log each notice.
> - **Consent logs:** one row per item (terms, privacy, health, AI, coach sharing, progress photos, photo sharing per coach, risk acknowledgement, parent attestation, each parent scope). Each row holds:
>   - user ID and actor (teen, parent, adult);
>   - state;
>   - text version and the SHA-256 hash of the exact text shown, characters included;
>   - timestamp;
>   - IP hash and device hash, keyed with a pepper kept outside the database (KMS HMAC key or edge secret, with the pepper version on each row, and a separate pepper from the trainer-code one);
>   - app version.
>   Append only. Archive every text in the append-only `legal_text_versions` table. Never write raw IPs to our tables, function logs or analytics, and alert when the pepper is missing.
> - **Policy versioning:** store each published version with its hash; record which version each user accepted; show an in-app notice and get new consent before any material change that adds a health category, purpose or recipient.
> - **Health screen and re-ask:** our own seven questions (`phase4-build-answers` §2A), never labeled PAR-Q+.
>   - `app.can_ai_plan` requires the re-screen status `ok`; it’s due at 12 months or after an injury or condition edit.
>   - The 12-month Health data re-ask (`consents.reask_on`) never locks the app or pauses AI on its own.
> - **Teen notifications:** notify the teen whenever the parent changes a setting or consent, and when a parent’s change deletes the teen’s weight. Push previews say only "Your parent changed a privacy setting."
> - **Day-14 purge** of unlinked 16–17 accounts and the parent email (the clock starts at account creation); device-side purge of the Setup 6–8 answers.
> - **Store age data:** delete the raw Apple/Google age response after verification; keep only the age band, its source and a timestamp.
> - **Progress photos:**
>   - separate first-use opt-in rows;
>   - encrypted on the device;
>   - location and device metadata stripped;
>   - a per-photo key, crypto-shredded on delete so backups are unreadable within 30 days;
>   - shared copies under a separate key, revoked immediately;
>   - hash matching on imported photos before storage, and on shared copies before sharing;
>   - **Re-consent for import:** existing opted-in users keep their consent for camera photos and are never blocked at launch. The first tap on Import shows the revised opt-in just in time (Agree / Cancel, equal weight) and logs a new row with the new version and hash; new users see the revised text in onboarding (RCW 19.373.030).
>   - never in the Anthropic prompt builder, analytics, crash reports, session replays or crash screenshots;
>   - no face detection or landmarks, no face recognition, no body or face measurement extraction (the alignment check uses the overlay, whole-frame similarity, or on-device body-only pose points with face points discarded and nothing stored);
>   - **Import from the photo library:** system picker only (iOS `PHPickerViewController`; Android Photo Picker; in Expo, `launchImageLibraryAsync` without requesting media-library permission). Never request full-library access (Google Play’s Photo and Video Permissions policy limits `READ_MEDIA_IMAGES` when a picker is enough). Accept JPEG, HEIC and PNG; re-encode to JPEG on the phone; strip every EXIF, XMP, IPTC and maker-note field, including GPS, device make, model and serial, before encryption, even if approximate location is on. Read `DateTimeOriginal` on the phone only to prefill the progress date; the user confirms or edits it; store only that date and discard the rest. Never change the original in the library. No face detection, landmarks, auto-crop, blur or body measurement on imported photos (CUBI §503.001).
>   - **Lock:** on by default; a Photo privacy setting turns it off (log the change). When on, re-lock after 1 minute away.
>   - **Camera roll:** saving copies is off by default; turning it on shows the "we can’t delete these" warning.
>   - the server rejects uploads from users under 18.
> - **Coach visibility:** row-level security on health rows (including weigh-ins) so a coach sees no rows, counts, timestamps, `updated_at`, sync events or derived "last active" signals unless sharing is on for that coach. Check the aggregate endpoints, realtime channels and push payloads.
> - **Download my data:** build it to the §16 contents and exclusions.
>   - One ZIP (JSON and CSV, plus photos).
>   - Generated on the server and delivered through a short-lived in-app link after a lock check.
>   - Never includes the pepper, keys, other people’s data, safety, moderation or NCMEC records, internal security logs, or AI prompts.
> - **Wearables (v1: Apple Health and Garmin only):**
>   - a separate "Connect health apps and wearables" switch, off by default, then a per-source connect (Apple Health; Garmin through Garmin Connect authorization) requesting only the types we use; never request reproductive or sexual health types (no Garmin Women’s Health API);
>   - HealthKit read-only unless a write is needed; never write false data to HealthKit; no HealthKit data in iCloud (Apple 5.1.3(ii)); no HealthKit data for marketing, advertising or use-based data mining (5.1.2(vi), 5.1.3(i));
>   - accept the Garmin Connect Developer Program Agreement before building, and use Garmin data only as it allows (see Risks);
>   - encrypted like other health data;
>   - every row tagged with its source; a per-source disconnect stops reads immediately (and ends the Garmin authorization), then asks "Delete data already synced from {Source}?" with **Delete** as the default and **Keep** as the other choice; Delete removes that source’s data within 30 days; a Garmin deregistration notice counts as a disconnect with Delete;
>   - kept out of the Anthropic prompt builder, PostHog, Sentry and coach APIs;
>   - for 16–17, both teen and parent opt-in rows;
>   - Google Health Connect: not in v1; when it ships, add the Play Console health declaration and update §4.3 and §5.1 first.
> - **Approximate location:**
>   - "while using" and approximate only, requested only when the user opens a feature that needs it; no background location;
>   - rounded on the device to about 1 mile, well outside the TDPSA "precise" line (within 1,750 ft, §541.001(21)); don’t log coordinates; never attach location to photos, analytics or crash reports; turn off PostHog GeoIP enrichment;
>   - purpose: local weather during outdoor cardio only (Engineer, Nov 17); never stored on our servers; the weather request carries only the rounded location, no account data; provider is Apple WeatherKit (REST API); show the Apple Weather mark and the legal data-sources link wherever weather is shown (`phase5-review.md` › Engineer v1 scope);
>   - a manual-entry fallback for every feature (Apple 5.1.2(i));
>   - for 16–17, both teen and parent opt-in before the OS prompt.
> - **Precise run GPS:** not in v1. Before it ships, it needs its own precise + background opt-in, privacy zones (locked on for 16–17), route controls, the Play background-location declaration, and new policy text.
> - **Geofencing ban:** no geofences around health-care facilities, and no inference of health-facility visits (RCW 19.373.080).
> - **Analytics (PostHog, US cloud) and crash reports (Sentry, US region):**
>   - sign each vendor’s DPA and list them as processors (done in §8.1);
>   - PostHog: autocapture off, session replay off, app-lifecycle and screen capture off unless allowlisted, `personProfiles: 'never'` (anonymous events only), "Discard client IP data" on, the GeoIP transformation off, no person properties for feature flags, an explicit US host;
>   - Sentry: `sendDefaultPii: false`, `attachScreenshot: false`, `attachViewHierarchy: false`, "Prevent Storing of IP Addresses" on, server-side data scrubbing on, console breadcrumbs off, no `setUser`; strip IDs and tokens from request URLs and query strings (Sentry always sends them);
>   - an event allowlist with no health, weight, wearable, photo, route or location fields and no free text; no events or properties from the health, weight, photo or wearable screens;
>   - no user ID, name or email on any event: at most a random install ID that resets on sign-out and account deletion, never joined to account data, and shared only with processors (needed for the §541.106(b) basis);
>   - no IDFA, cross-app identifiers or ATT prompt;
>   - a "Share usage analytics" switch, on by default for adults; for 16–17, crash reports only.
> - **Maps:** none in v1 (no map screens in the repo, checked Nov 17). Add a map provider to §8.1 before any map ships.

---

## 1. Who we are

[App] is a strength and fitness training app run by [Company] ("we," "us"). We’re based in Texas, USA. This policy explains what personal information we collect, why, who we share it with, how long we keep it, and the choices and rights you have.

Health information gets extra protection. Our **[Consumer Health Data Privacy Policy](/consumer-health-data-privacy-policy)** covers it in detail and is part of this policy.

Questions: privacy@[domain] · [mailing address].

## 2. The short version

- We **don’t sell** your personal information, we **don’t use it for targeted ads**, we **don’t share it for advertising**, and the app has **no advertising SDKs**.
- Health info (like body weight or injury notes) is collected only if you turn it on. It’s off by default, encrypted, and never used for ads.
- AI planning is a separate switch, also off by default, and it works only while health info is on. If you turn it on, our AI provider, Anthropic, gets only your goals, experience, equipment, training schedule (days and session length), age range and an injury category. It never gets your name, email, photos, location or notes.
- Progress photos (18+) are a separate opt-in, off by default. You can take them in the app or import ones you pick from your photo library. They’re encrypted, never used for ads, analytics or AI, and shared with a coach only if you pick them and turn on photo sharing.
- Data from Apple Health or Garmin is a separate switch, off by default, connected one source at a time. It’s never sold, never used for ads, and never sent to our AI provider.
- Location is off by default. We ask for approximate location only to show local weather when you start an outdoor cardio workout, never in the background, and we don’t store it.
- A coach sees your data only if you turn on coach sharing.
- You must be at least 16. If you’re 16 or 17, a parent or guardian has to link to your account and agree first.
- [App] is offered only in the United States.

## 3. Who can use [App]

- You must be **16 or older**. We don’t let anyone under 16 create an account.
- If you’re **16 or 17**, a parent or legal guardian must link to your account and agree to our Terms as the contracting party before your account is fully active. See §9.
- [App] is for people in the **United States** only.

## 4. What we collect

### 4.1 Information you give us

| What | Examples | Why |
|---|---|---|
| Date of birth (used once, then discarded) | The date you enter on the first screen | To check you’re old enough. We **don’t save** your date of birth. We keep only a general age range (an "age band") and, for 16–17, the date you turn 18. |
| Account details | Email address, password (stored hashed by our auth provider), name if you add one | To create and secure your account and contact you about it. |
| Parent invite (16–17 only) | Your parent’s email address | Only to send the invite. Deleted if the parent doesn’t link within 14 days. |
| Training setup | Training style, days per week, session length, gyms and equipment, units, app color, optional lift maxes, Hyrox race date | To build your plan and show the app the way you like. |
| Workout logs | Exercises, sets, reps, loads, cardio, personal records, swaps and their reasons | To give you the logging, history and charts you asked for. |
| Health info (**only if you turn it on**) | Body weight, measurements, injury and pain notes, health-screen answers, form-check numbers, training data used for your health profile | To build and adjust your workouts, show progress, and keep plans safe. See the [Consumer Health Data Privacy Policy](/consumer-health-data-privacy-policy). |
| Progress photos (**18+ only, optional**) | Front, side and back photos you take in the app or import from your photo library | To show your progress privately, and to a 1:1 coach only for photos you pick. **Separate opt-in:** the first time you open Progress photos, you choose whether to turn on "Allow progress photos." It’s off by default and separate from Health data, AI planning and coach sharing. Sharing photos with your coach is another separate opt-in that you can turn off anytime. Location, device details and other hidden photo data are removed before upload. Photos are never used for ads, analytics or AI. Turning photos off deletes them (see §15). More in §5.2. |
| Form-check videos (**optional**) | Short videos of a lift | Analyzed on your phone. Adults’ saved videos stay on the phone unless shared with a 1:1 coach. 16–17: the video is deleted right after analysis and never uploaded. |
| Messages | Chat with your 1:1 coach (text only for 16–17) | To provide coaching. |
| Consent and safety choices | Your switch settings, your risk acknowledgement, parent attestation | To prove what you agreed to and when. |
| Support and rights requests | What you write to us | To help you and keep records the law requires. |

### 4.2 Information collected automatically

- **Device and app info:** device type, operating system, app version, language, crash and error logs, and IP address. We use this to run, secure and fix the app.
- **Security and consent records:** when you give or withdraw consent, accept our Terms, or make a privacy request, we record the time, the version of the text you saw, your app version, and a one-way coded (hashed) version of your IP address and device ID, not the addresses themselves. Our hosting and sign-in providers also see your IP address when you use [App] and keep it in security logs for a limited time [OPEN: the Supabase log retention for our plan].
- **A no-personal-data device flag:** if someone is turned away for age, we set a flag on that device so the form can’t be retried. It contains no personal information.

- **Crash reports and basic product analytics:** which screens and features are used, app performance and crashes. Product analytics go to PostHog and crash reports go to Sentry, service providers working only for us that store this data in the US. Analytics events never include health info, weight, progress photos, wearable data or location, and we don’t track you across other companies’ apps or websites. You can turn product analytics off in Settings › Privacy › Share usage analytics. 16–17: product analytics stay off; only crash reports are collected. **Crash reports and analytics events aren’t tied to your account:** they carry no user ID, name or email, at most a random install ID that resets when you sign out or delete your account, and we don’t try to link them back to you. Neither service stores your IP address with events, and crash reports never include screenshots or progress photos.

The app has **no advertising SDKs**, and we **don’t share any data for advertising**.

### 4.3 Information from other sources

- **Apple or Google sign-in:** your name and email (or Apple’s private relay email) if you choose to sign in that way.
- **App store age signals:** Apple’s Declared Age Range or Google Play Age Signals tell us an age range, and for minors whether a parent approved. We use the **lower** of that age and the one from your date of birth. We delete the store’s raw response once the check is done, as Texas law requires (Tex. Bus. & Com. Code §121.055(b)), and keep only the age band, its source and a timestamp.
- **Apple and Google purchases:** whether you have an active Pro subscription and its status. We don’t get your card details.
- **Stripe:** payment status for 1:1 coaching, and verification results for parents and coaches (a result ID, not card numbers or ID images).
- **Apple Health and Garmin (only if you connect them):** Apple Health (HealthKit) on iPhone, and Garmin Connect if you link your Garmin account. See §5.1.
- **Your parent (16–17):** consent choices and settings changes your parent makes.
- **Your coach:** plans, notes and messages your coach creates for you.

### 4.4 What we don’t collect

- Your raw date of birth (after the age check).
- Precise location, or location in the background. See §4.5.
- Health-app or wearable data you haven’t connected.
- Biometric identifiers. Face ID or fingerprint unlock happens on your phone; we never receive it. Pose tracking for form checks runs on your phone, face points are discarded, and we don’t use face recognition. We don’t extract face or body measurements from progress photos.
- Your contacts or your photo library. If you import progress photos, you pick them in your phone’s photo picker, and the app gets only the photos you pick, never access to your whole library.

### 4.5 Location

**Approximate location (off by default).** We use it only to show local weather when you start an outdoor cardio workout. We ask the first time you use it, and you can type a city instead. We use only approximate location (about a mile, never pinpoint), only at that moment, and **never in the background**. We **don’t store it**: only the rounded location is sent to Apple WeatherKit to get the forecast, and then it’s discarded. We never attach location to progress photos.

**Rules for all location data:**
- We don’t collect precise location, which Texas law treats as "sensitive data" (Tex. Bus. & Com. Code §541.001(29)).
- We **never** use location to work out whether you visited a health-care facility, and we never set up geofences around health-care facilities (RCW 19.373.080).
- Location that could show you’re seeking health care can be health data under Washington law. We don’t use location that way (Consumer Health Data Privacy Policy §3.2).
- Location is **never sent to Anthropic**, never used for ads, and never included in analytics.
- 16–17: see §9.

## 5. Health information

Health info is collected **only if you turn on the "Save my health info" switch**. It is:

- encrypted with keys held in a separate key-management service ([KMS provider]), not in our database;
- never sold and never used for ads;
- shared only with service providers who process it for us under contract, and with your coach only if you separately turn on coach sharing.

You can turn it off any time in Settings › Privacy. When you do, we stop collecting it and delete it within 30 days. Full details are in the **[Consumer Health Data Privacy Policy](/consumer-health-data-privacy-policy)**.

### 5.1 Health apps and wearables

You can choose to connect **Apple Health** (HealthKit, on iPhone) or **Garmin** (through your Garmin Connect account). Other health apps and wearables aren’t available yet. We read only **workouts, heart rate, steps, active energy and body weight**. Body weight from these sources follows the same rules as weight you enter yourself, including the 16–17 rules in §9.

- It’s a **separate switch, off by default**, and you connect **one source at a time**. Your phone’s permission screen lets you pick which data types to share.
- We use this data only to show your activity and trends in [App] and to help fit your training to you. It’s treated like other health info: encrypted, **never sold, never used for ads or marketing, never used for data mining**, and never stored in iCloud.
- It’s **not sent to Anthropic** or any other AI provider, never included in analytics or crash reports, and not shared with coaches. [OPEN: coach sharing of wearable data for adults; see drafting note 4.]
- **Disconnecting:** disconnect a source any time in Settings › Privacy. Reading stops right away, and we ask whether to delete the data already synced from that source. **Delete** is the default: we remove it within 30 days. If you choose **Keep**, it stays with your other health info until you delete it, turn the health switch off, or delete your account. If you remove [App]’s access in Garmin Connect, we treat it as a disconnect and delete that data within 30 days. If you turn off access in Apple Health, Apple doesn’t tell us, so use Settings › Privacy in [App] to delete what was already synced.
- 16–17: the teen and the parent must both opt in, and coaches never see it.

### 5.2 Progress photos (18+ only)

- **Separate opt-in, off by default.** The first time you open Progress photos, you choose whether to turn on "Allow progress photos." It’s separate from Health data, AI planning and coach sharing. 16–17 users can’t take, import or upload progress photos; the feature opens at 18.
- **What we keep:** the photos you take in [App] or import, and each photo’s progress date. We remove location, device details and other hidden photo data before upload.
- **Importing from your photo library:** you pick photos in your phone’s photo picker, so [App] gets only the photos you pick, never access to your whole library. JPEG, HEIC and PNG work. Your phone makes a copy, converts it to JPEG and removes all hidden photo data, including GPS location and the device’s make, model and serial number, even if you’ve turned on approximate location. We read the date the photo was taken, on your phone, only to suggest a progress date; you confirm or change it, and we keep only that date. Your original stays in your library, unchanged. Import only photos of yourself (Terms §11). Because an imported photo can come from anywhere, it goes through an automated safety check (matching against known child-abuse images) before it’s stored. The first time you import, we show you the updated photo consent and ask you to agree. Imported photos follow every rule in this section.
- **Protection:** photos are encrypted on your phone before upload and served only through short-lived links. In the app, they’re locked behind Face ID, your fingerprint or your phone’s passcode. The lock is on by default, and you can turn it off in Photo privacy.
- **Never:** used for ads, analytics, crash reports or AI, or sent to Anthropic. We don’t extract face or body measurements from photos, and we don’t use face detection or face recognition on them, whether you took them in [App] or imported them.
- **Sharing with a coach** is another separate opt-in, offered only when you have an active 1:1 coach. The coach sees only photos you pick, in the app, with no downloads, and each one is watermarked with your initials. We can’t block screenshots. Shared photos go through an automated safety check. Turn sharing off anytime; the coach loses access right away.
- **Turning photos off or deleting them:** turning progress photos off stops new photos and deletes the ones you’ve taken, and we offer you a copy first. Deleted photos are removed from your phone right away and from our servers and backups within 30 days; we destroy their encryption keys so backup copies can’t be read. You can download your photos anytime (Settings › Privacy › Download my data, or Photo privacy › Download my photos). A downloaded copy isn’t locked or encrypted, and we can’t delete it.
- **Camera roll:** saving copies to your camera roll is off by default. If you turn it on, those copies aren’t locked or encrypted, and we can’t delete them. Importing a photo doesn’t change or delete the original in your library.

### 5.3 Health screen and 12-month check-ins

- Before an AI plan, we ask a short set of health questions written in our own words (not an official questionnaire). If an answer suggests you check with a professional first, you can confirm you’re cleared with a checkbox; we never ask for a doctor’s note or medical records.
- We ask you to update the health screen every 12 months and whenever you change an injury or condition. **AI planning pauses until you do**; your saved plan stays but stops adapting, and logging and coaching continue. For 16–17, the teen and the parent update it together.
- Every 12 months we also ask whether you still want Health data on. It stays on until you turn it off; the check-in never switches it off by itself.

## 6. How we use information

We use personal information to:

- create and secure accounts, check age and run parent linking;
- provide logging, history, charts, plans, swaps, form checks and coaching features;
- build and adjust your plan (with AI only if you turn AI planning on);
- process subscriptions and coaching payments;
- send service messages, such as verification codes, trial reminders, billing notices and safety notices [OPEN: marketing email only with a separate opt-in];
- keep users safe, including chat safety filters for minors and reporting required by law (§13);
- prevent fraud and abuse, and fix bugs;
- keep the records the law requires and respond to legal requests.

We **don’t** sell personal information, use it for targeted ads, or use it for profiling that produces legal or similarly significant effects.

## 7. AI planning (Anthropic)

AI planning is a **separate switch, off by default**. You can use [App] without it. **It needs the health switch on**, because it checks your health-screen answers and uses any injury you add to avoid or swap exercises, and those answers are health info. It also pauses while your health screen is due for its 12-month update (§5.3).

**If you turn it on:**

- We send Anthropic, our AI provider, your **goals, experience, equipment, training schedule (days and session length), age range and an injury category**, with a random ID that changes every request. From your health info, Anthropic receives only the injury category.
- We **never** send your name, email, user ID, progress photos, location, wearable or health-app data, health-screen answers, measurements, weight, or free-text notes.
- Anthropic processes this data only for us, under its Commercial Terms and Data Processing Addendum, and **doesn’t train its AI on it**.
- **Anthropic deletes it within 30 days**, unless its automated safety checks flag a request (then it may keep that request for up to 2 years) or the law requires it to keep data longer.
- The AI uses the injury category **only to avoid or swap exercises**. It never builds rehab or treatment plans.
- AI-made plans are labeled: "Made with AI. It can be wrong, so check that it fits you. It isn’t medical advice. Stop and see a professional if anything hurts."

> [DRAFTING NOTE: Once Anthropic approves zero data retention **in writing** and the Console shows it under Settings › Privacy Controls › Data retention period, replace the retention bullet above with the Version A wording: "Anthropic doesn’t store it after replying. The one exception is when the law requires it or Anthropic’s automated safety checks flag a request; Anthropic also keeps the results of those safety checks." Update the health policy §8, the in-app AI switch text and the consent version/hash at the same time.]

Turn it off any time in Settings › Privacy. Your saved plan stays but stops adapting. For 16–17, a parent must also agree before it turns on, and either can turn it off.

## 8. How we share information

### 8.1 Service providers (processors)

These companies process data **for us, under contract**, and only as we instruct. They may not sell it or use it for their own purposes.

| Provider | What they do | Data they handle |
|---|---|---|
| Supabase | Hosting, database, sign-in (AWS us-west-1) | All account and app data (health info is stored encrypted) |
| [KMS provider] | Key management (AWS us-west-1) | Encryption keys only, not your data |
| Anthropic | AI planning (only if you turn it on) | Goals, experience, equipment, training schedule (days and session length), age range, injury category, random request ID |
| Apple and Google | Sign-in (if chosen), in-app purchases, age signals, app distribution | Sign-in identity, purchase status, age range |
| Stripe | Payments for 1:1 coaching, parent card verification, identity checks for coaches and for parents of minors in 1:1 | Payment and verification details (Stripe also acts under its own privacy policy for payments) |
| [Email provider] | Sending account, parent-invite and service emails | Email address, message content |
| [Live video/voice provider] [OPEN] | Live coaching check-ins (never recorded for 16–17) | Audio/video stream, session times |
| [Push notification provider] [OPEN] | Push notifications | Device token, notification text |
| [Safety-moderation and image hash-matching vendor] [OPEN] | Safety filters on minors’ coach chats; hash matching on imported progress photos, coach-shared images and coach demo videos | Message text, shared images, demo videos |
| [Subscription-management vendor] [OPEN, only if used] | Receipt checking for Pro | Purchase records, an app user ID |
| PostHog (US cloud) | Basic product analytics (you can turn it off) | Feature and screen usage, app version, device type, a random install ID; no user ID, name or email, no stored IP address, and no health info, weight, photos, wearable data or location |
| Sentry (US) | Crash and error reports | Crash logs, device and app version, a random install ID; no user ID, name or email, no stored IP address, no screenshots, and no photos or health info |
| Apple WeatherKit (Apple Inc.) | Local weather during outdoor cardio (only if you allow location) | Your rounded, approximate location only, for that one request; no account details. We don’t store it. |

Apple Health and Garmin are **sources** you connect, not companies we send your data to.

**No advertising partners.** The app has no advertising SDKs, and we share no data with advertisers or ad networks.

### 8.2 Your coach (only if you turn on coach sharing)

Coaches are **independent** businesses, not our employees. A coach sees your data only if you turn on coach sharing for that coach, which is a separate switch from the health switch.

- **Adults:** your coach can see your workouts, history, PRs, charts, the health items you choose, and any form-check videos you share. Progress photos need a separate photo-sharing opt-in for that coach, and then the coach sees only the photos you pick, watermarked with your initials. No downloads. Wearable data isn’t shared with coaches.
- **16–17:** your coach can see workouts, history, PRs, charts, and form checks as skeleton and numbers only. Coaches **never** see a minor’s health info or wearable data (weight, including weight synced from Apple Health or Garmin, measurements, injury or pain notes, health-screen answers), never get videos, and get no photos. The teen and the parent must both agree.
- **Without sharing, coaches see nothing of your health info**, not even whether, when or how often you added something (for example, weigh-ins).
- Turn it off any time in Settings › Coaching (photo sharing in Photo privacy or on any shared photo); access stops immediately.
- **Coaches must delete your data,** including any progress photos, weigh-ins and other health info they received, within 30 days after your coaching ends, under our Coach Terms. Asking your coach to delete your data ends coaching right away and starts the 30 days, and your coach loses access in [App] right away. Turning off coach sharing also counts as a request to delete what you had shared: your coach loses access to it right away and must delete any copies within 30 days. If you ask us to delete your data, we tell your coach too. [ATTORNEY: matches Coach Terms v0.1 §2.]

### 8.3 Your parent (16–17)

A linked parent can see your data and consent history, and everything your coach sees. Your parent can read your coach chat. You’ll be told whenever your parent changes a setting or consent. Your parent **can’t download** a copy of your data; only you can (§16). Your parent can still ask us to delete your data or close your account from Parent Settings.

### 8.4 Legal, safety and business reasons

We may disclose information:

- when the law requires it, such as a valid subpoena or court order;
- to report suspected child sexual abuse material to NCMEC (18 U.S.C. §2258A) or suspected child abuse to Texas authorities (Tex. Fam. Code §261.101);
- to protect someone from serious harm, or to protect our rights and users;
- in a merger, sale or reorganization, where the new owner must keep this policy’s promises for existing data (including the health policy), or ask for your consent first.

### 8.5 What we never do

- We never **sell** personal information.
- We never use it for **targeted advertising**, never share it for advertising, and have no advertising SDKs in the app.
- We never share health info with advertisers, data brokers or employers.

## 9. Teens (16–17) and parents

- **Age check:** we ask for date of birth before email, with no hints, and combine it with the app store age signal, using the lower age. We store only an age band and the date you turn 18.
- **Pending account:** until a parent links, the account holds only your email, age band, the date you turn 18, the parent’s invite email and the invite status. Setup answers (training style, gym, units) stay **on your phone** and upload only once the link is active. No health info, workouts or purchases until then.
- **14-day limit:** if no parent links within 14 days, we delete the account and the parent’s email. We use the parent’s email only to send the invite.
- **Parent is the contracting party.** The parent agrees to the Terms and this policy, and is the customer for any purchase. No purchases until the link is active.
- **Both must agree.** Health info, AI planning and coach sharing each turn on only when **both** the teen and the parent opt in. Either can turn any of them off. AI planning also needs health info on, and the teen and parent update the health screen together.
- **Parent can view** the teen’s data and consent history, and the teen is notified when the parent changes anything. The parent can’t download a copy of the teen’s data; the teen can download their own (§16). The parent can still ask us to delete the teen’s data or close the account.
- **Extra protections for 16–17:**
  - no progress photos;
  - form checks shared only as skeleton and numbers, never video (the video is deleted on the phone right after analysis);
  - coach chat is text only, and the parent can read it;
  - the "Lose fat" goal isn’t offered;
  - **body weight:** with health info on (both the teen’s and the parent’s opt-in), you can log your weight, or sync it from Apple Health or Garmin, and see your history and trend charts, the same as adults. Coaches never see it. If either turns health info off, or the teen deletes it, it’s deleted: from the app right away, and from our servers and backups within 30 days. The teen is told when a parent’s change caused it;
  - live sessions only with a parent invite, and never recorded;
  - coaches never see the teen’s health info;
  - **coaches of 16–17 users** are checked against the national sex offender public registry (NSOPW). We don’t run criminal background checks;
  - **blocking or reporting a coach** needs no parent approval and takes effect right away. It ends coaching, and your parent sees only "Coaching ended," not the reason, unless our trust and safety team decides your safety requires telling them;
  - **wearables and health apps:** connecting requires both the teen and the parent to opt in; never shared with coaches;
  - **approximate location:** only with both the teen’s and the parent’s opt-in, and never in the background;
  - **analytics:** product analytics are off; only crash reports are collected.
- **At 18:** the account becomes an adult account on the stored date, and we show a one-time note (once only, never repeated, and the same information stays in Settings) explaining what changes (Parent Settings ends, your privacy choices are yours alone, and you may need to accept the Terms in your own name) [ATTORNEY/Engineer: confirm the parent link ends at 18]. Progress photos become available; nothing is collected for them before then.

## 10. Children under 16

[App] isn’t for anyone under 16. If someone under 16 tries to sign up, we show a generic message and save nothing they entered (we keep only a total count of turned-away sign-ups). We don’t knowingly collect personal information from children under 13. If we learn we have, we delete it. Contact privacy@[domain] if you think we have.

## 11. Payments

- **Pro** is bought through Apple or Google in-app purchase. Apple or Google handle the payment; we receive only subscription status.
- **1:1 coaching** is sold by the coach, who is the seller of record. Payments go through Stripe as direct charges to the coach’s Stripe account. For 16–17, the parent is the customer.
- We don’t store full card numbers. For parent verification we keep only the method and Stripe’s result ID.

## 12. If you’re a coach

If you apply to coach on [App], we also collect: your name, contact details, certifications and their verification results, your Stripe connected-account status and identity-check result, your 18+ attestation, your profile and content, and, if you’ll coach minors, a National Sex Offender Public Website (NSOPW) search result and your Texas abuse-reporting training record. [Company] reviews every application. We use these to approve and run your coach account and keep clients safe. We keep a 2-year log of your access to client data.

- **Identity check:** Stripe checks your ID document. It’s document-only, with no selfie, and we receive only the method and a result ID, never your ID images.
- **Registry search (coaches of 16–17 users):** we record the search date, who reviewed it, the result category, and any source that was unavailable, and we search again at least once a year and after a name change. A name match alone never leads to a denial: a person reviews it, and you get a neutral notice and a chance to show the match isn’t you. We don’t run criminal background checks.
- **Deletion confirmations:** when coaching ends, we keep your item-by-item confirmation that you deleted the client’s data, and the reminders and notices we sent you.

## 13. Safety monitoring and reporting

- Coach chats with 16–17 users are text only, filtered for self-harm, eating disorders, substances, harassment and grooming, and reviewed by people when flagged. They’re never disappearing.
- Imported progress photos and images shared with coaches are checked against known child-abuse image hashes.
- We report apparent child sexual exploitation, including child sexual abuse material, enticement or trafficking of a minor, to NCMEC (18 U.S.C. §2258A), as federal law requires, and suspected child abuse to Texas authorities as state law requires.
- Safety records are kept as shown in §15.

## 14. Security

- Data is encrypted in transit (TLS) and at rest.
- Health info uses per-user encryption keys, wrapped by [KMS provider] and used only by our server. The database holds only encrypted data and wrapped keys.
- Progress photos are encrypted on your phone before upload and served only through short-lived links. In the app they’re locked behind Face ID, your fingerprint or your passcode (on by default; you can turn the lock off in Photo privacy). When photos are deleted, we destroy their encryption keys.
- IP addresses and device IDs in consent records are stored only as keyed one-way hashes; the key is kept outside our database.
- Access by our staff and processors is limited to what’s needed, and logged.

No system is perfectly secure. See §18 for what we do if something goes wrong.

## 15. How long we keep information

| Information | How long |
|---|---|
| Account data, workout logs, settings | While your account is open. After you delete your account, we delete it within 45 days; backups expire within 6 months. |
| Health info | Until you turn the health switch off or delete it (then deleted within 30 days), or you delete your account. 16–17 body weight: deleted the same way when either the teen or the parent turns health info off, or the teen clears it. |
| Progress photos (18+, taken or imported) | Until you delete them or turn photos off; then removed from your phone right away and from our servers and backups within 30 days. Copies you saved to your camera roll, and the originals of photos you imported, stay in your library; we can’t delete them. |
| Adult form-check videos | On your phone; auto-deleted after 90 days unless starred. Shared copies are deleted from our server when you unshare or delete your account. |
| 16–17 form-check videos | Deleted on the phone right after analysis; never uploaded. |
| Pending 16–17 account and parent’s email | Deleted on day 14 if the parent hasn’t linked. |
| Raw date of birth | Not kept. |
| Raw app store age signal | Deleted once the check is done. |
| Turned-away under-16 sign-ups | No personal information kept. |
| Data sent to Anthropic | Deleted by Anthropic within 30 days (up to 2 years if its safety checks flag a request, or longer if the law requires). |
| Consent records (version, text hash, timestamps, hashed IP and device ID, app version) | Life of the account + 4 years; for minors, at least until their 22nd birthday. |
| Privacy-rights and deletion request logs | At least 24 months (we aim for 4 years). |
| Coach access logs | 2 years. |
| Coach deletion confirmations, reminders and notices | [PROPOSED] 3 years after the confirmation or the last notice. |
| Coach registry (NSOPW) search records | [PROPOSED] While the coach is approved for 16–17 users, plus 3 years. |
| Minor safety records (flags, reports, chat kept for safety review) | Until the minor’s 22nd birthday or 4 years, whichever is later. Legal holds override. |
| NCMEC report materials | 1 year after the report, secured and access-limited. |
| Wearable and health-app data (Apple Health, Garmin) | Until you disconnect the source (unless you choose to keep data already synced), turn the switch off, or delete your account; then deleted within 30 days. |
| Approximate location | Not stored. Used once to get local weather, then discarded. |
| Analytics events (PostHog) | Not linked to your account. 12 months. |
| Crash reports (Sentry) | Not linked to your account. 90 days. |
| IP addresses in our hosting and sign-in providers’ security logs | [OPEN: the Supabase log retention for our plan] |
| Adult coach chat after coaching ends | [PROPOSED] 12 months after coaching ends, then deleted, unless a safety record or legal hold applies. |
| Payment and tax records | [PROPOSED] 7 years [confirm with CPA]. |
| Support emails | [PROPOSED] 2 years after the conversation ends. |

## 16. Your choices and rights

**Everyone, wherever you live in the US, can:**

- see and download your data (Settings › Privacy › Download my data; see below);
- correct it (in the app, or ask us);
- delete it, or your whole account (Settings › Account › Delete account);
- turn the health, wearable, location, AI, coach-sharing, progress-photo and photo-sharing switches off any time, and turn off product analytics;
- get a list of the companies we’ve shared your data with.

We won’t treat you differently, charge you more or give you a worse service for using these rights. (If you turn off health info or AI, features that need them, like an adaptive AI plan, stop working; the free logging tier always stays.)

**What "Download my data" includes:** one ZIP file, with data in common formats (JSON and CSV):
- your account and settings (email, name, age range and the date you turn 18; we don’t keep your date of birth);
- your training setup;
- workouts, sets and PRs;
- your AI quiz answers and AI plans;
- health info you’ve saved, including the injury category and plan changes we made from it;
- data from Apple Health and Garmin, if you connected them;
- progress photos (18+), taken or imported, with location and device details removed;
- messages with your coach;
- your privacy choices (every consent and switch change, with the date and the exact text you saw);
- who received your data;
- purchases recorded with us;
- requests you’ve sent us.

Some records aren’t in the file: security logs, other people’s information (including another client’s data or a coach’s or parent’s own account data), and safety and child-protection records we must keep confidential. The hashed IP and device codes in your consent records aren’t in the file, but you can ask for them. Crash reports and analytics events aren’t linked to your account, so we can’t find them for a request; Texas law doesn’t require us to re-link them (Tex. Bus. & Com. Code §541.106(b)). Ask us through Your privacy rights about anything else.

**Texas residents** (Texas Data Privacy and Security Act, Tex. Bus. & Com. Code ch. 541): you can confirm and access your data, correct it, delete it, get a portable copy, and opt out of sale, targeted ads and profiling (§541.051). We don’t sell personal information, do targeted ads or do that kind of profiling, so there’s nothing to opt out of, but you can still ask. We process sensitive data, like health info or data of a known child, only with consent.

**Washington and Nevada residents:** you have health-data rights under Washington’s My Health My Data Act and Nevada’s consumer health data law. See the [Consumer Health Data Privacy Policy](/consumer-health-data-privacy-policy).

**Other states:** if your state gives you more privacy rights, we’ll honor them. Contact us.

**Parents of 16–17 users** can make requests for the teen from Parent Settings, such as deletion, but they can’t download the teen’s data. The teen can make every request, including downloading their own data. [ATTORNEY: confirm that the in-app view answers a parent’s access request without a download.]

## 17. How to make a request, and how to appeal

- **In the app:** Settings › Privacy › Your privacy rights.
- **By email:** privacy@[domain] (you don’t need the app or a new account).

We’ll confirm it’s you, usually through your signed-in account or a code sent to your account email. If we can’t confirm it with reasonable effort, we may ask for more information. An authorized agent may opt out on your behalf if we can verify their authority.

We’ll respond within **45 days**. If we need more time, we may extend once by up to 45 more days and will tell you why within the first 45 days. Requests are free up to twice a year.

**Appeals:** if we turn down your request, you can appeal by tapping "Appeal this decision" in the app or emailing privacy@[domain] with "Appeal" in the subject. We’ll answer in writing within **45 days**, with our reasons (Texas law allows up to 60; we use 45 for everyone). If we deny your appeal, you can complain to your state attorney general:

- Texas: https://www.texasattorneygeneral.gov/consumer-protection/file-consumer-complaint
- Washington: https://www.atg.wa.gov/file-complaint

## 18. If there’s a data breach

If a breach affects your information, we’ll notify you as the law requires, including:

- **FTC Health Breach Notification Rule** (16 CFR part 318) for health info: notice to you without unreasonable delay and within 60 calendar days of discovery; notice to the FTC (at the same time if 500 or more people are affected); and notice to the media if 500 or more residents of a state are affected.
- **Texas law** (Tex. Bus. & Com. Code §521.053): notice to affected people within 60 days of determining a breach happened, and to the Texas Attorney General within 30 days if 250 or more Texans are affected.
- Other states’ breach laws where they apply.

Notices will say what happened, what information was involved, what you can do, and how to reach us.

## 19. Cookies, tracking, analytics and ads

- **No ads:** the app has no advertising SDKs, we don’t share data for advertising, and we don’t do targeted advertising.
- **No cross-app tracking:** we don’t track you across other companies’ apps or websites, so the app doesn’t show Apple’s tracking prompt.
- **Analytics and crash reports:** we use PostHog (US cloud) for basic product analytics and Sentry (US region) for crash reports, both as service providers working only for us. Events never include health info, weight, progress photos, wearable data or location. They carry no user ID, name or email, only at most a random install ID that resets when you sign out or delete your account; neither service stores your IP address with events; and we don’t try to link them back to you. Turn product analytics off in Settings › Privacy › Share usage analytics. 16–17: crash reports only.
- **Website:** uses only cookies needed to run it [Engineer: confirm when the site is built]. [OPEN: if website analytics are added, update this section and the health policy §9 first.] If your browser sends a Global Privacy Control signal, we treat it as an opt-out of sale and targeted ads (which we don’t do anyway).

## 20. Where we process data

[App] is offered only in the US, and we store data in the United States. Our database and encryption keys are in AWS us-west-1 (Northern California), and PostHog and Sentry store data in the US. Anthropic processes AI requests [OPEN: Kevin is checking whether US-only processing is on for our account; if not, say "Anthropic may process requests outside the US under its Data Processing Addendum"].

## 21. Changes to this policy

We’ll post updates here and change the version and date at the top. For material changes, we’ll tell you in the app or by email before they take effect. We won’t collect or use health info in new ways, or share it with new kinds of recipients, without asking you first.

## 22. Contact

[Company] · [mailing address] · privacy@[domain]
