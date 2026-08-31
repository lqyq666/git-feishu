-- Keep Task 2 evidence and its locked commitment in one idempotent transaction.
create unique index if not exists commitments_one_primary_per_task_idx
  on public.commitments(task_id)
  where task_id is not null and supersedes_id is null;

create or replace function public.submit_task_two_with_commitment(
  target_exploration uuid,
  payload jsonb,
  evidence_payload jsonb,
  commitment_payload jsonb
)
returns public.exploration_tasks
language plpgsql
security definer
set search_path=public
as $$
declare result public.exploration_tasks;
begin
  result := public.submit_exploration_task(
    target_exploration,
    2::smallint,
    payload,
    evidence_payload
  );
  insert into public.commitments(
    exploration_id,task_id,user_id,mode,status,action_statement,starts_at,due_at,
    timezone,success_rule,evidence_requirement,reward_text,recovery_action,witness_label
  ) values (
    target_exploration,result.id,auth.uid(),commitment_payload->>'mode','ACTIVE',
    commitment_payload->>'action_statement',(commitment_payload->>'starts_at')::timestamptz,
    (commitment_payload->>'due_at')::timestamptz,coalesce(commitment_payload->>'timezone','Asia/Shanghai'),
    commitment_payload->>'success_rule',commitment_payload->>'evidence_requirement',
    coalesce(commitment_payload->>'reward_text',''),commitment_payload->>'recovery_action',
    nullif(commitment_payload->>'witness_label','')
  ) on conflict do nothing;
  return result;
end $$;

grant execute on function public.submit_task_two_with_commitment(uuid,jsonb,jsonb,jsonb) to authenticated;
