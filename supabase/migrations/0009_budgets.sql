create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  month_start date not null,
  amount numeric(14,2) not null check (amount > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, category_id, month_start)
);

create index if not exists budgets_user_month_idx
  on public.budgets(user_id, month_start, category_id);

alter table public.budgets enable row level security;

create policy "budgets_select_own"
on public.budgets
for select using (auth.uid() = user_id);

create policy "budgets_insert_own"
on public.budgets
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.categories c
    where c.id = category_id
      and c.user_id = auth.uid()
  )
);

create policy "budgets_update_own"
on public.budgets
for update using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.categories c
    where c.id = category_id
      and c.user_id = auth.uid()
  )
);

create policy "budgets_delete_own"
on public.budgets
for delete using (auth.uid() = user_id);
