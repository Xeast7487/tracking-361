import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return new Response('Non autorisé', { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const [tokenRes, ownerRes, employeesRes] = await Promise.all([
    admin.from('app_settings').select('value').eq('key', 'discord_bot_token').maybeSingle(),
    admin.from('app_settings').select('value').eq('key', 'discord_owner_id').maybeSingle(),
    admin.from('profiles').select('id, full_name').eq('notify_discord', true).eq('is_active', true).eq('role', 'employee'),
  ])

  return Response.json({
    bot_token: tokenRes.data?.value ?? '',
    owner_id: ownerRes.data?.value ?? '',
    notify_employees: (employeesRes.data ?? []).map((e: any) => e.id),
  })
}
