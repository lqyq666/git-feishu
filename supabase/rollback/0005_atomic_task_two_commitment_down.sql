revoke execute on function public.submit_task_two_with_commitment(uuid,jsonb,jsonb,jsonb) from authenticated;
drop function if exists public.submit_task_two_with_commitment(uuid,jsonb,jsonb,jsonb);
drop index if exists public.commitments_one_primary_per_task_idx;
