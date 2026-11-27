-- "Start a new AI plan": the user ends their current AI plan and goes back to the quiz.
-- The plan is marked ended rather than deleted: deleting would cascade to its exercises and erase the
-- user's logged sets. loadAssignedPlan skips ended plans. Coach plans are never touched.

alter table public.plans add column ended_at timestamptz;

create or replace function public.end_ai_plan()
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  update public.plans set ended_at = now()
   where owner_id = v_uid and client_id = v_uid and ai_generated and ended_at is null;
  -- Back to "no accepted plan", so Home and Train offer the quiz again.
  update public.ai_plan_sessions
     set accepted_plan_at = null, first_session_completed_at = null, updated_at = now()
   where user_id = v_uid;
  delete from private.ai_plan_drafts where user_id = v_uid;
  perform private.log_audit(v_uid, 'ai_plan_ended', v_uid, '{}'::jsonb);
end $$;
revoke all on function public.end_ai_plan() from public, anon;
grant execute on function public.end_ai_plan() to authenticated, service_role;
