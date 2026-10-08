import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data, error } = await supabase
      .from('swydo_reports')
      .select('id, client, period, created_at, comments, created_by, profiles(full_name)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ ok: true, reports: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erreur serveur' }, { status: 500 })
  }
}
