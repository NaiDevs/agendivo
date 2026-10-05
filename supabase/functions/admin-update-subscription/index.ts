import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

async function stripeRequest(path: string, body?: Record<string, string>) {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  })
  return { ok: res.ok, data: await res.json() }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const adminSecret = Deno.env.get('ADMIN_SECRET') ?? ''
  const auth = req.headers.get('Authorization') ?? ''
  if (auth !== `Bearer ${adminSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
  }

  let body: { business_id?: string; action?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: corsHeaders })
  }

  const { business_id, action } = body
  if (!business_id || !['activate', 'deactivate'].includes(action ?? '')) {
    return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400, headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: sub, error: subError } = await supabase
    .from('subscriptions')
    .select('status, stripe_subscription_id')
    .eq('business_id', business_id)
    .maybeSingle()

  if (subError) {
    return new Response(JSON.stringify({ success: false, error: subError.message }), { status: 500, headers: corsHeaders })
  }

  let newStatus: string

  if (action === 'activate') {
    if (sub?.status === 'paused' && sub.stripe_subscription_id) {
      const { ok } = await stripeRequest(`/subscriptions/${sub.stripe_subscription_id}`, {
        'pause_collection': '',
      })
      if (!ok) {
        return new Response(JSON.stringify({ success: false, error: 'Stripe resume failed' }), { status: 502, headers: corsHeaders })
      }
    }
    newStatus = 'active'
  } else {
    if (sub?.stripe_subscription_id) {
      const { ok } = await stripeRequest(`/subscriptions/${sub.stripe_subscription_id}`, {
        'pause_collection[behavior]': 'void',
      })
      if (!ok) {
        return new Response(JSON.stringify({ success: false, error: 'Stripe pause failed' }), { status: 502, headers: corsHeaders })
      }
      newStatus = 'paused'
    } else {
      newStatus = 'canceled'
    }
  }

  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('business_id', business_id)

  if (updateError) {
    return new Response(JSON.stringify({ success: false, error: updateError.message }), { status: 500, headers: corsHeaders })
  }

  return new Response(JSON.stringify({ success: true, new_status: newStatus }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
