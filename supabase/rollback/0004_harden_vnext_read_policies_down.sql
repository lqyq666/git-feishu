drop policy if exists "read own exploration tasks" on public.exploration_tasks;
create policy "own exploration tasks" on public.exploration_tasks for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists "read own evidence items" on public.evidence_items;
create policy "own evidence items" on public.evidence_items for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
