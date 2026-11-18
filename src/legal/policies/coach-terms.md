# [App] Coach Terms

**Version:** [v0.1 DRAFT] · **Effective date:** [Effective date] · **Last updated:** Nov 17, 2026 (draft)

---

> ## Drafting notes for Engineer and attorney (delete this block before publishing)
>
> **Changelog**
> - **v0.1 (Nov 17, 2026, Counsel):** first draft. Built from `phase5-review.md` › Phase 5b (6) and rev 2 (e), and `phase6-review.md` (§2, §3, §4, §5, §6.1, Change requests 1–3) with Kevin’s Phase 6 decisions (Nov 17): day-31 pause and day-45 suspension; 3 upheld copyright notices in 12 months closes the account; document-only Stripe identity check (no selfie); [Company] reviews every application; the parent sees only "Coaching ended" after a teen blocks or reports a coach.
>
> **[ATTORNEY] Every section needs review by a licensed Texas attorney before launch.** In particular:
> - whether coaches are third parties (as our policies say) or processors. If they’re processors, add the Tex. Bus. & Com. Code §541.104(b) contract terms (`phase6-review.md` §3);
> - the independent-contractor framing;
> - the enforcement ladder;
> - the repeat-infringer rule;
> - the reporting-duty summary (Tex. Fam. Code §§261.101, 261.103, 261.109);
> - NSOPW use under DOJ’s and each jurisdiction’s conditions of use;
> - whether the training and registry search create any added duty of care.
>
> **Build hooks for Engineer:**
> - Bundle and hash like the Terms (strip this block, SHA-256 of the published text, expose `{version, hash}`).
> - Log acceptance as a `consent_events` row of type `coach_terms` (actor `coach`).
> - The coach attestation line: "I’ll delete a client’s data within 30 days after coaching ends, and confirm each item in [App]."
> - Placeholders: [App]; [Company]; [DMCA agent details]; [Effective date].

These Coach Terms apply to you if you coach on [App]. They add to our [Terms of Service](/terms-of-service), and they control if the two conflict on a coach’s duties. Words like "client data" mean any information about a client that you get through [App], including what the client shares with you, messages, plans you wrote for them, notes and files.

## 1. Applying and approval

- You must be 18 or older and pass Stripe’s identity check. The check is document-only, with no selfie. We receive only the method and a result ID, never your ID images.
- **[Company] reviews every application.** We check the certification you submit with the issuer’s lookup tool. "Verified" means only that. It isn’t a medical or dietetics license or a background check.
- You’re an independent contractor, not our employee, agent or partner. You set your methods and hours. [ATTORNEY]

## 2. Deleting client data

- **The duty.** Within 30 days after coaching with a client ends for any reason, you must delete all of that client’s data you received through [App], and keep no copies outside [App]. That includes progress photos, weigh-ins, other health information, messages, notes and files. Coaching can end because the client ends it, you end it, either of you blocks the other, the parent cancels, or we remove you.
- **Legal records.** The only exception is records the law requires you to keep, such as payment and tax records as seller of record. Keep only what the law requires, keep it secure, and use it for no other purpose.
- **A deletion request ends coaching.** If a client asks you to delete their data, coaching ends right away and the same 30 days start that day. Your access in [App] ends right away.
- **Turning off sharing counts as a request.** If a client turns off coach sharing, or photo sharing, that counts as a request to delete what they had shared. Your access to it ends right away, and you must delete any copies within 30 days.
- **Itemized confirmation.** By the due date shown in [App], you must confirm deletion item by item, marking each one "Deleted" or "None":
  1. progress photos;
  2. weigh-ins and health info;
  3. messages;
  4. notes and files;
  5. downloads and screenshots;
  6. copies in other apps or tools;
  7. records the law requires you to keep.

  You must then confirm that you kept no other copies. We log your answers, the date and the version of this text.
- **If you find a copy later,** delete it right away.
- **Data loss.** Tell us right away if any client data is lost, stolen or seen by someone who shouldn’t have it.
- **Audits.** We may ask you to show that you followed this section, and you must cooperate. On our request, you’ll confirm in writing that you’ve deleted the data. [ATTORNEY]

## 3. What happens if you don’t confirm

- **7 days before the due date:** we remind you.
- **Day 31, with no confirmation:** your deletion is overdue. You can’t add new clients until you confirm, and our trust and safety team is told.
- **Day 45, with no confirmation:** your coach account is suspended. Your existing clients are told that coaching has ended, and this section still applies to you.

We may act sooner for serious or repeated problems. [ATTORNEY]

## 4. Coaching 16–17 year olds

- This is a separate approval. To get it, you must finish [App]’s Texas abuse-reporting training.
- **Registry search.** [Company] searches the national sex offender public registry (NSOPW) before approval, at least once a year after that, and after a name change. We search with your identity-verified legal name and date of birth.
  - A name match alone never leads to a denial. A person reviews it, and you get a neutral notice and a chance to show the match isn’t you before we decide.
  - We don’t show search details in the app.
  - We don’t run criminal background checks.
- **If a search lapses,** you can’t add new 16–17 clients until it’s done.
- **What you never see.** You never see a 16–17 client’s body weight or other health info, and they have no progress photos.
- **Stay on [App].** All contact, payment and live sessions with 16–17 clients stay in [App].
- **Blocking and reporting.** A 16–17 client can block or report you without a parent’s approval, and it takes effect right away. Coaching ends, the client’s parent sees only "Coaching ended," and the 30 days in §2 start. [ATTORNEY]

## 5. Reporting suspected abuse

- **Your duty under Texas law.** If you believe a child’s physical or mental health or welfare has been harmed by abuse or neglect, you must report it right away (Tex. Fam. Code §261.101(a)).
- **Professionals.** If you’re a "professional" under §261.101(b), you must report within 24 hours and can’t hand the report to someone else. That means a person licensed or certified by the state, such as a teacher or nurse, whose duties under that license involve direct contact with children.
- **Where to report:** the Texas Abuse Hotline at 1-800-252-5400 (24/7), or online at txabusehotline.org. If someone is in immediate danger, call 911. If the person you suspect is responsible for the child’s care, report to DFPS (§261.103).
- **No anonymous reports.** DFPS doesn’t accept anonymous child-abuse reports. You must give your name and phone number, and DFPS keeps them confidential.
- **Telling [App] isn’t enough.** You can also tell [App], but that doesn’t replace your report to DFPS or the police. Knowingly failing to report is a crime (§261.109).

This section is general information, not legal advice. [ATTORNEY]

## 6. Your content and copyright

- Upload only video you made or have the rights to use. Only you should be in the shot, with no minors in the frame.
- **Repeat infringers.** Three upheld copyright notices against your account within 12 months closes your account (17 U.S.C. §512(i)(1)(A)). You can send a counter-notice as described in the Terms of Service. [ATTORNEY]

## 7. Ending

- You can stop coaching any time.
- We may pause or end your coach account for breaking these Coach Terms or the Terms of Service.
- §2, §5 and this section continue after your account ends.
