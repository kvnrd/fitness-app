# [App] Consumer Health Data Privacy Policy

**Version:** [v0.2 DRAFT] · **Effective date:** [Effective date] · **Last updated:** [Date]

---

> ## Drafting notes for Engineer and attorney (delete this block before publishing)
>
> **Changelog**
> - **v0.2 (Nov 15, 2026, Counsel):** Kevin's answers folded in. No advertising SDKs or ad sharing (stated plainly). Added wearable and health-platform data (Apple Health/HealthKit, Google Health Connect, connected wearables) as consumer health data under a separate per-source opt-in, off by default, never sent to Anthropic (§3.1). Added location: approximate location off by default and foreground only; precise run GPS as a later "when available" feature with its own opt-in, privacy zones and private routes; never used to infer health-facility visits; no geofencing (§3.2). Analytics drafted as [PROVISIONAL] with no health data in events (§9). Teen rules for wearables, location and routes (§13). Provisional contact email.
> - **v0.1 (Nov 15, 2026, Counsel):** first draft.
>
> Drafted by Counsel on Nov 15, 2026. General legal information, not formal legal representation. This is the standalone policy required by Washington's My Health My Data Act (RCW 19.373.020) and written to also meet Nevada's NRS 603A.495. The onboarding **Privacy & safety** screen links here. Sources and law checks are the same as in `privacy-policy.md` (RCW 19.373.010–.050 read on leg.wa.gov Nov 15, 2026; NRS 603A.495; 16 CFR 318; Anthropic Commercial Terms effective Jun 17, 2025, and its API retention article dated Jul 1, 2026). v0.2 additions checked Nov 15, 2026: Apple App Review Guidelines 5.1.2(i), (vi), 5.1.3 and 5.1.5 (last updated Oct 16, 2026); Google Play Console Help "Android Health Permissions: Guidance and FAQs"; RCW 19.373.080; Tex. Bus. & Com. Code §541.001(21), (29).
>
> **Placeholders:** [App]; [Company] = [Kevin's legal name] / [LLC name, TBD]; contact email = **krodriguez0720@gmail.com [PROVISIONAL: replace with a domain alias such as privacy@[domain] before launch]**; [mailing address]; [website URL]; [Effective date]; [Version]; [KMS provider]; [Email provider]; [Live video/voice provider]; [Safety-moderation and image hash-matching vendor]; [Analytics vendor] / [Crash-reporting vendor] [OPEN]; [Map provider] [OPEN]; wearable sources and data types [OPEN: Engineer to list]; approximate-location features [OPEN: Engineer to list].
>
> **Open items (marked `[OPEN]` in the text):**
> 1. **Decided (v0.2):** no advertising SDKs and no sharing for ads. Wearables yes (§3.1). Location yes, split into approximate (now) and precise run GPS (later) (§3.2). **Still open:** the exact wearable sources and data types (Apple 5.1.3(i) requires disclosing the specific health data collected); approximate-location features; analytics vendors ([PROVISIONAL] §9); [Map provider]. Any new category, purpose or recipient still needs disclosure and new affirmative consent first (RCW 19.373.020(1)(c)–(d); NRS 603A.495(3)).
> 1a. **Wearable data to Anthropic: NO** unless the AI consent is widened **and** Apple 5.1.2(i) (explicit permission before sharing with third-party AI) and Google's explicit-consent rule are met. **Wearable data to coaches: NO at launch** [OPEN for adults]; never for 16–17.
> 1b. **Location retention:** approximate [OPEN: proposed not stored server-side beyond the request, device cache ≤24 h]; routes [OPEN: proposed keep while account active, delete within 30 days after the user deletes the route or account]. If precise location is used outside run tracking, or background location outside an active run, update §3.2, §13 and §14 and add a new opt-in.
> 1c. **Google Play injury-risk clause:** Google bars using health and fitness data in apps "where the use or failure of health data could reasonably be expected to lead to ... personal injury." Keep wearable data to display, trends and gentle suggestions. [ATTORNEY + Play review.]
> 2. **Coach deletion clause** (§7.2): placeholder until coach terms require it. Don't promise it before then (FTC Act §5, Texas DTPA).
> 3. **Form-check AI cues:** an LLM writing cues from form metrics would send data the AI switch doesn't list. Not allowed under this policy as written (§8).
> 4. **Adult weight goal at Setup step 5** happens before the health switch. Keep it on the device until the switch is on.
> 5. **Progress photos (18+):** this policy treats them as consumer health data. Decide the consent mechanism (Counsel recommends a separate just-in-time opt-in at first use) and update §3 and §6.
> 6. **Basic workout logs** are treated as necessary for the logging service the user asked for (RCW 19.373.030(1)(a)(ii)); using them with health info for plan-building is under the switch. [ATTORNEY: confirm.]
> 7. **Minors' form numbers to coaches** need both teen and parent opt-in (not parent notice only). Align `formcheck-notes.md`.
> 8. **Version A** AI wording only after Anthropic approves zero data retention in writing (§8 drafting note).
>
> **Attorney must review before launch:** the full text; whether every listed item is "consumer health data" (RCW 19.373.010); Anthropic as an MHMDA "processor" (its DPA doesn't name MHMDA, see `phase2-legal-answers.md` §13); coach sharing as "sharing" needing separate consent; the minors' rules and parent-verification adequacy; the retention periods; the deletion-notice process; the treatment of form-check numbers for minors (shared with coaches) vs. the "health info" coaches never see; Nevada's 30-day deletion timing.
>
> **Build hooks for Engineer:**
> - **Homepage link:** a prominent, separate "Consumer Health Data Privacy Policy" link on the website homepage (not only in the footer of inner pages) (RCW 19.373.020(1)(b); NRS 603A.495(2)). Also link it from the store listing's privacy URL page, Settings › Privacy, the Privacy & safety screen (health section), and Parent Settings.
> - **Consent:** health switch and coach-sharing switch are separate records (collection vs. sharing, RCW 19.373.030(1)(b)(i)). For 16–17, a scope is on only when both teen and parent rows are "on." Log state, actor, text version + SHA-256 hash, timestamp, IP, device, app version. Append only.
> - **Withdrawal:** turning the health switch off stops collection right away and starts deletion of health fields within 30 days by destroying that user's health data key (crypto-shredding). Warn and offer export first.
> - **Rights flow:** Settings › Privacy › Your privacy rights, plus krodriguez0720@gmail.com. Requests: confirm/access (including the recipient list with contact emails, §7.4), withdraw consent, delete, correct. 45-day clock from receipt (not from authentication), one 45-day extension with notice inside the first 45 days. Free twice a year.
> - **Recipient list endpoint:** generate per user from logs: which processors received their data, and which coaches (name and in-app contact) got access and when.
> - **Deletion fan-out:** notify Supabase-side jobs, Anthropic (as a listed processor), [Email provider], any coach who had access, and other recipients; log each notice; backups expire within 6 months.
> - **Appeal:** "Appeal this decision" on every denial and by email; written answer within 45 days with reasons; on denial include the Washington AG link and the Texas AG link.
> - **Wearables:** separate switch + per-source connect; request only the types we use; source-tag every row; per-source disconnect deletes that source's data within 30 days; server-side allowlist keeps wearable data out of the Anthropic prompt, analytics and coach APIs; no HealthKit data in iCloud; never write false data to HealthKit; Health Connect use-case declaration in Play Console; background/history read only if needed and justified. 16–17: teen + parent opt-in rows.
> - **Location:** approximate, while-in-use only, rounded on device to ~1 mile (TDPSA "precise" = within 1,750 ft, §541.001(21)); manual fallback (Apple 5.1.2(i)). Run GPS (later): separate precise + background opt-in; collect only during an active run; visible recording indicator; privacy zones on by default and locked on for 16–17; strip in-zone coordinates from every export, share, coach view and map request; per-route and delete-all. **No geofences around health-care facilities and no health-visit inference** (RCW 19.373.080).
> - **Analytics [PROVISIONAL]:** event allowlist with no health, wearable, route or precise-location fields; no cross-app IDs; opt-out switch; 16–17 crash reports only.
> - **Policy versioning:** hash each version; show an in-app notice for changes; re-consent before any new category, purpose or recipient type.

---

## 1. What this policy covers

This policy explains how [Company] ("we," "us") collects, uses, shares and protects **consumer health data** in the [App] app. It adds to our main [Privacy Policy](/privacy-policy).

It's written to meet Washington's My Health My Data Act (RCW ch. 19.373) and Nevada's consumer health data law (NRS ch. 603A), but **we apply it to every user**, wherever you live in the US.

## 2. What we mean by "health data"

Consumer health data is personal information that is linked or reasonably linkable to you and that identifies your past, present or future physical or mental health status. In [App], that means the items in §3, plus anything we infer from them (for example, a plan adjusted to avoid an injured area).

## 3. Health data we collect, and why

We collect the health data below **only if you turn on the "Save my health info" switch**, except where noted. It's off by default.

| Category | Examples | Why we collect it and how we use it |
|---|---|---|
| Body weight | Weight entries, weight trend, weight goal | Show your progress; set loads and plans that fit you. (16–17: no weight-loss or calorie goals.) |
| Body measurements | Waist, chest, arms and similar | Show your progress. |
| Injury and pain notes | Injuries you list, "pain" swap reasons, notes | Avoid or swap exercises that may not fit you; keep plans safe. Never used to diagnose or treat. |
| Health-screen answers | Answers to the pre-plan health questions (PAR-Q style) | Flag when to see a professional before training; keep plans safe. |
| Form-check numbers | Rep counts, joint angles, depth, bar path, flagged reps, skeleton replay | Show technique feedback and track progress. The video itself is analyzed on your phone. |
| Training data in your health profile | Workout history and performance used together with the items above | Build and adjust your workouts. |
| Progress photos (18+ only) | Front, side and back photos taken in [App] | Show your progress privately. [OPEN: consent mechanism; see drafting note 5.] |
| Inferences | An injury category; plan adjustments made because of your health info | Build safer plans. |

**Basic workout logs** (exercises, sets, reps, loads) are stored even with the switch off, because they're needed for the logging feature you asked for. They're used only for logging, history and charts unless you turn the health switch on.

**We don't collect:** health-app or wearable data you haven't connected; location in the background except during a run you're recording (when available); biometric identifiers (Face ID stays on your phone; pose tracking runs on your phone and discards face points; we don't use face recognition); diagnoses or medical records from providers; reproductive or sexual health data. [Engineer: make sure no connected source reads reproductive or sexual health types.]

### 3.1 Health apps and wearables (separate switch, off by default)

If you turn on "Connect health apps and wearables" and connect a source, we collect the data types you allow from:
- Apple Health (HealthKit)
- Google Health Connect
- connected wearables

[OPEN: Engineer to list the exact sources and data types, for example workouts, heart rate, steps, active energy, sleep.]

| | |
|---|---|
| **Why** | To show your activity and trends in [App] and help fit your training to you. |
| **How it's handled** | Encrypted like other health data. You connect one source at a time and choose the data types on your phone's permission screen. |
| **Never** | Sold; used for advertising, marketing or data mining; stored in iCloud; sent to Anthropic or any AI provider; shared with coaches [OPEN for adults]; used in analytics. |
| **Turn it off** | Disconnect a source in Settings › Privacy (or in Apple Health / Health Connect). Reading stops right away; that source's data is deleted within 30 days. |

These limits follow Apple's App Review Guidelines 5.1.2(vi) and 5.1.3 and Google Play's policy on Android health permissions.

### 3.2 Location and your health

- **Approximate location** (off by default) is used only when you open a feature that needs it, never in the background, and is never finer than about a mile. We don't treat it as health data, and we don't use it for anything health-related.
- **Precise GPS for run tracking (when available)** will be a separate opt-in for precise and background location, used only while you record a run. Privacy zones hide each route's start and end, and routes are private unless you choose to share them. Routes can show your workouts, so we protect them like health data: encrypted, never sold, never used for ads, never sent to Anthropic.
- We **never** use location or routes to work out whether you visited a health-care facility, and we **never** set up geofences around places that provide in-person health care (RCW 19.373.080).
- Precise location is "sensitive data" under Texas law and is used only with your consent.
- Turning location off stops collection. You can delete one route or all routes any time.

## 4. Where it comes from

- **You:** what you enter or record in [App].
- **Your phone:** form-check numbers produced by on-device pose analysis.
- **Our systems:** inferences we make from what you give us (like an injury category).
- **Your parent (16–17):** consent choices and settings.
- **Your coach:** notes and plan changes a coach makes for you, if you use 1:1 coaching.

We don't buy health data and don't get it from data brokers.

## 5. How we use and process it

We use health data **only** to:

- build, adjust and show your workouts and progress;
- keep plans safe (for example, steering away from exercises that may not fit an injury);
- show your data to your coach, **only** if you turn on coach sharing (§7.2);
- send AI planning a limited injury category, **only** if you also turn on AI planning (§8). Wearable data, location and routes are never sent to AI;
- secure the service, keep required records, and comply with the law.

**How it's processed:** stored by Supabase in encrypted form, with per-user keys held in [KMS provider] and used only by our server; served to you, your parent (16–17) and, if you choose, your coach.

**We never:**

- sell health data;
- use it for advertising or share it with advertisers, data brokers, employers or insurers (the app has no advertising SDKs);
- use it in analytics, or use health-app or wearable data for data mining;
- use it to train AI, ours or anyone else's;
- use it for any new purpose without asking you first.

## 6. Your consent

- **Collection:** the "Save my health info" switch on the Privacy & safety screen. It shows what we collect, why, who receives it, and how to turn it off before anything is collected.
- **Sharing with a coach:** a separate "Share with my coach" switch.
- **AI planning:** a separate "Use AI to build my plan" switch.
- **Health apps and wearables:** a separate "Connect health apps and wearables" switch, then a per-source connection.
- **Precise run GPS (when available):** a separate opt-in for precise and background location.
- All switches are **off by default**. You can keep using [App]'s free logging with them all off. No switch is bundled with our Terms.
- **Turning a switch off:** go to Settings › Privacy (or Settings › Coaching for coach sharing). Collection or sharing stops right away. If you turn off health info, we delete your health data within 30 days. We'll offer you an export first.
- **16–17:** each switch turns on only when **both** you and your parent agree. Either of you can turn it off. You'll be told when your parent changes anything.

## 7. Who we share health data with

### 7.1 Processors (they work for us under contract)

Processors may use health data only on our instructions, under a binding contract, and must help us honor your rights.

| Processor | Category | Health data they handle |
|---|---|---|
| Supabase | Cloud hosting and database | All health data, stored encrypted |
| [KMS provider] | Encryption key management | Keys only; no health data |
| Anthropic | AI service provider (only if you turn on AI planning) | Injury category only (plus non-health items: goals, experience, equipment, age range) |
| [Email provider] | Email delivery | None (account and service emails only) |
| [Live video/voice provider] [OPEN] | Live coaching check-ins | Whatever you say or show in a live session; never recorded for 16–17 |
| [Safety-moderation and image hash-matching vendor] [OPEN] | Child-safety screening | Coach-shared images and minors' chat text, if they contain health details |

| [Map provider] [OPEN] (when run tracking is available) | Route maps | Map area only; route points inside privacy zones are never sent |
| [Analytics vendor] / [Crash-reporting vendor] [OPEN] [PROVISIONAL] | Product analytics and crash reports | **None.** Health data is excluded from analytics and crash reports. |

Apple Health, Health Connect and wearables are sources you connect; we don't send your data to them. We have **no advertising partners**.

### 7.2 Coaches (third parties, only with your separate consent)

Coaches are independent businesses. A coach gets health data **only** if you turn on coach sharing for that coach.

- **Adults:** the health items you choose, any progress photos you pick, form-check videos you share, and run routes you choose to share (zones applied, when available). Viewed in the app only, no downloads. Wearable data isn't shared with coaches.
- **16–17:** coaches **never** see weight, measurements, injury or pain notes, health-screen answers or wearable data, never get videos, and get no photos. Run routes (when available) only if the teen and parent both opt in, and only distance, pace and a zoned map, never the start or end point. They may see form checks as skeleton and numbers only, if both the teen and the parent agree.
- Turn sharing off any time; access ends immediately.
- If you ask us to delete your health data, we notify the coach too.
- [OPEN: only if coach terms require it, add: "Coaches must delete your data when asked, under our coach terms."]

### 7.3 Others

- **Your parent (16–17):** can view your data and consent history.
- **Legal and safety:** when the law requires it, or to report child sexual abuse material to NCMEC or suspected child abuse to Texas authorities.
- **Business transfer:** if [App] is sold or merged, the new owner must keep these promises or ask your consent.

**Affiliates:** we have no affiliates that receive health data. [Update if an LLC or other entity is formed that receives data.]

### 7.4 Getting the list

You can ask for a list of every third party and processor that has received your health data, with an email address or online way to contact each one (§11).

## 8. AI planning and Anthropic

- **Off by default.** Only if you turn on AI planning.
- Anthropic, our AI provider, receives your **goals, experience, equipment, age range and an injury category**, with a random ID that changes every request. From your health data, it receives **only an injury category**, never your notes, measurements, photos, name, email, user ID or location.
- Anthropic processes it **only for us**, under its Commercial Terms and Data Processing Addendum, and **doesn't train its AI on it**.
- **Anthropic deletes it within 30 days**, unless its automated safety checks flag a request (then it may keep that request for up to 2 years) or the law requires it to keep data longer.
- The AI uses the injury category **only to avoid or swap exercises**. It never builds rehab or treatment plans, and its plans aren't medical advice.

> [DRAFTING NOTE: When Anthropic approves zero data retention **in writing** and the Console shows it, replace the retention bullet with Version A: "Anthropic doesn't store it after replying. The one exception is when the law requires it or Anthropic's automated safety checks flag a request; Anthropic also keeps the results of those safety checks." Change the in-app AI switch text, the main Privacy Policy §7, and the consent version/hash at the same time.]

## 9. Tracking across websites and apps

No third party collects your health data over time or across websites or apps through [App] or our website. The app has **no advertising SDKs** and no cross-app tracking. [PROVISIONAL] We use crash reports and basic product analytics, handled by us or by a service provider working only for us [OPEN: vendors]; they never include health data, wearable data, precise location or routes, and you can turn product analytics off in Settings › Privacy.

## 10. How we protect it

- Encrypted in transit and at rest, with per-user keys wrapped in [KMS provider], separate from our database.
- Progress photos are encrypted on your phone before upload, locked behind Face ID or passcode in the app, and served only through short-lived links.
- Access is limited to the people and processors who need it to provide what you asked for, and access is logged. Coach access logs are kept 2 years.
- You can change health data any time in the app, or ask us to correct it.

## 11. Your rights

You have the right to:

1. **Confirm and access:** find out whether we collect, share or sell your health data (we don't sell it), get a copy, and get a list of all third parties and affiliates we've shared it with, with a way to contact each.
2. **Withdraw consent** to our collection and sharing of your health data at any time.
3. **Delete** your health data. We delete it from all our systems and tell every processor, coach and other recipient to delete it too. Backup copies are deleted within 6 months.
4. **Correct** inaccurate health data.
5. **Not be discriminated against** for using these rights.
6. **Appeal** if we turn down a request.

## 12. How to use your rights

- **In the app:** Settings › Privacy › Your privacy rights (or Parent Settings for parents of 16–17 users).
- **By email:** krodriguez0720@gmail.com. You don't need to create an account.

**Verifying it's you:** we use your signed-in account, or send a code to your account email. If we can't verify you with reasonable effort, we may ask for more information.

**Timing:** we respond within **45 days** of receiving your request. If we need more time, we may extend once by up to 45 more days and will tell you why within the first 45 days. We complete health-data deletion within **30 days** of verifying a deletion request (backups within 6 months). Requests are free up to twice a year.

**Appeals:** if we turn down a request, tap "Appeal this decision" in the app or email krodriguez0720@gmail.com with "Appeal" in the subject. We'll answer in writing within **45 days**, with our reasons. If we deny your appeal, you can complain to the attorney general:

- Washington: https://www.atg.wa.gov/file-complaint
- Texas: https://www.texasattorneygeneral.gov/consumer-protection/file-consumer-complaint
- Nevada or another state: your state attorney general's consumer protection office.

## 13. Teens (16–17)

- A parent must link and agree before any health data is collected.
- Health data, AI planning and coach sharing each need **both** the teen and the parent to opt in. Either can turn them off.
- The teen can turn off and delete health data in Settings › Privacy; the parent can in Parent Settings. The teen is told when the parent changes anything.
- No progress photos, no weight-loss or calorie goals, form-check videos deleted on the phone right after analysis, and coaches never see the teen's health info.
- **Wearables and health apps:** both the teen and the parent must opt in; coaches never see this data.
- **Approximate location:** only with both opt-ins; never in the background.
- **Precise run GPS (when available):** both the teen and the parent must opt in. Used only during an active run, with no background location at any other time. Privacy zones are always on and can't be turned off. No public or social route sharing and no route maps on profiles. A coach sees routes only if both opt in to coach sharing, and then only distance, pace and a zoned map, never the start or end point. The parent can view routes, and the teen is told this.
- **Analytics:** product analytics off; crash reports only, with no health data.
- We don't knowingly collect health data from anyone under 16.

## 14. How long we keep it

| Health data | How long |
|---|---|
| Health data under the switch | Until you turn the switch off or delete it (then deleted within 30 days), or delete your account. |
| Progress photos (18+) | Until you delete them; then removed from phone, server and backups within 30 days. |
| Adult form-check videos | On your phone; auto-deleted after 90 days unless starred. Shared copies are deleted from our server when unshared or the account is deleted. |
| 16–17 form-check videos | Deleted on the phone right after analysis; never uploaded. |
| Data sent to Anthropic | Deleted within 30 days (up to 2 years if flagged by safety checks, or longer if the law requires). |
| Wearable and health-app data | Until you disconnect the source, turn the switch off, or delete your account; then deleted within 30 days. |
| Run routes (when available) | [OPEN: proposed: kept while your account is active; deleted within 30 days after you delete the route or your account.] |
| Approximate location | [OPEN: proposed: not stored on our servers beyond the request; cached on your phone at most 24 hours.] |
| Account deletion | Within 45 days; backups within 6 months. |
| Consent records | Life of the account + 4 years; for minors, at least until their 22nd birthday. |
| Rights-request logs | At least 24 months (we aim for 4 years). |
| Coach access logs | 2 years. |
| Minor safety records that include health details | Until the minor's 22nd birthday or 4 years, whichever is later. Legal holds override. |

## 15. Breaches

If unsecured health data is breached, we'll notify you without unreasonable delay and within 60 calendar days of discovery, as the FTC Health Breach Notification Rule requires (16 CFR part 318). We'll also notify the FTC, and the media if 500 or more residents of a state are affected, and follow Texas law (Tex. Bus. & Com. Code §521.053) and other state laws that apply.

## 16. Changes to this policy

We'll post changes here with a new version and date, and tell you in the app before material changes take effect. We **won't** collect new categories of health data, use it for new purposes, or share it with new kinds of recipients **without first telling you and getting your consent**.

## 17. Contact

[Company] · [mailing address] · krodriguez0720@gmail.com · [website URL]
