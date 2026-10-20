import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `Tu es un assistant comptable pour Agence 361, une agence web québécoise. Tu aides l'administrateur à classer et saisir ses documents comptables.

Quand tu analyses un document :
1. Identifie le type (facture reçue, facture émise, reçu, relevé bancaire, etc.)
2. Extrait : date, description, montant HT (avant taxes), TPS (5%), TVQ (9.975%), total
3. Propose une catégorie parmi : revenu, depense_materiel, depense_logiciel, salaire, sous_traitance, autre
4. Si quelque chose n'est pas clair, POSE UNE OU DEUX QUESTIONS PRÉCISES avant de conclure
5. Une fois tout confirmé, fournis le résumé structuré entre balises <entree> et </entree> :

<entree>
{
  "date_transaction": "2024-01-15",
  "description": "Achat filament PLA - Prusa",
  "categorie": "depense_materiel",
  "type": "depense",
  "montant_ht": 45.00,
  "tps": 2.25,
  "tvq": 4.49,
  "montant_total": 51.74
}
</entree>

Important : si les taxes ne sont pas visibles sur le document, calcule-les en fonction du type de transaction (les achats B2B avec numéro de TPS sont remboursables, les achats personnels non). Parle en français québécois naturel et sois concis.`

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Non authentifié', { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return new Response('Accès refusé', { status: 403 })

  const body = await req.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    documentId?: string
    file?: { data: string; name: string; type: string }
  }

  const { messages, file } = body
  let { documentId } = body

  // Upload file to storage and create document record on first message
  if (file && !documentId) {
    const adminClient = createSupabaseAdminClient()
    const buffer = Buffer.from(file.data, 'base64')
    const ext   = file.name.split('.').pop() ?? 'bin'
    const path  = `${user.id}/${Date.now()}.${ext}`

    await adminClient.storage.from('compta-documents').upload(path, buffer, {
      contentType: file.type,
    })

    const { data: doc } = await adminClient.from('compta_documents').insert({
      user_id:      user.id,
      nom_fichier:  file.name,
      type_fichier: file.type.startsWith('image/') ? 'image' : 'pdf',
      storage_path: path,
      statut:       'analyse',
    }).select('id').single()

    documentId = doc?.id ?? undefined
  }

  // Build Anthropic messages — include file only on first user message
  type AnthropicMsg = Parameters<typeof anthropic.messages.stream>[0]['messages'][number]
  const anthropicMessages: AnthropicMsg[] = messages.map((m, i) => {
    if (i === 0 && file) {
      const isPdf = file.type === 'application/pdf'
      return {
        role: 'user',
        content: [
          isPdf
            ? { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: file.data } }
            : { type: 'image' as const, source: { type: 'base64' as const, media_type: file.type as 'image/jpeg' | 'image/png' | 'image/webp', data: file.data } },
          { type: 'text' as const, text: m.content },
        ],
      }
    }
    return { role: m.role, content: m.content }
  })

  const stream = anthropic.messages.stream({
    model:      'claude-sonnet-4-6',
    max_tokens: 1024,
    system:     SYSTEM,
    messages:   anthropicMessages,
  })

  const headers: Record<string, string> = { 'Content-Type': 'text/plain; charset=utf-8' }
  if (documentId) headers['X-Document-Id'] = documentId

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, { headers })
}
