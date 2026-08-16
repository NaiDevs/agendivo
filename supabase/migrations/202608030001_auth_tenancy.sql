create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (length(trim(full_name)) >= 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key,
  owner_user_id uuid not null references auth.users (id) on delete restrict,
  name text not null check (length(trim(name)) >= 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_members (
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'employee')),
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create table public.devices (
  id uuid primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) >= 1),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (business_id, id)
);

create index business_members_user_id_idx
  on public.business_members (user_id, business_id);

create index devices_business_id_idx
  on public.devices (business_id, last_seen_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger businesses_set_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Usuario Agendivo')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_members
    where business_id = target_business_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.has_business_role(
  target_business_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_members
    where business_id = target_business_id
      and user_id = auth.uid()
      and role = any(allowed_roles)
  );
$$;

create or replace function public.create_business(
  business_id uuid,
  business_name text
)
returns public.businesses
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_business public.businesses;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if length(trim(business_name)) < 2 then
    raise exception 'INVALID_BUSINESS_NAME';
  end if;

  insert into public.businesses (id, owner_user_id, name)
  values (business_id, auth.uid(), trim(business_name))
  returning * into created_business;

  insert into public.business_members (business_id, user_id, role)
  values (created_business.id, auth.uid(), 'owner');

  return created_business;
end;
$$;

revoke all on function public.create_business(uuid, text) from public;
grant execute on function public.create_business(uuid, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.devices enable row level security;

create policy profiles_select_own
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy profiles_update_own
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy businesses_select_member
on public.businesses for select
to authenticated
using (public.is_business_member(id));

create policy businesses_update_admin
on public.businesses for update
to authenticated
using (public.has_business_role(id, array['owner', 'admin']))
with check (public.has_business_role(id, array['owner', 'admin']));

create policy business_members_select_same_business
on public.business_members for select
to authenticated
using (public.is_business_member(business_id));

create policy business_members_manage_admin
on public.business_members for all
to authenticated
using (public.has_business_role(business_id, array['owner', 'admin']))
with check (public.has_business_role(business_id, array['owner', 'admin']));

create policy devices_select_same_business
on public.devices for select
to authenticated
using (public.is_business_member(business_id));

create policy devices_insert_own
on public.devices for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and public.is_business_member(business_id)
);

create policy devices_update_own
on public.devices for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and public.is_business_member(business_id)
);

create policy devices_delete_own_or_admin
on public.devices for delete
to authenticated
using (
  (select auth.uid()) = user_id
  or public.has_business_role(business_id, array['owner', 'admin'])
);
