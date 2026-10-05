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

  const url = new URL(req.url)
  const businessId = url.searchParams.get('id')
  if (!businessId) {
    return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const [bizResult, subResult, membersResult, devicesResult] = await Promise.all([
    supabase.from('businesses').select('id, name, owner_user_id, created_at').eq('id', businessId).single(),
    supabase.from('subscriptions').select('*').eq('business_id', businessId).maybeSingle(),
    supabase.from('business_members').select('user_id, role, profiles ( full_name )').eq('business_id', businessId),
    supabase.from('devices').select('id, name, last_seen_at, user_id').eq('business_id', businessId),
  ])

  if (bizResult.error) {
    return new Response(JSON.stringify({ error: bizResult.error.message }), { status: 404, headers: corsHeaders })
  }

  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const emailByUserId = Object.fromEntries(users.map((u: any) => [u.id, u.email ?? '']))

  const ownerEmail = emailByUserId[bizResult.data.owner_user_id] ?? ''

  const members = (membersResult.data ?? []).map((m: any) => ({
    user_id: m.user_id,
    full_name: (m.profiles as any)?.full_name ?? '',
    email: emailByUserId[m.user_id] ?? '',
    role: m.role,
  }))

  return new Response(JSON.stringify({
    business: {
      id: bizResult.data.id,
      name: bizResult.data.name,
      owner_email: ownerEmail,
      created_at: bizResult.data.created_at,
    },
    subscription: subResult.data ?? null,
    members,
    devices: devicesResult.data ?? [],
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
