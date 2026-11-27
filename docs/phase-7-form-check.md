# Phase 7: Form check

Status: **parts 1 and 2 of 3** (logic, server, native pose module, dev lab). Product screens wait for approved copy.

## What's in part 1

- `src/formCheck/`: the on-phone analysis, pure TypeScript, unit-tested (`tests/unit/formCheck.test.ts`).
  - `landmarks.ts`: MediaPipe's 33 pose points with the 11 face points (indices 0–10) thrown away. A
    `BodyFrame` has no slot for a face point. Accepts 33 points (drops the face), the native module's
    22 body-only points, or its packed `Float32Array` (22 × x, y, visibility). Any other length throws.
  - `angles.ts`: joint angles (knee, hip, elbow, shoulder, shoulder–hip–ankle line) on the side the camera sees better, and torso lean.
  - `movements.ts`: the five v1 lifts (squat, deadlift, bench press, overhead press, push-up), their thresholds, and a matcher from plan exercise names.
  - `analyzer.ts`: `RepAnalyzer`, a live rep counter (hysteresis band on a smoothed angle, minimum rep time) plus per-rep flags and bar path.
  - `cues.ts`: rule-based extra cues (no LLM; form-check data isn't covered by the AI consent).
  - `features.ts`: live rep count is free; angles, flagged reps, bar path and cues are Pro. Pro arrives with Phase 9; `EXPO_PUBLIC_DEV_FORM_CHECK_PRO=1` previews it in non-production builds.
  - `retention.ts`: adult videos stay on the phone and are deleted after 90 days unless starred (20 stars max). 16–17 videos are deleted right after analysis and can't be starred.
  - `sharing.ts`: what a coach may get, the compact body-only skeleton (~10 fps) and the metrics shape.
- `supabase/migrations/20261127000200_phase7_form_check.sql` + `supabase/tests/phase7.sql` (39 assertions):
  - `form_checks` (numbers + body-only skeleton, no video, no free text), written only through `save_form_check`, which needs the effective health opt-in.
  - `form_check_shares`: only with the user's own active verified coach. Adults may include video. 16–17: never video (trigger, even for the service role), and the coach sees nothing until the parent approves. Owner or parent can revoke; ending coaching or withdrawing coach_sharing hides it at once.
  - Coach review notes: adults only until the Phase 8 minor chat safeguards exist.

Codes (flags, cues) have no product copy yet. **Counsel has no form-check string table**, so screens wait for Kevin's copy.

## Flags and cues

| Flag | Lifts | Rule |
|---|---|---|
| `depth_short` | squat, bench, push-up | Squat: hip above knee at the bottom. Others: bottom elbow angle above the limit. |
| `torso_lean` | squat | More than 55° from vertical at the bottom. |
| `lockout_incomplete` | deadlift, bench, OHP | Top angle below the lockout limit. |
| `bar_drift` | squat, deadlift | Wrist travel sideways over 25% of torso length. |
| `hip_sag` | push-up | Shoulder–hip–ankle line under 155°. |
| `low_confidence` | all | Primary joint missing on over 30% of a rep's frames. |

A cue shows when its flag is on at least a third of the reps and at least 2 reps (1 for sets of 1–2). Two cues max. A camera-angle cue replaces technique cues when tracking was poor. Thresholds are first guesses and need tuning on real sets.

## Part 2: native pose module (`modules/pose-landmarker`)

Kevin picked "our own small native module" (Nov 27, 2026). Neither community plugin works on SDK 58: `react-native-mediapipe-posedetection` needs Vision Camera 4 + worklets-core (Vision Camera is on v5); `expo-mediapipe` has one author, three releases in two days (June 2026) and ships an MCP server as a runtime dependency.

- Local Expo module, like `store-age-signal`. One native view, `PoseCameraView` (props `active`, `facing`; events `onPose`, `onNoPose`, `onTrackingError`), plus `getCameraPermission` / `requestCameraPermission`.
- Google MediaPipe Tasks Vision (Apache-2.0): iOS pod `MediaPipeTasksVision` 1.0.1 (the last CocoaPods release; Google now ships 1.2.x through Swift Package Manager, move when proven with Expo), Android `com.google.mediapipe:tasks-vision` 1.2.2 with CameraX 1.5.3 (versions from google-ai-edge/mediapipe-samples).
- Model: `ios/models/pose_landmarker_lite.task` (5,777,746 bytes, sha256 `59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a`, from Google's `mediapipe-models` bucket). One copy, bundled on iOS by the podspec and on Android via `assets.srcDirs`.
- **Face points never leave native code**: only indices 11–32 are packed into the event (22 × x, y, visibility). The JS side (`LiveSession`) refuses any other length.
- Frames are analyzed in memory at ~15 fps and dropped. Nothing is recorded, written to disk or uploaded in part 2.
- Expo Go and web: the module is optional (`requireOptionalNativeModule`), so the app still runs there without form check. `npm run start:go` still opens Expo Go now that `expo-dev-client` is installed.
- iOS camera purpose string: the plugin sets a **DRAFT** `NSCameraUsageDescription` (starts with "DRAFT:"). Kevin must approve the real text before any store build; pass it as the plugin's `cameraPermission` option in `app.json`.
- Not compiled in the cloud (no Xcode or Android SDK). Autolinking finds the module on both platforms (`expo-modules-autolinking resolve`) and the config plugin applies (`expo config --type introspect`).

### Dev lab (`/dev-form-check`)

A developer-only camera screen to test tracking and rep counting before the product screens exist: live skeleton, rep count, movement and camera pickers, and per-rep angles, flags and cues after the set (with `EXPO_PUBLIC_DEV_FORM_CHECK_PRO=1`). Labels are developer labels, not product copy. It's on only with `EXPO_PUBLIC_FORM_CHECK_LAB=1` and never when `EXPO_PUBLIC_ENV=production`; only then is `fitnessapp://dev-form-check` allowed as a deep link.

### Build on Kevin's iPhone (free Apple ID)

1. On the Mac: `cd ~/Projects/fitness-app && git fetch origin && git checkout claude/project-thread-j623rd && git pull && npm ci`.
2. iPhone: plug in by cable, tap Trust, then Settings › Privacy & Security › Developer Mode › On (the phone restarts).
3. `npx expo prebuild --platform ios` (makes the `ios/` folder and installs pods; it may ask for a bundle identifier: use something unique like `com.kvnrd.fitnessapp`).
4. `open ios/*.xcworkspace`. In Xcode, select the app target › Signing & Capabilities: pick your Personal Team. A free team can't use **Sign in with Apple** or **Declared Age Range**, so delete those two capabilities here (only in this local build; sign in with the email code instead).
5. `EXPO_PUBLIC_FORM_CHECK_LAB=1 EXPO_PUBLIC_DEV_FORM_CHECK_PRO=1 npx expo run:ios --device` and pick the iPhone.
6. First launch only: iPhone Settings › General › VPN & Device Management › trust your developer profile.
7. In Safari on the iPhone, open `fitnessapp://dev-form-check`. Allow the camera, prop the phone side-on, and do a set.

A free-team install stops opening after 7 days; rerun step 5. Check: reps counted vs. real reps, false reps when standing still, and phone heat and battery after ~10 minutes.

## Part 3

**Screens**, after Kevin supplies copy: record a set, live rep count, results, history with stars, share with coach, parent approval, coach view. Also the saved-video recording path (adults only), the storage bucket for shared adult videos and its purge on revoke or account deletion, and on-phone deletion scheduling.
