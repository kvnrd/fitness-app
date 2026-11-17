# [App] Terms of Service

**Version:** [v0.2 DRAFT] · **Effective date:** [Effective date] · **Last updated:** Nov 16, 2026 (draft)

---

> ## Drafting notes for Engineer and attorney (delete this block before publishing)
>
> **Changelog**
> - **v0.2 (Nov 16, 2026, Counsel):** aligned with Privacy Policy and Health policy v0.3.
>   - **§7:** AI planning pauses while the 12-month health re-screen is due.
>   - **§12:** the content license no longer reaches health info, progress photos or messages for AI training or analytics. Before, "improve the Service" conflicted with the policies’ "never used to train AI / in analytics."
>   - **§20:** a pending re-accept never blocks privacy rights (TDPSA §541.054).
>   - **Build hooks:** the acceptance log uses the IP hash and device hash; the checkbox wording is now "I agree to the Terms of Service, and I’ve read the Privacy Policy."
>   - **Notes:** the contact-email note is updated.
>   - **Apostrophes:** curly (’) throughout.
>   - **Engineer:** bump `TERMS` from `v0.1-draft` and re-hash.
> - **v0.1 (Nov 16, 2026, Counsel):** first draft.
>
> Drafted by Counsel on Nov 16, 2026. This is general legal information, not formal legal representation. Sources: `legal/phase2-legal-answers.md`, `legal/phase3-review.md`, `legal/phase4-review.md`, `legal/privacy-policy.md` (v0.3 DRAFT), `legal/consumer-health-data-privacy-policy.md` (v0.3 DRAFT), `legal/phase4-build-answers.md`, `legal/phase5-review.md`, `monetization-notes.md`, repo `docs/phase-3-onboarding.md` (branch `phase-3-onboarding`). Law checked Nov 16, 2026: Apple "Instructions for Minimum Terms of Developer’s End-User License Agreement" (apple.com/legal/internet-services/itunes/dev/minterms/); Tex. Bus. & Com. Code ch. 541 (statutes.capitol.texas.gov); 16 CFR 312.10 (eCFR).
>
> **Attorney review (a licensed Texas attorney must review before launch):**
> 1. **§6 Assumption of risk and release** — express-negligence and fair-notice compliance (*Dresser Indus. v. Page Petroleum*, 853 S.W.2d 505 (Tex. 1993)); conspicuousness (Tex. Bus. & Com. Code §1.201(b)(10)); scope of what can be released; effect for 16–17 (a parent can’t waive a minor’s injury claims, *Munoz v. II Jaz Inc.*, 863 S.W.2d 207 (Tex. App. 1993); limitations runs from 18, Civ. Prac. & Rem. Code §16.001).
> 2. **§18 Disputes** — whether to use arbitration and a class waiver at all [OPEN: Kevin decides], and if so the provider, rules, fees, opt-out, small-claims carve-out, and mass-arbitration terms.
> 3. **§16–§17 Disclaimers, limitation of liability, indemnity** — enforceability for consumers, Texas DTPA limits on waivers (Tex. Bus. & Com. Code §17.42), and Apple minimum term 5 (the EULA may not limit liability beyond what the law permits).
> 4. **§4 Minors and parents** — parent as contracting party, voidability of minors’ contracts (*Dairyland Cnty. Mut. v. Roman*, 498 S.W.2d 154 (Tex. 1973)), Texas SB 2420 (Bus. & Com. Code ch. 121) consent and good-faith reliance.
> 5. **§9–§10 Coaching marketplace** — independent-contractor and seller-of-record framing, Stripe direct charges, refund terms, platform-fee refund [OPEN].
> 6. **§8 Subscriptions** — store terms, free-trial and promo disclosures; ROSCA (15 U.S.C. §8403) and state auto-renewal laws once a web checkout is added.
> 7. **§13 Copyright / DMCA** — designated-agent registration with the U.S. Copyright Office (17 U.S.C. §512(c)(2)).
> 8. **§12 User content license** and the Consumer Review Fairness Act (15 U.S.C. §45b): no term may restrict honest reviews.
>
> **Placeholders:** [App]; [Company] = [Kevin’s legal name] until the LLC is formed, then [LLC name] (no LLC exists yet); [mailing address]; [phone]; privacy@[domain] and support@[domain]; [website URL]; [Effective date]; [Coach Terms] link; [DMCA agent name, address, email, registration no.]; [Arbitration: YES/NO].
>
> **Consistency notes:** All three documents now use privacy@[domain]. Fill in the real domain in all three at the same time. Nothing in these Terms is a consent to health data, AI, or coach sharing; those stay separate switches (RCW 19.373.010; Tex. Bus. & Com. Code §541.001(6)(A)).
>
> **Build hooks for Engineer:**
> - **Version and hash:** bundle this file like the policies (`npm run policies` style): strip this drafting block, compute SHA-256 of the published text, and expose `{version, hash}`. Replace `terms-placeholder-v0` in `complete_signup` and `accept_parent_link`; the server should reject a missing hash once Terms exist. Route: `/legal/terms`; add it to Train › Account › Privacy/Legal rows, the paywall, the coach application, and Parent Settings.
> - **Acceptance logging:** one append-only `consent_events` row of type `terms` per acceptance: user ID, actor (adult, parent, coach), the teen’s account ID for parent acceptances, version, hash, timestamp, IP hash and device hash (keyed with a pepper kept outside the database), app version. Archive the exact text in `legal_text_versions`. Separate rows for the release in §6 are not needed (it’s part of the Terms), but the §6 heading must render as shown.
> - **Where it appears in onboarding:** (1) adults: the Terms checkbox on Create (2 of 8), and on Apple/Google sign-up a Terms checkbox before account creation; (2) 16–17: the teen’s Create checkbox may stay, logged with actor `teen`, but the binding acceptance is the **parent’s** as contracting party on the Parent consent screen ("Confirm and link"), logged with the teen’s account ID; the teen’s account stays pending until then; (3) coaches: the coach application accepts these Terms plus the [Coach Terms]; (4) material changes: show a re-accept screen (§20) and log a new row. The Terms checkbox is never combined with the health, AI, coach-sharing, photo or risk items. Its wording, everywhere: "I agree to the Terms of Service, and I’ve read the Privacy Policy." The re-accept screen never blocks Settings › Privacy, data export or account deletion.
> - **Pre-launch:** any test acceptances recorded under `terms-placeholder-v0` don’t count. Require re-acceptance of v1.0 before production.

---

**Please read these Terms carefully. Section 6 includes an assumption of risk and a release of claims, including claims for our own negligence. Section 18 explains how disputes are resolved.**

## 1. Who we are and what these Terms cover

These Terms of Service ("Terms") are an agreement between you and [Company] ("[Company]," "we," "us"), based in Texas, USA. They cover the [App] mobile app, our website, and related services (the "Service").

By creating an account or using the Service, you agree to these Terms. Our [Privacy Policy](/privacy-policy) and [Consumer Health Data Privacy Policy](/consumer-health-data-privacy-policy) explain how we handle your information. They are separate documents. Agreeing to these Terms never turns on health data, AI planning, or coach sharing. Those are separate choices that you make yourself, and they stay off unless you turn them on.

## 2. Where the Service is available

The Service is offered only in the United States. You must not use it if you are located in a country under a U.S. government embargo or on a U.S. government list of prohibited or restricted parties.

## 3. Who can use [App]

- You must be at least **16**.
- If you’re **16 or 17**, a parent or legal guardian must link to your account and agree to these Terms (see §4).
- Coaches must be **18 or older** and approved by us (see §9).
- You must give accurate information, including your date of birth. You may have only one personal account, and you’re responsible for keeping your login secure.

## 4. Teens (16–17) and parents

- **Your parent is the contracting party.** A parent or legal guardian who links to a 16–17-year-old’s account agrees to these Terms for that account, confirms they are 18 or older with legal authority over the teen, and is responsible for purchases they approve.
- **Pending accounts.** Until a parent links, the teen’s account is limited. If no parent links within 14 days after the account is created, we delete the account and the parent’s email.
- **No purchases** until the parent link is active. For 1:1 coaching, the parent is the customer.
- **Both must agree.** Health data, AI planning, coach sharing and similar features turn on only when both the teen and the parent opt in. Either can turn them off.
- **Extra protections** apply to 16–17, as described in our Privacy Policy, including text-only coach chat that the parent can read, no progress photos, form checks shared only as skeleton and numbers, no weight-loss or calorie goals, and live sessions only with the parent invited and never recorded.
- **At 18,** the account becomes an adult account, and the teen may need to accept these Terms in their own name.

## 5. Not medical advice

[App] provides training plans, logs, and tools for **general fitness**. **It isn’t medical care, a diagnosis, or a treatment plan, and it isn’t a substitute for advice from a doctor or other qualified professional.** Talk to a professional before you start or change a program, especially if you have an injury, a health condition, or are returning to training.

**Stop right away and get medical help if you have chest pain, fainting or dizziness, or trouble breathing. In an emergency, call 911.**

The health screen in [App] is a self-reported check. Your answers and any clearance you confirm are your own statements. We don’t review them medically.

[App] isn’t designed for clinical use. Licensed health care providers may not use it to treat patients or to store patient information.

## 6. ASSUMPTION OF RISK AND RELEASE

**PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS.**

**(a) Risks.** Strength training, conditioning, running, and other exercise can cause injury, including muscle and joint injuries, heart problems, and, rarely, death. You choose to take part, and you control how you train: check that a plan fits you, use equipment safely, and stop if something hurts.

**(b) Assumption of risk.** To the fullest extent the law allows, **you voluntarily assume all risks of injury, illness, or property damage that arise from exercise or other activities you do in connection with the Service**, whether the activity comes from a plan you made, an AI-generated plan, a coach, or any other content in the Service.

**(c) RELEASE, INCLUDING OUR OWN NEGLIGENCE.** TO THE FULLEST EXTENT THE LAW ALLOWS, **YOU RELEASE [COMPANY] AND ITS OWNERS, MEMBERS, MANAGERS, EMPLOYEES, AND CONTRACTORS FROM ALL CLAIMS FOR PERSONAL INJURY, ILLNESS, DEATH, OR PROPERTY DAMAGE ARISING FROM YOUR EXERCISE OR OTHER PHYSICAL ACTIVITY IN CONNECTION WITH THE SERVICE, INCLUDING CLAIMS CAUSED IN WHOLE OR IN PART BY THE NEGLIGENCE OF [COMPANY] OR THOSE PEOPLE**, such as claims that a workout, an AI-generated plan, an exercise swap, an instruction, or a safety screen was wrong or incomplete.

**(d) What this release does not cover.** This release doesn’t cover claims for gross negligence, intentional or willful misconduct, fraud, or anything else the law doesn’t allow to be released. It doesn’t waive any right under the Texas Deceptive Trade Practices Act that can’t be waived, or any privacy right under the law (for example, Tex. Bus. & Com. Code §541.054).

**(e) Users under 18.** If you are 16 or 17, the law may not allow you or your parent to release your own injury claims in advance, and this section does not claim to do so. A parent who links to a teen’s account acknowledges the risks in (a) and agrees to (b) and (c) **only for the parent’s own claims**, to the extent the law allows. The teen’s and the parent’s risk acknowledgements in the app are notices, not waivers of the teen’s rights.

**(f) Coaches.** Coaches are independent and are not covered by this release. This release doesn’t limit any claim you may have against a coach.

> [ATTORNEY: confirm (c) meets the express-negligence and fair-notice tests (Dresser, 853 S.W.2d 505) and §1.201(b)(10) conspicuousness as rendered in-app (bold, all caps, contrasting heading). Confirm scope, the carve-outs in (d), and the parent-only release in (e).]

## 7. AI-generated plans

- If you turn on AI planning, [App] uses an AI provider (Anthropic) to create and adapt plans, as described in our Privacy Policy. AI planning needs health info turned on, and it pauses while your health screen is due for its 12-month update; your saved plan stays but stops adapting.
- **AI plans are made by a computer, not a person. They can be wrong, incomplete, or unsuitable for you.** Every AI plan is labeled "Made with AI." Check that a plan fits you, and stop and see a professional if anything hurts.
- The AI uses an injury category only to avoid or swap exercises. **It doesn’t diagnose, treat, or build rehab plans,** and you shouldn’t rely on it for that.
- For 16–17, AI plans never include weight-loss, calorie, body-size or bulking targets, or supplement suggestions.
- Safety filters may block or change a plan. We don’t promise any particular result, such as strength, weight, or body-composition changes.
- You may not use the AI features to generate content unrelated to your training, or to try to get around safety filters.

## 8. Subscriptions (Pro and Coach Program) through Apple and Google

- **Pro** and the **Coach Program** are sold as auto-renewing subscriptions through Apple’s App Store or Google Play in-app purchase. Prices, free trials and promotions are shown in the app before you buy.
- **Billing, renewal and cancellation** are handled by Apple or Google under their terms. Your subscription renews automatically unless you cancel at least 24 hours before the end of the current period in your App Store or Google Play account settings. Deleting the app doesn’t cancel a subscription.
- **Free trials** convert to a paid subscription at the end of the trial unless you cancel before it ends. Any introductory price renews at the regular price shown at purchase.
- **Refunds** for in-app purchases are handled by Apple or Google under their refund policies. We can’t issue refunds for store purchases ourselves.
- **Price changes** follow Apple’s and Google’s notice and consent rules.
- 16–17 accounts can’t purchase until a parent link is active.
- The free logging features stay available without a subscription.

## 9. Coaching marketplace

- **Coaches are independent.** Coaches on [App] are independent contractors who run their own businesses. They are not our employees, agents, or partners. We don’t control how they coach, set their hours, or direct their methods. We verify certifications only as described in the app ("verified" means what the app says it means), and we don’t guarantee any coach’s skill or results.
- **The coach is the seller.** For 1:1 coaching, **the coach is the seller of record**. You buy coaching from the coach, not from us. Payments are processed by Stripe as charges on the coach’s own Stripe account. Stripe’s terms also apply. We charge coaches a platform fee.
- **Refunds and chargebacks** are the coach’s responsibility. Refunds follow the coach’s offer and the standard client terms shown before you buy [ATTORNEY/OPEN: whether the platform fee is refunded]. For 16–17, the parent is the customer and may cancel any time, with prorated refunds, and receives an immediate refund if a safety report about the coach is upheld.
- **Coaches don’t give medical advice.** They can’t diagnose or treat injuries or conditions, or present themselves as doctors, physical therapists, or dietitians unless licensed.
- **What coaches see** depends on your coach-sharing choices (see the Privacy Policy). Coaches never see a 16–17 user’s health info, and they see an adult’s health answers only if the adult chooses to share them.
- **Stay on [App].** Clients and coaches must keep communication, payment, and live sessions with 16–17 users in [App]. For 16–17, off-platform contact of any kind is prohibited.
- **Coach Terms.** Coaches must also accept our [Coach Terms] and coach attestation, which control if they conflict with these Terms on coach obligations.

## 10. Safety rules for minors

Everyone must follow these rules. Breaking them can lead to immediate removal and a report to authorities.

- No sexual, romantic, or grooming conduct toward anyone under 18, and no requests for photos, personal contact details, or meetings.
- Coach chat with 16–17 users is text only, visible to the parent, filtered, and reviewed by people when flagged. Messages aren’t sent between 10 pm and 7 am. Don’t try to get around these protections.
- Live sessions with 16–17 users happen only in [App], with the parent invited, and are never recorded by anyone.
- We report child sexual abuse material to NCMEC (18 U.S.C. §2258A) and suspected child abuse or neglect to Texas authorities (Tex. Fam. Code ch. 261). Coaches have their own reporting duty under Texas law.
- Use the report and block tools to tell us about anything unsafe. If someone is in immediate danger, call 911.

## 11. Acceptable use

You agree not to:

- break the law, or harass, threaten, impersonate, or harm anyone;
- post content that is sexual, hateful, violent, or promotes self-harm, eating disorders, compensatory exercise, or unsafe weight loss;
- give or ask for medical diagnoses or treatment through the Service;
- post fake reviews, or pay or pressure anyone for reviews;
- upload content you don’t have the right to share, or other people’s personal information without permission;
- scrape, copy, reverse engineer, or overload the Service, or get around rate limits, age checks, or security;
- create accounts with false ages or for someone else (except a parent linking to their teen’s account), or share your account;
- use the Service for any commercial purpose other than coaching through the coaching features;
- use the Service in a way that violates the terms of your device, store, wireless carrier, or other third-party services you use with it.

## 12. Your content

- You keep ownership of what you create in [App] (workouts, notes, messages, reviews, videos, and other content).
- You give us a non-exclusive, royalty-free, worldwide license to host, store, process, display, and transmit your content **only to run and improve the Service for you and to keep it safe**, and as our Privacy Policy describes. We never use your health info, progress photos or messages to train AI or for analytics. For public content you choose to post (such as reviews or a coach profile), the license also covers showing it to other users. The license ends when you delete the content or your account, except for copies we must keep for legal or safety reasons, as the Privacy Policy explains.
- We don’t use your content for advertising, and we don’t sell it.
- You’re responsible for your content and confirm you have the rights to share it.
- Coaches give us the same license for their profiles and coaching content, plus the right to show their public profile in [App].
- Nothing in these Terms limits your right to post an honest review.
- We may remove content or limit features to enforce these Terms or protect users.

## 13. Copyright complaints (DMCA)

If you believe content on [App] infringes your copyright, send a notice under 17 U.S.C. §512(c)(3) to our designated agent:

[DMCA agent name] · [Company] · [mailing address] · [dmca@[domain]] · [phone]

Your notice must include your signature, a description of the work, where the content is in [App], your contact information, a statement of good-faith belief that the use isn’t authorized, and a statement, under penalty of perjury, that your notice is accurate and that you’re the owner or authorized to act for the owner. We may remove the content, notify the user, and accept counter-notices as the law provides. We terminate repeat infringers’ accounts in appropriate cases.

## 14. Our app and license

- We own the Service, including its software, design, and our content. We give you a personal, limited, non-exclusive, non-transferable, revocable license to use the app for your own non-commercial training (and, for coaches, to coach through it), while you follow these Terms.
- **App Store (Apple) users:** the license is limited to Apple-branded products you own or control, as allowed by the Usage Rules in the Apple Media Services Terms and Conditions, except that the app may be used by other accounts linked to the purchaser through Family Sharing or volume purchasing where available.
- We may update, change, or stop features. We’ll give notice of significant changes where we can.

## 15. Apple App Store terms

If you got [App] from Apple’s App Store, you and we both acknowledge and agree that:

1. These Terms are between you and [Company] only, **not with Apple**. [Company], not Apple, is solely responsible for [App] and its content. These Terms don’t provide usage rules that conflict with the Apple Media Services Terms and Conditions.
2. Apple has **no obligation** to provide any maintenance or support for [App]. [Company] is solely responsible for maintenance and support as described in these Terms or as the law requires.
3. If [App] fails to conform to any applicable warranty, you may notify Apple, and Apple will refund the purchase price (if any) for [App] to you. To the maximum extent the law allows, Apple has no other warranty obligation for [App], and any other claims, losses, liabilities, damages, costs or expenses from any failure to conform to a warranty are [Company]’s sole responsibility, to the extent not disclaimed in these Terms.
4. [Company], not Apple, is responsible for addressing any claims by you or a third party relating to [App] or your possession and use of it, including (i) product liability claims, (ii) claims that [App] fails to meet any legal or regulatory requirement, and (iii) claims under consumer protection, privacy, or similar laws, including in connection with [App]’s use of HealthKit.
5. If a third party claims that [App] or your possession and use of it infringes their intellectual property rights, [Company], not Apple, is solely responsible for investigating, defending, settling, and discharging that claim.
6. You represent and warrant that (i) you are not located in a country that is subject to a U.S. Government embargo or that has been designated by the U.S. Government as a "terrorist supporting" country, and (ii) you are not listed on any U.S. Government list of prohibited or restricted parties.
7. You must comply with applicable third-party terms when using [App] (for example, your wireless data service agreement).
8. Questions, complaints, or claims about [App] go to [Company] at the contact details in §21.
9. Apple and Apple’s subsidiaries are **third-party beneficiaries** of these Terms, and when you accept these Terms, Apple will have the right (and will be deemed to have accepted the right) to enforce them against you as a third-party beneficiary.

If you got [App] from Google Play, Google Play’s terms also apply to your download and purchases.

## 16. Disclaimers

TO THE FULLEST EXTENT THE LAW ALLOWS, THE SERVICE IS PROVIDED **"AS IS" AND "AS AVAILABLE."** WE DISCLAIM ALL IMPLIED WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DON’T PROMISE THAT THE SERVICE OR ANY PLAN WILL BE ERROR-FREE, UNINTERRUPTED, OR SUITED TO YOUR HEALTH OR GOALS, OR THAT YOU’LL GET ANY PARTICULAR RESULT. WE’RE NOT RESPONSIBLE FOR WHAT COACHES OR OTHER USERS DO OR SAY. Some states don’t allow these disclaimers, so some may not apply to you.

## 17. Limitation of liability and indemnity

**(a) Limitation.** TO THE FULLEST EXTENT THE LAW ALLOWS, [COMPANY] WON’T BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOST PROFITS OR DATA, AND OUR TOTAL LIABILITY FOR ALL CLAIMS RELATING TO THE SERVICE IS LIMITED TO THE GREATER OF (1) THE AMOUNT YOU PAID US (NOT INCLUDING PAYMENTS TO COACHES) IN THE 12 MONTHS BEFORE THE CLAIM, OR (2) $100.

**(b) Exceptions.** This section doesn’t limit liability for gross negligence, intentional misconduct, fraud, death or personal injury where the law doesn’t allow a limit, or any other liability that can’t be limited by law, and it doesn’t limit any consumer right that can’t be waived.

**(c) Indemnity.** If you’re an adult (or a parent for your own conduct) and you break these Terms or the law, or post content that infringes someone’s rights, you agree to cover our reasonable losses and costs from third-party claims caused by that conduct, to the extent the law allows. Coaches have additional indemnity duties under the [Coach Terms].

> [ATTORNEY: confirm (a)–(c) for Texas consumers, DTPA §17.42, and Apple minimum term 5.]

## 18. Disputes

**(a) Talk to us first.** Before filing a claim, email privacy@[domain] (or support@[domain]) with a description, and give us 30 days to try to resolve it.

**(b) Governing law.** Texas law governs these Terms, without regard to conflict-of-law rules, except where federal law applies or the law of your state of residence gives you protections that can’t be waived.

**(c) Where claims are heard.** [OPEN: Kevin to decide on arbitration (yes/no); ATTORNEY to draft.]

- **Option A, no arbitration:** Claims are brought in the state or federal courts located in [Texas county], Texas, and you and we consent to their jurisdiction, except that you may bring a claim in small-claims court in your county of residence, and the law of your state may let you sue where you live.
- **Option B, arbitration:** [Placeholder only. If chosen: individual binding arbitration with [provider] under its consumer rules; small-claims carve-out; we pay filing fees above a set amount; a 30-day opt-out after you first accept; class-action and jury waiver; mass-arbitration procedures; severability if the class waiver fails; no limit on public injunctive relief where the law requires; notice of changes with the right to reject.]

**(d) Time limit.** [ATTORNEY: whether to include a contractual limitations period. Don’t shorten minors’ limitations periods (Civ. Prac. & Rem. Code §16.001).]

## 19. Ending your account

- **You** can stop using [App] and delete your account any time in Settings. A parent can close a linked teen’s account in Parent Settings. Deleting your account doesn’t cancel an Apple or Google subscription. Cancel that in your store account.
- **We** may suspend or end your account, or remove content, if you break these Terms, create risk for other users (especially minors), or if the law requires it. Where it’s safe and lawful, we’ll tell you why and give you a way to appeal.
- **What happens to your data** is explained in our Privacy Policy, including what we keep for legal and safety reasons.
- Sections 5, 6, 12 (for retained copies), 13, 15, 16, 17, 18, and 21 survive after your account ends.

## 20. Changes to these Terms

We may update these Terms. We’ll post the new version with a new effective date. For **material changes**, we’ll give you notice in the app or by email at least [30] days before they take effect, and ask you to accept them again; for 16–17 accounts, we’ll ask the parent. If you don’t agree, you can stop using the Service and delete your account before the change takes effect. While a re-acceptance is pending, you can still use your privacy settings, download your data, and delete your account. Changes don’t apply to disputes that started before the change. Changes to a privacy consent (health, AI, coach sharing) always need a new opt-in, never just acceptance of new Terms.

## 21. General

- These Terms, the policies they reference, and (for coaches) the [Coach Terms] are the whole agreement about the Service.
- If a part of these Terms can’t be enforced, the rest stays in effect, and that part is enforced as far as the law allows.
- Our failure to enforce a term isn’t a waiver.
- You can’t transfer these Terms without our consent. We may transfer them in a merger, sale, or reorganization, and the Privacy Policy explains what happens to your data then.
- Neither party is responsible for delays caused by events beyond reasonable control.
- Except for Apple as described in §15, there are no third-party beneficiaries.

## 22. Contact

[Company] · [mailing address] · [phone] · privacy@[domain] · [website URL]

Questions, complaints, or claims about [App] go to the contact details above.
