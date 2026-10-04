alter table public.appointments
add column if not exists service_items jsonb not null default '[]'::jsonb
check (jsonb_typeof(service_items) = 'array');

update public.appointments appointment
set service_items = jsonb_build_array(jsonb_build_object(
  'serviceId', service.id,
  'name', service.name,
  'durationMinutes', service.duration_minutes,
  'price', service.price
))
from public.services service
where appointment.service_id = service.id
  and appointment.business_id = service.business_id
  and appointment.service_items = '[]'::jsonb;

create or replace function public.sync_appointment_service_items(
  target_business_id uuid,
  appointments_payload jsonb
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_business_member(target_business_id) then
    raise exception 'SYNC_FORBIDDEN';
  end if;

  update public.appointments appointment
  set service_items = item.service_items
  from jsonb_to_recordset(coalesce(appointments_payload, '[]'::jsonb)) as item(
    id uuid,
    business_id uuid,
    service_items jsonb,
    updated_at timestamptz,
    version integer
  )
  where appointment.id = item.id
    and appointment.business_id = target_business_id
    and item.business_id = target_business_id
    and appointment.version = item.version
    and appointment.updated_at = item.updated_at
    and jsonb_typeof(item.service_items) = 'array';
end;
$$;

revoke all on function public.sync_appointment_service_items(uuid, jsonb) from public;
grant execute on function public.sync_appointment_service_items(uuid, jsonb) to authenticated;
