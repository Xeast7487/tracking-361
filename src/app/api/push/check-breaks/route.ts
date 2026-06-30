import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const BREAK_THRESHOLD_MS = 30 * 60 * 1_000

webpush.setVapidDetails(
  'mailto:admin@agence361.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
  }

  const supabase = getAdmin()
  const now = new Date()
  const threshold = new Date(now.getTime() - BREAK_THRESHOLD_MS).toISOString()

  const { data: longBreaks } = await supabase
    .from('time_entries')
    .select('id, paused_at, profiles(full_name)')
    .is('ended_at', null)
    .not('paused_at', 'is', null)
    .is('long_break_notified_at', null)
    .lt('paused_at', threshold)

  if (!longBreaks || longBreaks.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  const { data: adminProfiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .eq('is_active', true)

  const adminIds = (adminProfiles ?? []).map((p: any) => p.id)
  if (adminIds.length === 0) return NextResponse.json({ sent: 0 })

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth_key')
    .in('user_id', adminIds)

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0, note: 'No subscriptions' })
  }

  const names = longBreaks
    .map((e: any) => e.profiles?.full_name ?? 'Employé')
    .join(', ')

  const body = longBreaks.length === 1
    ? `${names} est en pause depuis plus de 30 minutes.`
    : `${longBreaks.length} employés sont en pause depuis plus de 30 minutes : ${names}.`

  const payload = JSON.stringify({
    title: '⏰ Pause prolongée',
    body,
    url: '/admin',
    tag: 'long-break',
  })

  const failedEndpoints: string[] = []
  await Promise.all(subscriptions.map(async (sub: any) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
        payload
      )
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        failedEndpoints.push(sub.endpoint)
      }
    }
  }))

  if (failedEndpoints.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', failedEndpoints)
  }

  await supabase
    .from('time_entries')
    .update({ long_break_notified_at: now.toISOString() })
    .in('id', longBreaks.map((e: any) => e.id))

  return NextResponse.json({ sent: subscriptions.length - failedEndpoints.length, breaks: longBreaks.length })
}
