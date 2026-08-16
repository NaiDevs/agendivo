create extension if not exists btree_gist with schema extensions;

drop trigger if exists businesses_set_updated_at on public.businesses;

alter table public.businesses
  add column phone text,
  add column email text,
  add column address text,
  add column timezone text not null default 'America/Tegucigalpa',
  add column currency text not null default 'HNL' check (length(currency) = 3),
  add column deleted_at timestamptz,
  add column version integer not null default 1 check (version > 0),
  add column device_id uuid;

create table public.customers (
  id uuid primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  phone text,
  email text,
  notes text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  version integer not null check (version > 0),
  device_id uuid not null,
  unique (business_id, id)
);

create table public.employees (
  id uuid primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  phone text,
  email text,
  color text not null default 'copper',
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  version integer not null check (version > 0),
  device_id uuid not null,
  unique (business_id, id)
);

create table public.services (
  id uuid primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  description text,
  duration_minutes integer not null check (duration_minutes > 0),
  price bigint not null check (price >= 0),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  version integer not null check (version > 0),
  device_id uuid not null,
  unique (business_id, id)
);

create table public.appointments (
  id uuid primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid not null,
  employee_id uuid,
  service_id uuid,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null check (
    status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')
  ),
  price bigint not null check (price >= 0),
  notes text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  version integer not null check (version > 0),
  device_id uuid not null,
  check (starts_at < ends_at),
  foreign key (business_id, customer_id)
    references public.customers (business_id, id) on delete restrict,
  foreign key (business_id, employee_id)
    references public.employees (business_id, id) on delete restrict,
  foreign key (business_id, service_id)
    references public.services (business_id, id) on delete restrict,
  unique (business_id, id),
  exclude using gist (
    business_id with =,
    employee_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (
    employee_id is not null
    and deleted_at is null
    and status not in ('cancelled', 'no_show')
  )
);

create index customers_business_updated_idx
  on public.customers (business_id, updated_at);
create index employees_business_updated_idx
  on public.employees (business_id, updated_at);
create index services_business_updated_idx
  on public.services (business_id, updated_at);
create index appointments_business_updated_idx
  on public.appointments (business_id, updated_at);
create index appointments_business_starts_idx
  on public.appointments (business_id, starts_at)
  where deleted_at is null;

alter table public.customers enable row level security;
alter table public.employees enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;

grant select, update on public.profiles to authenticated;
grant select, update on public.businesses to authenticated;
grant select, insert, update, delete on public.business_members to authenticated;
grant select, insert, update, delete on public.devices to authenticated;
grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.employees to authenticated;
grant select, insert, update, delete on public.services to authenticated;
grant select, insert, update, delete on public.appointments to authenticated;

create policy customers_member_access
on public.customers for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

create policy employees_member_access
on public.employees for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

create policy services_member_access
on public.services for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

create policy appointments_member_access
on public.appointments for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

create or replace function public.sync_push(
  target_business_id uuid,
  source_device_id uuid,
  business_payload jsonb,
  customers_payload jsonb,
  employees_payload jsonb,
  services_payload jsonb,
  appointments_payload jsonb
)
returns jsonb
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_business_member(target_business_id) then
    raise exception 'SYNC_FORBIDDEN';
  end if;

  if coalesce(business_payload ->> 'id', '') <> target_business_id::text then
    raise exception 'SYNC_BUSINESS_MISMATCH';
  end if;

  insert into public.devices (id, business_id, user_id, name, last_seen_at)
  values (
    source_device_id,
    target_business_id,
    auth.uid(),
    coalesce(nullif(business_payload ->> 'device_name', ''), 'Agendivo'),
    now()
  )
  on conflict (id) do update
  set last_seen_at = excluded.last_seen_at,
      name = excluded.name
  where public.devices.business_id = excluded.business_id
    and public.devices.user_id = excluded.user_id;

  update public.businesses
  set name = business_payload ->> 'name',
      phone = nullif(business_payload ->> 'phone', ''),
      email = nullif(business_payload ->> 'email', ''),
      address = nullif(business_payload ->> 'address', ''),
      timezone = business_payload ->> 'timezone',
      currency = business_payload ->> 'currency',
      created_at = (business_payload ->> 'created_at')::timestamptz,
      updated_at = (business_payload ->> 'updated_at')::timestamptz,
      deleted_at = (business_payload ->> 'deleted_at')::timestamptz,
      version = (business_payload ->> 'version')::integer,
      device_id = (business_payload ->> 'device_id')::uuid
  where id = target_business_id
    and (
      (business_payload ->> 'version')::integer > version
      or (
        (business_payload ->> 'version')::integer = version
        and (business_payload ->> 'updated_at')::timestamptz >= updated_at
      )
    );

  insert into public.customers (
    id, business_id, name, phone, email, notes, created_at, updated_at,
    deleted_at, version, device_id
  )
  select id, business_id, name, phone, email, notes, created_at, updated_at,
         deleted_at, version, device_id
  from jsonb_to_recordset(customers_payload) as item(
    id uuid, business_id uuid, name text, phone text, email text, notes text,
    created_at timestamptz, updated_at timestamptz, deleted_at timestamptz,
    version integer, device_id uuid
  )
  where business_id = target_business_id
  on conflict (id) do update set
    name = excluded.name,
    phone = excluded.phone,
    email = excluded.email,
    notes = excluded.notes,
    updated_at = excluded.updated_at,
    deleted_at = excluded.deleted_at,
    version = excluded.version,
    device_id = excluded.device_id
  where excluded.business_id = public.customers.business_id
    and (
      excluded.version > public.customers.version
      or (
        excluded.version = public.customers.version
        and excluded.updated_at > public.customers.updated_at
      )
    );

  insert into public.employees (
    id, business_id, name, phone, email, color, created_at, updated_at,
    deleted_at, version, device_id
  )
  select id, business_id, name, phone, email, color, created_at, updated_at,
         deleted_at, version, device_id
  from jsonb_to_recordset(employees_payload) as item(
    id uuid, business_id uuid, name text, phone text, email text, color text,
    created_at timestamptz, updated_at timestamptz, deleted_at timestamptz,
    version integer, device_id uuid
  )
  where business_id = target_business_id
  on conflict (id) do update set
    name = excluded.name,
    phone = excluded.phone,
    email = excluded.email,
    color = excluded.color,
    updated_at = excluded.updated_at,
    deleted_at = excluded.deleted_at,
    version = excluded.version,
    device_id = excluded.device_id
  where excluded.business_id = public.employees.business_id
    and (
      excluded.version > public.employees.version
      or (
        excluded.version = public.employees.version
        and excluded.updated_at > public.employees.updated_at
      )
    );

  insert into public.services (
    id, business_id, name, description, duration_minutes, price, created_at,
    updated_at, deleted_at, version, device_id
  )
  select id, business_id, name, description, duration_minutes, price, created_at,
         updated_at, deleted_at, version, device_id
  from jsonb_to_recordset(services_payload) as item(
    id uuid, business_id uuid, name text, description text,
    duration_minutes integer, price bigint, created_at timestamptz,
    updated_at timestamptz, deleted_at timestamptz, version integer,
    device_id uuid
  )
  where business_id = target_business_id
  on conflict (id) do update set
    name = excluded.name,
    description = excluded.description,
    duration_minutes = excluded.duration_minutes,
    price = excluded.price,
    updated_at = excluded.updated_at,
    deleted_at = excluded.deleted_at,
    version = excluded.version,
    device_id = excluded.device_id
  where excluded.business_id = public.services.business_id
    and (
      excluded.version > public.services.version
      or (
        excluded.version = public.services.version
        and excluded.updated_at > public.services.updated_at
      )
    );

  insert into public.appointments (
    id, business_id, customer_id, employee_id, service_id, starts_at, ends_at,
    status, price, notes, created_at, updated_at, deleted_at, version, device_id
  )
  select id, business_id, customer_id, employee_id, service_id, starts_at, ends_at,
         status, price, notes, created_at, updated_at, deleted_at, version, device_id
  from jsonb_to_recordset(appointments_payload) as item(
    id uuid, business_id uuid, customer_id uuid, employee_id uuid,
    service_id uuid, starts_at timestamptz, ends_at timestamptz, status text,
    price bigint, notes text, created_at timestamptz, updated_at timestamptz,
    deleted_at timestamptz, version integer, device_id uuid
  )
  where business_id = target_business_id
  on conflict (id) do update set
    customer_id = excluded.customer_id,
    employee_id = excluded.employee_id,
    service_id = excluded.service_id,
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    status = excluded.status,
    price = excluded.price,
    notes = excluded.notes,
    updated_at = excluded.updated_at,
    deleted_at = excluded.deleted_at,
    version = excluded.version,
    device_id = excluded.device_id
  where excluded.business_id = public.appointments.business_id
    and (
      excluded.version > public.appointments.version
      or (
        excluded.version = public.appointments.version
        and excluded.updated_at > public.appointments.updated_at
      )
    );

  return jsonb_build_object(
    'business_id', target_business_id,
    'synced_at', now()
  );
end;
$$;

revoke all on function public.sync_push(uuid, uuid, jsonb, jsonb, jsonb, jsonb, jsonb)
from public;
grant execute on function public.sync_push(uuid, uuid, jsonb, jsonb, jsonb, jsonb, jsonb)
to authenticated;
