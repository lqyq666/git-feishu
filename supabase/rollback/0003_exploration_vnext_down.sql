-- Intentionally conservative rollback: preserve all vNext user data.
-- Revoke new RPC entry points and deploy the previous frontend; tables remain available for recovery.
revoke execute on function public.save_exploration_task_draft(uuid,smallint,jsonb,integer) from authenticated;
revoke execute on function public.submit_exploration_task(uuid,smallint,jsonb,jsonb) from authenticated;
