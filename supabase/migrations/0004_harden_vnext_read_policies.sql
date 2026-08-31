-- Make RPC-only write domains explicit at both privilege and RLS layers.
drop policy if exists "own exploration tasks" on public.exploration_tasks;
create policy "read own exploration tasks" on public.exploration_tasks for select to authenticated using(user_id=auth.uid());
drop policy if exists "own evidence items" on public.evidence_items;
create policy "read own evidence items" on public.evidence_items for select to authenticated using(user_id=auth.uid());
revoke insert,update,delete on public.exploration_tasks,public.evidence_items from authenticated;
