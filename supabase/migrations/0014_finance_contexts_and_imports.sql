-- Finance contexts: one shared data model with strict per-context RLS.
-- Existing records remain in Personal; General is a read-only aggregate view.

alter table public.profiles
  add column if not exists active_finance_context text not null default 'personal'
  check (active_finance_context in ('personal', 'silentra', 'general'));

alter table public.accounts add column if not exists finance_context text not null default 'personal'
  check (finance_context in ('personal', 'silentra'));
alter table public.categories add column if not exists finance_context text not null default 'personal'
  check (finance_context in ('personal', 'silentra'));
alter table public.transactions add column if not exists finance_context text not null default 'personal'
  check (finance_context in ('personal', 'silentra'));
alter table public.wishlist_items add column if not exists finance_context text not null default 'personal'
  check (finance_context in ('personal', 'silentra'));
alter table public.goals add column if not exists finance_context text not null default 'personal'
  check (finance_context in ('personal', 'silentra'));
alter table public.goal_contributions add column if not exists finance_context text not null default 'personal'
  check (finance_context in ('personal', 'silentra'));
alter table public.budgets add column if not exists finance_context text not null default 'personal'
  check (finance_context in ('personal', 'silentra'));
alter table public.recurring_expenses add column if not exists finance_context text not null default 'personal'
  check (finance_context in ('personal', 'silentra'));
alter table public.recurring_incomes add column if not exists finance_context text not null default 'personal'
  check (finance_context in ('personal', 'silentra'));

-- Import metadata supports safe repeat imports without exposing bank credentials.
alter table public.transactions
  add column if not exists import_source text,
  add column if not exists import_reference text;

alter table public.transactions
  drop constraint if exists transactions_import_metadata_pair_check;
alter table public.transactions
  add constraint transactions_import_metadata_pair_check
  check ((import_source is null) = (import_reference is null));

drop index if exists public.transactions_import_dedupe_idx;
create unique index transactions_import_dedupe_idx
  on public.transactions(user_id, finance_context, import_source, import_reference);

-- Category names are unique within a context, not across the whole user account.
alter table public.categories
  drop constraint if exists categories_user_id_name_key;
alter table public.categories
  drop constraint if exists categories_user_context_name_key;
alter table public.categories
  add constraint categories_user_context_name_key
  unique (user_id, finance_context, name);

create index if not exists accounts_user_context_idx
  on public.accounts(user_id, finance_context, is_active);
create index if not exists categories_user_context_sort_idx
  on public.categories(user_id, finance_context, sort_order, name);
create index if not exists transactions_user_context_date_idx
  on public.transactions(user_id, finance_context, occurred_at desc);
create index if not exists wishlist_user_context_idx
  on public.wishlist_items(user_id, finance_context, priority, created_at desc);
create index if not exists goals_user_context_idx
  on public.goals(user_id, finance_context, priority, created_at desc);
create index if not exists contributions_user_context_idx
  on public.goal_contributions(user_id, finance_context, goal_id, contributed_at desc);
create index if not exists budgets_user_context_month_idx
  on public.budgets(user_id, finance_context, month_start);
create index if not exists recurring_expenses_user_context_due_idx
  on public.recurring_expenses(user_id, finance_context, next_due_date);
create index if not exists recurring_incomes_user_context_date_idx
  on public.recurring_incomes(user_id, finance_context, next_income_date);

-- General can read both contexts. Personal and Silentra can only read their own context.
create or replace function public.can_access_finance_context(target_context text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and (
        p.active_finance_context = 'general'
        or p.active_finance_context = target_context
      )
  );
$$;

-- New records inherit the active context. In General, forms may explicitly choose one;
-- the column default keeps an unspecified new record in Personal.
create or replace function public.can_write_finance_context(target_context text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.active_finance_context = target_context
  );
$;

create or replace function public.assign_active_finance_context()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  active_context text;
begin
  select p.active_finance_context
    into active_context
  from public.profiles p
  where p.id = (select auth.uid());

  if active_context in ('personal', 'silentra') then
    new.finance_context := active_context;
  end if;

  return new;
end;
$$;

drop trigger if exists accounts_assign_finance_context on public.accounts;
create trigger accounts_assign_finance_context
before insert on public.accounts
for each row execute function public.assign_active_finance_context();

drop trigger if exists categories_assign_finance_context on public.categories;
create trigger categories_assign_finance_context
before insert on public.categories
for each row execute function public.assign_active_finance_context();

drop trigger if exists transactions_assign_finance_context on public.transactions;
create trigger transactions_assign_finance_context
before insert on public.transactions
for each row execute function public.assign_active_finance_context();

drop trigger if exists wishlist_assign_finance_context on public.wishlist_items;
create trigger wishlist_assign_finance_context
before insert on public.wishlist_items
for each row execute function public.assign_active_finance_context();

drop trigger if exists goals_assign_finance_context on public.goals;
create trigger goals_assign_finance_context
before insert on public.goals
for each row execute function public.assign_active_finance_context();

drop trigger if exists goal_contributions_assign_finance_context on public.goal_contributions;
create trigger goal_contributions_assign_finance_context
before insert on public.goal_contributions
for each row execute function public.assign_active_finance_context();

drop trigger if exists budgets_assign_finance_context on public.budgets;
create trigger budgets_assign_finance_context
before insert on public.budgets
for each row execute function public.assign_active_finance_context();

drop trigger if exists recurring_expenses_assign_finance_context on public.recurring_expenses;
create trigger recurring_expenses_assign_finance_context
before insert on public.recurring_expenses
for each row execute function public.assign_active_finance_context();

drop trigger if exists recurring_incomes_assign_finance_context on public.recurring_incomes;
create trigger recurring_incomes_assign_finance_context
before insert on public.recurring_incomes
for each row execute function public.assign_active_finance_context();

-- Rebuild policies with context checks and cross-table context consistency.
drop policy if exists accounts_own on public.accounts;
create policy accounts_select_own_context on public.accounts
for select using (
  auth.uid() = user_id
  and public.can_access_finance_context(finance_context)
);
create policy accounts_insert_own_context on public.accounts
for insert with check (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
);
create policy accounts_update_own_context on public.accounts
for update using (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
)
with check (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
);
create policy accounts_delete_own_context on public.accounts
for delete using (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
);

drop policy if exists categories_own on public.categories;
create policy categories_select_own_context on public.categories
for select using (
  auth.uid() = user_id
  and public.can_access_finance_context(finance_context)
);
create policy categories_insert_own_context on public.categories
for insert with check (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
);
create policy categories_update_own_context on public.categories
for update using (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
)
with check (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
);
create policy categories_delete_own_context on public.categories
for delete using (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
);

drop policy if exists transactions_select_own on public.transactions;
drop policy if exists transactions_delete_own on public.transactions;
drop policy if exists transactions_insert_own on public.transactions;
drop policy if exists transactions_update_own on public.transactions;
drop policy if exists transactions_account_and_category_own on public.transactions;
drop policy if exists transactions_account_and_category_own_update on public.transactions;
create policy transactions_select_own_context on public.transactions
for select using (
  auth.uid() = user_id
  and public.can_access_finance_context(finance_context)
);
create policy transactions_insert_own_context on public.transactions
for insert with check (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
  and exists (
    select 1 from public.accounts a
    where a.id = account_id
      and a.user_id = auth.uid()
      and a.finance_context = public.transactions.finance_context
  )
  and (
    category_id is null
    or exists (
      select 1 from public.categories c
      where c.id = category_id
        and c.user_id = auth.uid()
        and c.finance_context = public.transactions.finance_context
    )
  )
);
create policy transactions_update_own_context on public.transactions
for update using (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
)
with check (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
  and exists (
    select 1 from public.accounts a
    where a.id = account_id
      and a.user_id = auth.uid()
      and a.finance_context = public.transactions.finance_context
  )
  and (
    category_id is null
    or exists (
      select 1 from public.categories c
      where c.id = category_id
        and c.user_id = auth.uid()
        and c.finance_context = public.transactions.finance_context
    )
  )
);
create policy transactions_delete_own_context on public.transactions
for delete using (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
);

drop policy if exists wishlist_own on public.wishlist_items;
create policy wishlist_select_own_context on public.wishlist_items
for select using (
  auth.uid() = user_id
  and public.can_access_finance_context(finance_context)
);
create policy wishlist_insert_own_context on public.wishlist_items
for insert with check (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
);
create policy wishlist_update_own_context on public.wishlist_items
for update using (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
)
with check (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
);
create policy wishlist_delete_own_context on public.wishlist_items
for delete using (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
);

drop policy if exists goals_select_own on public.goals;
drop policy if exists goals_delete_own on public.goals;
drop policy if exists goals_insert_own on public.goals;
drop policy if exists goals_update_own on public.goals;
drop policy if exists goals_wishlist_own on public.goals;
drop policy if exists goals_wishlist_own_update on public.goals;
create policy goals_select_own_context on public.goals
for select using (
  auth.uid() = user_id
  and public.can_access_finance_context(finance_context)
);
create policy goals_insert_own_context on public.goals
for insert with check (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
  and (
    wishlist_item_id is null
    or exists (
      select 1 from public.wishlist_items w
      where w.id = wishlist_item_id
        and w.user_id = auth.uid()
        and w.finance_context = public.goals.finance_context
    )
  )
);
create policy goals_update_own_context on public.goals
for update using (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
)
with check (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
  and (
    wishlist_item_id is null
    or exists (
      select 1 from public.wishlist_items w
      where w.id = wishlist_item_id
        and w.user_id = auth.uid()
        and w.finance_context = public.goals.finance_context
    )
  )
);
create policy goals_delete_own_context on public.goals
for delete using (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
);

drop policy if exists goal_contributions_select_own on public.goal_contributions;
drop policy if exists goal_contributions_delete_own on public.goal_contributions;
drop policy if exists goal_contributions_insert_own on public.goal_contributions;
drop policy if exists goal_contributions_update_own on public.goal_contributions;
drop policy if exists goal_contributions_goal_own on public.goal_contributions;
drop policy if exists goal_contributions_goal_own_update on public.goal_contributions;
create policy goal_contributions_select_own_context on public.goal_contributions
for select using (
  auth.uid() = user_id
  and public.can_access_finance_context(finance_context)
);
create policy goal_contributions_insert_own_context on public.goal_contributions
for insert with check (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
  and exists (
    select 1 from public.goals g
    where g.id = goal_id
      and g.user_id = auth.uid()
      and g.finance_context = public.goal_contributions.finance_context
  )
);
create policy goal_contributions_update_own_context on public.goal_contributions
for update using (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
)
with check (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
  and exists (
    select 1 from public.goals g
    where g.id = goal_id
      and g.user_id = auth.uid()
      and g.finance_context = public.goal_contributions.finance_context
  )
);
create policy goal_contributions_delete_own_context on public.goal_contributions
for delete using (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
);

drop policy if exists budgets_select_own on public.budgets;
drop policy if exists budgets_insert_own on public.budgets;
drop policy if exists budgets_update_own on public.budgets;
drop policy if exists budgets_delete_own on public.budgets;
create policy budgets_select_own_context on public.budgets
for select using (
  auth.uid() = user_id
  and public.can_access_finance_context(finance_context)
);
create policy budgets_insert_own_context on public.budgets
for insert with check (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
  and exists (
    select 1 from public.categories c
    where c.id = category_id
      and c.user_id = auth.uid()
      and c.finance_context = public.budgets.finance_context
  )
);
create policy budgets_update_own_context on public.budgets
for update using (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
)
with check (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
  and exists (
    select 1 from public.categories c
    where c.id = category_id
      and c.user_id = auth.uid()
      and c.finance_context = public.budgets.finance_context
  )
);
create policy budgets_delete_own_context on public.budgets
for delete using (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
);

drop policy if exists recurring_expenses_own on public.recurring_expenses;
create policy recurring_expenses_select_own_context on public.recurring_expenses
for select using (
  auth.uid() = user_id
  and public.can_access_finance_context(finance_context)
);
create policy recurring_expenses_insert_own_context on public.recurring_expenses
for insert with check (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
  and (
    account_id is null
    or exists (
      select 1 from public.accounts a
      where a.id = account_id
        and a.user_id = auth.uid()
        and a.finance_context = public.recurring_expenses.finance_context
    )
  )
);
create policy recurring_expenses_update_own_context on public.recurring_expenses
for update using (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
)
with check (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
  and (
    account_id is null
    or exists (
      select 1 from public.accounts a
      where a.id = account_id
        and a.user_id = auth.uid()
        and a.finance_context = public.recurring_expenses.finance_context
    )
  )
);
create policy recurring_expenses_delete_own_context on public.recurring_expenses
for delete using (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
);

drop policy if exists recurring_incomes_own on public.recurring_incomes;
create policy recurring_incomes_select_own_context on public.recurring_incomes
for select using (
  auth.uid() = user_id
  and public.can_access_finance_context(finance_context)
);
create policy recurring_incomes_insert_own_context on public.recurring_incomes
for insert with check (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
  and (
    account_id is null
    or exists (
      select 1 from public.accounts a
      where a.id = account_id
        and a.user_id = auth.uid()
        and a.finance_context = public.recurring_incomes.finance_context
    )
  )
);
create policy recurring_incomes_update_own_context on public.recurring_incomes
for update using (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
)
with check (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
  and (
    account_id is null
    or exists (
      select 1 from public.accounts a
      where a.id = account_id
        and a.user_id = auth.uid()
        and a.finance_context = public.recurring_incomes.finance_context
    )
  )
);
create policy recurring_incomes_delete_own_context on public.recurring_incomes
for delete using (
  auth.uid() = user_id
  and public.can_write_finance_context(finance_context)
);
