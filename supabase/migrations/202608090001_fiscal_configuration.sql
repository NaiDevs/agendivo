create table public.fiscal_profiles (
  id uuid primary key,
  business_id uuid not null unique references public.businesses (id) on delete restrict,
  country_code text not null check (length(country_code) = 2),
  legal_name text not null check (length(trim(legal_name)) >= 2),
  tax_id text,
  invoices_enabled smallint not null default 0 check (invoices_enabled in (0, 1)),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  version integer not null default 1 check (version > 0),
  device_id uuid not null
);

create table public.emission_points (
  id uuid primary key,
  business_id uuid not null references public.businesses (id) on delete restrict,
  name text not null check (length(trim(name)) > 0),
  establishment_code text not null check (establishment_code ~ '^\d{3}$'),
  emission_point_code text not null check (emission_point_code ~ '^\d{3}$'),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  version integer not null default 1 check (version > 0),
  device_id uuid not null
);

create table public.fiscal_authorizations (
  id uuid primary key,
  business_id uuid not null references public.businesses (id) on delete restrict,
  emission_point_id uuid not null references public.emission_points (id) on delete restrict,
  cai text not null check (length(trim(cai)) > 0),
  document_type text not null check (document_type in ('invoice')),
  range_start bigint not null check (range_start >= 0),
  range_end bigint not null check (range_end >= range_start),
  next_number bigint not null check (next_number between range_start and range_end),
  valid_until date not null,
  active smallint not null default 1 check (active in (0, 1)),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  version integer not null default 1 check (version > 0),
  device_id uuid not null
);

create unique index emission_points_codes_active_idx
  on public.emission_points (business_id, establishment_code, emission_point_code)
  where deleted_at is null;

create unique index fiscal_authorization_active_idx
  on public.fiscal_authorizations (emission_point_id, document_type)
  where deleted_at is null and active = 1;

alter table public.fiscal_profiles enable row level security;
alter table public.emission_points enable row level security;
alter table public.fiscal_authorizations enable row level security;

create policy fiscal_profiles_member_access
on public.fiscal_profiles for all to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

create policy emission_points_member_access
on public.emission_points for all to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

create policy fiscal_authorizations_member_access
on public.fiscal_authorizations for all to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

create or replace function public.sync_fiscal_configuration(
  target_business_id uuid,
  fiscal_profiles_payload jsonb,
  emission_points_payload jsonb,
  fiscal_authorizations_payload jsonb
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_business_member(target_business_id) then
    raise exception 'SYNC_FORBIDDEN';
  end if;

  insert into public.fiscal_profiles (
    id, business_id, country_code, legal_name, tax_id, invoices_enabled,
    created_at, updated_at, deleted_at, version, device_id
  )
  select id, business_id, country_code, legal_name, tax_id, invoices_enabled,
         created_at, updated_at, deleted_at, version, device_id
  from jsonb_to_recordset(fiscal_profiles_payload) as item(
    id uuid, business_id uuid, country_code text, legal_name text, tax_id text,
    invoices_enabled smallint, created_at timestamptz, updated_at timestamptz,
    deleted_at timestamptz, version integer, device_id uuid
  )
  where business_id = target_business_id
  on conflict (id) do update set
    country_code = excluded.country_code,
    legal_name = excluded.legal_name,
    tax_id = excluded.tax_id,
    invoices_enabled = excluded.invoices_enabled,
    updated_at = excluded.updated_at,
    deleted_at = excluded.deleted_at,
    version = excluded.version,
    device_id = excluded.device_id
  where excluded.business_id = public.fiscal_profiles.business_id
    and (
      excluded.version > public.fiscal_profiles.version
      or (excluded.version = public.fiscal_profiles.version
          and excluded.updated_at > public.fiscal_profiles.updated_at)
    );

  insert into public.emission_points (
    id, business_id, name, establishment_code, emission_point_code,
    created_at, updated_at, deleted_at, version, device_id
  )
  select id, business_id, name, establishment_code, emission_point_code,
         created_at, updated_at, deleted_at, version, device_id
  from jsonb_to_recordset(emission_points_payload) as item(
    id uuid, business_id uuid, name text, establishment_code text,
    emission_point_code text, created_at timestamptz, updated_at timestamptz,
    deleted_at timestamptz, version integer, device_id uuid
  )
  where business_id = target_business_id
  on conflict (id) do update set
    name = excluded.name,
    establishment_code = excluded.establishment_code,
    emission_point_code = excluded.emission_point_code,
    updated_at = excluded.updated_at,
    deleted_at = excluded.deleted_at,
    version = excluded.version,
    device_id = excluded.device_id
  where excluded.business_id = public.emission_points.business_id
    and (
      excluded.version > public.emission_points.version
      or (excluded.version = public.emission_points.version
          and excluded.updated_at > public.emission_points.updated_at)
    );

  insert into public.fiscal_authorizations (
    id, business_id, emission_point_id, cai, document_type, range_start,
    range_end, next_number, valid_until, active, created_at, updated_at,
    deleted_at, version, device_id
  )
  select id, business_id, emission_point_id, cai, document_type, range_start,
         range_end, next_number, valid_until, active, created_at, updated_at,
         deleted_at, version, device_id
  from jsonb_to_recordset(fiscal_authorizations_payload) as item(
    id uuid, business_id uuid, emission_point_id uuid, cai text,
    document_type text, range_start bigint, range_end bigint, next_number bigint,
    valid_until date, active smallint, created_at timestamptz,
    updated_at timestamptz, deleted_at timestamptz, version integer,
    device_id uuid
  )
  where business_id = target_business_id
  on conflict (id) do update set
    emission_point_id = excluded.emission_point_id,
    cai = excluded.cai,
    document_type = excluded.document_type,
    range_start = excluded.range_start,
    range_end = excluded.range_end,
    next_number = excluded.next_number,
    valid_until = excluded.valid_until,
    active = excluded.active,
    updated_at = excluded.updated_at,
    deleted_at = excluded.deleted_at,
    version = excluded.version,
    device_id = excluded.device_id
  where excluded.business_id = public.fiscal_authorizations.business_id
    and (
      excluded.version > public.fiscal_authorizations.version
      or (excluded.version = public.fiscal_authorizations.version
          and excluded.updated_at > public.fiscal_authorizations.updated_at)
    );
end;
$$;

revoke all on function public.sync_fiscal_configuration(uuid, jsonb, jsonb, jsonb)
from public;
grant execute on function public.sync_fiscal_configuration(uuid, jsonb, jsonb, jsonb)
to authenticated;
