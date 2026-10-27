import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Non authentifié', { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return new Response('Accès refusé', { status: 403 })

  const { documentId, periodeLabel, periodeDebut, periodeFin, entrees, receipts } = await req.json() as {
    documentId?: string
    periodeLabel?: string
    periodeDebut?: string
    periodeFin?: string
    receipts?: { name: string; type: string; data: string }[]
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

  // Stocker les pièces jointes uploadées pendant le Q&A
  if (lotId && receipts && receipts.length > 0) {
    for (const receipt of receipts) {
      const ext  = receipt.name.split('.').pop() ?? 'bin'
      const path = `${user.id}/receipts/${lotId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const buf  = Buffer.from(receipt.data, 'base64')
      const { error: upErr } = await adminClient.storage
        .from('compta-documents')
        .upload(path, buf, { contentType: receipt.type, upsert: false })
      if (!upErr) {
        await adminClient.from('compta_lot_attachments').insert({
          lot_id: lotId, user_id: user.id,
          nom_fichier: receipt.name, storage_path: path, type_fichier: receipt.type,
        })
      }
    }
  }

  return new Response('OK')
}
