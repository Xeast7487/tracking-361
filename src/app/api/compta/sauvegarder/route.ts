import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Non authentifié', { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return new Response('Accès refusé', { status: 403 })

  const { documentId, entrees } = await req.json() as {
    documentId?: string
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

  const toInsert = entrees.map(e => ({
    ...e,
    user_id:     user.id,
    document_id: documentId ?? null,
    source:      documentId ? 'ia' : 'manuel',
  }))

  const { error } = await adminClient.from('compta_entrees').insert(toInsert)
  if (error) return new Response(error.message, { status: 500 })

  if (documentId) {
    await adminClient.from('compta_documents').update({ statut: 'confirme' }).eq('id', documentId)
  }

  return new Response('OK')
}
