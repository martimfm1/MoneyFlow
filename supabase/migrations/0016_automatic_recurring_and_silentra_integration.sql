-- Automatic recurring postings and secure Silentra for Barbers revenue sync.
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
  v_days_in_month := extract(day from (v_month_start + interval '1 month - 1 day'))::integer;

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
  if p_recurrence_id is null or p_recurrence_type not in ('income', 'expense') then
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
    while v_next_date <= v_today loop
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
    for update skip locked
    limit v_limit
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
    for update skip locked
    limit v_limit
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

-- Platform-to-MoneyFlow connection. Only the short-lived pairing flow and
-- the long-lived capability token can reach these SECURITY DEFINER endpoints.
create table if not exists public.silentra_platform_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  context_id uuid not null,
  account_id uuid not null references public.accounts(id) on delete restrict,
  platform text not null default 'silentra-for-barbers'
    check (platform = 'silentra-for-barbers'),
  token_hash text,
  status text not null default 'active'
    check (status in ('active', 'disconnected')),
  connected_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint silentra_platform_integrations_context_owner_fkey
    foreign key (context_id, user_id)
    references public.financial_contexts(id, user_id) on delete cascade,
  constraint silentra_platform_integrations_user_platform_key
    unique (user_id, platform)
);

create table if not exists public.silentra_platform_pairing_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  context_id uuid not null,
  account_id uuid not null references public.accounts(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint silentra_platform_pairing_context_owner_fkey
    foreign key (context_id, user_id)
    references public.financial_contexts(id, user_id) on delete cascade
);

create index if not exists silentra_pairing_tokens_user_expiry_idx
  on public.silentra_platform_pairing_tokens(user_id, expires_at desc);

alter table public.silentra_platform_integrations enable row level security;
alter table public.silentra_platform_pairing_tokens enable row level security;
revoke all on public.silentra_platform_integrations
  from public, anon, authenticated;
revoke all on public.silentra_platform_pairing_tokens
  from public, anon, authenticated;
grant all on public.silentra_platform_integrations to service_role;
grant all on public.silentra_platform_pairing_tokens to service_role;

create or replace function public.issue_silentra_pairing_token(p_account_id uuid)
returns table(pairing_token text, expires_at timestamptz, account_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_context_id uuid;
  v_currency text;
  v_token text;
  v_expiry timestamptz := pg_catalog.now() + interval '15 minutes';
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  select f.id, a.currency_code
    into v_context_id, v_currency
  from public.financial_contexts f
  join public.accounts a
    on a.context_id = f.id and a.user_id = f.user_id
  where f.user_id = v_user_id
    and f.slug = 'silentra'
    and a.id = p_account_id
    and a.is_active = true;

  if not found then
    raise exception using errcode = '22023', message = 'INVALID_SILENTRA_ACCOUNT';
  end if;

  if v_currency <> 'EUR' then
    raise exception using errcode = '22023', message = 'SILENTRA_REVENUE_ACCOUNT_MUST_BE_EUR';
  end if;

  delete from public.silentra_platform_pairing_tokens
  where user_id = v_user_id and (used_at is not null or expires_at <= pg_catalog.now());

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.silentra_platform_pairing_tokens (
    user_id, context_id, account_id, token_hash, expires_at
  )
  values (
    v_user_id,
    v_context_id,
    p_account_id,
    encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex'),
    v_expiry
  );

  return query select v_token, v_expiry, p_account_id;
end;
$$;

revoke all on function public.issue_silentra_pairing_token(uuid)
  from public, anon;
grant execute on function public.issue_silentra_pairing_token(uuid)
  to authenticated;

create or replace function public.consume_silentra_pairing_token(p_pairing_token text)
returns table(sync_token text, account_id uuid, account_name text, currency_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pairing public.silentra_platform_pairing_tokens%rowtype;
  v_sync_token text;
  v_account_name text;
  v_currency text;
begin
  if p_pairing_token is null or length(p_pairing_token) < 40 or length(p_pairing_token) > 100 then
    raise exception using errcode = '42501', message = 'INVALID_PAIRING_TOKEN';
  end if;

  select *
    into v_pairing
  from public.silentra_platform_pairing_tokens
  where token_hash = encode(extensions.digest(convert_to(p_pairing_token, 'UTF8'), 'sha256'), 'hex')
    and used_at is null
    and expires_at > pg_catalog.now()
  for update;

  if not found then
    raise exception using errcode = '42501', message = 'PAIRING_TOKEN_EXPIRED_OR_INVALID';
  end if;

  select a.name, a.currency_code
    into v_account_name, v_currency
  from public.accounts a
  where a.id = v_pairing.account_id
    and a.user_id = v_pairing.user_id
    and a.context_id = v_pairing.context_id
    and a.is_active = true;

  if not found or v_currency <> 'EUR' then
    raise exception using errcode = '22023', message = 'SILENTRA_ACCOUNT_UNAVAILABLE';
  end if;

  v_sync_token := encode(extensions.gen_random_bytes(32), 'hex');

  update public.silentra_platform_pairing_tokens
  set used_at = pg_catalog.now()
  where id = v_pairing.id;

  insert into public.silentra_platform_integrations (
    user_id, context_id, account_id, platform, token_hash, status, connected_at, updated_at
  )
  values (
    v_pairing.user_id,
    v_pairing.context_id,
    v_pairing.account_id,
    'silentra-for-barbers',
    encode(extensions.digest(convert_to(v_sync_token, 'UTF8'), 'sha256'), 'hex'),
    'active',
    pg_catalog.now(),
    pg_catalog.now()
  )
  on conflict (user_id, platform)
  do update set
    context_id = excluded.context_id,
    account_id = excluded.account_id,
    token_hash = excluded.token_hash,
    status = 'active',
    connected_at = pg_catalog.now(),
    updated_at = pg_catalog.now();

  return query select v_sync_token, v_pairing.account_id, v_account_name, v_currency;
end;
$$;

revoke all on function public.consume_silentra_pairing_token(text)
  from public;
grant execute on function public.consume_silentra_pairing_token(text)
  to anon, authenticated;

create or replace function public.get_silentra_integration_status()
returns table(is_connected boolean, account_id uuid, account_name text, currency_code text, connected_at timestamptz)
language sql
security definer
stable
set search_path = ''
as $$
  select
    coalesce(i.status = 'active', false),
    i.account_id,
    a.name,
    a.currency_code,
    i.connected_at
  from (select auth.uid() as user_id) viewer
  left join public.silentra_platform_integrations i
    on i.user_id = viewer.user_id
   and i.platform = 'silentra-for-barbers'
  left join public.accounts a
    on a.id = i.account_id
   and a.user_id = viewer.user_id
  where viewer.user_id is not null;
$$;

revoke all on function public.get_silentra_integration_status()
  from public, anon;
grant execute on function public.get_silentra_integration_status()
  to authenticated;

create or replace function public.disconnect_silentra_integration()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  update public.silentra_platform_integrations
  set status = 'disconnected',
      token_hash = null,
      updated_at = pg_catalog.now()
  where user_id = v_user_id
    and platform = 'silentra-for-barbers';

  return found;
end;
$$;

revoke all on function public.disconnect_silentra_integration()
  from public, anon;
grant execute on function public.disconnect_silentra_integration()
  to authenticated;

create or replace function public.record_silentra_platform_payment(
  p_sync_token text,
  p_event_id text,
  p_amount numeric,
  p_currency text,
  p_occurred_at timestamptz,
  p_description text,
  p_external_reference text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_integration public.silentra_platform_integrations%rowtype;
  v_account_currency text;
  v_transaction_id uuid;
  v_reference text;
begin
  if p_sync_token is null or length(p_sync_token) < 40 or length(p_sync_token) > 100 then
    raise exception using errcode = '42501', message = 'INVALID_INTEGRATION_TOKEN';
  end if;

  select *
    into v_integration
  from public.silentra_platform_integrations
  where platform = 'silentra-for-barbers'
    and status = 'active'
    and token_hash = encode(extensions.digest(convert_to(p_sync_token, 'UTF8'), 'sha256'), 'hex')
  limit 1;

  if not found then
    raise exception using errcode = '42501', message = 'INTEGRATION_NOT_CONNECTED';
  end if;

  if p_event_id is null or length(trim(p_event_id)) < 1 or length(p_event_id) > 200
    or p_amount is null or p_amount <= 0 or p_amount > 1000000
    or p_currency is null or p_currency !~ '^[A-Z]{3}$'
    or p_occurred_at is null
    or p_description is null or length(trim(p_description)) < 1
    or length(p_description) > 160 then
    raise exception using errcode = '22023', message = 'INVALID_PLATFORM_PAYMENT';
  end if;

  select currency_code
    into v_account_currency
  from public.accounts
  where id = v_integration.account_id
    and user_id = v_integration.user_id
    and context_id = v_integration.context_id
    and is_active = true;

  if not found then
    raise exception using errcode = 'P0002', message = 'INTEGRATION_ACCOUNT_UNAVAILABLE';
  end if;
  if v_account_currency <> p_currency then
    raise exception using errcode = '22023', message = 'PAYMENT_CURRENCY_MISMATCH';
  end if;

  v_reference := 'subscription-payment:' || p_event_id;

  insert into public.transactions (
    user_id, context_id, account_id, transaction_type, amount,
    description, notes, occurred_at, import_source, import_reference
  )
  values (
    v_integration.user_id,
    v_integration.context_id,
    v_integration.account_id,
    'income',
    round(p_amount, 2),
    left(trim(p_description), 160),
    case
      when p_external_reference is null or trim(p_external_reference) = ''
        then 'Pagamento de subscrição confirmado no Silentra for Barbers.'
      else 'Pagamento de subscrição confirmado no Silentra for Barbers. Referência: ' ||
        left(trim(p_external_reference), 120)
    end,
    p_occurred_at,
    'silentra_for_barbers',
    v_reference
  )
  on conflict (user_id, context_id, import_source, import_reference)
  do nothing
  returning id into v_transaction_id;

  if v_transaction_id is null then
    select id into v_transaction_id
    from public.transactions
    where user_id = v_integration.user_id
      and context_id = v_integration.context_id
      and import_source = 'silentra_for_barbers'
      and import_reference = v_reference
    limit 1;

    return pg_catalog.jsonb_build_object(
      'ok', true, 'duplicate', true, 'transactionId', v_transaction_id
    );
  end if;

  return pg_catalog.jsonb_build_object(
    'ok', true, 'duplicate', false, 'transactionId', v_transaction_id
  );
end;
$$;

revoke all on function public.record_silentra_platform_payment(text, text, numeric, text, timestamptz, text, text)
  from public, authenticated;
grant execute on function public.record_silentra_platform_payment(text, text, numeric, text, timestamptz, text, text)
  to anon, service_role;

notify pgrst, 'reload schema';
