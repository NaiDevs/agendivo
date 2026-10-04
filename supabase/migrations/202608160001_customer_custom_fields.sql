alter table public.customers
  add column custom_field_values jsonb not null default '{}'::jsonb,
  add constraint customers_custom_field_values_object
    check (jsonb_typeof(custom_field_values) = 'object');

create table public.customer_custom_fields (
  id uuid primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (length(trim(name)) >= 2),
  type text not null check (
    type in ('text', 'telephone', 'number', 'boolean', 'datetime', 'email', 'select')
  ),
  is_required boolean not null default false,
  is_multiple boolean not null default false,
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  version integer not null check (version > 0),
  device_id uuid not null,
  unique (business_id, id),
  check (type = 'select' or (is_multiple = false and options = '[]'::jsonb))
);

create index customer_custom_fields_business_updated_idx
  on public.customer_custom_fields (business_id, updated_at);

create index customer_custom_fields_business_order_idx
  on public.customer_custom_fields (business_id, sort_order)
  where deleted_at is null;

create unique index customer_custom_fields_business_name_idx
  on public.customer_custom_fields (business_id, lower(name))
  where deleted_at is null;

alter table public.customer_custom_fields enable row level security;

grant select, insert, update, delete on public.customer_custom_fields to authenticated;

create policy customer_custom_fields_member_access
on public.customer_custom_fields for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

create or replace function public.sync_customer_custom_fields(
  target_business_id uuid,
  customer_custom_fields_payload jsonb,
  customer_values_payload jsonb
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_business_member(target_business_id) then
    raise exception 'SYNC_FORBIDDEN';
  end if;

  insert into public.customer_custom_fields (
    id, business_id, name, type, is_required, is_multiple, options, sort_order,
    created_at, updated_at, deleted_at, version, device_id
  )
  select id, business_id, name, type, is_required, is_multiple, options, sort_order,
         created_at, updated_at, deleted_at, version, device_id
  from jsonb_to_recordset(customer_custom_fields_payload) as item(
    id uuid, business_id uuid, name text, type text, is_required boolean,
    is_multiple boolean, options jsonb, sort_order integer, created_at timestamptz,
    updated_at timestamptz, deleted_at timestamptz, version integer, device_id uuid
  )
  where business_id = target_business_id
  on conflict (id) do update set
    name = excluded.name,
    type = excluded.type,
    is_required = excluded.is_required,
    is_multiple = excluded.is_multiple,
    options = excluded.options,
    sort_order = excluded.sort_order,
    updated_at = excluded.updated_at,
    deleted_at = excluded.deleted_at,
    version = excluded.version,
    device_id = excluded.device_id
  where excluded.business_id = public.customer_custom_fields.business_id
    and (
      excluded.version > public.customer_custom_fields.version
      or (
        excluded.version = public.customer_custom_fields.version
        and excluded.updated_at > public.customer_custom_fields.updated_at
      )
    );

  update public.customers as customer
  set custom_field_values = item.custom_field_values
  from jsonb_to_recordset(customer_values_payload) as item(
    id uuid, business_id uuid, custom_field_values jsonb,
    updated_at timestamptz, version integer
  )
  where item.business_id = target_business_id
    and customer.business_id = target_business_id
    and customer.id = item.id
    and customer.version = item.version
    and customer.updated_at = item.updated_at
    and jsonb_typeof(item.custom_field_values) = 'object';
end;
$$;

revoke all on function public.sync_customer_custom_fields(uuid, jsonb, jsonb) from public;
grant execute on function public.sync_customer_custom_fields(uuid, jsonb, jsonb) to authenticated;

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
    'customers', (
      select coalesce(jsonb_agg(row_to_json(c.*)), '[]'::jsonb)
      from public.customers c
      where c.business_id = target_business_id
        and c.updated_at > cutoff
        and c.device_id <> requesting_device_id
    ),
    'customerCustomFields', (
      select coalesce(jsonb_agg(row_to_json(f.*)), '[]'::jsonb)
      from public.customer_custom_fields f
      where f.business_id = target_business_id
        and f.updated_at > cutoff
        and f.device_id <> requesting_device_id
    ),
    'employees', (
      select coalesce(jsonb_agg(row_to_json(e.*)), '[]'::jsonb)
      from public.employees e
      where e.business_id = target_business_id
        and e.updated_at > cutoff
        and e.device_id <> requesting_device_id
    ),
    'services', (
      select coalesce(jsonb_agg(row_to_json(s.*)), '[]'::jsonb)
      from public.services s
      where s.business_id = target_business_id
        and s.updated_at > cutoff
        and s.device_id <> requesting_device_id
    ),
    'appointments', (
      select coalesce(jsonb_agg(row_to_json(a.*)), '[]'::jsonb)
      from public.appointments a
      where a.business_id = target_business_id
        and a.updated_at > cutoff
        and a.device_id <> requesting_device_id
    )
  );
end;
$$;

revoke all on function public.sync_pull(uuid, uuid, timestamptz) from public;
grant execute on function public.sync_pull(uuid, uuid, timestamptz) to authenticated;
