-- Manual rollback for 0002_complete_exploration_loop.sql.
-- New Day 2–7 evidence must be exported or removed before restoring the old constraints.
-- PostgreSQL enum values are intentionally left in place because removing enum values
-- requires rebuilding the type and is riskier than leaving unused values.

drop trigger if exists explorations_require_evidence_before_progress on public.explorations;
drop function if exists public.enforce_exploration_evidence_progress();
drop index if exists public.evidence_exploration_kind_status_idx;

alter table public.evidence
  drop constraint if exists evidence_kind_check,
  drop constraint if exists evidence_position_check,
  drop constraint if exists evidence_source_check,
  drop constraint if exists evidence_confidence_check,
  drop constraint if exists evidence_status_check;

alter table public.evidence
  add constraint evidence_kind_check check (kind in ('DAY_1_DESIRE_SIGNAL')),
  add constraint evidence_position_check check (position between 1 and 3),
  drop column if exists source,
  drop column if exists confidence,
  drop column if exists status;
