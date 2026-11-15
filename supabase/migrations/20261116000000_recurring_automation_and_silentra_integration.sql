-- Automatic, idempotent recurring postings and secure Silentra for Barbers revenue bridge.
-- Recurring entries remain user-managed; only active items with a due date and a valid
-- active account are posted. Transaction balance triggers perform the actual balance change.

alter table public.recurring_expenses
  add column if not exists anchor_day smallint;
alter table public.recurring_expenses
  add column if not exists anchor_month smallint;

alter table public.recurring_incomes
  add column if not exists anchor_day smallint;
alter table public.recurring_incomes
  add column if not exists anchor_month smallint;

update public.recurring_expenses
set anchor_day = extract(day from next_due_date)::smallint,
    anchor_month = extract(month from next_due_date)::smallint
where anchor_day is null or anchor_month is null;

update public.recurring_incomes
set anchor_day = extract(day from next_income_date)::smallint,
    anchor_month = extract(month from next_income_date)::smallint
where anchor_day is null or anchor_month is null;

alter table public.recurring_expenses
  alter column anchor_day set not null,
  alter column anchor_month set not null;
alter table public.recurring_incomes
  alter column anchor_day set not null,
  alter column anchor_month set not null;

alter table public.recurring_expenses
  drop constraint if exists recurring_expenses_anchor_day_check;
alter table public.recurring_expenses
  add constraint recurring_expenses_anchor_day_check
  check (anchor_day between 1 and 31);
alter table public.recurring_expenses
  drop constraint if exists recurring_expenses_anchor_month_check;
alter table public.recurring_expenses
  add constraint recurring_expenses_anchor_month_check
  check (anchor_month between 1 and 12);

alter table public.recurring_incomes
  drop constraint if exists recurring_incomes_anchor_day_check;
alter table public.recurring_incomes
  add constraint recurring_incomes_anchor_day_check
  check (anchor_day between 1 and 31);
alter table public.recurring_incomes
  drop constraint if exists recurring_incomes_anchor_month_check;
alter table public.recurring_incomes
  add constraint recurring_incomes_anchor_month_check
  check (anchor_month between 1 and 12);

create or replace function public.next_recurring_due_date(
  p_due_date date,
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
  v_target_month date;
  v_day integer;
  v_year integer;
  v_month integer;
begin
  if p_frequency = 'monthly' then
    v_target_month := (pg_catalog.date_trunc('month', p_due_date)::date + interval '1 month')::date;
  elsif p_frequency = 'quarterly' then
    v_target_month := (pg_catalog.date_trunc('month', p_due_date)::date + interval '3 months')::date;
  elsif p_frequency = 'yearly' then
    v_year := extract(year from p_due_date)::integer + 1;
    v_month := p_anchor_month;
    v_target_month := pg_catalog.make_date(v_year, v_month, 1);
  else
    raise exception 'Unsupported recurring frequency';
  end if;

  v_day := least(
    p_anchor_day,
    extract(day from (v_target_month + interval '1 month - 1 day'))::integer
  );

  return v_target_month + (v_day - 1);
end;
$$;

revoke all on function public.next_recurring_due_date(date, text, integer, integer)
  from public, anon, authenticated;

create or replace function public._process_due_recurring_transactions(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (pg_catalog.now() at time zone 'UTC')::date;
  v_item record;
  v_due_date date;
  v_processed integer := 0;
  v_inserted integer;
  v_iteration integer;
begin
  if p_user_id is null then
    return 0;
  end if;

  for v_item in
    select
      r.id, r.user_id, r.context_id, r.account_id, r.name, r.amount,
      r.frequency, r.next_due_date as next_date, r.anchor_day, r.anchor_month,
      r.currency_code, a.currency_code as account_currency
    from public.recurring_expenses r
    join public.accounts a
      on a.id = r.account_id
     and a.user_id = r.user_id
     and a.context_id = r.context_id
     and a.is_active = true
    where r.user_id = p_user_id
      and r.is_active = true
      and r.account_id is not null
      and r.next_due_date <= v_today
      and upper(r.currency_code) = upper(a.currency_code)
    order by r.next_due_date, r.created_at
    for update of r skip locked
  loop
    v_due_date := v_item.next_date;

    for v_iteration in 1..120 loop
      exit when v_due_date > v_today;

      insert into public.transactions (
        user_id, context_id, account_id, transaction_type, amount,
        description, occurred_at, import_source, import_reference
      )
      values (
        v_item.user_id,
        v_item.context_id,
        v_item.account_id,
        'expense',
        v_item.amount,
        pg_catalog.left('Recorrência: ' || v_item.name, 120),
        v_due_date::timestamp at time zone 'UTC',
        'recurring_expense',
        v_item.id::text || ':' || pg_catalog.to_char(v_due_date, 'YYYY-MM-DD')
      )
      on conflict (user_id, context_id, import_source, import_reference)
      do nothing;

      get diagnostics v_inserted = row_count;
      v_processed := v_processed + v_inserted;
      v_due_date := public.next_recurring_due_date(
        v_due_date, v_item.frequency, v_item.anchor_day, v_item.anchor_month
      );
    end loop;

    update public.recurring_expenses
    set next_due_date = v_due_date,
        updated_at = pg_catalog.now()
    where id = v_item.id
      and user_id = v_item.user_id
      and context_id = v_item.context_id;
  end loop;

  for v_item in
    select
      r.id, r.user_id, r.context_id, r.account_id, r.name, r.amount,
      r.frequency, r.next_income_date as next_date, r.anchor_day, r.anchor_month,
      r.currency_code, a.currency_code as account_currency
    from public.recurring_incomes r
    join public.accounts a
      on a.id = r.account_id
     and a.user_id = r.user_id
     and a.context_id = r.context_id
     and a.is_active = true
    where r.user_id = p_user_id
      and r.is_active = true
      and r.account_id is not null
      and r.next_income_date <= v_today
      and upper(r.currency_code) = upper(a.currency_code)
    order by r.next_income_date, r.created_at
    for update of r skip locked
  loop
    v_due_date := v_item.next_date;

    for v_iteration in 1..120 loop
      exit when v_due_date > v_today;

      insert into public.transactions (
        user_id, context_id, account_id, transaction_type, amount,
        description, occurred_at, import_source, import_reference
      )
      values (
        v_item.user_id,
        v_item.context_id,
        v_item.account_id,
        'income',
        v_item.amount,
        pg_catalog.left('Recorrência: ' || v_item.name, 120),
        v_due_date::timestamp at time zone 'UTC',
        'recurring_income',
        v_item.id::text || ':' || pg_catalog.to_char(v_due_date, 'YYYY-MM-DD')
      )
      on conflict (user_id, context_id, import_source, import_reference)
      do nothing;

      get diagnostics v_inserted = row_count;
      v_processed := v_processed + v_inserted;
      v_due_date := public.next_recurring_due_date(
        v_due_date, v_item.frequency, v_item.anchor_day, v_item.anchor_month
      );
    end loop;

    update public.recurring_incomes
    set next_income_date = v_due_date,
        updated_at = pg_catalog.now()
    where id = v_item.id
      and user_id = v_item.user_id
      and context_id = v_item.context_id;
  end loop;

  return v_processed;
end;
$$;

revoke all on function public._process_due_recurring_transactions(uuid)
  from public, anon, authenticated;

create or replace function public.process_my_due_recurring_transactions()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  return public._process_due_recurring_transactions(v_user_id);
end;
$$;

revoke all on function public.process_my_due_recurring_transactions()
  from public, anon;
grant execute on function public.process_my_due_recurring_transactions()
  to authenticated;

-- Scheduled work resolves each user internally instead of accepting a user ID from an untrusted caller.
create or replace function public.process_due_recurring_transactions_all()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user record;
  v_total integer := 0;
begin
  for v_user in
    select distinct user_id
    from (
      select user_id from public.recurring_expenses where is_active = true
      union
      select user_id from public.recurring_incomes where is_active = true
    ) users
  loop
    v_total := v_total + public._process_due_recurring_transactions(v_user.user_id);
  end loop;
  return v_total;
end;
$$;

revoke all on function public.process_due_recurring_transactions()
  from public, anon, authenticated;
revoke all on function public.process_due_recurring_transactions_all()
  from public, anon, authenticated;
grant execute on function public.process_due_recurring_transactions_all()
  to postgres;

-- Supabase Cron runs independently of an open browser session.
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;
select cron.schedule(
  'moneyflow-recurring-transactions',
  '5 4 * * *',
  'select public.process_due_recurring_transactions_all()'
);

-- Only one platform connection is permitted per MoneyFlow user. The connection
-- is always pinned to the Silentra finance context and a EUR account.
create table if not exists public.silentra_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  context_id uuid not null references public.financial_contexts(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete restrict,
  account_name text not null,
  currency_code text not null default 'EUR' check (currency_code = 'EUR'),
  event_secret_hash text,
  status text not null default 'connected' check (status in ('connected', 'disconnected')),
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  disconnected_at timestamptz
);

alter table public.silentra_integrations enable row level security;
revoke all on public.silentra_integrations from public, anon, authenticated;
grant select on public.silentra_integrations to authenticated;

create policy silentra_integrations_select_own
  on public.silentra_integrations
  for select to authenticated
  using (user_id = (select auth.uid()));

create table if not exists public.silentra_pairing_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  context_id uuid not null references public.financial_contexts(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete restrict,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.silentra_pairing_tokens enable row level security;
revoke all on public.silentra_pairing_tokens from public, anon, authenticated;

create or replace function public.create_silentra_pairing(p_account_id uuid, p_token_hash text)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_context_id uuid;
  v_expires_at timestamptz := pg_catalog.now() + interval '15 minutes';
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid pairing token';
  end if;

  select a.context_id
    into v_context_id
  from public.accounts a
  join public.financial_contexts fc
    on fc.id = a.context_id
   and fc.user_id = a.user_id
   and fc.slug = 'silentra'
  where a.id = p_account_id
    and a.user_id = v_user_id
    and a.is_active = true
    and upper(a.currency_code) = 'EUR';

  if v_context_id is null then
    raise exception 'Choose an active EUR account in the Silentra context';
  end if;

  delete from public.silentra_pairing_tokens
  where user_id = v_user_id
    and (used_at is not null or expires_at <= pg_catalog.now());

  insert into public.silentra_pairing_tokens (
    token_hash, user_id, context_id, account_id, expires_at
  )
  values (p_token_hash, v_user_id, v_context_id, p_account_id, v_expires_at);

  return v_expires_at;
end;
$$;

revoke all on function public.create_silentra_pairing(uuid, text)
  from public, anon;
grant execute on function public.create_silentra_pairing(uuid, text)
  to authenticated;

create or replace function public.consume_silentra_pairing_token(
  p_token_hash text,
  p_event_secret_hash text
)
returns table (account_name text, currency_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pair public.silentra_pairing_tokens;
  v_account_name text;
  v_currency_code text;
begin
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$'
     or p_event_secret_hash is null or p_event_secret_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid pairing request';
  end if;

  select *
    into v_pair
  from public.silentra_pairing_tokens p
  where p.token_hash = p_token_hash
    and p.used_at is null
    and p.expires_at > pg_catalog.now()
  for update;

  if not found then
    raise exception 'Pairing token is invalid, expired or already used';
  end if;

  select a.name, a.currency_code
    into v_account_name, v_currency_code
  from public.accounts a
  where a.id = v_pair.account_id
    and a.user_id = v_pair.user_id
    and a.context_id = v_pair.context_id
    and a.is_active = true
    and upper(a.currency_code) = 'EUR';

  if v_account_name is null then
    raise exception 'The selected MoneyFlow account is no longer available';
  end if;

  update public.silentra_pairing_tokens
  set used_at = pg_catalog.now()
  where id = v_pair.id;

  insert into public.silentra_integrations (
    user_id, context_id, account_id, account_name, currency_code,
    event_secret_hash, status, connected_at, disconnected_at
  )
  values (
    v_pair.user_id, v_pair.context_id, v_pair.account_id,
    v_account_name, upper(v_currency_code), p_event_secret_hash,
    'connected', pg_catalog.now(), null
  )
  on conflict (user_id) do update
  set context_id = excluded.context_id,
      account_id = excluded.account_id,
      account_name = excluded.account_name,
      currency_code = excluded.currency_code,
      event_secret_hash = excluded.event_secret_hash,
      status = 'connected',
      connected_at = pg_catalog.now(),
      disconnected_at = null;

  return query select v_account_name, upper(v_currency_code);
end;
$$;

revoke all on function public.consume_silentra_pairing_token(text, text)
  from public, authenticated;
grant execute on function public.consume_silentra_pairing_token(text, text)
  to anon;

create or replace function public.process_silentra_platform_payment(
  p_event_secret_hash text,
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
  v_connection public.silentra_integrations;
  v_transaction_id uuid;
  v_inserted integer := 0;
  v_currency text := upper(coalesce(p_currency, ''));
begin
  if p_event_secret_hash is null or p_event_secret_hash !~ '^[a-f0-9]{64}$'
     or p_event_id is null or length(trim(p_event_id)) not between 1 and 200
     or p_amount is null or p_amount <= 0 or p_amount::text = 'NaN'
     or v_currency !~ '^[A-Z]{3}$'
     or p_description is null then
    raise exception 'Invalid platform payment event';
  end if;

  select *
    into v_connection
  from public.silentra_integrations i
  where i.event_secret_hash = p_event_secret_hash
    and i.status = 'connected'
  for update;

  if not found then
    raise exception 'Silentra integration is not connected';
  end if;

  if v_currency <> v_connection.currency_code then
    raise exception 'Payment currency does not match the linked MoneyFlow account';
  end if;

  if not exists (
    select 1
    from public.accounts a
    join public.financial_contexts fc on fc.id = a.context_id
    where a.id = v_connection.account_id
      and a.user_id = v_connection.user_id
      and a.context_id = v_connection.context_id
      and a.is_active = true
      and fc.slug = 'silentra'
  ) then
    raise exception 'The linked MoneyFlow account is no longer active';
  end if;

  insert into public.transactions (
    user_id, context_id, account_id, transaction_type, amount,
    description, occurred_at, import_source, import_reference
  )
  values (
    v_connection.user_id,
    v_connection.context_id,
    v_connection.account_id,
    'income',
    round(p_amount, 2),
    pg_catalog.left('Silentra for Barbers · ' || p_description, 120),
    coalesce(p_occurred_at, pg_catalog.now()),
    'silentra_platform',
    trim(p_event_id)
  )
  on conflict (user_id, context_id, import_source, import_reference)
  do nothing
  returning id into v_transaction_id;

  get diagnostics v_inserted = row_count;

  if v_transaction_id is null then
    select t.id into v_transaction_id
    from public.transactions t
    where t.user_id = v_connection.user_id
      and t.context_id = v_connection.context_id
      and t.import_source = 'silentra_platform'
      and t.import_reference = trim(p_event_id);
  end if;

  update public.silentra_integrations
  set last_synced_at = pg_catalog.now()
  where id = v_connection.id;

  return pg_catalog.jsonb_build_object(
    'ok', true,
    'inserted', v_inserted = 1,
    'transactionId', v_transaction_id,
    'externalReference', p_external_reference
  );
end;
$$;

revoke all on function public.process_silentra_platform_payment(text, text, numeric, text, timestamptz, text, text)
  from public, authenticated;
grant execute on function public.process_silentra_platform_payment(text, text, numeric, text, timestamptz, text, text)
  to anon;

create or replace function public.disconnect_silentra_integration()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.silentra_integrations
  set status = 'disconnected',
      event_secret_hash = null,
      disconnected_at = pg_catalog.now()
  where user_id = auth.uid();
end;
$$;

revoke all on function public.disconnect_silentra_integration()
  from public, anon;
grant execute on function public.disconnect_silentra_integration()
  to authenticated;

create or replace function public.disconnect_silentra_integration_by_secret_hash(
  p_event_secret_hash text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $
declare
  v_updated integer := 0;
begin
  if p_event_secret_hash is null or p_event_secret_hash !~ '^[a-f0-9]{64}
 then
    raise exception 'Invalid integration credential';
  end if;

  update public.silentra_integrations
  set status = 'disconnected',
      event_secret_hash = null,
      disconnected_at = pg_catalog.now()
  where event_secret_hash = p_event_secret_hash
    and status = 'connected';

  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$;

revoke all on function public.disconnect_silentra_integration_by_secret_hash(text)
  from public, authenticated;
grant execute on function public.disconnect_silentra_integration_by_secret_hash(text)
  to anon;

notify pgrst, 'reload schema';
