-- Store the active context in the database so RLS can enforce it for direct Data API calls.
alter table public.profiles
  add column if not exists active_finance_context text not null default 'personal';

alter table public.profiles
  drop constraint if exists profiles_active_finance_context_check;

alter table public.profiles
  add constraint profiles_active_finance_context_check
  check (active_finance_context in ('personal', 'silentra', 'general'));

-- General is a read-only aggregate context. It can read both spaces, while
-- Personal and Silentra can only read/write their own financial_context row.
create or replace function public.can_access_financial_context(target_context_id uuid)
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
        or exists (
          select 1
          from public.financial_contexts context
          where context.id = target_context_id
            and context.user_id = p.id
            and context.slug = p.active_finance_context
        )
      )
  );
$$;

create or replace function public.can_write_financial_context(target_context_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.financial_contexts context
      on context.user_id = p.id
     and context.id = target_context_id
    where p.id = (select auth.uid())
      and p.active_finance_context in ('personal', 'silentra')
      and context.slug = p.active_finance_context
  );
$$;

-- Replace the legacy user-only policies with context-aware policies.
drop policy if exists "accounts_own" on public.accounts;
drop policy if exists "categories_own" on public.categories;
drop policy if exists "transactions_own" on public.transactions;
drop policy if exists "transactions_select_own" on public.transactions;
drop policy if exists "transactions_delete_own" on public.transactions;
drop policy if exists "transactions_insert_own" on public.transactions;
drop policy if exists "transactions_update_own" on public.transactions;
drop policy if exists "transactions_account_and_category_own" on public.transactions;
drop policy if exists "transactions_account_and_category_own_update" on public.transactions;
drop policy if exists "wishlist_own" on public.wishlist_items;
drop policy if exists "goals_own" on public.goals;
drop policy if exists "goals_select_own" on public.goals;
drop policy if exists "goals_delete_own" on public.goals;
drop policy if exists "goals_insert_own" on public.goals;
drop policy if exists "goals_update_own" on public.goals;
drop policy if exists "goals_wishlist_own" on public.goals;
drop policy if exists "goals_wishlist_own_update" on public.goals;
drop policy if exists "goal_contributions_own" on public.goal_contributions;
drop policy if exists "goal_contributions_select_own" on public.goal_contributions;
drop policy if exists "goal_contributions_delete_own" on public.goal_contributions;
drop policy if exists "goal_contributions_insert_own" on public.goal_contributions;
drop policy if exists "goal_contributions_update_own" on public.goal_contributions;
drop policy if exists "goal_contributions_goal_own" on public.goal_contributions;
drop policy if exists "goal_contributions_goal_own_update" on public.goal_contributions;
drop policy if exists "budgets_select_own" on public.budgets;
drop policy if exists "budgets_insert_own" on public.budgets;
drop policy if exists "budgets_update_own" on public.budgets;
drop policy if exists "budgets_delete_own" on public.budgets;
drop policy if exists "recurring_expenses_own" on public.recurring_expenses;
drop policy if exists "recurring_incomes_own" on public.recurring_incomes;

create policy accounts_select_finance_context
  on public.accounts for select to authenticated
  using ((select auth.uid()) = user_id
    and public.can_access_financial_context(context_id));
create policy accounts_insert_finance_context
  on public.accounts for insert to authenticated
  with check ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));
create policy accounts_update_finance_context
  on public.accounts for update to authenticated
  using ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id))
  with check ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));
create policy accounts_delete_finance_context
  on public.accounts for delete to authenticated
  using ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));

create policy categories_select_finance_context
  on public.categories for select to authenticated
  using ((select auth.uid()) = user_id
    and public.can_access_financial_context(context_id));
create policy categories_insert_finance_context
  on public.categories for insert to authenticated
  with check ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));
create policy categories_update_finance_context
  on public.categories for update to authenticated
  using ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id))
  with check ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));
create policy categories_delete_finance_context
  on public.categories for delete to authenticated
  using ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));

create policy transactions_select_finance_context
  on public.transactions for select to authenticated
  using ((select auth.uid()) = user_id
    and public.can_access_financial_context(context_id));
create policy transactions_insert_finance_context
  on public.transactions for insert to authenticated
  with check ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));
create policy transactions_update_finance_context
  on public.transactions for update to authenticated
  using ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id))
  with check ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));
create policy transactions_delete_finance_context
  on public.transactions for delete to authenticated
  using ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));

create policy wishlist_select_finance_context
  on public.wishlist_items for select to authenticated
  using ((select auth.uid()) = user_id
    and public.can_access_financial_context(context_id));
create policy wishlist_insert_finance_context
  on public.wishlist_items for insert to authenticated
  with check ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));
create policy wishlist_update_finance_context
  on public.wishlist_items for update to authenticated
  using ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id))
  with check ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));
create policy wishlist_delete_finance_context
  on public.wishlist_items for delete to authenticated
  using ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));

create policy goals_select_finance_context
  on public.goals for select to authenticated
  using ((select auth.uid()) = user_id
    and public.can_access_financial_context(context_id));
create policy goals_insert_finance_context
  on public.goals for insert to authenticated
  with check ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));
create policy goals_update_finance_context
  on public.goals for update to authenticated
  using ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id))
  with check ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));
create policy goals_delete_finance_context
  on public.goals for delete to authenticated
  using ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));

create policy goal_contributions_select_finance_context
  on public.goal_contributions for select to authenticated
  using ((select auth.uid()) = user_id
    and public.can_access_financial_context(context_id));
create policy goal_contributions_insert_finance_context
  on public.goal_contributions for insert to authenticated
  with check ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));
create policy goal_contributions_update_finance_context
  on public.goal_contributions for update to authenticated
  using ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id))
  with check ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));
create policy goal_contributions_delete_finance_context
  on public.goal_contributions for delete to authenticated
  using ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));

create policy budgets_select_finance_context
  on public.budgets for select to authenticated
  using ((select auth.uid()) = user_id
    and public.can_access_financial_context(context_id));
create policy budgets_insert_finance_context
  on public.budgets for insert to authenticated
  with check ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));
create policy budgets_update_finance_context
  on public.budgets for update to authenticated
  using ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id))
  with check ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));
create policy budgets_delete_finance_context
  on public.budgets for delete to authenticated
  using ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));

create policy recurring_expenses_select_finance_context
  on public.recurring_expenses for select to authenticated
  using ((select auth.uid()) = user_id
    and public.can_access_financial_context(context_id));
create policy recurring_expenses_insert_finance_context
  on public.recurring_expenses for insert to authenticated
  with check ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));
create policy recurring_expenses_update_finance_context
  on public.recurring_expenses for update to authenticated
  using ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id))
  with check ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));
create policy recurring_expenses_delete_finance_context
  on public.recurring_expenses for delete to authenticated
  using ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));

create policy recurring_incomes_select_finance_context
  on public.recurring_incomes for select to authenticated
  using ((select auth.uid()) = user_id
    and public.can_access_financial_context(context_id));
create policy recurring_incomes_insert_finance_context
  on public.recurring_incomes for insert to authenticated
  with check ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));
create policy recurring_incomes_update_finance_context
  on public.recurring_incomes for update to authenticated
  using ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id))
  with check ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));
create policy recurring_incomes_delete_finance_context
  on public.recurring_incomes for delete to authenticated
  using ((select auth.uid()) = user_id
    and public.can_write_financial_context(context_id));

-- CSV imports can be re-run safely without creating duplicate transactions.
alter table public.transactions
  add column if not exists import_source text,
  add column if not exists import_reference text;

alter table public.transactions
  drop constraint if exists transactions_import_metadata_pair_check;
alter table public.transactions
  add constraint transactions_import_metadata_pair_check
  check ((import_source is null) = (import_reference is null));

create unique index if not exists transactions_import_dedupe_idx
  on public.transactions(user_id, context_id, import_source, import_reference);
