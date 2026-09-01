drop policy if exists "transactions_own" on public.transactions;
drop policy if exists "goals_own" on public.goals;
drop policy if exists "goal_contributions_own" on public.goal_contributions;

create policy "transactions_select_own"
on public.transactions
for select using (auth.uid() = user_id);

create policy "transactions_delete_own"
on public.transactions
for delete using (auth.uid() = user_id);

create policy "transactions_insert_own"
on public.transactions
for insert with check (
  auth.uid() = user_id
  and exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
  and (category_id is null or exists (select 1 from public.categories c where c.id = category_id and c.user_id = auth.uid()))
);

create policy "transactions_update_own"
on public.transactions
for update using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
  and (category_id is null or exists (select 1 from public.categories c where c.id = category_id and c.user_id = auth.uid()))
);

create policy "goals_select_own"
on public.goals
for select using (auth.uid() = user_id);

create policy "goals_delete_own"
on public.goals
for delete using (auth.uid() = user_id);

create policy "goals_insert_own"
on public.goals
for insert with check (
  auth.uid() = user_id
  and (wishlist_item_id is null or exists (select 1 from public.wishlist_items w where w.id = wishlist_item_id and w.user_id = auth.uid()))
);

create policy "goals_update_own"
on public.goals
for update using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (wishlist_item_id is null or exists (select 1 from public.wishlist_items w where w.id = wishlist_item_id and w.user_id = auth.uid()))
);

create policy "goal_contributions_select_own"
on public.goal_contributions
for select using (auth.uid() = user_id);

create policy "goal_contributions_delete_own"
on public.goal_contributions
for delete using (auth.uid() = user_id);

create policy "goal_contributions_insert_own"
on public.goal_contributions
for insert with check (
  auth.uid() = user_id
  and exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid())
);

create policy "goal_contributions_update_own"
on public.goal_contributions
for update using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid())
);
