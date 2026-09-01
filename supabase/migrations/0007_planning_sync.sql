create or replace function public.sync_goal_current_amount()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  affected_goal_id uuid;
begin
  affected_goal_id := case when tg_op = 'DELETE' then old.goal_id else new.goal_id end;

  update public.goals
  set current_amount = least(
        target_amount,
        coalesce((select sum(gc.amount) from public.goal_contributions gc where gc.goal_id = affected_goal_id), 0)
      ),
      updated_at = timezone('utc', now())
  where id = affected_goal_id;

  if tg_op = 'UPDATE' and old.goal_id is distinct from new.goal_id then
    update public.goals
    set current_amount = least(
          target_amount,
          coalesce((select sum(gc.amount) from public.goal_contributions gc where gc.goal_id = old.goal_id), 0)
        ),
        updated_at = timezone('utc', now())
    where id = old.goal_id;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists goal_contributions_sync_goal on public.goal_contributions;
create trigger goal_contributions_sync_goal
after insert or update or delete on public.goal_contributions
for each row execute procedure public.sync_goal_current_amount();

create index if not exists wishlist_user_status_idx
  on public.wishlist_items(user_id, status, priority, created_at desc);
