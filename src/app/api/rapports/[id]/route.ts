import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data, error } = await supabase
      .from('swydo_reports')
      .select('*, profiles(full_name)')
      .eq('id', params.id)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Rapport introuvable' }, { status: 404 })
    return NextResponse.json({ ok: true, report: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json()
    const allowed: Record<string, boolean> = { comments: true, summary: true }
    const patch: Record<string, any> = { updated_at: new Date().toISOString() }
    for (const key of Object.keys(body)) {
      if (allowed[key]) patch[key] = body[key]
    }

    const { data, error } = await supabase
      .from('swydo_reports')
      .update(patch)
      .eq('id', params.id)
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ ok: true, report: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { error } = await supabase
      .from('swydo_reports')
      .delete()
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erreur serveur' }, { status: 500 })
  }
}
