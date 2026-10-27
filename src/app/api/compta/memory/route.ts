import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function getAdmin(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié', status: 401 as const }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Accès refusé', status: 403 as const }
  return { supabase, user }
}

export async function GET(req: NextRequest) {
  const ctx = await getAdmin(req)
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  const { supabase, user } = ctx

  const { data } = await supabase
    .from('compta_qa_memory')
    .select('service, description, updated_at')
    .eq('user_id', user.id)
    .order('service')

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const ctx = await getAdmin(req)
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  const { supabase, user } = ctx

  const body = await req.json() as { service: string; description: string }
  if (!body.service?.trim() || !body.description?.trim()) {
    return NextResponse.json({ error: 'service et description requis' }, { status: 400 })
  }

  const { error } = await supabase.from('compta_qa_memory').upsert(
    { user_id: user.id, service: body.service.trim(), description: body.description.trim(), updated_at: new Date().toISOString() },
    { onConflict: 'user_id,service' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const ctx = await getAdmin(req)
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  const { supabase, user } = ctx

  const { service } = await req.json() as { service: string }
  if (!service) return NextResponse.json({ error: 'service requis' }, { status: 400 })

  await supabase.from('compta_qa_memory').delete().eq('user_id', user.id).eq('service', service)
  return NextResponse.json({ success: true })
}
