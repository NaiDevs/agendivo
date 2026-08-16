drop function if exists public.has_active_subscription(uuid);
drop policy if exists subscriptions_select_member on public.subscriptions;
drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
drop table if exists public.stripe_webhook_events;
drop table if exists public.subscriptions;

