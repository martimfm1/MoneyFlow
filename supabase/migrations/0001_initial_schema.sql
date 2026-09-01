create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  currency_code text not null default 'EUR' check (currency_code ~ '^[A-Z]{3}$'),
  locale text not null default 'pt-PT',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  account_type text not null default 'cash' check (account_type in ('cash','bank','card','savings','other')),
  balance numeric(14,2) not null default 0,
  currency_code text not null default 'EUR' check (currency_code ~ '^[A-Z]{3}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 50),
  icon text not null default 'Circle',
  color text not null default 'neutral',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, name)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete restrict,
  category_id uuid references public.categories(id) on delete set null,
  transaction_type text not null check (transaction_type in ('income','expense')),
  amount numeric(14,2) not null check (amount > 0),
  description text,
  notes text,
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  price numeric(14,2) not null check (price >= 0),
  category text,
  priority text not null default 'medium' check (priority in ('high','medium','low')),
  url text,
  image_url text,
  notes text,
  desired_date date,
  status text not null default 'want' check (status in ('want','saving','ready','purchased')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wishlist_item_id uuid references public.wishlist_items(id) on delete set null,
  name text not null check (char_length(trim(name)) between 1 and 120),
  target_amount numeric(14,2) not null check (target_amount > 0),
  current_amount numeric(14,2) not null default 0 check (current_amount >= 0),
  target_date date,
  icon text not null default 'Target',
  category text,
  priority text not null default 'medium' check (priority in ('high','medium','low')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (current_amount <= target_amount)
);

create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  contributed_at timestamptz not null default timezone('utc', now()),
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists accounts_user_id_idx on public.accounts(user_id);
create index if not exists categories_user_id_idx on public.categories(user_id);
create index if not exists transactions_user_date_idx on public.transactions(user_id, occurred_at desc);
create index if not exists wishlist_user_priority_idx on public.wishlist_items(user_id, priority, created_at desc);
create index if not exists goals_user_priority_idx on public.goals(user_id, priority, created_at desc);
create index if not exists contributions_user_goal_idx on public.goal_contributions(user_id, goal_id, contributed_at desc);

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.goals enable row level security;
alter table public.goal_contributions enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "accounts_own" on public.accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "categories_own" on public.categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transactions_own" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "wishlist_own" on public.wishlist_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goals_own" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goal_contributions_own" on public.goal_contributions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
