# Design direction: Iron & Chalk

**Subject:** a trainer-led strength and conditioning program, sold under the trainer's own name.
**Audience:** people who train 4–6 days a week and follow one coach.
**Main job:** open today's session, watch the coach, and log every set without thinking about the app.

The brief asked for dark, high end and easy to use.

## Palette

| Token | Hex | Role |
| --- | --- | --- |
| Pitch | `#000000` | Base. True black, which reads as premium on OLED phones. |
| Iron | `#16181B` | Raised surfaces: video frame, inputs, sheets. |
| Knurl | `#2B2E33` | Rules and borders. |
| Chalk | `#EEEAE3` | Primary text, the primary button, completed sets. |
| Dust | `#8F8C86` | Secondary text. |
| Oxide | `#C7B08C` | The coach's voice only: their name, video and notes. |

There is no neon accent. Completion is shown as chalk filling the row, the way chalk marks a bar.

## Type

- **Big Shoulders Display** (800/900): an industrial condensed face, like steel-stamped plate numbers. It's used for day names, workout titles and every logged number.
- **Archivo** (400/500/600): a grotesque with real tabular figures. It's used for body copy and controls.
- **Scale:** 12 / 14 / 16 / 20 / 28 / 44 / 76.
- **No all-caps labels and no eyebrows.** Labels are short sentence-case lines in Dust.

## Layout

Everything is left-aligned. Content runs as a ledger on black, separated by hairline rules, rather than a stack of identical cards. Radius follows hierarchy: pill for the one primary action, 6px for media and inputs, 0 for ledger rows.

```
Hybrid Athlete                       (AR)
Week 3 of 8 with Alex Rivera

Thursday            <- 76px stamped
Zone 2 Run
45 min, 1 exercise
[ Start workout ]   <- chalk pill
───────────────────────────────── progress
This week
Mon   Lower Strength        55 min  ●
Tue   Engine Intervals      40 min  ○
```

```
‹  Week 3 of 8
 M   T   W   T   F   S   S     <- underline = selected
Lower Strength (44px)
┌ video, oxide coach line ┐
Coach's notes, ruled list
1  Back Squat          4 × 6 @ RPE 8
   Set  Last    lb    Reps   [✓]
   1    185×6   205    6      ■   <- stamped numerals
```

## Principles

1. **The numbers are the memorable element.** Logged weights and reps are set big in Big Shoulders, like plates on a bar. Everything else stays quiet.
2. **The coach has a voice color.** Oxide marks anything the trainer said, so clients can tell coaching from app UI.
3. **No decoration.** No gradients as ornament, no glows, no arrows on buttons. Motion only responds to a press or completes a set.
