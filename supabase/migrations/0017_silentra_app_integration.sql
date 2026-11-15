-- Pair Silentra for Barbers with one EUR account in the user's Silentra context.
-- Long-lived sync credentials are stored only as SHA-256 hashes in MoneyFlow.

create table if not exists public.moneyflow_integration_pairings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  context_id uuid not null,
  account_id uuid not null references public.accounts(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (context_id, user_id)
    references public.financial_contexts(id, user_id) on delete cascade
);

create index if not exists moneyflow_pairings_expiry_idx
  on public.moneyflow_integration_pairings(expires_at)
  where consumed_at is null;

create table if not exists public.moneyflow_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  context_id uuid not null,
  account_id uuid not null references public.accounts(id) on delete restrict,
  provider text not null default 'silentra-for-barbers'
    check (provider = 'silentra-for-barbers'),
  token_hash text not null unique,
  status text not null default 'connected'
    check (status in ('connected', 'disconnected')),
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider),
  foreign key (context_id, user_id)
    references public.financial_contexts(id, user_id) on delete cascade
);

create index if not exists moneyflow_integrations_user_idx
  on public.moneyflow_integrations(user_id, provider, status);

alter table public.moneyflow_integration_pairings enable row level security;
alter table public.moneyflow_integrations enable row level security;

revoke all on public.moneyflow_integration_pairings
  from public, anon, authenticated;
grant insert on public.moneyflow_integration_pairings to authenticated;

create policy moneyflow_pairings_insert_own
  on public.moneyflow_integration_pairings
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.financial_contexts c
      where c.id = context_id
        and c.user_id = user_id
        and c.slug = 'silentra'
    )
    and exists (
      select 1 from public.accounts a
      where a.id = account_id
        and a.user_id = user_id
        and a.context_id = context_id
        and a.currency_code = 'EUR'
        and a.is_active
    )
  );

revoke all on public.moneyflow_integrations
  from public, anon, authenticated;
grant select on public.moneyflow_integrations to authenticated;

create policy moneyflow_integrations_select_own
  on public.moneyflow_integrations
  for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.claim_silentra_pairing(p_token_hash text)
returns table (
  connection_id uuid,
  account_name text,
  currency_code text,
  sync_token text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pairing public.moneyflow_integration_pairings%rowtype;
  v_account_name text;
  v_currency_code text;
  v_sync_token text;
  v_connection_id uuid;
begin
  if p_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'INVALID_PAIRING_TOKEN';
  end if;

  select p.* into v_pairing
  from public.moneyflow_integration_pairings p
  where p.token_hash = p_token_hash
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
    and a.is_active
    and a.currency_code = 'EUR'
    and c.slug = 'silentra';

  if not found then
    raise exception 'PAIRING_ACCOUNT_NOT_AVAILABLE';
  end if;

  v_sync_token := encode(gen_random_bytes(32), 'hex');

  insert into public.moneyflow_integrations (
    user_id, context_id, account_id, provider, token_hash,
    status, connected_at, last_synced_at, updated_at
  )
  values (
    v_pairing.user_id, v_pairing.context_id, v_pairing.account_id,
    'silentra-for-barbers',
    encode(digest(v_sync_token, 'sha256'), 'hex'),
    'connected', now(), null, now()
  )
  on conflict (user_id, provider) do update
    set context_id = excluded.context_id,
        account_id = excluded.account_id,
        token_hash = excluded.token_hash,
        status = 'connected',
        connected_at = now(),
        last_synced_at = null,
        updated_at = now()
  returning id into v_connection_id;

  update public.moneyflow_integration_pairings
  set consumed_at = now()
  where id = v_pairing.id;

  return query
  select v_connection_id, v_account_name, v_currency_code, v_sync_token;
end;
$$;

create or replace function public.record_silentra_platform_payment(
  p_sync_token_hash text,
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
  v_connection public.moneyflow_integrations%rowtype;
  v_account public.accounts%rowtype;
  v_transaction_id uuid;
  v_currency text;
begin
  if p_sync_token_hash !~ '^[a-f0-9]{64}$'
    or p_event_id is null
    or length(p_event_id) < 1
    or length(p_event_id) > 160
    or p_amount is null
    or p_amount <= 0
    or p_amount > 100000000
    or p_currency !~ '^[A-Za-z]{3}$'
    or p_occurred_at is null then
    raise exception 'INVALID_SILENTRA_PAYMENT';
  end if;

  v_currency := upper(p_currency);

  select i.* into v_connection
  from public.moneyflow_integrations i
  where i.token_hash = p_sync_token_hash
    and i.provider = 'silentra-for-barbers'
    and i.status = 'connected'
  for update;

  if not found then
    raise exception 'SILENTRA_INTEGRATION_NOT_CONNECTED';
  end if;

  select a.* into v_account
  from public.accounts a
  where a.id = v_connection.account_id
    and a.user_id = v_connection.user_id
    and a.context_id = v_connection.context_id
    and a.is_active
    and a.currency_code = v_currency;

  if not found then
    raise exception 'SILENTRA_DESTINATION_ACCOUNT_INVALID';
  end if;

  insert into public.transactions (
    user_id, context_id, account_id, transaction_type, amount,
    description, notes, occurred_at, import_source, import_reference
  )
  values (
    v_connection.user_id, v_connection.context_id, v_connection.account_id,
    'income', round(p_amount, 2),
    left(coalesce(nullif(trim(p_description), ''), 'Subscrição Silentra for Barbers'), 120),
    case when p_external_reference is null then null
      else 'Referência: ' || left(p_external_reference, 120) end,
    p_occurred_at,
    'silentra_platform',
    p_event_id
  )
  on conflict (user_id, context_id, import_source, import_reference)
  do nothing
  returning id into v_transaction_id;

  update public.moneyflow_integrations
  set last_synced_at = now(), updated_at = now()
  where id = v_connection.id;

  return pg_catalog.jsonb_build_object(
    'ok', true,
    'created', v_transaction_id is not null,
    'duplicate', v_transaction_id is null,
    'transactionId', v_transaction_id
  );
end;
$$;

create or replace function public.disconnect_silentra_integration(
  p_sync_token_hash text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.moneyflow_integrations
  set status = 'disconnected',
      token_hash = encode(gen_random_bytes(32), 'hex'),
      updated_at = now()
  where token_hash = p_sync_token_hash
    and provider = 'silentra-for-barbers'
    and status = 'connected';

  get diagnostics v_count = row_count;
  return v_count = 1;
end;
$$;

revoke all on function public.claim_silentra_pairing(text)
  from public, anon, authenticated;
revoke all on function public.record_silentra_platform_payment(text, text, numeric, text, timestamptz, text, text)
  from public, anon, authenticated;
revoke all on function public.disconnect_silentra_integration(text)
  from public, anon, authenticated;

grant execute on function public.claim_silentra_pairing(text) to service_role;
grant execute on function public.record_silentra_platform_payment(text, text, numeric, text, timestamptz, text, text)
  to service_role;
grant execute on function public.disconnect_silentra_integration(text) to service_role;

notify pgrst, 'reload schema';
