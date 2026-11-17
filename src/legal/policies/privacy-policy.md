# [App] Privacy Policy

**Version:** [v0.3 DRAFT] · **Effective date:** [Effective date] · **Last updated:** Nov 16, 2026 (draft)

---

> ## Drafting notes for Engineer and attorney (delete this block before publishing)
>
> **Changelog**
> - **v0.3 (Nov 16, 2026, Counsel):** decisions from `phase4-review.md`, `phase4-build-answers.md` and `phase5-review.md` (all revs) folded in.
>   - **AI planning:** it now needs the health switch on (§2, §5.3, §7, §9).
>   - **Health screen:** a 12-month re-screen, also after an injury or condition edit, and AI planning pauses while it’s due. Separately, a 12-month Health data check-in that never expires consent (§5.3). The questions are our own wording and are never called PAR-Q+.
>   - **Anthropic:** now also receives "training schedule" (days and session length) (§2, §7, §8.1).
>   - **Consent records:** described as keyed hashes of IP and device ID, plus provider security logs [OPEN: Supabase log retention] (§4.2, §14, §15).
>   - **Progress photos:** wording filled in (§4.1 row, new §5.2, the §4.4 biometrics bullet, the §15 row). Coach photo sharing is a separate opt-in (§8.2), and there is no face or body measurement extraction (Texas CUBI). Photos are never sent to AI, analytics or crash reports.
>   - **Photo deletion:** off the phone right away, and off servers and backups within 30 days by destroying the photo key. Camera-roll copies are marked [PENDING KEVIN: camera-roll option]; the lock is marked [PENDING KEVIN: photo lock].
>   - **Teen body weight:** an optional current value only, deleted when either opt-in turns off [PENDING KEVIN: teen weight] (§9).
>   - **Coaches:** they can’t see health entries or their metadata, such as weigh-ins, without sharing (§8.2).
>   - **Download my data:** contents and exclusions added (§16).
>   - **Crash and analytics:** not tied to the account; at most a resettable install ID; Tex. Bus. & Com. Code §541.106(b) (§4.2, §19).
>   - **Parent export** of a teen’s data, with the teen notified [PENDING KEVIN: parent export] (§8.3, §9).
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
> - Vendors: [KMS provider]; [Email provider] (Kevin to choose; launch blocker for the parent-invite email); [Live video/voice provider]; [Push notification provider]; [Safety-moderation and image hash-matching vendor]; [Subscription-management vendor, if used]; [Analytics vendor] and [Crash-reporting vendor]; [Map provider].
>
> **Still open (each is marked `[OPEN]` or `[PENDING KEVIN]` in the text):**
> 1. **Pending Kevin:**
>    - the photo lock (always on, or a default-on setting);
>    - the camera-roll copy option (if it’s dropped, delete every "camera roll" sentence and bump the photo opt-in hash);
>    - teen weight (Profile-only current value, or none at all);
>    - parent export of a teen’s data;
>    - the coach-deletion clause in the Coach Terms (unlocks the §8.2 line);
>    - the app name, company and LLC details, address, domain and effective date;
>    - the email vendor;
>    - whether adults keep "Lose fat" in the AI quiz (no policy text depends on it).
> 2. **Engineer to supply:**
>    - wearable sources and data types (Apple 5.1.3(i) requires listing them);
>    - the approximate-location features;
>    - the Supabase log retention for our plan (§4.2, §15);
>    - the Supabase, KMS and Anthropic regions (§20);
>    - the analytics, crash and map vendors.
> 3. **Retention still to set:**
>    - approximate location and run routes (proposals are in §15);
>    - analytics and crash data;
>    - adult coach chat after coaching ends;
>    - payment and tax records (with the CPA);
>    - support emails.
> 4. **Wearable data to coaches (adults):** this draft says no. Adding it would need a per-item coach-sharing choice and updates to §5.1 and health policy §3.1 and §7.2. Never for 16–17.
> 5. **Form-check "AI cues":** a server LLM writing cues from form metrics would send data the AI consent doesn’t list. Keep the cues rule-based or on-device, or widen the AI consent and both policies first.
> 6. **Minors’ form numbers to coaches:** need both the teen’s and the parent’s opt-in. Confirm `formcheck-notes.md` is aligned.
> 7. **Version A AI wording** (no retention after the reply): only after Anthropic approves zero data retention in writing (§7 note).
> 8. **Basic workout logs** with the health switch off: treated as needed for logging (RCW 19.373.030(1)(a)(ii)). [ATTORNEY: confirm.]
> 9. **Launch blockers that the text relies on:**
>    - the email sender (the parent invite and the day 3 and day 7 reminders);
>    - Parent Settings (view and withdraw each scope, re-ask, re-screen, and export if approved);
>    - the full Settings › Privacy rights rows;
>    - the daily photo and health purge job, with alerts.
>
> **Risks to watch:**
> - **Google Play’s injury-risk clause:** Google bars using health data where its use "could reasonably be expected to lead to ... personal injury." Keep wearable data to display, trends and gentle suggestions. [ATTORNEY + Play review]
> - **Analytics opt-out vs. opt-in under MHMDA** for non-health events. [ATTORNEY]
> - **CUBI and transient on-device processing:** untested in court. Don’t build any face landmarks, face matching or body-measurement extraction from photos without coming back to Counsel.
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
>   - hash matching on shared copies;
>   - never in the Anthropic prompt builder, analytics, crash reports, session replays or crash screenshots;
>   - no face detection or landmarks, no face recognition, no body or face measurement extraction (the alignment check uses the overlay, whole-frame similarity, or on-device body-only pose points with face points discarded and nothing stored);
>   - the server rejects uploads from users under 18.
> - **Coach visibility:** row-level security on health rows (including weigh-ins) so a coach sees no rows, counts, timestamps, `updated_at`, sync events or derived "last active" signals unless sharing is on for that coach. Check the aggregate endpoints, realtime channels and push payloads.
> - **Download my data:** build it to the §16 contents and exclusions.
>   - One ZIP (JSON and CSV, plus photos).
>   - Generated on the server and delivered through a short-lived in-app link after a lock check.
>   - Never includes the pepper, keys, other people’s data, safety, moderation or NCMEC records, internal security logs, or AI prompts.
> - **Wearables:**
>   - a separate "Connect health apps and wearables" switch, off by default, then a per-source connect requesting only the types we use;
>   - read-only unless a write is needed; never write false data to HealthKit; no HealthKit data in iCloud;
>   - encrypted like other health data;
>   - every row tagged with its source; a per-source disconnect stops reads immediately and deletes that source’s data within 30 days;
>   - kept out of the Anthropic prompt builder, analytics and coach APIs;
>   - the Health Connect use-case declaration in Play Console;
>   - for 16–17, both teen and parent opt-in rows.
> - **Approximate location:**
>   - "while using" and approximate only, requested only when the user opens a feature that needs it; no background location;
>   - rounded on the device to about 1 mile (TDPSA "precise" = within 1,750 ft, §541.001(21)); don’t log coordinates;
>   - a manual-entry fallback for every feature (Apple 5.1.2(i));
>   - for 16–17, both teen and parent opt-in before the OS prompt.
> - **Precise run GPS (later):**
>   - a separate precise + background opt-in, collected only while a run is recording, with a visible recording indicator;
>   - the Play background-location declaration;
>   - privacy zones on by default (locked on for 16–17), with in-zone coordinates stripped from every export, share, coach view and map request;
>   - per-route and delete-all controls;
>   - for 16–17, no public route maps;
>   - kept out of the Anthropic prompt builder and analytics.
> - **Geofencing ban:** no geofences around health-care facilities, and no inference of health-facility visits (RCW 19.373.080).
> - **Analytics and crash [PROVISIONAL]:**
>   - processor contracts or first-party only;
>   - an event allowlist with no health, wearable, photo, route or sub-state location fields and no free text;
>   - no user ID, name or email on any event: at most a random install ID that resets on sign-out and account deletion, never joined to account data, and shared only with processors (needed for the §541.106(b) basis);
>   - no IDFA, cross-app identifiers or ATT prompt;
>   - a "Share usage analytics" switch, on by default for adults; for 16–17, crash reports only.

---

## 1. Who we are

[App] is a strength and fitness training app run by [Company] ("we," "us"). We’re based in Texas, USA. This policy explains what personal information we collect, why, who we share it with, how long we keep it, and the choices and rights you have.

Health information gets extra protection. Our **[Consumer Health Data Privacy Policy](/consumer-health-data-privacy-policy)** covers it in detail and is part of this policy.

Questions: privacy@[domain] · [mailing address].

## 2. The short version

- We **don’t sell** your personal information, we **don’t use it for targeted ads**, we **don’t share it for advertising**, and the app has **no advertising SDKs**.
- Health info (like body weight or injury notes) is collected only if you turn it on. It’s off by default, encrypted, and never used for ads.
- AI planning is a separate switch, also off by default, and it works only while health info is on. If you turn it on, our AI provider, Anthropic, gets only your goals, experience, equipment, training schedule (days and session length), age range and an injury category. It never gets your name, email, photos, location or notes.
- Progress photos (18+) are a separate opt-in, off by default. They’re encrypted, never used for ads, analytics or AI, and shared with a coach only if you pick them and turn on photo sharing.
- Wearable and health-app data (like Apple Health or Health Connect) is a separate switch, off by default, connected one source at a time. It’s never sold, never used for ads, and never sent to our AI provider.
- Location is off by default. We ask for approximate location only when you open a feature that needs it, and never in the background. Precise GPS for run tracking (when available) is a separate choice, used only while you record a run.
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
| Progress photos (**18+ only, optional**) | Front, side and back photos you take in the app | To show your progress privately, and to a 1:1 coach only for photos you pick. **Separate opt-in:** the first time you open Progress photos, you choose whether to turn on "Allow progress photos." It’s off by default and separate from Health data, AI planning and coach sharing. Sharing photos with your coach is another separate opt-in that you can turn off anytime. Location and device details are removed before upload. Photos are never used for ads, analytics or AI. Turning photos off deletes them (see §15). More in §5.2. |
| Form-check videos (**optional**) | Short videos of a lift | Analyzed on your phone. Adults’ saved videos stay on the phone unless shared with a 1:1 coach. 16–17: the video is deleted right after analysis and never uploaded. |
| Messages | Chat with your 1:1 coach (text only for 16–17) | To provide coaching. |
| Consent and safety choices | Your switch settings, your risk acknowledgement, parent attestation | To prove what you agreed to and when. |
| Support and rights requests | What you write to us | To help you and keep records the law requires. |

### 4.2 Information collected automatically

- **Device and app info:** device type, operating system, app version, language, crash and error logs, and IP address. We use this to run, secure and fix the app.
- **Security and consent records:** when you give or withdraw consent, accept our Terms, or make a privacy request, we record the time, the version of the text you saw, your app version, and a one-way coded (hashed) version of your IP address and device ID, not the addresses themselves. Our hosting and sign-in providers also see your IP address when you use [App] and keep it in security logs for a limited time [OPEN: the Supabase log retention for our plan].
- **A no-personal-data device flag:** if someone is turned away for age, we set a flag on that device so the form can’t be retried. It contains no personal information.

- **[PROVISIONAL] Crash reports and basic product analytics:** which screens and features are used, app performance and crashes. These are handled by us or by a service provider working only for us [OPEN: vendor names]. Analytics events never include health info, wearable data, precise location or routes, and we don’t track you across other companies’ apps or websites. You can turn product analytics off in Settings › Privacy › Share usage analytics. 16–17: product analytics stay off; only crash reports are collected. **Crash reports and analytics events aren’t tied to your account:** they carry no user ID, name or email, at most a random install ID that resets when you sign out or delete your account, and we don’t try to link them back to you. They never include progress photos.

The app has **no advertising SDKs**, and we **don’t share any data for advertising**.

### 4.3 Information from other sources

- **Apple or Google sign-in:** your name and email (or Apple’s private relay email) if you choose to sign in that way.
- **App store age signals:** Apple’s Declared Age Range or Google Play Age Signals tell us an age range, and for minors whether a parent approved. We use the **lower** of that age and the one from your date of birth. We delete the store’s raw response once the check is done, as Texas law requires (Tex. Bus. & Com. Code §121.055(b)), and keep only the age band, its source and a timestamp.
- **Apple and Google purchases:** whether you have an active Pro subscription and its status. We don’t get your card details.
- **Stripe:** payment status for 1:1 coaching, and verification results for parents and coaches (a result ID, not card numbers or ID images).
- **Health apps and wearables (only if you connect them):** Apple Health (HealthKit), Google Health Connect, and connected wearables [OPEN: Engineer to list the exact sources]. See §5.1.
- **Your parent (16–17):** consent choices and settings changes your parent makes.
- **Your coach:** plans, notes and messages your coach creates for you.

### 4.4 What we don’t collect

- Your raw date of birth (after the age check).
- Location in the background, except during a run you’re recording with run tracking (when available). See §4.5.
- Health-app or wearable data you haven’t connected.
- Biometric identifiers. Face ID or fingerprint unlock happens on your phone; we never receive it. Pose tracking for form checks runs on your phone, face points are discarded, and we don’t use face recognition. We don’t extract face or body measurements from progress photos.
- Your contacts or photo library (we use only photos you take in [App]).

### 4.5 Location

**Approximate location (off by default).** Some features [OPEN: Engineer to list, e.g. finding gyms near you or Travel mode] can use your approximate location. We ask only when you open one of those features, and you can always type a place instead. We use only approximate location (about a mile, never pinpoint), only while you’re using the feature, and **never in the background**. [OPEN: retention, proposed: not stored on our servers beyond the request; cached on your phone for at most 24 hours.]

**Precise GPS for run tracking (when available).** A later feature will let you record runs with a route map. It will be a **separate opt-in** for precise and background location, used **only while a run is being recorded**, and it stops when the run ends. Your phone shows when a run is recording.
- **Privacy zones** are on by default and hide the start and end of every route.
- **Routes are private by default.** Sharing a route with a coach or anyone else is a separate choice.
- Turning the opt-in off stops collection. You can delete one route or all routes any time.
- [OPEN: retention, proposed: kept while your account is active; deleted within 30 days after you delete the route or your account.]

**Rules for all location data:**
- Precise location is "sensitive data" under Texas law (Tex. Bus. & Com. Code §541.001(29)), so we use it only with your consent.
- We **never** use location or routes to work out whether you visited a health-care facility, and we never set up geofences around health-care facilities (RCW 19.373.080).
- Location and routes are **never sent to Anthropic**, never used for ads, and never included in analytics.
- 16–17: see §9.

## 5. Health information

Health info is collected **only if you turn on the "Save my health info" switch**. It is:

- encrypted with keys held in a separate key-management service ([KMS provider]), not in our database;
- never sold and never used for ads;
- shared only with service providers who process it for us under contract, and with your coach only if you separately turn on coach sharing.

You can turn it off any time in Settings › Privacy. When you do, we stop collecting it and delete it within 30 days. Full details are in the **[Consumer Health Data Privacy Policy](/consumer-health-data-privacy-policy)**.

### 5.1 Health apps and wearables

You can choose to connect Apple Health (HealthKit), Google Health Connect, or a connected wearable [OPEN: Engineer to list the exact sources and the data types we read, such as workouts, heart rate, steps or sleep].

- It’s a **separate switch, off by default**, and you connect **one source at a time**. Your phone’s permission screen lets you pick which data types to share.
- We use this data only to show your activity and trends in [App] and to help fit your training to you. It’s treated like other health info: encrypted, **never sold, never used for ads or marketing, never used for data mining**, and never stored in iCloud.
- It’s **not sent to Anthropic** or any other AI provider, and it’s not shared with coaches. [OPEN: coach sharing of wearable data for adults; see drafting note 1b.]
- Disconnect a source any time in Settings › Privacy (or in Apple Health / Health Connect). Reading stops right away, and we delete data from that source within 30 days.
- 16–17: the teen and the parent must both opt in, and coaches never see it.

### 5.2 Progress photos (18+ only)

- **Separate opt-in, off by default.** The first time you open Progress photos, you choose whether to turn on "Allow progress photos." It’s separate from Health data, AI planning and coach sharing. 16–17 users can’t take or upload progress photos; the feature opens at 18.
- **What we keep:** the photos you take in [App] and the date you took them. We remove location and device details before upload.
- **Protection:** photos are encrypted on your phone before upload and served only through short-lived links. In the app, they’re locked behind Face ID, your fingerprint or your phone’s passcode [PENDING KEVIN: photo lock, always on or on by default].
- **Never:** used for ads, analytics, crash reports or AI, or sent to Anthropic. We don’t extract face or body measurements from photos, and we don’t use face detection or face recognition on them.
- **Sharing with a coach** is another separate opt-in, offered only when you have an active 1:1 coach. The coach sees only photos you pick, in the app, with no downloads, and each one is watermarked with your initials. We can’t block screenshots. Shared photos go through an automated safety check. Turn sharing off anytime; the coach loses access right away.
- **Turning photos off or deleting them:** turning progress photos off stops new photos and deletes the ones you’ve taken, and we offer you a copy first. Deleted photos are removed from your phone right away and from our servers and backups within 30 days; we destroy their encryption keys so backup copies can’t be read. You can download your photos anytime (Settings › Privacy › Download my data, or Photo privacy › Download my photos). A downloaded copy isn’t locked or encrypted, and we can’t delete it.
- **Camera roll** [PENDING KEVIN: camera-roll option]: saving copies to your camera roll is off by default. Copies there aren’t locked or encrypted, and we can’t delete them.

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
- We **never** send your name, email, user ID, progress photos, location, run routes, wearable or health-app data, health-screen answers, measurements, weight, or free-text notes.
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
| Supabase | Hosting, database, sign-in | All account and app data (health info is stored encrypted) |
| [KMS provider] | Key management | Encryption keys only, not your data |
| Anthropic | AI planning (only if you turn it on) | Goals, experience, equipment, training schedule (days and session length), age range, injury category, random request ID |
| Apple and Google | Sign-in (if chosen), in-app purchases, age signals, app distribution | Sign-in identity, purchase status, age range |
| Stripe | Payments for 1:1 coaching, parent card verification, identity checks for coaches and for parents of minors in 1:1 | Payment and verification details (Stripe also acts under its own privacy policy for payments) |
| [Email provider] | Sending account, parent-invite and service emails | Email address, message content |
| [Live video/voice provider] [OPEN] | Live coaching check-ins (never recorded for 16–17) | Audio/video stream, session times |
| [Push notification provider] [OPEN] | Push notifications | Device token, notification text |
| [Safety-moderation and image hash-matching vendor] [OPEN] | Safety filters on minors’ coach chats; hash matching on coach-shared images | Message text, shared images |
| [Subscription-management vendor] [OPEN, only if used] | Receipt checking for Pro | Purchase records, an app user ID |
| [Analytics vendor] [OPEN] [PROVISIONAL] | Basic product analytics (you can turn it off) | Feature and screen usage, app version, device type, a random install ID; no user ID, name or email, and no health info, photos, wearable data, precise location or routes |
| [Crash-reporting vendor] [OPEN] [PROVISIONAL] | Crash and error reports | Crash logs, device and app version, a random install ID; no user ID, name or email, and no photos |
| [Map provider] [OPEN] (when run tracking is available) | Showing route maps | Map area being viewed; route points inside privacy zones are never sent |

Apple Health, Health Connect and wearables are **sources** you connect, not companies we send your data to.

**No advertising partners.** The app has no advertising SDKs, and we share no data with advertisers or ad networks.

### 8.2 Your coach (only if you turn on coach sharing)

Coaches are **independent** businesses, not our employees. A coach sees your data only if you turn on coach sharing for that coach, which is a separate switch from the health switch.

- **Adults:** your coach can see your workouts, history, PRs, charts, the health items you choose, and any form-check videos you share. Progress photos need a separate photo-sharing opt-in for that coach, and then the coach sees only the photos you pick, watermarked with your initials. No downloads. Run routes (when available) are shared only if you choose to share them, with privacy zones applied. Wearable data isn’t shared with coaches.
- **16–17:** your coach can see workouts, history, PRs, charts, and form checks as skeleton and numbers only. Run routes (when available) only if the teen and the parent both opt in, and then only distance, pace and a map with privacy zones applied, never the start or end point. Coaches **never** see a minor’s health info or wearable data (weight, measurements, injury or pain notes, health-screen answers), never get videos, and get no photos. The teen and the parent must both agree.
- **Without sharing, coaches see nothing of your health info**, not even whether, when or how often you added something (for example, weigh-ins).
- Turn it off any time in Settings › Coaching (photo sharing in Photo privacy or on any shared photo); access stops immediately.
- [OPEN: coach deletion on request. Only if the coach terms require it, add: "Coaches must delete your data when asked, under our coach terms." Until then, don’t promise it.]

### 8.3 Your parent (16–17)

A linked parent can see your data and consent history, and everything your coach sees. Your parent can read your coach chat. You’ll be told whenever your parent changes a setting or consent. [PENDING KEVIN: parent export] Your parent can also download a copy of your data from Parent Settings, and you’ll be told when they do ("Your parent downloaded a copy of your data."). The copy contains your data only, not your parent’s.

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
- **Parent can view** the teen’s data and consent history, and the teen is notified when the parent changes anything. [PENDING KEVIN: parent export] The parent can download a copy of the teen’s data, and the teen is told.
- **Extra protections for 16–17:**
  - no progress photos;
  - form checks shared only as skeleton and numbers, never video (the video is deleted on the phone right after analysis);
  - coach chat is text only, and the parent can read it;
  - no weight-loss or calorie goals;
  - **body weight** [PENDING KEVIN: teen weight]: no weight card, trend or chart anywhere in the app. Only an optional current value in Profile, with no goal or chart, and only while both the teen and the parent have health info on. If either turns health info off, or the teen clears it, the weight is deleted: from the app right away, and from our servers and backups within 30 days. The teen is told when a parent’s change deleted it, and if it’s turned back on, it starts empty;
  - live sessions only with a parent invite, and never recorded;
  - coaches never see the teen’s health info;
  - **wearables and health apps:** connecting requires both the teen and the parent to opt in; never shared with coaches;
  - **approximate location:** only with both the teen’s and the parent’s opt-in, and never in the background;
  - **precise run GPS (when available):** only with both the teen’s and the parent’s opt-in; used only during an active run, with no background location at any other time; privacy zones are always on and can’t be turned off; no public or social route sharing and no route maps on profiles; a coach sees routes only if both opt in to coach sharing, and then only distance, pace and a zoned map, never the start or end point; the parent can view routes, and the teen is told this;
  - **analytics:** product analytics are off; only crash reports are collected.
- **At 18:** the account becomes an adult account on the stored date. Progress photos become available; nothing is collected for them before then.

## 10. Children under 16

[App] isn’t for anyone under 16. If someone under 16 tries to sign up, we show a generic message and save nothing they entered (we keep only a total count of turned-away sign-ups). We don’t knowingly collect personal information from children under 13. If we learn we have, we delete it. Contact privacy@[domain] if you think we have.

## 11. Payments

- **Pro** is bought through Apple or Google in-app purchase. Apple or Google handle the payment; we receive only subscription status.
- **1:1 coaching** is sold by the coach, who is the seller of record. Payments go through Stripe as direct charges to the coach’s Stripe account. For 16–17, the parent is the customer.
- We don’t store full card numbers. For parent verification we keep only the method and Stripe’s result ID.

## 12. If you’re a coach

If you apply to coach on [App], we also collect: your name, contact details, certifications and their verification results, your Stripe connected-account status and identity-check result, your 18+ attestation, your profile and content, and, if you’ll coach minors, a National Sex Offender Public Website (NSOPW) search result and your Texas abuse-reporting training record. We use these to approve and run your coach account and keep clients safe. We keep a 2-year log of your access to client data.

## 13. Safety monitoring and reporting

- Coach chats with 16–17 users are text only, filtered for self-harm, eating disorders, substances, harassment and grooming, and reviewed by people when flagged. They’re never disappearing.
- Images shared with coaches are checked against known child-abuse image hashes.
- We report child sexual abuse material to NCMEC as federal law requires, and suspected child abuse to Texas authorities as state law requires.
- Safety records are kept as shown in §15.

## 14. Security

- Data is encrypted in transit (TLS) and at rest.
- Health info uses per-user encryption keys, wrapped by [KMS provider] and used only by our server. The database holds only encrypted data and wrapped keys.
- Progress photos are encrypted on your phone before upload and served only through short-lived links. In the app they’re locked behind Face ID, your fingerprint or your passcode [PENDING KEVIN: photo lock]. When photos are deleted, we destroy their encryption keys.
- IP addresses and device IDs in consent records are stored only as keyed one-way hashes; the key is kept outside our database.
- Access by our staff and processors is limited to what’s needed, and logged.

No system is perfectly secure. See §18 for what we do if something goes wrong.

## 15. How long we keep information

| Information | How long |
|---|---|
| Account data, workout logs, settings | While your account is open. After you delete your account, we delete it within 45 days; backups expire within 6 months. |
| Health info | Until you turn the health switch off or delete it (then deleted within 30 days), or you delete your account. 16–17 body weight: deleted the same way when either the teen or the parent turns health info off, or the teen clears it [PENDING KEVIN: teen weight]. |
| Progress photos (18+) | Until you delete them or turn photos off; then removed from your phone right away and from our servers and backups within 30 days. Copies you saved to your camera roll aren’t affected. [PENDING KEVIN: camera-roll option] |
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
| Minor safety records (flags, reports, chat kept for safety review) | Until the minor’s 22nd birthday or 4 years, whichever is later. Legal holds override. |
| NCMEC report materials | 1 year after the report, secured and access-limited. |
| Wearable and health-app data | Until you disconnect the source, turn the switch off, or delete your account; then deleted within 30 days. |
| Approximate location | [OPEN: proposed: not stored on our servers beyond the request; cached on your phone at most 24 hours.] |
| Run routes (when available) | [OPEN: proposed: kept while your account is active; deleted within 30 days after you delete the route or your account.] |
| Analytics and crash data [PROVISIONAL] | Not linked to your account. [OPEN: proposed: 13 months for analytics events, 90 days for crash reports.] |
| IP addresses in our hosting and sign-in providers’ security logs | [OPEN: the Supabase log retention for our plan] |
| Adult coach chat after coaching ends | [OPEN] |
| Payment and tax records | [OPEN: set with CPA] |

## 16. Your choices and rights

**Everyone, wherever you live in the US, can:**

- see and download your data (Settings › Privacy › Download my data; see below);
- correct it (in the app, or ask us);
- delete it, or your whole account (Settings › Account › Delete account);
- turn the health, wearable, location, AI, coach-sharing, progress-photo and photo-sharing switches off any time, and turn off product analytics [PROVISIONAL];
- delete any run route, or all of them (when available);
- get a list of the companies we’ve shared your data with.

We won’t treat you differently, charge you more or give you a worse service for using these rights. (If you turn off health info or AI, features that need them, like an adaptive AI plan, stop working; the free logging tier always stays.)

**What "Download my data" includes:** one ZIP file, with data in common formats (JSON and CSV):
- your account and settings (email, name, age range and the date you turn 18; we don’t keep your date of birth);
- your training setup;
- workouts, sets and PRs;
- your AI quiz answers and AI plans;
- health info you’ve saved, including the injury category and plan changes we made from it;
- data from connected health apps and wearables;
- run routes (when available);
- progress photos (18+), with location and device details removed;
- messages with your coach;
- your privacy choices (every consent and switch change, with the date and the exact text you saw);
- who received your data;
- purchases recorded with us;
- requests you’ve sent us.

Some records aren’t in the file: security logs, other people’s information (including another client’s data or a coach’s or parent’s own account data), and safety and child-protection records we must keep confidential. The hashed IP and device codes in your consent records aren’t in the file, but you can ask for them. Crash reports and analytics events aren’t linked to your account, so we can’t find them for a request; Texas law doesn’t require us to re-link them (Tex. Bus. & Com. Code §541.106(b)). Ask us through Your privacy rights about anything else.

**Texas residents** (Texas Data Privacy and Security Act, Tex. Bus. & Com. Code ch. 541): you can confirm and access your data, correct it, delete it, get a portable copy, and opt out of sale, targeted ads and profiling (§541.051). We don’t sell personal information, do targeted ads or do that kind of profiling, so there’s nothing to opt out of, but you can still ask. We process sensitive data, like health info, precise location or data of a known child, only with consent.

**Washington and Nevada residents:** you have health-data rights under Washington’s My Health My Data Act and Nevada’s consumer health data law. See the [Consumer Health Data Privacy Policy](/consumer-health-data-privacy-policy).

**Other states:** if your state gives you more privacy rights, we’ll honor them. Contact us.

**Parents of 16–17 users** can make requests for the teen from Parent Settings. The teen can also make requests.

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
- **[PROVISIONAL] Analytics:** we collect crash reports and basic product analytics, either ourselves or through a service provider working only for us [OPEN: vendor names]. Events never include health info, wearable data, precise location or routes. Crash reports and analytics events carry no user ID, name or email, only at most a random install ID that resets when you sign out or delete your account, and we don’t try to link them back to you. Turn product analytics off in Settings › Privacy › Share usage analytics. 16–17: crash reports only.
- **Website:** uses only cookies needed to run it [Engineer: confirm when the site is built]. [OPEN: if website analytics are added, update this section and the health policy §9 first.] If your browser sends a Global Privacy Control signal, we treat it as an opt-out of sale and targeted ads (which we don’t do anyway).

## 20. Where we process data

[App] is offered only in the US, and we store data in the United States. [Engineer: confirm Supabase region and KMS region are US. Anthropic may process in other regions under its DPA; confirm.]

## 21. Changes to this policy

We’ll post updates here and change the version and date at the top. For material changes, we’ll tell you in the app or by email before they take effect. We won’t collect or use health info in new ways, or share it with new kinds of recipients, without asking you first.

## 22. Contact

[Company] · [mailing address] · privacy@[domain]
