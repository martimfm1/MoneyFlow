-- Automatic recurring postings.
-- Supabase Vault stores the server-only cron secret.
create extension if not exists supabase_vault with schema vault;

-- Existing recurring entries remain planning-only until the owner explicitly enables posting.
-- New entries are enabled by the application when created.

alter table public.recurring_expenses
  add column if not exists auto_post_enabled boolean not null default false,
  add column if not exists schedule_day_of_month smallint,
  add column if not exists schedule_month_of_year smallint;

alter table public.recurring_incomes
  add column if not exists auto_post_enabled boolean not null default false,
  add column if not exists schedule_day_of_month smallint,
  add column if not exists schedule_month_of_year smallint;

update public.recurring_expenses
set schedule_day_of_month = extract(day from next_due_date)::smallint,
    schedule_month_of_year = extract(month from next_due_date)::smallint
where schedule_day_of_month is null or schedule_month_of_year is null;

update public.recurring_incomes
set schedule_day_of_month = extract(day from next_income_date)::smallint,
    schedule_month_of_year = extract(month from next_income_date)::smallint
where schedule_day_of_month is null or schedule_month_of_year is null;

alter table public.recurring_expenses
  alter column schedule_day_of_month set not null,
  alter column schedule_month_of_year set not null,
  alter column schedule_day_of_month set default 1,
  alter column schedule_month_of_year set default 1;

alter table public.recurring_incomes
  alter column schedule_day_of_month set not null,
  alter column schedule_month_of_year set not null,
  alter column schedule_day_of_month set default 1,
  alter column schedule_month_of_year set default 1;

alter table public.recurring_expenses
  drop constraint if exists recurring_expenses_schedule_day_check,
  drop constraint if exists recurring_expenses_schedule_month_check;
alter table public.recurring_expenses
  add constraint recurring_expenses_schedule_day_check
    check (schedule_day_of_month between 1 and 31),
  add constraint recurring_expenses_schedule_month_check
    check (schedule_month_of_year between 1 and 12);

alter table public.recurring_incomes
  drop constraint if exists recurring_incomes_schedule_day_check,
  drop constraint if exists recurring_incomes_schedule_month_check;
alter table public.recurring_incomes
  add constraint recurring_incomes_schedule_day_check
    check (schedule_day_of_month between 1 and 31),
  add constraint recurring_incomes_schedule_month_check
    check (schedule_month_of_year between 1 and 12);

create index if not exists recurring_expenses_auto_due_idx
  on public.recurring_expenses(next_due_date, created_at)
  where is_active and auto_post_enabled;
create index if not exists recurring_incomes_auto_due_idx
  on public.recurring_incomes(next_income_date, created_at)
  where is_active and auto_post_enabled;

create table if not exists public.recurring_transaction_occurrences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  context_id uuid not null references public.financial_contexts(id) on delete cascade,
  recurring_type text not null check (recurring_type in ('income', 'expense')),
  recurring_id uuid not null,
  occurrence_date date not null,
  transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint recurring_transaction_occurrences_once
    unique (recurring_type, recurring_id, occurrence_date),
  constraint recurring_transaction_occurrences_transaction_once
    unique (transaction_id)
);

create index if not exists recurring_transaction_occurrences_owner_idx
  on public.recurring_transaction_occurrences(user_id, context_id, occurrence_date desc);

alter table public.recurring_transaction_occurrences enable row level security;
drop policy if exists recurring_occurrences_select_own
  on public.recurring_transaction_occurrences;
create policy recurring_occurrences_select_own
  on public.recurring_transaction_occurrences
  for select to authenticated
  using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.recurring_transaction_occurrences
  from anon, authenticated;
grant select on public.recurring_transaction_occurrences to authenticated;
grant all on public.recurring_transaction_occurrences to service_role;

create or replace function public.advance_recurring_date(
  p_current_date date,
  p_frequency text,
  p_anchor_day integer,
  p_anchor_month integer
)
returns date
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_month_start date;
  v_anchor_day integer;
  v_days_in_month integer;
begin
  if p_current_date is null then
    raise exception using errcode = '22023', message = 'INVALID_RECURRING_DATE';
  end if;

  if p_frequency = 'monthly' then
    v_month_start := (pg_catalog.date_trunc('month', p_current_date::timestamp)
      + interval '1 month')::date;
  elsif p_frequency = 'quarterly' then
    v_month_start := (pg_catalog.date_trunc('month', p_current_date::timestamp)
      + interval '3 months')::date;
  elsif p_frequency = 'yearly' then
    v_month_start := pg_catalog.make_date(
      extract(year from p_current_date)::integer + 1,
      greatest(1, least(12, coalesce(p_anchor_month, extract(month from p_current_date)::integer))),
      1
    );
  else
    raise exception using errcode = '22023', message = 'INVALID_RECURRING_FREQUENCY';
  end if;

  v_anchor_day := greatest(1, least(31, coalesce(p_anchor_day, extract(day from p_current_date)::integer)));
  v_days_in_month := extract(day from (v_month_start + interval '1 month' - interval '1 day'))::integer;

  return v_month_start + (least(v_anchor_day, v_days_in_month) - 1);
end;
$$;

revoke all on function public.advance_recurring_date(date, text, integer, integer)
  from public, anon, authenticated;

create or replace function public.set_recurring_automation(
  p_recurrence_type text,
  p_recurrence_id uuid,
  p_enabled boolean
)
returns date
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := timezone('Europe/Lisbon', pg_catalog.now())::date;
  v_next_date date;
  v_frequency text;
  v_anchor_day integer;
  v_anchor_month integer;
  v_steps integer := 0;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;
  if p_recurrence_id is null
    or p_recurrence_type is null
    or p_recurrence_type not in ('income', 'expense')
    or p_enabled is null then
    raise exception using errcode = '22023', message = 'INVALID_RECURRING_ENTRY';
  end if;

  if p_recurrence_type = 'income' then
    select next_income_date, frequency, schedule_day_of_month, schedule_month_of_year
      into v_next_date, v_frequency, v_anchor_day, v_anchor_month
    from public.recurring_incomes
    where id = p_recurrence_id and user_id = v_user_id
    for update;
  else
    select next_due_date, frequency, schedule_day_of_month, schedule_month_of_year
      into v_next_date, v_frequency, v_anchor_day, v_anchor_month
    from public.recurring_expenses
    where id = p_recurrence_id and user_id = v_user_id
    for update;
  end if;

  if not found then
    raise exception using errcode = 'P0002', message = 'RECURRING_ENTRY_NOT_FOUND';
  end if;

  if p_enabled then
    while v_next_date < v_today loop
      v_next_date := public.advance_recurring_date(
        v_next_date,
        v_frequency,
        v_anchor_day,
        v_anchor_month
      );
      v_steps := v_steps + 1;
      if v_steps > 5000 then
        raise exception using errcode = '54000', message = 'RECURRING_CATCHUP_LIMIT';
      end if;
    end loop;
  end if;

  if p_recurrence_type = 'income' then
    update public.recurring_incomes
    set auto_post_enabled = p_enabled,
        next_income_date = v_next_date,
        updated_at = timezone('utc', pg_catalog.now())
    where id = p_recurrence_id and user_id = v_user_id;
  else
    update public.recurring_expenses
    set auto_post_enabled = p_enabled,
        next_due_date = v_next_date,
        updated_at = timezone('utc', pg_catalog.now())
    where id = p_recurrence_id and user_id = v_user_id;
  end if;

  return v_next_date;
end;
$$;

revoke all on function public.set_recurring_automation(text, uuid, boolean)
  from public, anon;
grant execute on function public.set_recurring_automation(text, uuid, boolean)
  to authenticated;

create or replace function public.process_due_recurring_transactions(
  p_cron_secret text,
  p_as_of date default timezone('Europe/Lisbon', pg_catalog.now())::date,
  p_batch_size integer default 500
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expected_secret text;
  v_income public.recurring_incomes%rowtype;
  v_expense public.recurring_expenses%rowtype;
  v_occurrence_date date;
  v_next_date date;
  v_transaction_id uuid;
  v_reference text;
  v_income_inserted integer := 0;
  v_expense_inserted integer := 0;
  v_duplicates integer := 0;
  v_skipped integer := 0;
  v_occurrences integer;
  v_limit integer := greatest(1, least(coalesce(p_batch_size, 500), 1000));
begin
  select decrypted_secret
    into v_expected_secret
  from vault.decrypted_secrets
  where name = 'moneyflow_recurring_cron_secret'
  limit 1;

  if v_expected_secret is null
    or p_cron_secret is null
    or p_cron_secret is distinct from v_expected_secret then
    raise exception using errcode = '42501', message = 'INVALID_CRON_SECRET';
  end if;

  if p_as_of is null then
    raise exception using errcode = '22023', message = 'INVALID_PROCESSING_DATE';
  end if;

  for v_income in
    select *
    from public.recurring_incomes
    where is_active = true
      and auto_post_enabled = true
      and next_income_date <= p_as_of
    order by next_income_date, created_at
    limit v_limit
    for update skip locked
  loop
    if v_income.account_id is null or not exists (
      select 1
      from public.accounts a
      where a.id = v_income.account_id
        and a.user_id = v_income.user_id
        and a.context_id = v_income.context_id
        and a.is_active = true
        and a.currency_code = v_income.currency_code
    ) then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    v_occurrence_date := v_income.next_income_date;
    v_occurrences := 0;

    while v_occurrence_date <= p_as_of and v_occurrences < v_limit loop
      v_reference := 'recurring:income:' || v_income.id::text || ':' || v_occurrence_date::text;
      v_transaction_id := null;

      insert into public.transactions (
        user_id, context_id, account_id, transaction_type, amount,
        description, notes, occurred_at, import_source, import_reference
      )
      values (
        v_income.user_id,
        v_income.context_id,
        v_income.account_id,
        'income',
        v_income.amount,
        left('Entrada recorrente: ' || v_income.name, 160),
        'Lançamento criado automaticamente pela recorrência.',
        (v_occurrence_date::timestamp at time zone 'Europe/Lisbon'),
        'recurring_income',
        v_reference
      )
      on conflict (user_id, context_id, import_source, import_reference)
      do nothing
      returning id into v_transaction_id;

      if v_transaction_id is null then
        select id into v_transaction_id
        from public.transactions
        where user_id = v_income.user_id
          and context_id = v_income.context_id
          and import_source = 'recurring_income'
          and import_reference = v_reference
        limit 1;
        v_duplicates := v_duplicates + 1;
      else
        v_income_inserted := v_income_inserted + 1;
      end if;

      insert into public.recurring_transaction_occurrences (
        user_id, context_id, recurring_type, recurring_id, occurrence_date, transaction_id
      )
      values (
        v_income.user_id, v_income.context_id, 'income',
        v_income.id, v_occurrence_date, v_transaction_id
      )
      on conflict (recurring_type, recurring_id, occurrence_date) do nothing;

      v_next_date := public.advance_recurring_date(
        v_occurrence_date,
        v_income.frequency,
        v_income.schedule_day_of_month,
        v_income.schedule_month_of_year
      );

      update public.recurring_incomes
      set next_income_date = v_next_date,
          updated_at = timezone('utc', pg_catalog.now())
      where id = v_income.id;

      v_occurrence_date := v_next_date;
      v_occurrences := v_occurrences + 1;
    end loop;
  end loop;

  for v_expense in
    select *
    from public.recurring_expenses
    where is_active = true
      and auto_post_enabled = true
      and next_due_date <= p_as_of
    order by next_due_date, created_at
    limit v_limit
    for update skip locked
  loop
    if v_expense.account_id is null or not exists (
      select 1
      from public.accounts a
      where a.id = v_expense.account_id
        and a.user_id = v_expense.user_id
        and a.context_id = v_expense.context_id
        and a.is_active = true
        and a.currency_code = v_expense.currency_code
    ) then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    v_occurrence_date := v_expense.next_due_date;
    v_occurrences := 0;

    while v_occurrence_date <= p_as_of and v_occurrences < v_limit loop
      v_reference := 'recurring:expense:' || v_expense.id::text || ':' || v_occurrence_date::text;
      v_transaction_id := null;

      insert into public.transactions (
        user_id, context_id, account_id, transaction_type, amount,
        description, notes, occurred_at, import_source, import_reference
      )
      values (
        v_expense.user_id,
        v_expense.context_id,
        v_expense.account_id,
        'expense',
        v_expense.amount,
        left('Saída recorrente: ' || v_expense.name, 160),
        'Lançamento criado automaticamente pela recorrência.',
        (v_occurrence_date::timestamp at time zone 'Europe/Lisbon'),
        'recurring_expense',
        v_reference
      )
      on conflict (user_id, context_id, import_source, import_reference)
      do nothing
      returning id into v_transaction_id;

      if v_transaction_id is null then
        select id into v_transaction_id
        from public.transactions
        where user_id = v_expense.user_id
          and context_id = v_expense.context_id
          and import_source = 'recurring_expense'
          and import_reference = v_reference
        limit 1;
        v_duplicates := v_duplicates + 1;
      else
        v_expense_inserted := v_expense_inserted + 1;
      end if;

      insert into public.recurring_transaction_occurrences (
        user_id, context_id, recurring_type, recurring_id, occurrence_date, transaction_id
      )
      values (
        v_expense.user_id, v_expense.context_id, 'expense',
        v_expense.id, v_occurrence_date, v_transaction_id
      )
      on conflict (recurring_type, recurring_id, occurrence_date) do nothing;

      v_next_date := public.advance_recurring_date(
        v_occurrence_date,
        v_expense.frequency,
        v_expense.schedule_day_of_month,
        v_expense.schedule_month_of_year
      );

      update public.recurring_expenses
      set next_due_date = v_next_date,
          updated_at = timezone('utc', pg_catalog.now())
      where id = v_expense.id;

      v_occurrence_date := v_next_date;
      v_occurrences := v_occurrences + 1;
    end loop;
  end loop;

  return pg_catalog.jsonb_build_object(
    'ok', true,
    'asOf', p_as_of,
    'incomeInserted', v_income_inserted,
    'expenseInserted', v_expense_inserted,
    'duplicates', v_duplicates,
    'skipped', v_skipped
  );
end;
$$;

revoke all on function public.process_due_recurring_transactions(text, date, integer)
  from public, authenticated;
grant execute on function public.process_due_recurring_transactions(text, date, integer)
  to anon, service_role;

