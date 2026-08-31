-- Manual rollback for 0001_exploration.sql.
-- This deletes all application-layer exploration data. Review and run only during a deliberate rollback.

drop table if exists public.direction_hypotheses;
drop table if exists public.evidence;
drop table if exists public.explorations;
drop table if exists public.profiles;
drop type if exists public.exploration_state;
