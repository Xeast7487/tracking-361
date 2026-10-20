import { createSupabaseServerClient } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `Tu es un assistant comptable pour Agence 361, une agence web québécoise. L'utilisateur t'envoie plusieurs documents comptables d'un même mois.

TON RÔLE :
1. Analyse tous les documents reçus
2. Si tu as besoin d'un rapport de facturation (liste des factures émises aux clients) pour vérifier ou croiser des montants de revenus, demande-le explicitement
3. Pour chaque élément que tu ne comprends pas ou qui est ambigu, pose une question PRÉCISE en mentionnant le document et le montant exact. Ex : "Dans le relevé Desjardins du 12 oct, il y a un débit de 234,50$ chez 'AMZN*1234'. Est-ce du matériel ou du logiciel ?"
4. Quand tu as assez d'informations pour produire les entrées, fais-le

FORMAT DES ENTRÉES :
Quand tu as assez d'informations pour une entrée, inclus-la entre balises :
<entree>
{
  "date_transaction": "2024-01-15",
  "description": "Description claire",
  "categorie": "revenu|depense_materiel|depense_logiciel|salaire|sous_traitance|autre",
  "type": "revenu|depense",
  "montant_ht": 45.00,
  "tps": 2.25,
  "tvq": 4.49,
  "montant_total": 51.74
}
</entree>

RÈGLES :
- Mets plusieurs balises <entree> si tu as plusieurs entrées à produire
- Une entrée par transaction (ne regroupe pas plusieurs factures en une)
- Si les taxes ne sont pas visibles, calcule-les (TPS 5%, TVQ 9.975%) selon le contexte
- Les achats B2B avec numéro TPS : taxes remboursables
- Parle en français québécois, sois direct et concis`

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Non authentifié', { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return new Response('Accès refusé', { status: 403 })

  const body = await req.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    files?: { data: string; name: string; type: string }[]
  }

  const { messages, files } = body

  // Build Anthropic messages — attach all files to the first user message
  type AnthropicMsg = Parameters<typeof anthropic.messages.stream>[0]['messages'][number]

  const anthropicMessages: AnthropicMsg[] = messages.map((m, i) => {
    if (i === 0 && files?.length) {
      const docBlocks = files.map(f => {
        const isPdf = f.type === 'application/pdf'
        return isPdf
          ? { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: f.data }, title: f.name }
          : { type: 'image' as const, source: { type: 'base64' as const, media_type: f.type as 'image/jpeg' | 'image/png' | 'image/webp', data: f.data } }
      })
      return {
        role: 'user' as const,
        content: [
          ...docBlocks,
          { type: 'text' as const, text: m.content },
        ],
      }
    }
    return { role: m.role, content: m.content }
  })

  const stream = anthropic.messages.stream({
    model:      'claude-sonnet-4-6',
    max_tokens: 2048,
    system:     SYSTEM,
    messages:   anthropicMessages,
  })

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

  return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
