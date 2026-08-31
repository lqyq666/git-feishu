-- Extends the initial slice into a persisted Day 1–7 exploration loop.
-- Apply before deploying the frontend that writes the new evidence kinds.

alter type public.exploration_state add value if not exists 'DAY_3_READY';
alter type public.exploration_state add value if not exists 'DAY_4_READY';
alter type public.exploration_state add value if not exists 'DAY_5_READY';
alter type public.exploration_state add value if not exists 'DAY_6_READY';
alter type public.exploration_state add value if not exists 'DAY_7_READY';
alter type public.exploration_state add value if not exists 'ROUND_COMPLETE';

alter table public.evidence
  drop constraint if exists evidence_kind_check,
  drop constraint if exists evidence_position_check,
  add column if not exists source text not null default 'USER_REPORTED',
  add column if not exists confidence smallint not null default 3,
  add column if not exists status text not null default 'SUBMITTED';

alter table public.evidence
  add constraint evidence_kind_check check (kind in (
    'DAY_1_DESIRE_SIGNAL',
    'DAY_2_REALITY_SCAN',
    'DAY_3_HUMAN_CONTACT',
    'DAY_4_EXPERIMENT_A',
    'DAY_5_REAL_FEEDBACK',
    'DAY_6_EXPERIMENT_B',
    'DAY_7_DECISION'
  )),
  add constraint evidence_position_check check (position between 1 and 15),
  add constraint evidence_source_check check (source in (
    'USER_REPORTED',
    'OFFICIAL',
    'OBSERVED_BEHAVIOR',
    'MODEL_INFERENCE'
  )),
  add constraint evidence_confidence_check check (confidence between 1 and 5),
  add constraint evidence_status_check check (status in ('DRAFT', 'SUBMITTED'));

create index if not exists evidence_exploration_kind_status_idx
  on public.evidence(exploration_id, kind, status);

create or replace function public.enforce_exploration_evidence_progress()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  required_kind text;
  required_count integer := 1;
  submitted_count integer;
begin
  if new.current_day > old.current_day then
    required_kind := case old.current_day
      when 1 then 'DAY_1_DESIRE_SIGNAL'
      when 2 then 'DAY_2_REALITY_SCAN'
      when 3 then 'DAY_3_HUMAN_CONTACT'
      when 4 then 'DAY_4_EXPERIMENT_A'
      when 5 then 'DAY_5_REAL_FEEDBACK'
      when 6 then 'DAY_6_EXPERIMENT_B'
      else null
    end;
    if old.current_day = 1 then required_count := 3; end if;
  elsif old.current_day = 7
    and new.state::text = 'ROUND_COMPLETE'
    and old.state::text <> 'ROUND_COMPLETE' then
    required_kind := 'DAY_7_DECISION';
  end if;

  if required_kind is not null then
    select count(*) into submitted_count
    from public.evidence
    where exploration_id = old.id
      and kind = required_kind
      and status = 'SUBMITTED';

    if submitted_count < required_count then
      raise exception 'Required evidence % is not complete', required_kind;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists explorations_require_evidence_before_progress on public.explorations;
create trigger explorations_require_evidence_before_progress
before update of state, current_day on public.explorations
for each row execute function public.enforce_exploration_evidence_progress();
