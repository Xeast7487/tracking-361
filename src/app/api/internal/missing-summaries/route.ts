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
      .select('user_id, profiles(full_name)')
      .gte('started_at', `${today}T00:00:00`),
    supabase
      .from('daily_summaries')
      .select('user_id')
      .eq('date', today),
  ])

  const summaryIds = new Set((summariesRes.data ?? []).map((s: any) => s.user_id))
  const seen = new Set<string>()
  const missing: string[] = []

  for (const e of (punchedRes.data ?? []) as any[]) {
    if (seen.has(e.user_id) || summaryIds.has(e.user_id)) continue
    seen.add(e.user_id)
    missing.push(e.profiles?.full_name ?? e.user_id)
  }

  return Response.json({ missing, date: today })
}
