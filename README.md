# Fitness App

A trainer-led fitness app. Trainers publish a weekly program with walkthrough videos. Clients follow it day by day and log their sets: weight and reps for strength, and time, distance, power (kW) and calories for cardio.

It's built with Expo (React Native + TypeScript), so one codebase runs on iOS, Android and web. Trainers can use the web build to create content.

## Status

This is the MVP interface. All data is local mock data (`src/data/mockProgram.ts`) held in an in-memory store (`src/state/AppStore.tsx`). There is no backend yet.

| Screen | Route |
| --- | --- |
| Train: today's workout and the Mon–Sun week | `src/app/(tabs)/index.tsx` |
| Workout day: video, coach key points, exercise logging | `src/app/workout/[day].tsx` |
| Progress: weekly summary | `src/app/(tabs)/progress.tsx` |
| Coach Studio: build each day, set what clients log | `src/app/(tabs)/studio.tsx` |

## Run it

```bash
npm install
npx expo start        # press i / a / w for iOS, Android, web
npm run typecheck
```

Security notes and setup: [docs/SECURITY.md](docs/SECURITY.md).

## Design

The design direction is "Iron & Chalk": a true-black base, chalk white text, oxide for anything the coach says, and logged numbers set in Big Shoulders Display like stamped plates. The full rationale is in [docs/design.md](docs/design.md), and the tokens are in `src/theme/tokens.ts`.

## Next

- Supabase: auth with trainer and client roles, persisted programs and logs
- Mux video upload in Coach Studio
- Later: tiers, 1:1 DMs, AI coach bot, community, Apple Health / Health Connect / Strava / Garmin sync
