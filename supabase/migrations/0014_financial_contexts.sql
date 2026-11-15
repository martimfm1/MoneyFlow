-- Separate personal and Silentra finances without changing existing historical amounts.
-- Existing records are assigned to the Personal context.

create table public.financial_contexts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null check (slug in ('personal', 'silentra')),
  name text not null check (char_length(trim(name)) between 1 and 80),
  context_type text not null check (context_type in ('personal', 'business')),
  currency_code text not null default 'EUR' check (currency_code ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, slug),
  unique (id, user_id)
);

alter table public.financial_contexts enable row level security;

create policy "financial_contexts_select_own"
  on public.financial_contexts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Create the two spaces for existing users before moving any records.
insert into public.financial_contexts (user_id, slug, name, context_type, currency_code)
select id, 'personal', 'Pessoal', 'personal', currency_code
from public.profiles
on conflict (user_id, slug) do nothing;

insert into public.financial_contexts (user_id, slug, name, context_type, currency_code)
select id, 'silentra', 'Silentra', 'business', currency_code
from public.profiles
on conflict (user_id, slug) do nothing;

alter table public.accounts add column context_id uuid;
alter table public.categories add column context_id uuid;
alter table public.transactions add column context_id uuid;
alter table public.wishlist_items add column context_id uuid;
alter table public.goals add column context_id uuid;
alter table public.goal_contributions add column context_id uuid;
alter table public.budgets add column context_id uuid;
alter table public.recurring_incomes add column context_id uuid;
alter table public.recurring_expenses add column context_id uuid;

-- Preserve all current data in the Personal context.
update public.accounts as record
set context_id = context.id
from public.financial_contexts as context
where context.user_id = record.user_id
  and context.slug = 'personal';

update public.categories as record
set context_id = context.id
from public.financial_contexts as context
where context.user_id = record.user_id
  and context.slug = 'personal';

update public.transactions as record
set context_id = context.id
from public.financial_contexts as context
where context.user_id = record.user_id
  and context.slug = 'personal';

update public.wishlist_items as record
set context_id = context.id
from public.financial_contexts as context
where context.user_id = record.user_id
  and context.slug = 'personal';

update public.goals as record
set context_id = context.id
from public.financial_contexts as context
where context.user_id = record.user_id
  and context.slug = 'personal';

update public.goal_contributions as record
set context_id = context.id
from public.financial_contexts as context
where context.user_id = record.user_id
  and context.slug = 'personal';

update public.budgets as record
set context_id = context.id
from public.financial_contexts as context
where context.user_id = record.user_id
  and context.slug = 'personal';

update public.recurring_incomes as record
set context_id = context.id
from public.financial_contexts as context
where context.user_id = record.user_id
  and context.slug = 'personal';

update public.recurring_expenses as record
set context_id = context.id
from public.financial_contexts as context
where context.user_id = record.user_id
  and context.slug = 'personal';

alter table public.accounts alter column context_id set not null;
alter table public.categories alter column context_id set not null;
alter table public.transactions alter column context_id set not null;
alter table public.wishlist_items alter column context_id set not null;
alter table public.goals alter column context_id set not null;
alter table public.goal_contributions alter column context_id set not null;
alter table public.budgets alter column context_id set not null;
alter table public.recurring_incomes alter column context_id set not null;
alter table public.recurring_expenses alter column context_id set not null;

alter table public.accounts
  add constraint accounts_context_owner_fkey
  foreign key (context_id, user_id)
  references public.financial_contexts(id, user_id)
  on delete restrict;

alter table public.categories
  add constraint categories_context_owner_fkey
  foreign key (context_id, user_id)
  references public.financial_contexts(id, user_id)
  on delete restrict;

alter table public.transactions
  add constraint transactions_context_owner_fkey
  foreign key (context_id, user_id)
  references public.financial_contexts(id, user_id)
  on delete restrict;

alter table public.wishlist_items
  add constraint wishlist_items_context_owner_fkey
  foreign key (context_id, user_id)
  references public.financial_contexts(id, user_id)
  on delete restrict;

alter table public.goals
  add constraint goals_context_owner_fkey
  foreign key (context_id, user_id)
  references public.financial_contexts(id, user_id)
  on delete restrict;

alter table public.goal_contributions
  add constraint goal_contributions_context_owner_fkey
  foreign key (context_id, user_id)
  references public.financial_contexts(id, user_id)
  on delete restrict;

alter table public.budgets
  add constraint budgets_context_owner_fkey
  foreign key (context_id, user_id)
  references public.financial_contexts(id, user_id)
  on delete restrict;

alter table public.recurring_incomes
  add constraint recurring_incomes_context_owner_fkey
  foreign key (context_id, user_id)
  references public.financial_contexts(id, user_id)
  on delete restrict;

alter table public.recurring_expenses
  add constraint recurring_expenses_context_owner_fkey
  foreign key (context_id, user_id)
  references public.financial_contexts(id, user_id)
  on delete restrict;

-- Category names are unique within a financial context, not across the user's spaces.
alter table public.categories
  drop constraint if exists categories_user_id_name_key;

alter table public.categories
  add constraint categories_user_context_name_key
  unique (user_id, context_id, name);

-- The authenticated application only needs to read the user's available contexts.
grant select on public.financial_contexts to authenticated;

-- Existing users also receive their default category set in the new Silentra space.
insert into public.categories (user_id, context_id, name, icon, color, sort_order)
select
  context.user_id,
  context.id,
  defaults.name,
  defaults.icon,
  defaults.color,
  defaults.sort_order
from public.financial_contexts as context
cross join (values
  ('Alimentação', 'Utensils', 'orange', 10),
  ('Transportes', 'Car', 'blue', 20),
  ('Casa', 'House', 'violet', 30),
  ('Lazer', 'Gamepad2', 'pink', 40),
  ('Compras', 'ShoppingBag', 'amber', 50),
  ('Saúde', 'HeartPulse', 'rose', 60),
  ('Subscrições', 'Repeat', 'cyan', 70),
  ('Educação', 'GraduationCap', 'emerald', 80)
) as defaults(name, icon, color, sort_order)
where context.slug = 'silentra'
on conflict (user_id, context_id, name) do nothing;

create index accounts_context_idx
  on public.accounts(user_id, context_id, is_active);

create index categories_context_idx
  on public.categories(user_id, context_id, sort_order);

create index transactions_context_date_idx
  on public.transactions(user_id, context_id, occurred_at desc);

create index wishlist_items_context_idx
  on public.wishlist_items(user_id, context_id, status, priority);

create index goals_context_idx
  on public.goals(user_id, context_id, priority);

create index goal_contributions_context_idx
  on public.goal_contributions(user_id, context_id, contributed_at desc);

create index budgets_context_month_idx
  on public.budgets(user_id, context_id, month_start);

create index recurring_incomes_context_date_idx
  on public.recurring_incomes(user_id, context_id, next_income_date);

create index recurring_expenses_context_date_idx
  on public.recurring_expenses(user_id, context_id, next_due_date);

-- Seed the standard categories into both spaces for new users.
create or replace function public.seed_default_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, context_id, name, icon, color, sort_order)
  select
    new.id,
    context.id,
    defaults.name,
    defaults.icon,
    defaults.color,
    defaults.sort_order
  from public.financial_contexts as context
  cross join (values
    ('Alimentação', 'Utensils', 'orange', 10),
    ('Transportes', 'Car', 'blue', 20),
    ('Casa', 'House', 'violet', 30),
    ('Lazer', 'Gamepad2', 'pink', 40),
    ('Compras', 'ShoppingBag', 'amber', 50),
    ('Saúde', 'HeartPulse', 'rose', 60),
    ('Subscrições', 'Repeat', 'cyan', 70),
    ('Educação', 'GraduationCap', 'emerald', 80)
  ) as defaults(name, icon, color, sort_order)
  where context.user_id = new.id
  on conflict (user_id, context_id, name) do nothing;

  return new;
end;
$$;

-- Ensure both spaces exist before the profile insert triggers category seeding.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.financial_contexts (user_id, slug, name, context_type)
  values
    (new.id, 'personal', 'Pessoal', 'personal'),
    (new.id, 'silentra', 'Silentra', 'business')
  on conflict (user_id, slug) do nothing;

  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Protect against linking related records across financial contexts.
create or replace function public.validate_financial_context_links()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_table_name = 'transactions' then
    if not exists (
      select 1 from public.accounts
      where id = new.account_id
        and user_id = new.user_id
        and context_id = new.context_id
    ) then
      raise exception 'Transaction account must belong to the same financial context';
    end if;

    if new.category_id is not null and not exists (
      select 1 from public.categories
      where id = new.category_id
        and user_id = new.user_id
        and context_id = new.context_id
    ) then
      raise exception 'Transaction category must belong to the same financial context';
    end if;
  elsif tg_table_name = 'goals' then
    if new.wishlist_item_id is not null and not exists (
      select 1 from public.wishlist_items
      where id = new.wishlist_item_id
        and user_id = new.user_id
        and context_id = new.context_id
    ) then
      raise exception 'Wishlist item must belong to the same financial context';
    end if;
  elsif tg_table_name = 'goal_contributions' then
    if not exists (
      select 1 from public.goals
      where id = new.goal_id
        and user_id = new.user_id
        and context_id = new.context_id
    ) then
      raise exception 'Goal must belong to the same financial context';
    end if;
  elsif tg_table_name = 'budgets' then
    if not exists (
      select 1 from public.categories
      where id = new.category_id
        and user_id = new.user_id
        and context_id = new.context_id
    ) then
      raise exception 'Budget category must belong to the same financial context';
    end if;
  elsif tg_table_name = 'recurring_incomes' or tg_table_name = 'recurring_expenses' then
    if new.account_id is not null and not exists (
      select 1 from public.accounts
      where id = new.account_id
        and user_id = new.user_id
        and context_id = new.context_id
    ) then
      raise exception 'Recurring account must belong to the same financial context';
    end if;
  end if;

  return new;
end;
$$;

create trigger transactions_validate_context
  before insert or update on public.transactions
  for each row execute procedure public.validate_financial_context_links();

create trigger goals_validate_context
  before insert or update on public.goals
  for each row execute procedure public.validate_financial_context_links();

create trigger goal_contributions_validate_context
  before insert or update on public.goal_contributions
  for each row execute procedure public.validate_financial_context_links();

create trigger budgets_validate_context
  before insert or update on public.budgets
  for each row execute procedure public.validate_financial_context_links();

create trigger recurring_incomes_validate_context
  before insert or update on public.recurring_incomes
  for each row execute procedure public.validate_financial_context_links();

create trigger recurring_expenses_validate_context
  before insert or update on public.recurring_expenses
  for each row execute procedure public.validate_financial_context_links();

-- During onboarding, the selected primary currency is copied to both spaces.
-- Each context can later evolve its currency independently in its own settings.
create or replace function public.sync_financial_context_currency()
returns trigger
language plpgsql
security definer
set search_path = public
as $sync_financial_context_currency$
begin
  if new.currency_code is distinct from old.currency_code then
    update public.financial_contexts
    set currency_code = new.currency_code,
        updated_at = timezone('utc', now())
    where user_id = new.id;
  end if;

  return new;
end;
$sync_financial_context_currency$;

create trigger profiles_sync_financial_context_currency
  after update of currency_code on public.profiles
  for each row execute procedure public.sync_financial_context_currency();
