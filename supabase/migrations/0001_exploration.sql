-- Application source of truth. Run this only in the selected Supabase project.
-- The public/anonymous Feishu form is intentionally not connected to these tables.

create extension if not exists pgcrypto;

create type public.exploration_state as enum (
  'UNKNOWN',
  'EXPLORING_DESIRE',
  'DAY_2_READY',
  'DAY_2_ACTIVE'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_anonymous boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.explorations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  state public.exploration_state not null default 'UNKNOWN',
  current_day smallint not null default 1 check (current_day between 1 and 7),
  day_one_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  exploration_id uuid not null references public.explorations(id) on delete cascade,
  kind text not null check (kind in ('DAY_1_DESIRE_SIGNAL')),
  position smallint not null check (position between 1 and 3),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exploration_id, kind, position)
);

create table public.direction_hypotheses (
  id uuid primary key default gen_random_uuid(),
  exploration_id uuid not null references public.explorations(id) on delete cascade,
  source_evidence_position smallint not null check (source_evidence_position between 1 and 3),
  question text not null check (char_length(trim(question)) >= 8),
  smallest_action text not null check (char_length(trim(smallest_action)) >= 8),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'ARCHIVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index evidence_exploration_id_idx on public.evidence(exploration_id);
create index direction_hypotheses_exploration_id_idx on public.direction_hypotheses(exploration_id);

alter table public.profiles enable row level security;
alter table public.explorations enable row level security;
alter table public.evidence enable row level security;
alter table public.direction_hypotheses enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table
  public.profiles,
  public.explorations,
  public.evidence,
  public.direction_hypotheses
to authenticated;

create policy "users manage own profile" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "users manage own exploration" on public.explorations
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "users manage own evidence" on public.evidence
  for all to authenticated
  using (exists (
    select 1 from public.explorations
    where explorations.id = evidence.exploration_id
      and explorations.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.explorations
    where explorations.id = evidence.exploration_id
      and explorations.user_id = (select auth.uid())
  ));

create policy "users manage own direction hypotheses" on public.direction_hypotheses
  for all to authenticated
  using (exists (
    select 1 from public.explorations
    where explorations.id = direction_hypotheses.exploration_id
      and explorations.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.explorations
    where explorations.id = direction_hypotheses.exploration_id
      and explorations.user_id = (select auth.uid())
  ));
