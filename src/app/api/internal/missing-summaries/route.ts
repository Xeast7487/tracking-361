import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return new Response('Non autorisé', { status: 401 })
  }

  const supabase = await createSupabaseServerClient()
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Toronto' })

  const [punchedRes, summariesRes] = await Promise.all([
    supabase
      .from('time_entries')
      .select('user_id, profiles!inner(full_name, discord_user_id, notify_discord)')
      .gte('started_at', `${today}T00:00:00`)
      .eq('profiles.notify_discord', true),
    supabase
      .from('daily_summaries')
      .select('user_id')
      .eq('date', today),
  ])

  const summaryIds = new Set((summariesRes.data ?? []).map((s: any) => s.user_id))

  const seen = new Set<string>()
  const missing: { name: string; discord_user_id: string }[] = []

  for (const e of (punchedRes.data ?? []) as any[]) {
    const uid = e.user_id
    const profile = e.profiles
    if (seen.has(uid)) continue
    seen.add(uid)
    if (summaryIds.has(uid)) continue
    if (!profile?.discord_user_id) continue
    missing.push({ name: profile.full_name, discord_user_id: profile.discord_user_id })
  }

  return Response.json(missing)
}
