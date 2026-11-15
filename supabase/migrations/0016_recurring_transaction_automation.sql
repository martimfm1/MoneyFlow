-- Materialize each due recurring entry as exactly one real transaction.
-- Transaction insert/update/delete triggers remain the single source of account balance changes.

alter table public.recurring_expenses
  add column if not exists schedule_anchor_date date,
  add column if not exists next_occurrence_index integer not null default 0;

alter table public.recurring_incomes
  add column if not exists schedule_anchor_date date,
  add column if not exists next_occurrence_index integer not null default 0;

update public.recurring_expenses
set schedule_anchor_date = next_due_date
where schedule_anchor_date is null;

update public.recurring_incomes
set schedule_anchor_date = next_income_date
where schedule_anchor_date is null;

alter table public.recurring_expenses
  alter column schedule_anchor_date set not null,
  add constraint recurring_expenses_occurrence_index_check
    check (next_occurrence_index >= 0);

alter table public.recurring_incomes
  alter column schedule_anchor_date set not null,
  add constraint recurring_incomes_occurrence_index_check
    check (next_occurrence_index >= 0);

create table if not exists public.recurring_transaction_occurrences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  context_id uuid not null references public.financial_contexts(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete restrict,
  source_type text not null check (source_type in ('income', 'expense')),
  source_id uuid not null,
  due_date date not null,
  transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (source_type, source_id, due_date)
);

create index if not exists recurring_occurrences_user_date_idx
  on public.recurring_transaction_occurrences(user_id, due_date desc);

alter table public.recurring_transaction_occurrences enable row level security;
revoke all on public.recurring_transaction_occurrences from public, anon, authenticated;
grant all on public.recurring_transaction_occurrences to service_role;

create or replace function public.set_recurring_schedule_anchor()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.schedule_anchor_date := coalesce(
      new.schedule_anchor_date,
      case when tg_table_name = 'recurring_expenses'
        then new.next_due_date else new.next_income_date end
    );
    new.next_occurrence_index := coalesce(new.next_occurrence_index, 0);
    return new;
  end if;

  if new.frequency is distinct from old.frequency
    or (
      tg_table_name = 'recurring_expenses'
      and new.next_due_date is distinct from old.next_due_date
    )
    or (
      tg_table_name = 'recurring_incomes'
      and new.next_income_date is distinct from old.next_income_date
    ) then
    -- A user-edited schedule starts a fresh recurrence series. The worker
    -- increments next_occurrence_index when it advances the date, so that
    -- internal update does not reset the original day-of-month anchor.
    if new.next_occurrence_index is not distinct from old.next_occurrence_index then
      new.schedule_anchor_date := case
        when tg_table_name = 'recurring_expenses' then new.next_due_date
        else new.next_income_date
      end;
      new.next_occurrence_index := 0;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists recurring_expenses_schedule_anchor
  on public.recurring_expenses;
create trigger recurring_expenses_schedule_anchor
before insert or update of frequency, next_due_date, next_occurrence_index
on public.recurring_expenses
for each row execute function public.set_recurring_schedule_anchor();

drop trigger if exists recurring_incomes_schedule_anchor
  on public.recurring_incomes;
create trigger recurring_incomes_schedule_anchor
before insert or update of frequency, next_income_date, next_occurrence_index
on public.recurring_incomes
for each row execute function public.set_recurring_schedule_anchor();

create or replace function public.recurring_date_at(
  p_anchor_date date,
  p_frequency text,
  p_occurrence_index integer
)
returns date
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_month_step integer;
  v_target_month date;
  v_days_in_month integer;
  v_anchor_day integer;
begin
  if p_occurrence_index < 0 then
    raise exception 'INVALID_OCCURRENCE_INDEX';
  end if;

  v_month_step := case p_frequency
    when 'monthly' then 1
    when 'quarterly' then 3
    when 'yearly' then 12
    else null
  end;

  if v_month_step is null then
    raise exception 'INVALID_RECURRENCE_FREQUENCY';
  end if;

  v_target_month := (
    date_trunc('month', p_anchor_date::timestamp)
    + make_interval(months => v_month_step * p_occurrence_index)
  )::date;
  v_days_in_month := extract(
    day from (v_target_month + interval '1 month - 1 day')
  )::integer;
  v_anchor_day := extract(day from p_anchor_date)::integer;

  return v_target_month + (least(v_anchor_day, v_days_in_month) - 1);
end;
$$;

create or replace function public.process_due_recurring_transactions(
  p_as_of date default (now() at time zone 'Europe/Lisbon')::date,
  p_limit integer default 250
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item record;
  v_due_date date;
  v_next_index integer;
  v_occurrence_id uuid;
  v_transaction_id uuid;
  v_income_count integer := 0;
  v_expense_count integer := 0;
  v_income_schedules integer := 0;
  v_expense_schedules integer := 0;
  v_limit integer := greatest(1, least(coalesce(p_limit, 250), 1000));
  v_occurrence_guard integer;
  v_reference text;
begin
  -- Income entries are processed first. Every transaction insert is atomic
  -- with its occurrence ledger entry and account-balance trigger.
  for v_item in
    select r.id, r.user_id, r.context_id, r.account_id, r.name, r.amount,
           r.currency_code, r.frequency, r.next_income_date,
           r.schedule_anchor_date, r.next_occurrence_index
    from public.recurring_incomes r
    join public.accounts a
      on a.id = r.account_id
     and a.user_id = r.user_id
     and a.context_id = r.context_id
     and a.currency_code = r.currency_code
     and a.is_active
    where r.is_active
      and r.account_id is not null
      and r.next_income_date <= p_as_of
    order by r.next_income_date, r.created_at
    limit v_limit
    for update of r skip locked
  loop
    v_income_schedules := v_income_schedules + 1;
    v_due_date := v_item.next_income_date;
    v_next_index := v_item.next_occurrence_index;
    v_occurrence_guard := 0;

    while v_due_date <= p_as_of and v_occurrence_guard < 120 loop
      v_reference := v_item.id::text || ':' || v_due_date::text;
      v_occurrence_id := null;
      v_transaction_id := null;

      insert into public.recurring_transaction_occurrences (
        user_id, context_id, account_id, source_type, source_id, due_date
      )
      values (
        v_item.user_id, v_item.context_id, v_item.account_id,
        'income', v_item.id, v_due_date
      )
      on conflict (source_type, source_id, due_date) do nothing
      returning id into v_occurrence_id;

      if v_occurrence_id is not null then
        insert into public.transactions (
          user_id, context_id, account_id, transaction_type, amount,
          description, occurred_at, import_source, import_reference
        )
        values (
          v_item.user_id, v_item.context_id, v_item.account_id, 'income',
          v_item.amount, left(v_item.name, 120),
          v_due_date::timestamp at time zone 'Europe/Lisbon',
          'recurring_income', v_reference
        )
        on conflict (user_id, context_id, import_source, import_reference)
        do nothing
        returning id into v_transaction_id;

        if v_transaction_id is null then
          select t.id into v_transaction_id
          from public.transactions t
          where t.user_id = v_item.user_id
            and t.context_id = v_item.context_id
            and t.import_source = 'recurring_income'
            and t.import_reference = v_reference;
        end if;

        update public.recurring_transaction_occurrences
        set transaction_id = v_transaction_id
        where id = v_occurrence_id;

        if v_transaction_id is not null then
          v_income_count := v_income_count + 1;
        end if;
      end if;

      v_next_index := v_next_index + 1;
      v_due_date := public.recurring_date_at(
        v_item.schedule_anchor_date, v_item.frequency, v_next_index
      );
      v_occurrence_guard := v_occurrence_guard + 1;
    end loop;

    update public.recurring_incomes
    set next_occurrence_index = v_next_index,
        next_income_date = v_due_date,
        updated_at = now()
    where id = v_item.id;
  end loop;

  -- Expense entries use the same idempotency and account-balance path.
  for v_item in
    select r.id, r.user_id, r.context_id, r.account_id, r.name, r.amount,
           r.currency_code, r.frequency, r.next_due_date,
           r.schedule_anchor_date, r.next_occurrence_index
    from public.recurring_expenses r
    join public.accounts a
      on a.id = r.account_id
     and a.user_id = r.user_id
     and a.context_id = r.context_id
     and a.currency_code = r.currency_code
     and a.is_active
    where r.is_active
      and r.account_id is not null
      and r.next_due_date <= p_as_of
    order by r.next_due_date, r.created_at
    limit v_limit
    for update of r skip locked
  loop
    v_expense_schedules := v_expense_schedules + 1;
    v_due_date := v_item.next_due_date;
    v_next_index := v_item.next_occurrence_index;
    v_occurrence_guard := 0;

    while v_due_date <= p_as_of and v_occurrence_guard < 120 loop
      v_reference := v_item.id::text || ':' || v_due_date::text;
      v_occurrence_id := null;
      v_transaction_id := null;

      insert into public.recurring_transaction_occurrences (
        user_id, context_id, account_id, source_type, source_id, due_date
      )
      values (
        v_item.user_id, v_item.context_id, v_item.account_id,
        'expense', v_item.id, v_due_date
      )
      on conflict (source_type, source_id, due_date) do nothing
      returning id into v_occurrence_id;

      if v_occurrence_id is not null then
        insert into public.transactions (
          user_id, context_id, account_id, transaction_type, amount,
          description, occurred_at, import_source, import_reference
        )
        values (
          v_item.user_id, v_item.context_id, v_item.account_id, 'expense',
          v_item.amount, left(v_item.name, 120),
          v_due_date::timestamp at time zone 'Europe/Lisbon',
          'recurring_expense', v_reference
        )
        on conflict (user_id, context_id, import_source, import_reference)
        do nothing
        returning id into v_transaction_id;

        if v_transaction_id is null then
          select t.id into v_transaction_id
          from public.transactions t
          where t.user_id = v_item.user_id
            and t.context_id = v_item.context_id
            and t.import_source = 'recurring_expense'
            and t.import_reference = v_reference;
        end if;

        update public.recurring_transaction_occurrences
        set transaction_id = v_transaction_id
        where id = v_occurrence_id;

        if v_transaction_id is not null then
          v_expense_count := v_expense_count + 1;
        end if;
      end if;

      v_next_index := v_next_index + 1;
      v_due_date := public.recurring_date_at(
        v_item.schedule_anchor_date, v_item.frequency, v_next_index
      );
      v_occurrence_guard := v_occurrence_guard + 1;
    end loop;

    update public.recurring_expenses
    set next_occurrence_index = v_next_index,
        next_due_date = v_due_date,
        updated_at = now()
    where id = v_item.id;
  end loop;

  return pg_catalog.jsonb_build_object(
    'asOf', p_as_of,
    'incomeTransactionsCreated', v_income_count,
    'expenseTransactionsCreated', v_expense_count,
    'incomeSchedulesProcessed', v_income_schedules,
    'expenseSchedulesProcessed', v_expense_schedules
  );
end;
$$;

revoke all on function public.set_recurring_schedule_anchor()
  from public, anon, authenticated;
revoke all on function public.recurring_date_at(date, text, integer)
  from public, anon, authenticated;
revoke all on function public.process_due_recurring_transactions(date, integer)
  from public, anon, authenticated;
grant execute on function public.process_due_recurring_transactions(date, integer)
  to service_role;

-- Run shortly after local midnight in Portugal. The worker safely catches up
-- missed dates, at most 120 occurrences per schedule per run.
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'moneyflow-recurring-transactions-daily',
  '5 4 * * *',
  $$select public.process_due_recurring_transactions((now() at time zone 'Europe/Lisbon')::date, 250);$$
);

notify pgrst, 'reload schema';
