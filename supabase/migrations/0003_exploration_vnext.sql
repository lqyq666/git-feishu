-- Exploration Web vNext: additive, backward-compatible product domains.
-- Existing explorations/evidence are preserved. No destructive data migration.

alter table public.explorations
  add column if not exists status text not null default 'ACTIVE',
  add column if not exists current_stage smallint not null default 1,
  add column if not exists version integer not null default 2,
  add column if not exists started_at timestamptz not null default now(),
  add column if not exists completed_at timestamptz,
  add column if not exists is_test boolean not null default false;

update public.explorations
set current_stage = current_day,
    status = case when state::text = 'ROUND_COMPLETE' then 'COMPLETED' else 'ACTIVE' end,
    completed_at = case when state::text = 'ROUND_COMPLETE' then coalesce(completed_at, updated_at) else completed_at end
where current_stage <> current_day
   or (state::text = 'ROUND_COMPLETE' and status <> 'COMPLETED');

alter table public.explorations
  drop constraint if exists explorations_status_check,
  add constraint explorations_status_check check (status in ('ACTIVE', 'COMPLETED', 'ARCHIVED')),
  drop constraint if exists explorations_current_stage_check,
  add constraint explorations_current_stage_check check (current_stage between 1 and 7);

create table if not exists public.desire_signals (
  id uuid primary key default gen_random_uuid(),
  exploration_id uuid not null references public.explorations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  position smallint not null check (position between 1 and 3),
  signal_type text not null check (signal_type in ('ENVY', 'CURIOSITY', 'DISSATISFACTION', 'LEGACY')),
  source_label text not null default '',
  attraction text not null default '',
  willing_cost text not null default '',
  quick_chips jsonb not null default '[]'::jsonb check (jsonb_typeof(quick_chips) = 'array'),
  status text not null default 'DRAFT' check (status in ('DRAFT', 'SUBMITTED')),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exploration_id, position)
);

create table if not exists public.exploration_tasks (
  id uuid primary key default gen_random_uuid(),
  exploration_id uuid not null references public.explorations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  task_number smallint not null check (task_number between 1 and 7),
  status text not null default 'NOT_STARTED' check (status in ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
  draft_data jsonb not null default '{}'::jsonb check (jsonb_typeof(draft_data) = 'object'),
  submitted_data jsonb check (submitted_data is null or jsonb_typeof(submitted_data) = 'object'),
  revision integer not null default 1 check (revision > 0),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exploration_id, task_number)
);

create table if not exists public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  exploration_id uuid not null references public.explorations(id) on delete cascade,
  task_id uuid references public.exploration_tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  evidence_type text not null check (evidence_type in ('TEXT','IMAGE','LINK','FILE','OUTREACH_SENT','REPLY','EXPERIMENT_OUTPUT','FEEDBACK')),
  content text,
  storage_path text,
  external_url text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  is_test boolean not null default false,
  created_at timestamptz not null default now(),
  check (nullif(trim(content), '') is not null or storage_path is not null or external_url is not null)
);

create table if not exists public.commitments (
  id uuid primary key default gen_random_uuid(),
  exploration_id uuid not null references public.explorations(id) on delete cascade,
  task_id uuid references public.exploration_tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null default 'PRIVATE' check (mode in ('PRIVATE','WITNESS','PUBLIC')),
  status text not null default 'DRAFT' check (status in ('DRAFT','LOCKED','ACTIVE','EVIDENCE_SUBMITTED','COMPLETED','NOT_COMPLETED','RECOVERY_ACTIVE','CLOSED')),
  action_statement text not null default '',
  starts_at timestamptz,
  due_at timestamptz,
  timezone text not null default 'Asia/Shanghai',
  grace_minutes integer not null default 60 check (grace_minutes between 0 and 10080),
  success_rule text not null default '',
  evidence_requirement text not null default '',
  reward_text text not null default '',
  recovery_action text not null default '',
  witness_label text,
  locked_at timestamptz,
  outcome_at timestamptz,
  supersedes_id uuid references public.commitments(id),
  replacement_reason text,
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_key text not null,
  access_level text not null check (access_level in ('FREE','FULL_EXPLORATION')),
  source text not null check (source in ('payment','manual','promo','migration','test')),
  source_reference text,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_key, source, source_reference)
);

create table if not exists public.payment_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_key text not null,
  provider text not null,
  provider_order_id text not null,
  provider_event_id text,
  amount_minor integer not null check (amount_minor >= 0),
  currency text not null default 'CNY',
  status text not null check (status in ('PENDING','PAID','FAILED','REFUNDED','CANCELLED')),
  checkout_url text,
  is_test boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  unique (provider, provider_order_id),
  unique (provider, provider_event_id)
);

create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  exploration_id uuid references public.explorations(id) on delete cascade,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb check (jsonb_typeof(properties) = 'object'),
  is_test boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists desire_signals_user_idx on public.desire_signals(user_id, exploration_id);
create index if not exists exploration_tasks_user_idx on public.exploration_tasks(user_id, exploration_id, task_number);
create index if not exists evidence_items_exploration_idx on public.evidence_items(exploration_id, evidence_type);
create index if not exists commitments_user_status_idx on public.commitments(user_id, status);
create index if not exists entitlements_active_idx on public.entitlements(user_id, product_key, access_level) where revoked_at is null;
create index if not exists product_events_exploration_idx on public.product_events(exploration_id, created_at);

-- Preserve existing progress. Existing users past Task 1 retain full access.
insert into public.entitlements (user_id, product_key, access_level, source, source_reference)
select user_id, 'exploration_full_v1', 'FULL_EXPLORATION', 'migration', id::text
from public.explorations
where current_day > 1 or state::text = 'ROUND_COMPLETE'
on conflict do nothing;

insert into public.desire_signals (
  exploration_id, user_id, position, signal_type, source_label, attraction,
  willing_cost, status, revision, created_at, updated_at
)
select e.exploration_id, x.user_id, e.position, 'LEGACY',
       coalesce(e.content->>'admiredPerson',''), coalesce(e.content->>'admiredQuality',''),
       coalesce(e.content->>'acceptedCost',''), e.status, 1, e.created_at, e.updated_at
from public.evidence e
join public.explorations x on x.id=e.exploration_id
where e.kind='DAY_1_DESIRE_SIGNAL'
on conflict (exploration_id, position) do nothing;

insert into public.exploration_tasks (exploration_id, user_id, task_number, status, draft_data, submitted_data, started_at, completed_at)
select x.id, x.user_id, n,
       case when x.current_day > n or x.state::text='ROUND_COMPLETE' then 'COMPLETED'
            when x.current_day=n then 'IN_PROGRESS' else 'NOT_STARTED' end,
       coalesce(ev.content, '{}'::jsonb),
       case when ev.status='SUBMITTED' then ev.content else null end,
       case when x.current_day >= n then x.created_at else null end,
       case when x.current_day > n or x.state::text='ROUND_COMPLETE' then coalesce(ev.updated_at,x.updated_at) else null end
from public.explorations x cross join generate_series(1,7) n
left join public.evidence ev on ev.exploration_id=x.id and ev.position=1 and ev.kind=case n
  when 1 then 'DAY_1_DESIRE_SIGNAL' when 2 then 'DAY_2_REALITY_SCAN'
  when 3 then 'DAY_3_HUMAN_CONTACT' when 4 then 'DAY_4_EXPERIMENT_A'
  when 5 then 'DAY_5_REAL_FEEDBACK' when 6 then 'DAY_6_EXPERIMENT_B'
  when 7 then 'DAY_7_DECISION' end
on conflict (exploration_id, task_number) do nothing;

create or replace function public.owner_of_exploration(target uuid)
returns boolean language sql stable security invoker set search_path=public
as $$ select exists(select 1 from public.explorations where id=target and user_id=auth.uid()) $$;

create or replace function public.has_full_exploration_entitlement(target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public
as $$
  select exists(
    select 1 from public.entitlements
    where user_id=target_user and product_key='exploration_full_v1'
      and access_level='FULL_EXPLORATION' and revoked_at is null
      and starts_at <= now() and (expires_at is null or expires_at > now())
  )
$$;

create or replace function public.sync_owned_user_id()
returns trigger language plpgsql security invoker set search_path=public as $$
declare owner_id uuid;
begin
  select user_id into owner_id from public.explorations where id=new.exploration_id;
  if owner_id is null or owner_id <> auth.uid() then raise exception 'Exploration is not owned by current user'; end if;
  new.user_id := owner_id;
  return new;
end $$;

create or replace function public.enforce_locked_commitment()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
  if old.locked_at is not null and (
    new.action_statement is distinct from old.action_statement or new.starts_at is distinct from old.starts_at or
    new.due_at is distinct from old.due_at or new.timezone is distinct from old.timezone or
    new.success_rule is distinct from old.success_rule or new.evidence_requirement is distinct from old.evidence_requirement or
    new.reward_text is distinct from old.reward_text or new.recovery_action is distinct from old.recovery_action or
    new.mode is distinct from old.mode
  ) then raise exception 'Locked commitment rules cannot be edited; create a replacement instead'; end if;
  if new.status in ('LOCKED','ACTIVE') and old.locked_at is null then new.locked_at := now(); end if;
  new.updated_at := now(); new.revision := old.revision + 1;
  return new;
end $$;

create or replace function public.prepare_commitment()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
  if new.status in ('LOCKED','ACTIVE') then
    if length(trim(new.action_statement)) < 8 or new.starts_at is null or new.due_at is null or new.due_at <= new.starts_at or length(trim(new.success_rule)) < 4 or length(trim(new.evidence_requirement)) < 2 or length(trim(new.recovery_action)) < 4 then raise exception 'INCOMPLETE_COMMITMENT_RULES'; end if;
    new.locked_at := coalesce(new.locked_at,now());
  end if;
  return new;
end $$;

create or replace function public.protect_submitted_signal()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
  if new.revision < old.revision then raise exception 'STALE_SIGNAL_REVISION'; end if;
  if old.status='SUBMITTED' and (new.status <> 'SUBMITTED' or new.signal_type is distinct from old.signal_type or new.source_label is distinct from old.source_label or new.attraction is distinct from old.attraction or new.willing_cost is distinct from old.willing_cost or new.quick_chips is distinct from old.quick_chips) then raise exception 'SUBMITTED_SIGNAL_IS_IMMUTABLE'; end if;
  return new;
end $$;

create or replace function public.protect_completed_task()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
  if old.status='COMPLETED' and (new.status is distinct from old.status or new.submitted_data is distinct from old.submitted_data) then raise exception 'COMPLETED_TASK_IS_IMMUTABLE'; end if;
  return new;
end $$;

drop trigger if exists desire_signals_sync_owner on public.desire_signals;
create trigger desire_signals_sync_owner before insert or update on public.desire_signals for each row execute function public.sync_owned_user_id();
drop trigger if exists desire_signals_protect_submitted on public.desire_signals;
create trigger desire_signals_protect_submitted before update on public.desire_signals for each row execute function public.protect_submitted_signal();
drop trigger if exists exploration_tasks_sync_owner on public.exploration_tasks;
create trigger exploration_tasks_sync_owner before insert or update on public.exploration_tasks for each row execute function public.sync_owned_user_id();
drop trigger if exists exploration_tasks_protect_completed on public.exploration_tasks;
create trigger exploration_tasks_protect_completed before update on public.exploration_tasks for each row execute function public.protect_completed_task();
drop trigger if exists evidence_items_sync_owner on public.evidence_items;
create trigger evidence_items_sync_owner before insert or update on public.evidence_items for each row execute function public.sync_owned_user_id();
drop trigger if exists commitments_sync_owner on public.commitments;
create trigger commitments_sync_owner before insert or update on public.commitments for each row execute function public.sync_owned_user_id();
drop trigger if exists commitments_prepare on public.commitments;
create trigger commitments_prepare before insert on public.commitments for each row execute function public.prepare_commitment();
drop trigger if exists commitments_lock_rules on public.commitments;
create trigger commitments_lock_rules before update on public.commitments for each row execute function public.enforce_locked_commitment();

create or replace function public.save_exploration_task_draft(target_exploration uuid, target_task smallint, payload jsonb, client_revision integer)
returns public.exploration_tasks language plpgsql security definer set search_path=public as $$
declare result public.exploration_tasks;
begin
  if not public.owner_of_exploration(target_exploration) then raise exception 'Not authorized'; end if;
  if target_task > 1 and not public.has_full_exploration_entitlement(auth.uid()) then raise exception 'FULL_EXPLORATION_REQUIRED'; end if;
  insert into public.exploration_tasks(exploration_id,user_id,task_number,status,draft_data,revision,started_at,updated_at)
  values(target_exploration,auth.uid(),target_task,'IN_PROGRESS',payload,greatest(client_revision,1),now(),now())
  on conflict(exploration_id,task_number) do update set
    draft_data=case when excluded.revision >= exploration_tasks.revision and exploration_tasks.status <> 'COMPLETED' then excluded.draft_data else exploration_tasks.draft_data end,
    revision=case when excluded.revision >= exploration_tasks.revision and exploration_tasks.status <> 'COMPLETED' then excluded.revision else exploration_tasks.revision end,
    status=case when exploration_tasks.status='NOT_STARTED' then 'IN_PROGRESS' else exploration_tasks.status end,
    started_at=coalesce(exploration_tasks.started_at,now()), updated_at=now()
  returning * into result;
  return result;
end $$;

create or replace function public.submit_desire_map(target_exploration uuid, signals jsonb)
returns public.exploration_tasks language plpgsql security definer set search_path=public as $$
declare item jsonb; item_position smallint; result public.exploration_tasks;
begin
  if not public.owner_of_exploration(target_exploration) then raise exception 'Not authorized'; end if;
  if jsonb_typeof(signals) <> 'array' or jsonb_array_length(signals) <> 3 then raise exception 'THREE_SIGNALS_REQUIRED'; end if;
  for item in select * from jsonb_array_elements(signals) loop
    item_position := (item->>'position')::smallint;
    if item_position not between 1 and 3 or length(trim(coalesce(item->>'source',''))) < 2 or length(trim(coalesce(item->>'attraction',''))) < 2 or length(trim(coalesce(item->>'willingCost',''))) < 2 then raise exception 'INCOMPLETE_SIGNAL'; end if;
    insert into public.desire_signals(exploration_id,user_id,position,signal_type,source_label,attraction,willing_cost,quick_chips,status,revision,updated_at)
    values(target_exploration,auth.uid(),item_position,item->>'type',item->>'source',item->>'attraction',item->>'willingCost',coalesce(item->'quickChips','[]'::jsonb),'SUBMITTED',greatest(coalesce((item->>'revision')::integer,1),1),now())
    on conflict(exploration_id,position) do update set signal_type=excluded.signal_type,source_label=excluded.source_label,attraction=excluded.attraction,willing_cost=excluded.willing_cost,quick_chips=excluded.quick_chips,status='SUBMITTED',revision=greatest(desire_signals.revision+1,excluded.revision),updated_at=now();
    insert into public.evidence(exploration_id,kind,position,content,source,confidence,status,updated_at)
    values(target_exploration,'DAY_1_DESIRE_SIGNAL',item_position,jsonb_build_object('admiredPerson',item->>'source','admiredQuality',item->>'attraction','acceptedCost',item->>'willingCost'),'USER_REPORTED',3,'SUBMITTED',now())
    on conflict(exploration_id,kind,position) do update set content=excluded.content,status='SUBMITTED',updated_at=now();
  end loop;
  insert into public.exploration_tasks(exploration_id,user_id,task_number,status,draft_data,submitted_data,revision,started_at,completed_at,updated_at)
  values(target_exploration,auth.uid(),1,'COMPLETED',jsonb_build_object('signals',signals),jsonb_build_object('signals',signals),1,now(),now(),now())
  on conflict(exploration_id,task_number) do update set status='COMPLETED',draft_data=excluded.draft_data,submitted_data=excluded.submitted_data,revision=exploration_tasks.revision+1,completed_at=coalesce(exploration_tasks.completed_at,now()),updated_at=now()
  returning * into result;
  update public.explorations set current_stage=2,current_day=2,state='DAY_2_READY',day_one_completed_at=coalesce(day_one_completed_at,now()),updated_at=now() where id=target_exploration;
  return result;
end $$;

create or replace function public.submit_exploration_task(target_exploration uuid, target_task smallint, payload jsonb, evidence_payload jsonb default '[]'::jsonb)
returns public.exploration_tasks language plpgsql security definer set search_path=public as $$
declare current_stage_value smallint; result public.exploration_tasks; item jsonb; task_uuid uuid; direction_a text; direction_b text; legacy_kind text;
begin
  if not public.owner_of_exploration(target_exploration) then raise exception 'Not authorized'; end if;
  if target_task > 1 and not public.has_full_exploration_entitlement(auth.uid()) then raise exception 'FULL_EXPLORATION_REQUIRED'; end if;
  select current_stage into current_stage_value from public.explorations where id=target_exploration for update;
  if current_stage_value <> target_task then
    select * into result from public.exploration_tasks where exploration_id=target_exploration and task_number=target_task and status='COMPLETED';
    if found then return result; end if;
    raise exception 'TASK_ORDER_VIOLATION';
  end if;
  if jsonb_typeof(payload) <> 'object' then raise exception 'INVALID_TASK_PAYLOAD'; end if;
  if target_task=3 and coalesce(payload->>'outreachSent','') <> 'YES' then raise exception 'OUTREACH_EVIDENCE_REQUIRED'; end if;
  if target_task=4 and length(trim(coalesce(payload->>'artifact',''))) < 4 then raise exception 'EXPERIMENT_OUTPUT_REQUIRED'; end if;
  if target_task=5 and coalesce(payload->>'feedbackRequested','') <> 'YES' then raise exception 'FEEDBACK_REQUEST_REQUIRED'; end if;
  if target_task=6 then
    select submitted_data->>'direction' into direction_a from public.exploration_tasks where exploration_id=target_exploration and task_number=4;
    direction_b := payload->>'direction';
    if lower(regexp_replace(coalesce(direction_a,''),'\\s','','g')) = lower(regexp_replace(coalesce(direction_b,''),'\\s','','g')) then raise exception 'DIFFERENT_DIRECTION_REQUIRED'; end if;
  end if;
  insert into public.exploration_tasks(exploration_id,user_id,task_number,status,draft_data,submitted_data,revision,started_at,completed_at,updated_at)
  values(target_exploration,auth.uid(),target_task,'COMPLETED',payload,payload,1,now(),now(),now())
  on conflict(exploration_id,task_number) do update set status='COMPLETED',draft_data=excluded.draft_data,submitted_data=excluded.submitted_data,
    revision=exploration_tasks.revision+1,started_at=coalesce(exploration_tasks.started_at,now()),completed_at=coalesce(exploration_tasks.completed_at,now()),updated_at=now()
  returning * into result;
  task_uuid := result.id;
  if jsonb_typeof(evidence_payload)='array' then
    for item in select * from jsonb_array_elements(evidence_payload) loop
      insert into public.evidence_items(exploration_id,task_id,user_id,evidence_type,content,external_url,metadata,is_test)
      values(target_exploration,task_uuid,auth.uid(),item->>'evidence_type',nullif(item->>'content',''),nullif(item->>'external_url',''),coalesce(item->'metadata','{}'::jsonb),(select is_test from public.explorations where id=target_exploration));
    end loop;
  end if;
  legacy_kind := case target_task when 2 then 'DAY_2_REALITY_SCAN' when 3 then 'DAY_3_HUMAN_CONTACT' when 4 then 'DAY_4_EXPERIMENT_A' when 5 then 'DAY_5_REAL_FEEDBACK' when 6 then 'DAY_6_EXPERIMENT_B' when 7 then 'DAY_7_DECISION' end;
  insert into public.evidence(exploration_id,kind,position,content,source,confidence,status,updated_at)
  values(target_exploration,legacy_kind,1,payload,'USER_REPORTED',3,'SUBMITTED',now())
  on conflict(exploration_id,kind,position) do update set content=excluded.content,status='SUBMITTED',updated_at=now();
  update public.explorations set current_stage=least(target_task+1,7), current_day=least(target_task+1,7),
    status=case when target_task=7 then 'COMPLETED' else status end,
    state=(case target_task when 2 then 'DAY_3_READY' when 3 then 'DAY_4_READY' when 4 then 'DAY_5_READY' when 5 then 'DAY_6_READY' when 6 then 'DAY_7_READY' when 7 then 'ROUND_COMPLETE' end)::public.exploration_state,
    completed_at=case when target_task=7 then now() else completed_at end, updated_at=now()
  where id=target_exploration;
  return result;
end $$;

create or replace function public.record_commitment_outcome(target_commitment uuid, outcome text, proof_or_friction text)
returns uuid language plpgsql security definer set search_path=public as $$
declare current public.commitments; replacement_id uuid; task_uuid uuid;
begin
  select * into current from public.commitments where id=target_commitment and user_id=auth.uid() for update;
  if not found then raise exception 'Not authorized'; end if;
  if outcome='COMPLETED' then
    if length(trim(coalesce(proof_or_friction,''))) < 2 then raise exception 'COMPLETION_EVIDENCE_REQUIRED'; end if;
    update public.commitments set status='COMPLETED',outcome_at=now() where id=target_commitment;
    insert into public.evidence_items(exploration_id,task_id,user_id,evidence_type,content,metadata)
    values(current.exploration_id,current.task_id,auth.uid(),'TEXT',proof_or_friction,jsonb_build_object('commitment_id',target_commitment,'outcome','COMPLETED'));
    return target_commitment;
  elsif outcome='NOT_COMPLETED' then
    if now() <= current.due_at + make_interval(mins => current.grace_minutes) then raise exception 'COMMITMENT_NOT_OVERDUE'; end if;
    if length(trim(coalesce(proof_or_friction,''))) < 4 then raise exception 'FRICTION_NOTE_REQUIRED'; end if;
    update public.commitments set status='NOT_COMPLETED',outcome_at=now() where id=target_commitment;
    insert into public.evidence_items(exploration_id,task_id,user_id,evidence_type,content,metadata)
    values(current.exploration_id,current.task_id,auth.uid(),'TEXT',proof_or_friction,jsonb_build_object('commitment_id',target_commitment,'outcome','NOT_COMPLETED','is_friction',true));
    insert into public.commitments(exploration_id,task_id,user_id,mode,status,action_statement,starts_at,due_at,timezone,grace_minutes,success_rule,evidence_requirement,reward_text,recovery_action,witness_label,locked_at,supersedes_id,replacement_reason)
    values(current.exploration_id,current.task_id,auth.uid(),'PRIVATE','ACTIVE',current.recovery_action,now(),now()+interval '24 hours',current.timezone,current.grace_minutes,current.success_rule,current.evidence_requirement,current.reward_text,current.recovery_action,current.witness_label,now(),current.id,'自动执行事先约定的恢复动作') returning id into replacement_id;
    update public.commitments set status='RECOVERY_ACTIVE' where id=target_commitment;
    return replacement_id;
  end if;
  raise exception 'INVALID_OUTCOME';
end $$;

create or replace function public.is_commitment_overdue(target_commitment uuid)
returns boolean language sql stable security invoker set search_path=public as $$
  select coalesce(now() > due_at + make_interval(mins => grace_minutes), false)
  from public.commitments where id=target_commitment and user_id=auth.uid()
$$;

alter table public.desire_signals enable row level security;
alter table public.exploration_tasks enable row level security;
alter table public.evidence_items enable row level security;
alter table public.commitments enable row level security;
alter table public.entitlements enable row level security;
alter table public.payment_records enable row level security;
alter table public.product_events enable row level security;

grant select,insert,update on public.desire_signals,public.commitments to authenticated;
grant select on public.exploration_tasks,public.evidence_items to authenticated;
grant select on public.entitlements,public.payment_records to authenticated;
grant insert on public.product_events to authenticated;
grant execute on function public.has_full_exploration_entitlement(uuid), public.save_exploration_task_draft(uuid,smallint,jsonb,integer), public.submit_desire_map(uuid,jsonb), public.submit_exploration_task(uuid,smallint,jsonb,jsonb), public.record_commitment_outcome(uuid,text,text), public.is_commitment_overdue(uuid) to authenticated;

create policy "own desire signals" on public.desire_signals for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own exploration tasks" on public.exploration_tasks for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own evidence items" on public.evidence_items for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own commitments" on public.commitments for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "read own entitlements" on public.entitlements for select to authenticated using(user_id=auth.uid());
create policy "read own payments" on public.payment_records for select to authenticated using(user_id=auth.uid());
create policy "insert own product events" on public.product_events for insert to authenticated with check(user_id=auth.uid() or user_id is null);

-- Progress and evidence mutations go through validated RPCs after vNext.
drop policy if exists "users manage own exploration" on public.explorations;
create policy "users read own exploration" on public.explorations for select to authenticated using(user_id=auth.uid());
create policy "users create own exploration" on public.explorations for insert to authenticated with check(user_id=auth.uid());
revoke update,delete on public.explorations from authenticated;
revoke insert,update,delete on public.evidence,public.direction_hypotheses from authenticated;
