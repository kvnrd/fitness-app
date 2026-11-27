# Phase 7: Form check

Status: **part 1 of 3** (logic and server). No screens and no native code yet.

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

## Parts 2 and 3

2. **Native pose module** (`modules/pose-landmarker`, like `store-age-signal`) wrapping Google's MediaPipe Tasks Vision SDK (Apache-2.0) with a camera view, dropping face points in Swift/Kotlin before they reach JS. Add `expo-dev-client` and the Pose Landmarker model file. This is the switch from Expo Go to dev builds; Kevin builds on his Mac and tests on his iPhone (the Simulator has no camera).
   - Why not a plugin: `react-native-mediapipe-posedetection` needs Vision Camera 4 + worklets-core (Vision Camera is on v5); `expo-mediapipe` has one author, three releases in two days (June 2026) and ships an MCP server as a runtime dependency.
3. **Screens**, after Kevin supplies copy: record a set, live rep count, results, history with stars, share with coach, parent approval, coach view.

Open for part 3: the storage bucket for shared adult videos (and its purge on revoke / account deletion), and on-phone deletion scheduling.
