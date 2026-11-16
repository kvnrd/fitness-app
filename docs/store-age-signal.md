# Store age signal: Apple Declared Age Range and Google Play Age Signals

Counsel C1. The app asks the store for an age range, keeps only the bounds, and the server uses the lower of that and the date of birth (`private.derive_age`). Nothing else from the store is read, stored, logged or sent.

## What is built

- `modules/store-age-signal/`: local Expo module, autolinked from `./modules` (no `package.json` change).
  - `ios/StoreAgeSignalModule.swift`: `AgeRangeService.shared.requestAgeRange(ageGates:in:)` with gates 16 and 18, on the main actor, presented from the key window's top view controller. Below iOS 26 it returns `unavailable`.
  - `android/.../StoreAgeSignalModule.kt`: Play Age Signals SDK `com.google.android.play:age-signals:0.0.4` (latest on the Play docs when written). Calls `requestAgeSignalsAccess(activity)`, then `checkAgeSignals()` only if sharing is `SHARED`. `installId` is never read.
  - `plugin/withStoreAgeSignal.js` (via `app.plugin.js`, registered in `app.json`): adds entitlement `com.apple.developer.declared-age-range` and the Gradle dependency (idempotent; the module's own `build.gradle` also declares it).
- `src/age/mapStoreSignal.ts`: pure, tested mapping and validation (`node --test tests/unit/storeAgeSignal.test.ts`).
- `src/age/storeAgeSignal.ts`: `getStoreAgeSignal()` (same API as before), `checkStoreAgeSharingRevoked()`, `onStoreAgeSignalRevoked(listener)`. The module is loaded with `requireOptionalNativeModule`, so web, Expo Go and builds without it return null and the date of birth is used alone.

Native result: `{status: 'sharing'|'declined'|'unavailable'|'verification_required'|'revoked', lower, upper}`. Only `sharing` becomes a signal; every other status means "no signal".

## Revocation

- Android (0.0.4 SDK): the client API has no explicit "revoked" value. Parents revoke app approval in Family Link; Google reports this through the Play Console "Revoked app approvals" tab (list of `installId`, kept 90 days) and the `installId` must not be used for anything else. We never store it, so we cannot match it. The module returns `revoked` only when `significantChangeStatus` is `DECLINED` (closest client-visible signal). Real revocation handling is a Console/process matter for Kevin and Counsel.
- iOS: the module has no revoked state; if sharing is stopped the next request returns `declined`.
- `checkStoreAgeSharingRevoked()` is not wired into any screen yet. Call it at launch for signed-in users. TODO (server): per Counsel, a signal once received is actual knowledge, so a revocation never raises an age; record nothing personal.

Note: `checkStoreAgeSharingRevoked()` calls the same native request, which can show the store's sharing prompt if the user has not decided. Decide with Counsel whether a launch-time call is acceptable before wiring it.

## What Kevin must do

Apple
1. Apple Developer portal: enable the **Declared Age Range** capability on the App ID, then regenerate provisioning (EAS does this on the next build when credentials sync).
2. Build with Xcode 26 / the iOS 26 SDK (EAS image with Xcode 26). The API only exists on iOS 26+.
3. Use a development build (`eas build --profile development --platform ios`); Expo Go cannot load this module. Test on a device signed into an Apple Account with a declared age range.

Google
1. Play Console: open the app's **Age signals** page, complete enrolment, and set custom age ranges (minimum ages 16 and 18, at least 2 years apart, changeable once a year) so the bands match the gates. Complete the related app content declarations.
2. Build a development build (`eas build --profile development --platform android`).
3. Testing: the SDK ships `FakeAgeSignalsManager` (testing artifact) for unit tests. For a live test, sideload a debug build with the exact package name and use an account registered as a **license tester**; otherwise the API returns `APP_NOT_OWNED`.

## Not verified here

No native build exists in this environment. Verified only: TypeScript mapping tests (`npm run test:unit`), `expo export --platform web`, and that `expo prebuild` in a temp copy adds the entitlement and the Gradle dependency. NOT verified: that the Swift and Kotlin compile, the exact Apple signature (`requestAgeRange(ageGates:_:_:in:)` overloads, `Response` cases, `@unknown default`; Apple's docs pages could not be read here), the Kotlin SDK type names and whether `AgeSignalsStatus`/`SignificantChangeStatus` constants compare as `Int` the way the code assumes, the module's Expo Modules API usage (classic `Module()` form; SDK 58's own modules use a v2 form), prompts and results on real devices, and Play Console behaviour.
