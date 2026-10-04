alter table public.devices
  drop constraint if exists devices_business_id_id_key;

alter table public.devices
  drop constraint devices_pkey;

alter table public.devices
  add constraint devices_pkey primary key (business_id, id);

do $migration$
declare
  current_definition text;
  updated_definition text;
begin
  select pg_get_functiondef(
    'public.sync_push(uuid,uuid,jsonb,jsonb,jsonb,jsonb,jsonb)'::regprocedure
  ) into current_definition;

  updated_definition := regexp_replace(
    current_definition,
    'on conflict\s*\(id\)\s*do update',
    'on conflict on constraint devices_pkey do update',
    'i'
  );

  if updated_definition = current_definition then
    raise exception 'SYNC_PUSH_DEVICE_UPSERT_NOT_FOUND';
  end if;

  execute updated_definition;
end;
$migration$;
