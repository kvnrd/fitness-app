/**
 * DEV ONLY. Prints SQL that assigns the sample program (src/data/mockProgram.ts) to a signed-up
 * user, so the weekly plan / day workout / logging loop can be tried against a real Supabase
 * project before the Coach Studio plan editor writes to the database.
 *
 *   node scripts/dev-assign-plan.ts --client someone@example.com [--coach coach@example.com]
 *
 * Paste the output into the Supabase SQL editor (it runs as the postgres role, bypassing RLS).
 * Without --coach the plan is owned by the client. Re-running replaces that client's sample plan.
 * Never run this against production.
 */
import { mockProgram } from '../src/data/mockProgram.ts';
import { DAY_KEYS } from '../src/data/types.ts';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const client = arg('client');
const coach = arg('coach') ?? client;
if (!client || !/^[^@\s]+@[^@\s]+$/.test(client) || !coach || !/^[^@\s]+@[^@\s]+$/.test(coach)) {
  console.error('usage: node scripts/dev-assign-plan.ts --client <email> [--coach <email>]');
  process.exit(1);
}

const lit = (v: string | null | undefined) => (v === null || v === undefined ? 'null' : `'${v.replace(/'/g, "''")}'`);
const arr = (xs: string[]) => `array[${xs.map(lit).join(',')}]::text[]`;
const PLAN_NAME = `${mockProgram.trainer.programName} (sample)`;

const out: string[] = [];
out.push('do $$');
out.push('declare v_client uuid; v_coach uuid; v_plan uuid; v_day uuid;');
out.push('begin');
out.push(`  select id into v_client from auth.users where lower(email) = lower(${lit(client)});`);
out.push(`  select id into v_coach from auth.users where lower(email) = lower(${lit(coach)});`);
out.push(`  if v_client is null or v_coach is null then raise exception 'sign up both accounts in the app first'; end if;`);
out.push(`  if not exists (select 1 from public.profiles where id = v_client) or not exists (select 1 from public.profiles where id = v_coach) then`);
out.push(`    raise exception 'finish sign-up in the app first (no profile row yet)'; end if;`);
out.push(`  delete from public.plans where client_id = v_client and name = ${lit(PLAN_NAME)};`);
out.push(`  insert into public.plans (owner_id, client_id, name, week_label) values (v_coach, v_client, ${lit(PLAN_NAME)}, ${lit(mockProgram.weekLabel)}) returning id into v_plan;`);
for (const key of DAY_KEYS) {
  const d = mockProgram.days[key];
  out.push(
    `  insert into public.plan_days (plan_id, day_key, title, focus, duration_min, rest, key_points, video_title, video_duration) values ` +
      `(v_plan, ${lit(key)}, ${lit(d.title)}, ${lit(d.focus)}, ${d.durationMin}, ${!!d.rest}, ${arr(d.keyPoints)}, ${lit(d.video?.title)}, ${lit(d.video?.durationLabel)}) returning id into v_day;`,
  );
  d.exercises.forEach((e, i) => {
    out.push(
      `  insert into public.exercises (plan_day_id, name, kind, sets, target, fields, description, rest_seconds, position) values ` +
        `(v_day, ${lit(e.name)}, ${lit(e.kind)}, ${e.sets}, ${lit(e.target)}, ${arr(e.fields)}, ${lit(e.description)}, ${e.restSeconds ?? 'null'}, ${i});`,
    );
  });
}
out.push(`  raise notice 'assigned plan % to %', v_plan, v_client;`);
out.push('end $$;');
console.log(out.join('\n'));
