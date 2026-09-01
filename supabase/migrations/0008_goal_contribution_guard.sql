create or replace function public.guard_goal_contribution_amount()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  goal_target numeric(14,2);
  existing_total numeric(14,2);
  replacing_amount numeric(14,2) := 0;
begin
  select target_amount
    into goal_target
  from public.goals
  where id = new.goal_id
    and user_id = new.user_id
  for update;

  if goal_target is null then
    raise exception 'Goal not found';
  end if;

  if tg_op = 'UPDATE' and old.goal_id = new.goal_id then
    replacing_amount := old.amount;
  end if;

  select coalesce(sum(amount), 0)
    into existing_total
  from public.goal_contributions
  where goal_id = new.goal_id;

  if existing_total - replacing_amount + new.amount > goal_target then
    raise exception 'Goal contribution exceeds remaining amount';
  end if;

  return new;
end;
$$;

drop trigger if exists goal_contribution_guard on public.goal_contributions;
create trigger goal_contribution_guard
before insert or update on public.goal_contributions
for each row execute procedure public.guard_goal_contribution_amount();
