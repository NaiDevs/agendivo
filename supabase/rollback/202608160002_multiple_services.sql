drop function if exists public.sync_appointment_service_items(uuid, jsonb);
alter table public.appointments drop column if exists service_items;
