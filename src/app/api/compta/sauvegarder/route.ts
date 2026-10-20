import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Non authentifié', { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return new Response('Accès refusé', { status: 403 })

  const { documentId, periodeLabel, periodeDebut, periodeFin, entrees } = await req.json() as {
    documentId?: string
    periodeLabel?: string
    periodeDebut?: string
    periodeFin?: string
    entrees: {
      date_transaction: string
      description: string
      categorie: string
      type: string
      montant_ht: number
      tps: number
      tvq: number
      montant_total: number
      notes?: string
    }[]
  }

  const adminClient = createSupabaseAdminClient()

  let lotId: string | null = null
  if (periodeLabel) {
    const { data: lot } = await adminClient
      .from('compta_lots')
      .insert({
        user_id:       user.id,
        periode_label: periodeLabel,
        periode_debut: periodeDebut ?? null,
        periode_fin:   periodeFin   ?? null,
        nb_entrees:    entrees.length,
      })
      .select('id')
      .single()
    lotId = lot?.id ?? null
  }

  const toInsert = entrees.map(e => ({
    ...e,
    user_id:     user.id,
    document_id: documentId ?? null,
    lot_id:      lotId,
    source:      documentId ? 'ia' : lotId ? 'lot' : 'manuel',
  }))

  const { error } = await adminClient.from('compta_entrees').insert(toInsert)
  if (error) return new Response(error.message, { status: 500 })

  if (documentId) {
    await adminClient.from('compta_documents').update({ statut: 'confirme' }).eq('id', documentId)
  }

  return new Response('OK')
}
