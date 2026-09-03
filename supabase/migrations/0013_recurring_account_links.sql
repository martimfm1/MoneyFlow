alter table public.recurring_incomes
  add column if not exists account_id uuid references public.accounts(id) on delete restrict;

alter table public.recurring_expenses
  add column if not exists account_id uuid references public.accounts(id) on delete restrict;

create index if not exists recurring_incomes_account_id_idx
  on public.recurring_incomes(account_id);

create index if not exists recurring_expenses_account_id_idx
  on public.recurring_expenses(account_id);
