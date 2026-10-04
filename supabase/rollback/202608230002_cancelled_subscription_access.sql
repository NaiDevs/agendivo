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
      and status = 'active'
      and (
        current_period_end is null
        or current_period_end > now()
      )
  ) and public.is_business_member(target_business_id);
$$;
