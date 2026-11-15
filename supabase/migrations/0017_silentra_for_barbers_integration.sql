-- Secure server-to-server integration with Silentra for Barbers.
-- MoneyFlow stores only a hash of the event secret; the raw secret remains
-- in the server-side credentials table of Silentra for Barbers.

create table if not exists public.silentra_pairing_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  context_id uuid not null,
  account_id uuid not null references public.accounts(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (context_id, user_id)
    references public.financial_contexts(id, user_id) on delete cascade
);

create index if not exists silentra_pairing_tokens_expiry_idx
  on public.silentra_pairing_tokens(expires_at)
  where consumed_at is null;

create table if not exists public.silentra_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  context_id uuid not null,
  account_id uuid not null references public.accounts(id) on delete restrict,
  account_name text not null,
  currency_code text not null default 'EUR' check (currency_code = 'EUR'),
  event_secret_hash text not null unique
    check (event_secret_hash ~ '^[a-f0-9]{64}$'),
  status text not null default 'connected'
    check (status in ('connected', 'disconnected')),
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id),
  foreign key (context_id, user_id)
    references public.financial_contexts(id, user_id) on delete cascade
);

create index if not exists silentra_integrations_user_idx
  on public.silentra_integrations(user_id, status);

alter table public.silentra_pairing_tokens enable row level security;
alter table public.silentra_integrations enable row level security;
revoke all on public.silentra_pairing_tokens from public, anon, authenticated;
revoke all on public.silentra_integrations from public, anon, authenticated;
grant select on public.silentra_integrations to authenticated;

create policy silentra_integrations_select_own
  on public.silentra_integrations
  for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.create_silentra_pairing(
  p_account_id uuid,
  p_token_hash text
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_context_id uuid;
  v_expires_at timestamptz := now() + interval '15 minutes';
begin
  if v_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;
  if p_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'INVALID_PAIRING_TOKEN';
  end if;

  select c.id into v_context_id
  from public.financial_contexts c
  join public.profiles p on p.id = c.user_id
  where c.user_id = v_user_id
    and c.slug = 'silentra'
    and p.active_finance_context = 'silentra';

  if v_context_id is null then
    raise exception 'SILENTRA_CONTEXT_NOT_ACTIVE';
  end if;

  if not exists (
    select 1 from public.accounts a
    where a.id = p_account_id
      and a.user_id = v_user_id
      and a.context_id = v_context_id
      and a.currency_code = 'EUR'
      and a.is_active
  ) then
    raise exception 'INVALID_SILENTRA_ACCOUNT';
  end if;

  insert into public.silentra_pairing_tokens (
    user_id, context_id, account_id, token_hash, expires_at
  )
  values (
    v_user_id, v_context_id, p_account_id, lower(p_token_hash), v_expires_at
  );

  return v_expires_at;
end;
$$;

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
  v_pairing public.silentra_pairing_tokens%rowtype;
  v_account_name text;
  v_currency_code text;
begin
  if p_token_hash !~ '^[a-f0-9]{64}$'
    or p_event_secret_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'INVALID_PAIRING_CREDENTIALS';
  end if;

  select p.* into v_pairing
  from public.silentra_pairing_tokens p
  where p.token_hash = lower(p_token_hash)
    and p.consumed_at is null
    and p.expires_at > now()
  for update;

  if not found then
    raise exception 'PAIRING_TOKEN_EXPIRED_OR_INVALID';
  end if;

  select a.name, a.currency_code
    into v_account_name, v_currency_code
  from public.accounts a
  join public.financial_contexts c
    on c.id = a.context_id and c.user_id = a.user_id
  where a.id = v_pairing.account_id
    and a.user_id = v_pairing.user_id
    and a.context_id = v_pairing.context_id
    and a.currency_code = 'EUR'
    and a.is_active
    and c.slug = 'silentra';

  if not found then
    raise exception 'SILENTRA_ACCOUNT_NOT_AVAILABLE';
  end if;

  insert into public.silentra_integrations (
    user_id, context_id, account_id, account_name, currency_code,
    event_secret_hash, status, connected_at, last_synced_at, updated_at
  )
  values (
    v_pairing.user_id, v_pairing.context_id, v_pairing.account_id,
    v_account_name, v_currency_code, lower(p_event_secret_hash),
    'connected', now(), null, now()
  )
  on conflict (user_id) do update
    set context_id = excluded.context_id,
        account_id = excluded.account_id,
        account_name = excluded.account_name,
        currency_code = excluded.currency_code,
        event_secret_hash = excluded.event_secret_hash,
        status = 'connected',
        connected_at = now(),
        last_synced_at = null,
        updated_at = now();

  update public.silentra_pairing_tokens
  set consumed_at = now()
  where id = v_pairing.id;

  return query select v_account_name, v_currency_code;
end;
$$;

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
  v_integration public.silentra_integrations%rowtype;
  v_transaction_id uuid;
  v_currency text;
begin
  if p_event_secret_hash !~ '^[a-f0-9]{64}$'
    or p_event_id is null
    or length(p_event_id) < 1
    or length(p_event_id) > 200
    or p_amount is null
    or p_amount <= 0
    or p_amount > 1000000
    or p_currency !~ '^[A-Za-z]{3}$'
    or p_occurred_at is null
    or p_description is null
    or length(trim(p_description)) < 1 then
    raise exception 'INVALID_SILENTRA_PAYMENT';
  end if;

  v_currency := upper(p_currency);

  select i.* into v_integration
  from public.silentra_integrations i
  where i.event_secret_hash = lower(p_event_secret_hash)
    and i.status = 'connected'
  for update;

  if not found then
    raise exception 'SILENTRA_INTEGRATION_NOT_CONNECTED';
  end if;

  if v_currency <> v_integration.currency_code then
    raise exception 'SILENTRA_PAYMENT_CURRENCY_MISMATCH';
  end if;

  if not exists (
    select 1 from public.accounts a
    where a.id = v_integration.account_id
      and a.user_id = v_integration.user_id
      and a.context_id = v_integration.context_id
      and a.currency_code = v_currency
      and a.is_active
  ) then
    raise exception 'SILENTRA_DESTINATION_ACCOUNT_INVALID';
  end if;

  insert into public.transactions (
    user_id, context_id, account_id, transaction_type, amount,
    description, notes, occurred_at, import_source, import_reference
  )
  values (
    v_integration.user_id, v_integration.context_id, v_integration.account_id,
    'income', round(p_amount, 2),
    left(trim(p_description), 160),
    case when p_external_reference is null then null
      else 'Referência: ' || left(p_external_reference, 200) end,
    p_occurred_at,
    'silentra_platform',
    p_event_id
  )
  on conflict (user_id, context_id, import_source, import_reference)
  do nothing
  returning id into v_transaction_id;

  update public.silentra_integrations
  set last_synced_at = now(), updated_at = now()
  where id = v_integration.id;

  return pg_catalog.jsonb_build_object(
    'ok', true,
    'inserted', v_transaction_id is not null
  );
end;
$$;

create or replace function public.disconnect_silentra_integration()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  update public.silentra_integrations
  set status = 'disconnected',
      event_secret_hash = encode(gen_random_bytes(32), 'hex'),
      updated_at = now()
  where user_id = v_user_id
    and status = 'connected';

  get diagnostics v_count = row_count;
  return v_count = 1;
end;
$$;

create or replace function public.disconnect_silentra_integration_by_secret_hash(
  p_event_secret_hash text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if p_event_secret_hash !~ '^[a-f0-9]{64}$' then
    return false;
  end if;

  update public.silentra_integrations
  set status = 'disconnected',
      event_secret_hash = encode(gen_random_bytes(32), 'hex'),
      updated_at = now()
  where event_secret_hash = lower(p_event_secret_hash)
    and status = 'connected';

  get diagnostics v_count = row_count;
  return v_count = 1;
end;
$$;

revoke all on function public.create_silentra_pairing(uuid, text)
  from public, anon;
revoke all on function public.consume_silentra_pairing_token(text, text)
  from public, authenticated;
revoke all on function public.process_silentra_platform_payment(text, text, numeric, text, timestamptz, text, text)
  from public, authenticated;
revoke all on function public.disconnect_silentra_integration()
  from public, anon;
revoke all on function public.disconnect_silentra_integration_by_secret_hash(text)
  from public, authenticated;

grant execute on function public.create_silentra_pairing(uuid, text)
  to authenticated;
grant execute on function public.consume_silentra_pairing_token(text, text)
  to anon, authenticated;
grant execute on function public.process_silentra_platform_payment(text, text, numeric, text, timestamptz, text, text)
  to anon, authenticated;
grant execute on function public.disconnect_silentra_integration()
  to authenticated;
grant execute on function public.disconnect_silentra_integration_by_secret_hash(text)
  to anon;

notify pgrst, 'reload schema';
