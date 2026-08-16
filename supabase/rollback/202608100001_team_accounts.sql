drop index if exists public.employees_business_user_unique;
alter table public.employees drop column if exists account_role;
alter table public.employees drop column if exists user_id;
