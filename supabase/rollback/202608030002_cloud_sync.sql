drop function if exists public.sync_push(uuid, uuid, jsonb, jsonb, jsonb, jsonb, jsonb);

drop policy if exists appointments_member_access on public.appointments;
drop policy if exists services_member_access on public.services;
drop policy if exists employees_member_access on public.employees;
drop policy if exists customers_member_access on public.customers;

drop table if exists public.appointments;
drop table if exists public.services;
drop table if exists public.employees;
drop table if exists public.customers;

alter table public.businesses
  drop column if exists device_id,
  drop column if exists version,
  drop column if exists deleted_at,
  drop column if exists currency,
  drop column if exists timezone,
  drop column if exists address,
  drop column if exists email,
  drop column if exists phone;

create trigger businesses_set_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();
