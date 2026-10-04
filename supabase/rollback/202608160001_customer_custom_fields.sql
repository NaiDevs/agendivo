drop function if exists public.sync_customer_custom_fields(uuid, jsonb, jsonb);

create or replace function public.sync_pull(
  target_business_id uuid,
  requesting_device_id uuid,
  since_at timestamptz
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  cutoff timestamptz;
begin
  if auth.uid() is null or not public.is_business_member(target_business_id) then
    raise exception 'SYNC_FORBIDDEN';
  end if;
  cutoff := coalesce(since_at, '-infinity'::timestamptz);
  return jsonb_build_object(
    'customers', (select coalesce(jsonb_agg(to_jsonb(c.*) - 'custom_field_values'), '[]'::jsonb) from public.customers c where c.business_id = target_business_id and c.updated_at > cutoff and c.device_id <> requesting_device_id),
    'employees', (select coalesce(jsonb_agg(row_to_json(e.*)), '[]'::jsonb) from public.employees e where e.business_id = target_business_id and e.updated_at > cutoff and e.device_id <> requesting_device_id),
    'services', (select coalesce(jsonb_agg(row_to_json(s.*)), '[]'::jsonb) from public.services s where s.business_id = target_business_id and s.updated_at > cutoff and s.device_id <> requesting_device_id),
    'appointments', (select coalesce(jsonb_agg(row_to_json(a.*)), '[]'::jsonb) from public.appointments a where a.business_id = target_business_id and a.updated_at > cutoff and a.device_id <> requesting_device_id)
  );
end;
$$;

drop table if exists public.customer_custom_fields;
alter table public.customers drop column if exists custom_field_values;
