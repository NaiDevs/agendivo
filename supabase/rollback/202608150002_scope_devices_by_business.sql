do $rollback$
begin
  if exists (
    select id
    from public.devices
    group by id
    having count(*) > 1
  ) then
    raise exception 'ROLLBACK_BLOCKED_DUPLICATED_DEVICE_IDS';
  end if;
end;
$rollback$;

alter table public.devices
  drop constraint devices_pkey;

alter table public.devices
  add constraint devices_pkey primary key (id);

alter table public.devices
  add constraint devices_business_id_id_key unique (business_id, id);

do $rollback$
declare
  current_definition text;
  updated_definition text;
begin
  select pg_get_functiondef(
    'public.sync_push(uuid,uuid,jsonb,jsonb,jsonb,jsonb,jsonb)'::regprocedure
  ) into current_definition;

  updated_definition := regexp_replace(
    current_definition,
    'on conflict\s+on constraint\s+devices_pkey\s+do update',
    'on conflict (id) do update',
    'i'
  );

  if updated_definition = current_definition then
    raise exception 'SYNC_PUSH_DEVICE_UPSERT_NOT_FOUND';
  end if;

  execute updated_definition;
end;
$rollback$;
