import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Non authentifié', { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return new Response('Accès refusé', { status: 403 })

  const { searchParams } = new URL(req.url)
  const debut = searchParams.get('debut')
  const fin   = searchParams.get('fin')

  if (!debut || !fin) return Response.json([])

  // Chevauchement : lot existant dont la période intersecte [debut, fin]
  const { data } = await supabase
    .from('compta_lots')
    .select('id, periode_label, periode_debut, periode_fin, created_at')
    .not('periode_debut', 'is', null)
    .not('periode_fin',   'is', null)
    .lte('periode_debut', fin)
    .gte('periode_fin',   debut)
    .order('created_at', { ascending: false })

  return Response.json(data ?? [])
}
