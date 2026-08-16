drop policy if exists devices_delete_own_or_admin on public.devices;
drop policy if exists devices_update_own on public.devices;
drop policy if exists devices_insert_own on public.devices;
drop policy if exists devices_select_same_business on public.devices;
drop policy if exists business_members_manage_admin on public.business_members;
drop policy if exists business_members_select_same_business on public.business_members;
drop policy if exists businesses_update_admin on public.businesses;
drop policy if exists businesses_select_member on public.businesses;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_select_own on public.profiles;

drop function if exists public.create_business(uuid, text);
drop function if exists public.has_business_role(uuid, text[]);
drop function if exists public.is_business_member(uuid);
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop trigger if exists businesses_set_updated_at on public.businesses;
drop trigger if exists profiles_set_updated_at on public.profiles;
drop function if exists public.set_updated_at();

drop table if exists public.devices;
drop table if exists public.business_members;
drop table if exists public.businesses;
drop table if exists public.profiles;
