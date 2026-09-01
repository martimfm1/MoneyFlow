create policy "transactions_account_and_category_own"
on public.transactions
for insert with check (
  auth.uid() = user_id
  and exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
  and (category_id is null or exists (select 1 from public.categories c where c.id = category_id and c.user_id = auth.uid()))
);

create policy "transactions_account_and_category_own_update"
on public.transactions
for update with check (
  auth.uid() = user_id
  and exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
  and (category_id is null or exists (select 1 from public.categories c where c.id = category_id and c.user_id = auth.uid()))
);

create policy "goals_wishlist_own"
on public.goals
for insert with check (
  auth.uid() = user_id
  and (wishlist_item_id is null or exists (select 1 from public.wishlist_items w where w.id = wishlist_item_id and w.user_id = auth.uid()))
);

create policy "goals_wishlist_own_update"
on public.goals
for update with check (
  auth.uid() = user_id
  and (wishlist_item_id is null or exists (select 1 from public.wishlist_items w where w.id = wishlist_item_id and w.user_id = auth.uid()))
);

create policy "goal_contributions_goal_own"
on public.goal_contributions
for insert with check (
  auth.uid() = user_id
  and exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid())
);

create policy "goal_contributions_goal_own_update"
on public.goal_contributions
for update with check (
  auth.uid() = user_id
  and exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid())
);
