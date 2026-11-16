// Output filter (Counsel section 13 / Anthropic Usage Policy): blocks content that promotes eating
// disorders or compensatory exercise, idealizes body weight/shape, shames bodies, or gives medical
// treatment/rehab. For 16-17 also any weight-loss / calorie content. Fails CLOSED: any match rejects
// the whole plan (we never try to "clean" a flagged plan). Only the category is reported, never text.
import { planStrings, type Plan } from './plan.ts';

export type FilterCategory = 'eating_disorder' | 'body_shaming' | 'medical_treatment' | 'minor_weight_loss';
export type FilterResult = { ok: true } | { ok: false; category: FilterCategory };

const RULES: { category: FilterCategory; minorOnly?: boolean; re: RegExp }[] = [
  {
    category: 'eating_disorder',
    re: /\b(purg(e|es|ed|ing)|vomit\w*|laxative\w*|diuretic\w*|diet pills?|starv\w*|fasting|fasted cardio|skip(ping)? (a )?(meals?|breakfast|lunch|dinner)|eat (less|nothing)|burn (off|away) (what|the|that|those|your|any|every)\b[^.]{0,30}\b(ate|food|meals?|calories|snacks?|treats?)|earn (your|a|the) (meal|food|treat|dinner|snack)|work off (the|that|your) (meal|food|dinner|pizza|dessert)|compensat\w*|cheat meals?|thinspo\w*|pro-?ana|pro-?mia|anorexi\w*|bulimi\w*|binge\w*|(very )?low[- ]calorie|calorie (deficit|restriction|cutting)|\d{3,4}\s*(k?cal|calories)\s*(a|per|\/)\s*day)\b/i,
  },
  {
    category: 'body_shaming',
    re: /\b(you('re| are) (too )?(fat|overweight|lazy|skinny|flabby)|fat (belly|arms|thighs|rolls|ass)|flabby|ugly|disgusting|gross (body|fat)|muffin tops?|love handles|thigh gaps?|bikini body|beach body|summer body|thinspiration|ideal (body|weight|shape|figure)|perfect body|get rid of (your |that |the )?(fat|flab|belly)|bingo wings|body goals)\b/i,
  },
  {
    category: 'medical_treatment',
    re: /\b(diagnos\w*|rehab\w*|physical therapy|physiotherapy (protocol|plan)|treatment plan|treat (your|the|this|that) (injury|pain|condition)|cure\w*|heal (your|the|this|that)\b|prescri\w*|medication\w*|ibuprofen|painkillers?|anti-?inflammator\w*|RICE protocol|ice (it|the area))\b/i,
  },
  {
    category: 'minor_weight_loss',
    minorOnly: true,
    re: /\b(calories?|kcal|weight[- ]?loss|lose (weight|fat|pounds|lbs|kilos?)|fat[- ]?(loss|burn\w*)|cutting|deficit|bmi|weigh (yourself|in)|slim(ming)? down|tone up|shred\w*|lean(er)? out)\b/i,
  },
];

export function filterText(text: string, opts: { minor: boolean }): FilterResult {
  for (const r of RULES) {
    if (r.minorOnly && !opts.minor) continue;
    if (r.re.test(text)) return { ok: false, category: r.category };
  }
  return { ok: true };
}

export function filterPlan(plan: Plan, opts: { minor: boolean }): FilterResult {
  for (const s of planStrings(plan)) {
    const r = filterText(s, opts);
    if (!r.ok) return r;
  }
  return { ok: true };
}
