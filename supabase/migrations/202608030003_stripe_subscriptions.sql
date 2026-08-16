create table public.subscriptions (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text not null,
  status text not null check (
    status in (
      'checkout_pending',
      'incomplete',
      'incomplete_expired',
      'trialing',
      'active',
      'past_due',
      'canceled',
      'unpaid',
      'paused'
    )
  ),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stripe_webhook_events (
  id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;
alter table public.stripe_webhook_events enable row level security;

grant select on public.subscriptions to authenticated;
revoke all on public.stripe_webhook_events from anon, authenticated;

create policy subscriptions_select_member
on public.subscriptions for select
to authenticated
using (public.is_business_member(business_id));

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

revoke all on function public.has_active_subscription(uuid) from public;
grant execute on function public.has_active_subscription(uuid) to authenticated;

