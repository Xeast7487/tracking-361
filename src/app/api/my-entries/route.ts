import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getViewingUserId } from '@/lib/getViewingUser'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const { viewingId } = await getViewingUserId(user.id)

  const { data } = await supabase
    .from('time_entries')
    .select('id, started_at, ended_at, clients(name), projects(name)')
    .eq('user_id', viewingId)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false })
    .limit(100)

  return NextResponse.json(data ?? [])
}
