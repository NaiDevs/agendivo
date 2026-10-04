create or replace function public.has_active_subscription(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.subscriptions
    where business_id = target_business_id
      and status in ('trialing', 'active')
      and (
        current_period_end is null
        or current_period_end > now()
      )
  ) and public.is_business_member(target_business_id);
$$;

drop policy if exists businesses_update_admin on public.businesses;
create policy businesses_update_admin
on public.businesses for update
to authenticated
using (public.has_business_role(id, array['owner', 'admin']))
with check (public.has_business_role(id, array['owner', 'admin']));

drop policy if exists business_members_manage_admin on public.business_members;
create policy business_members_manage_admin
on public.business_members for all
to authenticated
using (public.has_business_role(business_id, array['owner', 'admin']))
with check (public.has_business_role(business_id, array['owner', 'admin']));

drop policy if exists devices_select_same_business on public.devices;
create policy devices_select_same_business
on public.devices for select
to authenticated
using (public.is_business_member(business_id));

drop policy if exists devices_insert_own on public.devices;
create policy devices_insert_own
on public.devices for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and public.is_business_member(business_id)
);

drop policy if exists devices_update_own on public.devices;
create policy devices_update_own
on public.devices for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and public.is_business_member(business_id)
);

drop policy if exists devices_delete_own_or_admin on public.devices;
create policy devices_delete_own_or_admin
on public.devices for delete
to authenticated
using (
  (select auth.uid()) = user_id
  or public.has_business_role(business_id, array['owner', 'admin'])
);

drop policy if exists customers_member_access on public.customers;
create policy customers_member_access
on public.customers for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

drop policy if exists employees_member_access on public.employees;
create policy employees_member_access
on public.employees for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

drop policy if exists services_member_access on public.services;
create policy services_member_access
on public.services for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

drop policy if exists appointments_member_access on public.appointments;
create policy appointments_member_access
on public.appointments for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

drop policy if exists fiscal_profiles_member_access on public.fiscal_profiles;
create policy fiscal_profiles_member_access
on public.fiscal_profiles for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

drop policy if exists emission_points_member_access on public.emission_points;
create policy emission_points_member_access
on public.emission_points for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

drop policy if exists fiscal_authorizations_member_access on public.fiscal_authorizations;
create policy fiscal_authorizations_member_access
on public.fiscal_authorizations for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

drop policy if exists customer_custom_fields_member_access on public.customer_custom_fields;
create policy customer_custom_fields_member_access
on public.customer_custom_fields for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));
