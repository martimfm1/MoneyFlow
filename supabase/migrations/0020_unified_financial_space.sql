-- Consolidate Personal and Silentra finances into one user-owned financial space.
-- Existing records stay attached to their original account and keep their amounts.

insert into public.financial_contexts (user_id, slug, name, context_type, currency_code)
select profile.id, 'personal', 'Financeiro', 'personal', profile.currency_code
from public.profiles as profile
on conflict (user_id, slug) do nothing;

update public.financial_contexts
set name = 'Financeiro', context_type = 'personal', updated_at = timezone('utc', now())
where slug = 'personal';

-- Merge same-name Silentra categories into their existing Personal counterpart.
create temporary table moneyflow_category_merge on commit drop as
select distinct on (source_category.id)
  source_category.id as source_id,
  target_category.id as target_id
from public.categories as source_category
join public.financial_contexts as source_context
  on source_context.id = source_category.context_id
 and source_context.user_id = source_category.user_id
 and source_context.slug = 'silentra'
join public.financial_contexts as target_context
  on target_context.user_id = source_context.user_id
 and target_context.slug = 'personal'
join public.categories as target_category
  on target_category.user_id = source_category.user_id
 and target_category.context_id = target_context.id
 and target_category.name = source_category.name
order by source_category.id, target_category.created_at, target_category.id;

-- Deduplicate imported events across both former contexts.
with ranked_imports as (
  select transaction.id,
    row_number() over (
      partition by transaction.user_id, transaction.import_source, transaction.import_reference
      order by case when context.slug = 'personal' then 0 else 1 end,
               transaction.created_at, transaction.id
    ) as row_number
  from public.transactions as transaction
  join public.financial_contexts as context on context.id = transaction.context_id
  where transaction.import_source is not null
    and transaction.import_reference is not null
)
delete from public.transactions as transaction
using ranked_imports
where transaction.id = ranked_imports.id and ranked_imports.row_number > 1;

-- Move accounts and non-duplicate categories first.
update public.accounts as account
set context_id = target_context.id
from public.financial_contexts as source_context
join public.financial_contexts as target_context
  on target_context.user_id = source_context.user_id and target_context.slug = 'personal'
where account.context_id = source_context.id and source_context.slug = 'silentra';

update public.categories as category
set context_id = target_context.id
from public.financial_contexts as source_context
join public.financial_contexts as target_context
  on target_context.user_id = source_context.user_id and target_context.slug = 'personal'
where category.context_id = source_context.id
  and source_context.slug = 'silentra'
  and not exists (
    select 1 from moneyflow_category_merge as category_merge
    where category_merge.source_id = category.id
  );

update public.wishlist_items as item
set context_id = target_context.id
from public.financial_contexts as source_context
join public.financial_contexts as target_context
  on target_context.user_id = source_context.user_id and target_context.slug = 'personal'
where item.context_id = source_context.id and source_context.slug = 'silentra';

-- Move child rows and remap categories together, keeping trigger checks valid.
update public.transactions as transaction
set context_id = target_context.id,
    category_id = coalesce(
      (select category_merge.target_id from moneyflow_category_merge as category_merge
       where category_merge.source_id = transaction.category_id),
      transaction.category_id
    )
from public.financial_contexts as source_context
join public.financial_contexts as target_context
  on target_context.user_id = source_context.user_id and target_context.slug = 'personal'
where transaction.context_id = source_context.id and source_context.slug = 'silentra';

update public.budgets as budget
set context_id = target_context.id,
    category_id = coalesce(
      (select category_merge.target_id from moneyflow_category_merge as category_merge
       where category_merge.source_id = budget.category_id),
      budget.category_id
    )
from public.financial_contexts as source_context
join public.financial_contexts as target_context
  on target_context.user_id = source_context.user_id and target_context.slug = 'personal'
where budget.context_id = source_context.id and source_context.slug = 'silentra';

delete from public.categories as source_category
using moneyflow_category_merge as category_merge
where source_category.id = category_merge.source_id;

update public.goals as goal
set context_id = target_context.id
from public.financial_contexts as source_context
join public.financial_contexts as target_context
  on target_context.user_id = source_context.user_id and target_context.slug = 'personal'
where goal.context_id = source_context.id and source_context.slug = 'silentra';

update public.goal_contributions as contribution
set context_id = target_context.id
from public.financial_contexts as source_context
join public.financial_contexts as target_context
  on target_context.user_id = source_context.user_id and target_context.slug = 'personal'
where contribution.context_id = source_context.id and source_context.slug = 'silentra';

update public.recurring_incomes as recurring
set context_id = target_context.id
from public.financial_contexts as source_context
join public.financial_contexts as target_context
  on target_context.user_id = source_context.user_id and target_context.slug = 'personal'
where recurring.context_id = source_context.id and source_context.slug = 'silentra';

update public.recurring_expenses as recurring
set context_id = target_context.id
from public.financial_contexts as source_context
join public.financial_contexts as target_context
  on target_context.user_id = source_context.user_id and target_context.slug = 'personal'
where recurring.context_id = source_context.id and source_context.slug = 'silentra';

update public.moneyflow_integration_pairings as pairing
set context_id = target_context.id
from public.financial_contexts as source_context
join public.financial_contexts as target_context
  on target_context.user_id = source_context.user_id and target_context.slug = 'personal'
where pairing.context_id = source_context.id and source_context.slug = 'silentra';

update public.moneyflow_integrations as integration
set context_id = target_context.id
from public.financial_contexts as source_context
join public.financial_contexts as target_context
  on target_context.user_id = source_context.user_id and target_context.slug = 'personal'
where integration.context_id = source_context.id and source_context.slug = 'silentra';

delete from public.financial_contexts where slug = 'silentra';

alter table public.financial_contexts drop constraint if exists financial_contexts_slug_check;
alter table public.financial_contexts add constraint financial_contexts_slug_check check (slug = 'personal');

update public.profiles
set active_finance_context = 'personal', updated_at = timezone('utc', now())
where active_finance_context is distinct from 'personal';

alter table public.profiles alter column active_finance_context set default 'personal';
alter table public.profiles drop constraint if exists profiles_active_finance_context_check;
alter table public.profiles add constraint profiles_active_finance_context_check
  check (active_finance_context = 'personal');

create or replace function public.can_access_financial_context(target_context_id uuid)
returns boolean language sql stable security invoker set search_path = public
as $$
  select exists (
    select 1 from public.financial_contexts as context
    where context.id = target_context_id
      and context.user_id = (select auth.uid())
      and context.slug = 'personal'
  );
$$;

create or replace function public.can_write_financial_context(target_context_id uuid)
returns boolean language sql stable security invoker set search_path = public
as $$
  select exists (
    select 1 from public.financial_contexts as context
    where context.id = target_context_id
      and context.user_id = (select auth.uid())
      and context.slug = 'personal'
  );
$$;

-- New accounts now receive only one canonical context; the existing category
-- seed trigger runs after the profile insert and therefore seeds only this row.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.financial_contexts (user_id, slug, name, context_type)
  values (new.id, 'personal', 'Financeiro', 'personal')
  on conflict (user_id, slug) do nothing;

  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop policy if exists moneyflow_pairings_insert_own on public.moneyflow_integration_pairings;
create policy moneyflow_pairings_insert_own
  on public.moneyflow_integration_pairings for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.financial_contexts as context
      where context.id = context_id and context.user_id = user_id and context.slug = 'personal'
    )
    and exists (
      select 1 from public.accounts as account
      where account.id = account_id and account.user_id = user_id
        and account.context_id = context_id and account.currency_code = 'EUR' and account.is_active
    )
  );

create or replace function public.claim_silentra_pairing(p_token_hash text)
returns table (connection_id uuid, account_name text, currency_code text, sync_token text)
language plpgsql security definer set search_path = ''
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

  select pairing.* into v_pairing
  from public.moneyflow_integration_pairings as pairing
  where pairing.token_hash = p_token_hash
    and pairing.consumed_at is null
    and pairing.expires_at > now()
  for update;

  if not found then
    raise exception 'PAIRING_TOKEN_EXPIRED_OR_INVALID';
  end if;

  select account.name, account.currency_code
    into v_account_name, v_currency_code
  from public.accounts as account
  join public.financial_contexts as context
    on context.id = account.context_id and context.user_id = account.user_id
  where account.id = v_pairing.account_id
    and account.user_id = v_pairing.user_id
    and account.context_id = v_pairing.context_id
    and account.is_active and account.currency_code = 'EUR'
    and context.slug = 'personal';

  if not found then
    raise exception 'PAIRING_ACCOUNT_NOT_AVAILABLE';
  end if;

  v_sync_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.moneyflow_integrations (
    user_id, context_id, account_id, provider, token_hash,
    status, connected_at, last_synced_at, updated_at
  )
  values (
    v_pairing.user_id, v_pairing.context_id, v_pairing.account_id,
    'silentra-for-barbers',
    encode(extensions.digest(v_sync_token, 'sha256'), 'hex'),
    'connected', now(), null, now()
  )
  on conflict (user_id, provider) do update
    set context_id = excluded.context_id,
        account_id = excluded.account_id,
        token_hash = excluded.token_hash,
        status = 'connected', connected_at = now(),
        last_synced_at = null, updated_at = now()
  returning id into v_connection_id;

  update public.moneyflow_integration_pairings
  set consumed_at = now()
  where id = v_pairing.id;

  return query select v_connection_id, v_account_name, v_currency_code, v_sync_token;
end;
$$;

notify pgrst, 'reload schema';
