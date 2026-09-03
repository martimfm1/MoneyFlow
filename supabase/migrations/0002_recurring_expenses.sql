create table if not exists public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  provider text,
  amount numeric(14,2) not null check (amount > 0),
  frequency text not null default 'yearly' check (frequency in ('monthly','quarterly','yearly')),
  next_due_date date not null,
  currency_code text not null default 'EUR' check (currency_code ~ '^[A-Z]{3}$'),
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists recurring_expenses_user_due_idx
  on public.recurring_expenses(user_id, next_due_date asc);

alter table public.recurring_expenses enable row level security;

create policy "recurring_expenses_own"
  on public.recurring_expenses
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
