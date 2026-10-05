import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const adminSecret = Deno.env.get('ADMIN_SECRET') ?? ''
  const auth = req.headers.get('Authorization') ?? ''
  if (auth !== `Bearer ${adminSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data, error } = await supabase
    .from('businesses')
    .select(`
      id,
      name,
      owner_user_id,
      subscriptions ( status, current_period_end, stripe_price_id, stripe_subscription_id )
    `)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }

  // Obtenemos emails de los owners vía auth.admin
  const ownerIds = [...new Set((data ?? []).map((b: any) => b.owner_user_id))]
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const emailByUserId = Object.fromEntries(users.map((u: any) => [u.id, u.email ?? '']))

  const businesses = (data ?? []).map((b: any) => {
    const sub = b.subscriptions?.[0]
    return {
      id: b.id,
      name: b.name,
      owner_email: emailByUserId[b.owner_user_id] ?? '',
      status: sub?.status ?? 'no_subscription',
      current_period_end: sub?.current_period_end ?? null,
      plan_name: sub?.stripe_price_id ?? null,
      stripe_subscription_id: sub?.stripe_subscription_id ?? null,
    }
  })

  const summary = {
    active: businesses.filter((b: any) => b.status === 'active').length,
    trialing: businesses.filter((b: any) => b.status === 'trialing').length,
    canceled: businesses.filter((b: any) => b.status === 'canceled').length,
    paused: businesses.filter((b: any) => b.status === 'paused').length,
  }

  return new Response(JSON.stringify({ businesses, summary }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
