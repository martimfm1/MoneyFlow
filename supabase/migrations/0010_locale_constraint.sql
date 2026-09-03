update public.profiles
set locale = 'pt-PT'
where locale is null or locale not in ('pt-PT', 'en');

alter table public.profiles
drop constraint if exists profiles_locale_check;

alter table public.profiles
add constraint profiles_locale_check
check (locale in ('pt-PT', 'en'));
