alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz;

create or replace function public.seed_default_categories()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.categories (user_id, name, icon, color, sort_order)
  values
    (new.id, 'Alimentação', 'Utensils', 'orange', 10),
    (new.id, 'Transportes', 'Car', 'blue', 20),
    (new.id, 'Casa', 'House', 'violet', 30),
    (new.id, 'Lazer', 'Gamepad2', 'pink', 40),
    (new.id, 'Compras', 'ShoppingBag', 'amber', 50),
    (new.id, 'Saúde', 'HeartPulse', 'rose', 60),
    (new.id, 'Subscrições', 'Repeat', 'cyan', 70),
    (new.id, 'Educação', 'GraduationCap', 'emerald', 80)
  on conflict (user_id, name) do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_created_seed_categories on public.profiles;
create trigger on_profile_created_seed_categories
after insert on public.profiles
for each row execute procedure public.seed_default_categories();

-- Seed categories for profiles that already existed before this migration.
insert into public.categories (user_id, name, icon, color, sort_order)
select p.id, c.name, c.icon, c.color, c.sort_order
from public.profiles p
cross join (values
  ('Alimentação', 'Utensils', 'orange', 10),
  ('Transportes', 'Car', 'blue', 20),
  ('Casa', 'House', 'violet', 30),
  ('Lazer', 'Gamepad2', 'pink', 40),
  ('Compras', 'ShoppingBag', 'amber', 50),
  ('Saúde', 'HeartPulse', 'rose', 60),
  ('Subscrições', 'Repeat', 'cyan', 70),
  ('Educação', 'GraduationCap', 'emerald', 80)
) as c(name, icon, color, sort_order)
on conflict (user_id, name) do nothing;
