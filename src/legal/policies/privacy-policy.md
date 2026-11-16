# [App] Privacy Policy

**Version:** [v0.2 DRAFT] · **Effective date:** [Effective date] · **Last updated:** [Date]

---

> ## Drafting notes for Engineer and attorney (delete this block before publishing)
>
> **Changelog**
> - **v0.2 (Nov 15, 2026, Counsel):** Kevin's answers folded in. (1) Ad SDKs: none, no ad sharing, no targeted ads (stated plainly; ad-SDK [OPEN] notes removed). (2) Wearables: yes; added Apple Health/HealthKit, Google Health Connect and connected wearables as a separate per-source opt-in, off by default (§4.3, §5.1, §8.1, §15); never sent to Anthropic; limits from Apple Guidelines 5.1.2(vi) and 5.1.3 and Google Play's Android health permissions policy. (3) Location split: approximate location for features that need it, off by default, foreground only (§4.5); precise GPS run tracking with route maps as a **later, "when available"** feature with its own precise + background opt-in, privacy zones, private routes (§4.5, §9, §15). (4) Analytics drafted as [PROVISIONAL]: crash reports plus basic product analytics, first-party or processor-only, opt-out in Settings (§4.2, §19). (5) Contact email set to a provisional Gmail address. Teen rules added for wearables, location, routes and analytics (§9).
> - **v0.1 (Nov 15, 2026, Counsel):** first draft.
>
> Drafted by Counsel on Nov 15, 2026. This is general legal information, not formal legal representation. Sources: `legal/phase2-legal-answers.md`, `legal/phase3-review.md`, `onboarding-notes.md` (Phase 3 and the date-of-birth flow), `monetization-notes.md`, `photos-notes.md`, `formcheck-notes.md`, `messaging-notes.md`. Law checked on Nov 15, 2026 (v0.2 additions: Apple App Review Guidelines 5.1.2, 5.1.3, 5.1.5, last updated Oct 16, 2026; Google Play Console Help "Android Health Permissions: Guidance and FAQs"; RCW 19.373.080; Tex. Bus. & Com. Code §541.001(21), (29)): RCW 19.373.020–.050 (leg.wa.gov), Tex. Bus. & Com. Code §§541.051, .052, .053, .055, .102, .107 and §521.053, 16 CFR 318.4–318.6 (eCFR), NRS 603A.495, Anthropic Commercial Terms (effective Jun 17, 2025) and Anthropic's API retention article (dated Jul 1, 2026).
>
> **Placeholders to fill:** [App]; [Company] = [Kevin's legal name] now, [LLC name] once formed; contact email = **krodriguez0720@gmail.com [PROVISIONAL: replace with a domain alias such as privacy@[domain] before launch]**; [mailing address]; [website URL]; [Effective date]; [Version]; [KMS provider]; [Email provider]; [Live video/voice provider]; [Push notification provider]; [Safety-moderation and image hash-matching vendor]; [Subscription-management vendor, e.g. RevenueCat, if used]; [Analytics vendor] and [Crash-reporting vendor] [OPEN]; [Map provider] [OPEN]; wearable sources [OPEN: Engineer to list]; approximate-location features [OPEN: Engineer to list].
>
> **Open items (each is marked `[OPEN]` in the text):**
> 1. **Analytics [PROVISIONAL]:** drafted as crash reports plus basic product analytics, first-party or processor-only, no health data or precise location in events, no cross-app tracking (so no App Tracking Transparency prompt), opt-out in Settings. Vendors [OPEN]. If Kevin drops analytics, delete §4.2's analytics bullets, the §8.1 rows and §19's analytics paragraph. **Ad SDKs: none (decided).**
> 1a. **Wearable sources** [OPEN: Engineer to list the exact sources, e.g. Apple Health/HealthKit types, Health Connect record types, any direct wearable APIs] and **wearable data types**. Policy text must list the specific types read (Apple 5.1.3(i): "disclose the specific health data that you are collecting from the device").
> 1b. **Wearable data to coaches:** this draft says **no** at launch. If adults should be able to share wearable items with a coach, add it as an explicit per-item choice in coach sharing and update §5.1 and the health policy §3.1/§7.2. Never for 16–17.
> 1c. **Wearable data to Anthropic: NO (decided default).** Not sent unless the AI consent is widened **and** Apple/Google rules allow it. Apple 5.1.2(i) requires clear disclosure and explicit permission before sharing with "third-party AI"; Google requires explicit, informed consent for third-party sharing. Re-review before any change.
> 1d. **Location:** approximate-location features [OPEN: Engineer to list]; approximate retention [OPEN: proposed: not stored on our servers beyond the request, device cache at most 24 hours]. Precise run GPS is a **later** feature ("when available"); its retention is [OPEN: proposed: keep while the account is active, delete within 30 days after the user deletes the route or the account]. If precise location is ever used outside run tracking, or background location outside an active run, update §4.5, §9 and §15 here and §3.2 and §14 of the health policy, and add a new opt-in.
> 1e. **Map provider** for route maps [OPEN]: rendering a route map may send coordinates to a map tile/SDK provider. Prefer on-device rendering or a provider under a processor contract that doesn't retain coordinates; list it in §8.1.
> 2. **Coach deletion clause:** coach terms don't yet require coaches to delete a client's data on request. Until they do, this policy must not promise it (§8.2). Counsel recommends adding the clause.
> 3. **Form-check "AI cues"** (`formcheck-notes.md`): the plan has an optional server LLM writing cues from form metrics. That sends data (form metrics) the AI consent doesn't list. Either keep the cues rule-based or on-device, or widen the AI consent, this policy (§7) and the health policy first. Flagged to Counsel.
> 4. **Weight goal before consent (adults):** Setup step 5 (weight goal) comes before the Privacy & safety screen. A weight goal is body-weight data. Keep step 5 answers **on the device** until the health switch is on, or don't upload them. Same for the Free Home "weight" card.
> 5. **Progress photos (18+)** aren't in the health-switch wording. Decide whether photos get their own just-in-time opt-in at first use (Counsel's recommendation) or are added to the health switch text.
> 6. **"Training data" in the health switch** vs. the Free logging tier that works with the switch off. This draft treats basic workout logs as data needed for the logging service the user asked for (RCW 19.373.030(1)(a)(ii)), and treats using them together with health info to build or adjust plans as covered by the switch. [ATTORNEY: confirm.]
> 7. **Minors' form numbers:** `formcheck-notes.md` has the teen turn on coach form-number sharing with the parent only *notified*. Under the Phase 2 rule, coach sharing needs **both** the teen and the parent to opt in. Align the build with the both-opt-in rule.
> 8. Retention still open: adult coach-chat messages after coaching ends; payment and tax records (ask the CPA); support emails.
> 9. Minor-safe goal list (no weight-loss or calorie goals) isn't designed yet.
> 10. Version A AI wording (no retention after reply) is only for after Anthropic approves zero data retention in writing (§7).
>
> **New conflicts and risks (v0.2):**
> - **Google Play limit on injury-risk uses:** Google's Android health permissions policy forbids using health and fitness data "in developing, or for incorporation into, applications ... where the use or failure of health data could reasonably be expected to lead to ... personal injury." Using Health Connect data to set training loads could be read that way. Keep wearable data to display, trends and gentle suggestions, with the not-medical-advice notice. [ATTORNEY + Play policy review.]
> - **Approximate vs. precise:** TDPSA "precise geolocation" means accuracy within a 1,750-foot radius (§541.001(21)). Android's coarse permission and iOS approximate location are generally coarser, but round on the device so nothing we store or send is finer than about 1 mile.
> - **Apple 5.1.2(i):** an app may not require users to turn on location services to use a feature. Every location feature needs a manual fallback (e.g. type a city or gym).
> - **Analytics in a fitness app:** app-usage events can themselves reveal health-related activity. Keep events free of health content, and treat the analytics vendor as a processor under contract. [ATTORNEY: confirm opt-out (not opt-in) is acceptable under MHMDA for non-health events.]
>
> **Attorney must review before launch:** the whole policy and the health policy; whether TDPSA applies (Kevin is likely an SBA small business, §541.002, so most of ch. 541 may not apply, and we honor the rights anyway); MHMDA processor adequacy of Anthropic's DPA (it doesn't name MHMDA); parent-verification adequacy; the retention table; consent wording; the KMS design (with security sign-off); FTC HBNR applicability; the minors' sections against COPPA, SB 2420 and SCOPE; the definition of the "health info" coaches of minors never see vs. form-check numbers they may see; wearable and location sections; the provisional analytics opt-out.
>
> **Corrections against older notes:** (a) Texas AG breach notice is due within **30 days** if 250+ Texans are affected (§521.053(i)), not 60. Individual notice stays at 60. (b) TDPSA allows **60 days** to answer an appeal (§541.053(c)). This policy commits to 45 days for every appeal, so one rule meets both MHMDA and TDPSA.
>
> **Build hooks for Engineer:**
> - **Links:** website homepage footer links to both policies, with "Consumer Health Data Privacy Policy" as its own link (RCW 19.373.020(1)(b); NRS 603A.495(2)). Store listings link this policy. In-app: Settings › Privacy shows both policies, the Privacy & safety screen links the health policy, the paywall links Terms and Privacy, and Parent Settings links both.
> - **Rights-request flow:** Settings › Privacy › "Your privacy rights" (access/export, correct, delete, withdraw consent, list of recipients, appeal), plus email to krodriguez0720@gmail.com for people without the app (two methods, §541.055(a); no new account required). Authenticate through the signed-in session; for email, use a one-time code to the account email. Parent requests run from Parent Settings.
> - **Request log:** ticket ID, type, date received, authentication result, 45-day due date, extension notice (sent inside the first 45 days, with reason), outcome, recipients notified. Keep it at least 24 months (4 years recommended).
> - **Appeal path:** "Appeal this decision" button on every denial and an appeal email address. Answer within 45 days in writing with reasons. On denial, include the Washington AG link (https://www.atg.wa.gov/file-complaint) and the Texas AG link (https://www.texasattorneygeneral.gov/consumer-protection/file-consumer-complaint).
> - **Deletion fan-out:** a deletion job that crypto-shreds the user's data key, deletes rows, queues backup expiry (max 6 months), and sends deletion notices to every processor and to any coach who received data (RCW 19.373.040(1)(c)). Log each notice.
> - **Consent logs:** one row per item (terms, privacy, health, AI, coach sharing, risk acknowledgement, parent attestation, each parent scope): user ID, actor (teen, parent, adult), state, text version and SHA-256 hash of the exact text shown, timestamp, IP, device, app version. Never overwrite; append.
> - **Policy versioning:** store each published version with its hash; record which version each user accepted; show an in-app notice and get new consent before any material change that adds a health category, purpose or recipient.
> - **Teen notifications:** notify the teen whenever the parent changes a setting or consent.
> - **Day-14 purge** of unlinked 16–17 accounts and the parent email; device-side purge of Setup 6–8 answers.
> - **Store age data:** delete the raw Apple/Google age response after verification; keep only the age band, its source and a timestamp.
> - **Wearables (v0.2):** a separate "Connect health apps and wearables" switch, off by default, then a per-source connect (HealthKit, Health Connect, each wearable) with the OS permission sheet requesting only the types we use. Read-only unless a write is needed; never write false data to HealthKit (5.1.3(ii)). Don't store HealthKit data in iCloud. Encrypt like other health data (KMS-wrapped per-user keys). Tag every wearable-sourced row with its source so a per-source disconnect can delete it. Disconnecting a source stops reads immediately and deletes that source's data within 30 days. Exclude wearable data from the Anthropic prompt builder (server-side allowlist), analytics events and coach APIs. Health Connect: declare the fitness/wellness/coaching use case in Play Console; request background or history read permissions only if a feature needs them and justify them. Use Health Connect's availability check before prompting. 16–17: the switch needs both teen and parent opt-in rows.
> - **Approximate location (v0.2):** request "while using" / approximate only (iOS reduced accuracy; Android ACCESS_COARSE_LOCATION), and only when the user opens a feature that needs it. No background location. Round on device to about 1 mile before sending. Don't log coordinates. Manual-entry fallback for every feature. Keep an in-app location switch in Settings › Privacy that mirrors the OS permission. 16–17: both teen and parent opt-in before the OS prompt appears.
> - **Precise run GPS (later, v0.2):** a separate "Precise location for run tracking" opt-in recorded in the consent log. iOS "Always" (or "While Using" + background location updates) and Android ACCESS_FINE_LOCATION + ACCESS_BACKGROUND_LOCATION with the Play background-location declaration. Collect only while a run is recording, stop at run end, and show a visible indicator (iOS blue status bar / Live Activity; Android foreground-service notification). Privacy zones on by default (always on and locked for 16–17) hide each route's start and end, plus any user-set zones. Strip coordinates inside zones from every export, share, coach view and map tile request. Per-route and delete-all controls. No route maps on profiles or public sharing for 16–17. Exclude routes from the Anthropic prompt builder and analytics.
> - **Geofencing ban:** no geofences around health-care facilities, and no code that infers visits to health-care facilities from location or routes (RCW 19.373.080).
> - **Analytics [PROVISIONAL]:** crash reports + basic product analytics via [Analytics vendor]/[Crash-reporting vendor] under processor contracts, or first-party. Event schema allowlist: no health fields, no wearable data, no location finer than country/state, no free text. No IDFA, no cross-app identifiers, no ATT prompt. Settings › Privacy › "Share usage analytics" switch (on by default for adults; analytics off for 16–17, crash reports only).

---

## 1. Who we are

[App] is a strength and fitness training app run by [Company] ("we," "us"). We're based in Texas, USA. This policy explains what personal information we collect, why, who we share it with, how long we keep it, and the choices and rights you have.

Health information gets extra protection. Our **[Consumer Health Data Privacy Policy](/consumer-health-data-privacy-policy)** covers it in detail and is part of this policy.

Questions: krodriguez0720@gmail.com · [mailing address].

## 2. The short version

- We **don't sell** your personal information, we **don't use it for targeted ads**, we **don't share it for advertising**, and the app has **no advertising SDKs**.
- Health info (like body weight or injury notes) is collected only if you turn it on. It's off by default, encrypted, and never used for ads.
- AI planning is a separate switch, also off by default. If you turn it on, our AI provider, Anthropic, gets only your goals, experience, equipment, age range and an injury category. It never gets your name, email, photos, location or notes.
- Wearable and health-app data (like Apple Health or Health Connect) is a separate switch, off by default, connected one source at a time. It's never sold, never used for ads, and never sent to our AI provider.
- Location is off by default. We ask for approximate location only when you open a feature that needs it, and never in the background. Precise GPS for run tracking (when available) is a separate choice, used only while you record a run.
- A coach sees your data only if you turn on coach sharing.
- You must be at least 16. If you're 16 or 17, a parent or guardian has to link to your account and agree first.
- [App] is offered only in the United States.

## 3. Who can use [App]

- You must be **16 or older**. We don't let anyone under 16 create an account.
- If you're **16 or 17**, a parent or legal guardian must link to your account and agree to our Terms as the contracting party before your account is fully active. See §9.
- [App] is for people in the **United States** only.

## 4. What we collect

### 4.1 Information you give us

| What | Examples | Why |
|---|---|---|
| Date of birth (used once, then discarded) | The date you enter on the first screen | To check you're old enough. We **don't save** your date of birth. We keep only a general age range (an "age band") and, for 16–17, the date you turn 18. |
| Account details | Email address, password (stored hashed by our auth provider), name if you add one | To create and secure your account and contact you about it. |
| Parent invite (16–17 only) | Your parent's email address | Only to send the invite. Deleted if the parent doesn't link within 14 days. |
| Training setup | Training style, days per week, gyms and equipment, units, app color, optional lift maxes, Hyrox race date | To build your plan and show the app the way you like. |
| Workout logs | Exercises, sets, reps, loads, cardio, personal records, swaps and their reasons | To give you the logging, history and charts you asked for. |
| Health info (**only if you turn it on**) | Body weight, measurements, injury and pain notes, health-screen answers, form-check numbers, training data used for your health profile | To build and adjust your workouts, show progress, and keep plans safe. See the [Consumer Health Data Privacy Policy](/consumer-health-data-privacy-policy). |
| Progress photos (**18+ only, optional**) | Front, side and back photos you take in the app | To show your progress privately. Location data is stripped. [OPEN: consent mechanism, see drafting note 5.] |
| Form-check videos (**optional**) | Short videos of a lift | Analyzed on your phone. Adults' saved videos stay on the phone unless shared with a 1:1 coach. 16–17: the video is deleted right after analysis and never uploaded. |
| Messages | Chat with your 1:1 coach (text only for 16–17) | To provide coaching. |
| Consent and safety choices | Your switch settings, your risk acknowledgement, parent attestation | To prove what you agreed to and when. |
| Support and rights requests | What you write to us | To help you and keep records the law requires. |

### 4.2 Information collected automatically

- **Device and app info:** device type, operating system, app version, language, crash and error logs, and IP address. We use this to run, secure and fix the app.
- **Security and consent records:** IP address, device and timestamp when you sign in, give or withdraw consent, or make a privacy request.
- **A no-personal-data device flag:** if someone is turned away for age, we set a flag on that device so the form can't be retried. It contains no personal information.

- **[PROVISIONAL] Crash reports and basic product analytics:** which screens and features are used, app performance and crashes. These are handled by us or by a service provider working only for us [OPEN: vendor names]. Analytics events never include health info, wearable data, precise location or routes, and we don't track you across other companies' apps or websites. You can turn product analytics off in Settings › Privacy › Share usage analytics. 16–17: product analytics stay off; only crash reports are collected.

The app has **no advertising SDKs**, and we **don't share any data for advertising**.

### 4.3 Information from other sources

- **Apple or Google sign-in:** your name and email (or Apple's private relay email) if you choose to sign in that way.
- **App store age signals:** Apple's Declared Age Range or Google Play Age Signals tell us an age range, and for minors whether a parent approved. We use the **lower** of that age and the one from your date of birth. We delete the store's raw response once the check is done, as Texas law requires (Tex. Bus. & Com. Code §121.055(b)), and keep only the age band, its source and a timestamp.
- **Apple and Google purchases:** whether you have an active Pro subscription and its status. We don't get your card details.
- **Stripe:** payment status for 1:1 coaching, and verification results for parents and coaches (a result ID, not card numbers or ID images).
- **Health apps and wearables (only if you connect them):** Apple Health (HealthKit), Google Health Connect, and connected wearables [OPEN: Engineer to list the exact sources]. See §5.1.
- **Your parent (16–17):** consent choices and settings changes your parent makes.
- **Your coach:** plans, notes and messages your coach creates for you.

### 4.4 What we don't collect

- Your raw date of birth (after the age check).
- Location in the background, except during a run you're recording with run tracking (when available). See §4.5.
- Health-app or wearable data you haven't connected.
- Biometric identifiers. Face ID or fingerprint unlock happens on your phone; we never receive it. Pose tracking for form checks runs on your phone, face points are discarded, and we don't use face recognition.
- Your contacts or photo library (we use only photos you take in [App]).

### 4.5 Location

**Approximate location (off by default).** Some features [OPEN: Engineer to list, e.g. finding gyms near you or Travel mode] can use your approximate location. We ask only when you open one of those features, and you can always type a place instead. We use only approximate location (about a mile, never pinpoint), only while you're using the feature, and **never in the background**. [OPEN: retention, proposed: not stored on our servers beyond the request; cached on your phone for at most 24 hours.]

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

- It's a **separate switch, off by default**, and you connect **one source at a time**. Your phone's permission screen lets you pick which data types to share.
- We use this data only to show your activity and trends in [App] and to help fit your training to you. It's treated like other health info: encrypted, **never sold, never used for ads or marketing, never used for data mining**, and never stored in iCloud.
- It's **not sent to Anthropic** or any other AI provider, and it's not shared with coaches. [OPEN: coach sharing of wearable data for adults; see drafting note 1b.]
- Disconnect a source any time in Settings › Privacy (or in Apple Health / Health Connect). Reading stops right away, and we delete data from that source within 30 days.
- 16–17: the teen and the parent must both opt in, and coaches never see it.

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

We **don't** sell personal information, use it for targeted ads, or use it for profiling that produces legal or similarly significant effects.

## 7. AI planning (Anthropic)

AI planning is a **separate switch, off by default**. You can use [App] without it.

**If you turn it on:**

- We send Anthropic, our AI provider, your **goals, experience, equipment, age range and an injury category**, with a random ID that changes every request.
- We **never** send your name, email, user ID, photos, location, run routes, wearable or health-app data, or free-text notes.
- Anthropic processes this data only for us, under its Commercial Terms and Data Processing Addendum, and **doesn't train its AI on it**.
- **Anthropic deletes it within 30 days**, unless its automated safety checks flag a request (then it may keep that request for up to 2 years) or the law requires it to keep data longer.
- The AI uses the injury category **only to avoid or swap exercises**. It never builds rehab or treatment plans.
- AI-made plans are labeled: "Made with AI. It can be wrong, so check that it fits you. It isn't medical advice. Stop and see a professional if anything hurts."

> [DRAFTING NOTE: Once Anthropic approves zero data retention **in writing** and the Console shows it under Settings › Privacy Controls › Data retention period, replace the retention bullet above with the Version A wording: "Anthropic doesn't store it after replying. The one exception is when the law requires it or Anthropic's automated safety checks flag a request; Anthropic also keeps the results of those safety checks." Update the health policy §8, the in-app AI switch text and the consent version/hash at the same time.]

Turn it off any time in Settings › Privacy. Your saved plan stays but stops adapting. For 16–17, a parent must also agree before it turns on, and either can turn it off.

## 8. How we share information

### 8.1 Service providers (processors)

These companies process data **for us, under contract**, and only as we instruct. They may not sell it or use it for their own purposes.

| Provider | What they do | Data they handle |
|---|---|---|
| Supabase | Hosting, database, sign-in | All account and app data (health info is stored encrypted) |
| [KMS provider] | Key management | Encryption keys only, not your data |
| Anthropic | AI planning (only if you turn it on) | Goals, experience, equipment, age range, injury category, random request ID |
| Apple and Google | Sign-in (if chosen), in-app purchases, age signals, app distribution | Sign-in identity, purchase status, age range |
| Stripe | Payments for 1:1 coaching, parent card verification, identity checks for coaches and for parents of minors in 1:1 | Payment and verification details (Stripe also acts under its own privacy policy for payments) |
| [Email provider] | Sending account, parent-invite and service emails | Email address, message content |
| [Live video/voice provider] [OPEN] | Live coaching check-ins (never recorded for 16–17) | Audio/video stream, session times |
| [Push notification provider] [OPEN] | Push notifications | Device token, notification text |
| [Safety-moderation and image hash-matching vendor] [OPEN] | Safety filters on minors' coach chats; hash matching on coach-shared images | Message text, shared images |
| [Subscription-management vendor] [OPEN, only if used] | Receipt checking for Pro | Purchase records, an app user ID |
| [Analytics vendor] [OPEN] [PROVISIONAL] | Basic product analytics (you can turn it off) | Feature and screen usage, app version, device type; no health info, wearable data, precise location or routes |
| [Crash-reporting vendor] [OPEN] [PROVISIONAL] | Crash and error reports | Crash logs, device and app version |
| [Map provider] [OPEN] (when run tracking is available) | Showing route maps | Map area being viewed; route points inside privacy zones are never sent |

Apple Health, Health Connect and wearables are **sources** you connect, not companies we send your data to.

**No advertising partners.** The app has no advertising SDKs, and we share no data with advertisers or ad networks.

### 8.2 Your coach (only if you turn on coach sharing)

Coaches are **independent** businesses, not our employees. A coach sees your data only if you turn on coach sharing for that coach, which is a separate switch from the health switch.

- **Adults:** your coach can see your workouts, history, PRs, charts, the health items you choose, any progress photos you pick, and any form-check videos you share. No downloads. Run routes (when available) are shared only if you choose to share them, with privacy zones applied. Wearable data isn't shared with coaches.
- **16–17:** your coach can see workouts, history, PRs, charts, and form checks as skeleton and numbers only. Run routes (when available) only if the teen and the parent both opt in, and then only distance, pace and a map with privacy zones applied, never the start or end point. Coaches **never** see a minor's health info or wearable data (weight, measurements, injury or pain notes, health-screen answers), never get videos, and get no photos. The teen and the parent must both agree.
- Turn it off any time in Settings › Coaching; access stops immediately.
- [OPEN: coach deletion on request. Only if the coach terms require it, add: "Coaches must delete your data when asked, under our coach terms." Until then, don't promise it.]

### 8.3 Your parent (16–17)

A linked parent can see your data and consent history, and everything your coach sees. Your parent can read your coach chat. You'll be told whenever your parent changes a setting or consent.

### 8.4 Legal, safety and business reasons

We may disclose information:

- when the law requires it, such as a valid subpoena or court order;
- to report suspected child sexual abuse material to NCMEC (18 U.S.C. §2258A) or suspected child abuse to Texas authorities (Tex. Fam. Code §261.101);
- to protect someone from serious harm, or to protect our rights and users;
- in a merger, sale or reorganization, where the new owner must keep this policy's promises for existing data (including the health policy), or ask for your consent first.

### 8.5 What we never do

- We never **sell** personal information.
- We never use it for **targeted advertising**, never share it for advertising, and have no advertising SDKs in the app.
- We never share health info with advertisers, data brokers or employers.

## 9. Teens (16–17) and parents

- **Age check:** we ask for date of birth before email, with no hints, and combine it with the app store age signal, using the lower age. We store only an age band and the date you turn 18.
- **Pending account:** until a parent links, the account holds only your email, age band, the date you turn 18, the parent's invite email and the invite status. Setup answers (training style, gym, units) stay **on your phone** and upload only once the link is active. No health info, workouts or purchases until then.
- **14-day limit:** if no parent links within 14 days, we delete the account and the parent's email. We use the parent's email only to send the invite.
- **Parent is the contracting party.** The parent agrees to the Terms and this policy, and is the customer for any purchase. No purchases until the link is active.
- **Both must agree.** Health info, AI planning and coach sharing each turn on only when **both** the teen and the parent opt in. Either can turn any of them off.
- **Parent can view** the teen's data and consent history, and the teen is notified when the parent changes anything.
- **Extra protections for 16–17:**
  - no progress photos;
  - form checks shared only as skeleton and numbers, never video (the video is deleted on the phone right after analysis);
  - coach chat is text only, and the parent can read it;
  - no weight-loss or calorie goals;
  - live sessions only with a parent invite, and never recorded;
  - coaches never see the teen's health info;
  - **wearables and health apps:** connecting requires both the teen and the parent to opt in; never shared with coaches;
  - **approximate location:** only with both the teen's and the parent's opt-in, and never in the background;
  - **precise run GPS (when available):** only with both the teen's and the parent's opt-in; used only during an active run, with no background location at any other time; privacy zones are always on and can't be turned off; no public or social route sharing and no route maps on profiles; a coach sees routes only if both opt in to coach sharing, and then only distance, pace and a zoned map, never the start or end point; the parent can view routes, and the teen is told this;
  - **analytics:** product analytics are off; only crash reports are collected.
- **At 18:** the account becomes an adult account on the stored date. Progress photos become available; nothing is collected for them before then.

## 10. Children under 16

[App] isn't for anyone under 16. If someone under 16 tries to sign up, we show a generic message and save nothing they entered (we keep only a total count of turned-away sign-ups). We don't knowingly collect personal information from children under 13. If we learn we have, we delete it. Contact krodriguez0720@gmail.com if you think we have.

## 11. Payments

- **Pro** is bought through Apple or Google in-app purchase. Apple or Google handle the payment; we receive only subscription status.
- **1:1 coaching** is sold by the coach, who is the seller of record. Payments go through Stripe as direct charges to the coach's Stripe account. For 16–17, the parent is the customer.
- We don't store full card numbers. For parent verification we keep only the method and Stripe's result ID.

## 12. If you're a coach

If you apply to coach on [App], we also collect: your name, contact details, certifications and their verification results, your Stripe connected-account status and identity-check result, your 18+ attestation, your profile and content, and, if you'll coach minors, a National Sex Offender Public Website (NSOPW) search result and your Texas abuse-reporting training record. We use these to approve and run your coach account and keep clients safe. We keep a 2-year log of your access to client data.

## 13. Safety monitoring and reporting

- Coach chats with 16–17 users are text only, filtered for self-harm, eating disorders, substances, harassment and grooming, and reviewed by people when flagged. They're never disappearing.
- Images shared with coaches are checked against known child-abuse image hashes.
- We report child sexual abuse material to NCMEC as federal law requires, and suspected child abuse to Texas authorities as state law requires.
- Safety records are kept as shown in §15.

## 14. Security

- Data is encrypted in transit (TLS) and at rest.
- Health info uses per-user encryption keys, wrapped by [KMS provider] and used only by our server. The database holds only encrypted data and wrapped keys.
- Progress photos are encrypted on your phone before upload and served only through short-lived links. Photos are locked behind Face ID or your passcode in the app.
- Access by our staff and processors is limited to what's needed, and logged.

No system is perfectly secure. See §18 for what we do if something goes wrong.

## 15. How long we keep information

| Information | How long |
|---|---|
| Account data, workout logs, settings | While your account is open. After you delete your account, we delete it within 45 days; backups expire within 6 months. |
| Health info | Until you turn the health switch off or delete it (then deleted within 30 days), or you delete your account. |
| Progress photos (18+) | Until you delete them; then removed from phone, server and backups within 30 days. |
| Adult form-check videos | On your phone; auto-deleted after 90 days unless starred. Shared copies are deleted from our server when you unshare or delete your account. |
| 16–17 form-check videos | Deleted on the phone right after analysis; never uploaded. |
| Pending 16–17 account and parent's email | Deleted on day 14 if the parent hasn't linked. |
| Raw date of birth | Not kept. |
| Raw app store age signal | Deleted once the check is done. |
| Turned-away under-16 sign-ups | No personal information kept. |
| Data sent to Anthropic | Deleted by Anthropic within 30 days (up to 2 years if its safety checks flag a request, or longer if the law requires). |
| Consent records (version, text hash, timestamps) | Life of the account + 4 years; for minors, at least until their 22nd birthday. |
| Privacy-rights and deletion request logs | At least 24 months (we aim for 4 years). |
| Coach access logs | 2 years. |
| Minor safety records (flags, reports, chat kept for safety review) | Until the minor's 22nd birthday or 4 years, whichever is later. Legal holds override. |
| NCMEC report materials | 1 year after the report, secured and access-limited. |
| Wearable and health-app data | Until you disconnect the source, turn the switch off, or delete your account; then deleted within 30 days. |
| Approximate location | [OPEN: proposed: not stored on our servers beyond the request; cached on your phone at most 24 hours.] |
| Run routes (when available) | [OPEN: proposed: kept while your account is active; deleted within 30 days after you delete the route or your account.] |
| Analytics and crash data [PROVISIONAL] | [OPEN: proposed: 13 months for analytics events, 90 days for crash reports.] |
| Adult coach chat after coaching ends | [OPEN] |
| Payment and tax records | [OPEN: set with CPA] |

## 16. Your choices and rights

**Everyone, wherever you live in the US, can:**

- see and download your data (Settings › Privacy › Export);
- correct it (in the app, or ask us);
- delete it, or your whole account (Settings › Account › Delete account);
- turn the health, wearable, location, AI and coach-sharing switches off any time, and turn off product analytics [PROVISIONAL];
- delete any run route, or all of them (when available);
- get a list of the companies we've shared your data with.

We won't treat you differently, charge you more or give you a worse service for using these rights. (If you turn off health info or AI, features that need them, like an adaptive AI plan, stop working; the free logging tier always stays.)

**Texas residents** (Texas Data Privacy and Security Act, Tex. Bus. & Com. Code ch. 541): you can confirm and access your data, correct it, delete it, get a portable copy, and opt out of sale, targeted ads and profiling (§541.051). We don't sell personal information, do targeted ads or do that kind of profiling, so there's nothing to opt out of, but you can still ask. We process sensitive data, like health info, precise location or data of a known child, only with consent.

**Washington and Nevada residents:** you have health-data rights under Washington's My Health My Data Act and Nevada's consumer health data law. See the [Consumer Health Data Privacy Policy](/consumer-health-data-privacy-policy).

**Other states:** if your state gives you more privacy rights, we'll honor them. Contact us.

**Parents of 16–17 users** can make requests for the teen from Parent Settings. The teen can also make requests.

## 17. How to make a request, and how to appeal

- **In the app:** Settings › Privacy › Your privacy rights.
- **By email:** krodriguez0720@gmail.com (you don't need the app or a new account).

We'll confirm it's you, usually through your signed-in account or a code sent to your account email. If we can't confirm it with reasonable effort, we may ask for more information. An authorized agent may opt out on your behalf if we can verify their authority.

We'll respond within **45 days**. If we need more time, we may extend once by up to 45 more days and will tell you why within the first 45 days. Requests are free up to twice a year.

**Appeals:** if we turn down your request, you can appeal by tapping "Appeal this decision" in the app or emailing krodriguez0720@gmail.com with "Appeal" in the subject. We'll answer in writing within **45 days**, with our reasons. If we deny your appeal, you can complain to your state attorney general:

- Texas: https://www.texasattorneygeneral.gov/consumer-protection/file-consumer-complaint
- Washington: https://www.atg.wa.gov/file-complaint

## 18. If there's a data breach

If a breach affects your information, we'll notify you as the law requires, including:

- **FTC Health Breach Notification Rule** (16 CFR part 318) for health info: notice to you without unreasonable delay and within 60 calendar days of discovery; notice to the FTC (at the same time if 500 or more people are affected); and notice to the media if 500 or more residents of a state are affected.
- **Texas law** (Tex. Bus. & Com. Code §521.053): notice to affected people within 60 days of determining a breach happened, and to the Texas Attorney General within 30 days if 250 or more Texans are affected.
- Other states' breach laws where they apply.

Notices will say what happened, what information was involved, what you can do, and how to reach us.

## 19. Cookies, tracking, analytics and ads

- **No ads:** the app has no advertising SDKs, we don't share data for advertising, and we don't do targeted advertising.
- **No cross-app tracking:** we don't track you across other companies' apps or websites, so the app doesn't show Apple's tracking prompt.
- **[PROVISIONAL] Analytics:** we collect crash reports and basic product analytics, either ourselves or through a service provider working only for us [OPEN: vendor names]. Events never include health info, wearable data, precise location or routes. Turn product analytics off in Settings › Privacy › Share usage analytics. 16–17: crash reports only.
- **Website:** uses only cookies needed to run it [Engineer: confirm when the site is built]. [OPEN: if website analytics are added, update this section and the health policy §9 first.] If your browser sends a Global Privacy Control signal, we treat it as an opt-out of sale and targeted ads (which we don't do anyway).

## 20. Where we process data

[App] is offered only in the US, and we store data in the United States. [Engineer: confirm Supabase region and KMS region are US. Anthropic may process in other regions under its DPA; confirm.]

## 21. Changes to this policy

We'll post updates here and change the version and date at the top. For material changes, we'll tell you in the app or by email before they take effect. We won't collect or use health info in new ways, or share it with new kinds of recipients, without asking you first.

## 22. Contact

[Company] · [mailing address] · krodriguez0720@gmail.com
