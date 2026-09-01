create or replace function public.apply_transaction_balance()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.accounts
    set balance = balance + case when new.transaction_type = 'income' then new.amount else -new.amount end,
        updated_at = timezone('utc', now())
    where id = new.account_id and user_id = new.user_id;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    update public.accounts
    set balance = balance - case when old.transaction_type = 'income' then old.amount else -old.amount end,
        updated_at = timezone('utc', now())
    where id = old.account_id and user_id = old.user_id;

    update public.accounts
    set balance = balance + case when new.transaction_type = 'income' then new.amount else -new.amount end,
        updated_at = timezone('utc', now())
    where id = new.account_id and user_id = new.user_id;
    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.accounts
    set balance = balance - case when old.transaction_type = 'income' then old.amount else -old.amount end,
        updated_at = timezone('utc', now())
    where id = old.account_id and user_id = old.user_id;
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists transactions_apply_balance on public.transactions;
create trigger transactions_apply_balance
after insert or update or delete on public.transactions
for each row execute procedure public.apply_transaction_balance();
