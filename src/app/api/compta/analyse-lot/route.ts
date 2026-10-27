import { createSupabaseServerClient } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const SYSTEM_DATES = `Tu es un assistant comptable. Analyse les relevés bancaires reçus.
Identifie la période couverte (date début et date fin).
Réponds UNIQUEMENT avec ce JSON (rien d'autre, pas de markdown) :
{"debut":"2024-10-01","fin":"2024-10-31","label":"Ces relevés couvrent du 1er au 31 octobre 2024."}`

function buildSystemQA(memory: { service: string; description: string }[]) {
  const memoryBlock = memory.length > 0
    ? `\nSERVICES DÉJÀ CONNUS (ne pas redemander) :\n${memory.map(m => `- ${m.service} : ${m.description}`).join('\n')}\n`
    : ''

  return `Tu es un assistant comptable pour Agence 361, une agence web québécoise. Tu reçois des relevés bancaires (compte courant, épargne, carte de crédit) et possiblement un rapport de facturation.
${memoryBlock}
À IGNORER COMPLÈTEMENT — ne pas créer d'entrée, ne pas poser de question :
- Transferts entre comptes de la même entreprise (ex: "Transfert vers épargne", "Transfert depuis compte courant", "Transfer", "TRF")
- Paiements de solde de carte de crédit depuis un compte bancaire (ex: "Paiement carte Visa", "Remboursement carte", "Crédit carte", "PAYMENT - THANK YOU")
- Virements internes, consolidations de comptes
- Dépôts provenant d'un autre compte personnel/entreprise
Ces mouvements sont de simples déplacements d'argent, pas des revenus ni des dépenses réelles.

DÉROULEMENT :
1. Lis TOUS les documents fournis en entier avant de commencer à poser des questions
2. Identifie d'abord toutes les transactions réelles (non-transferts) sur l'ensemble des documents
3. Génère les entrées évidentes immédiatement avec <entree> sans poser de question
4. Pour les éléments vraiment ambigus, pose tes questions UNE PAR UNE — une seule par message
5. Si une transaction provient d'un service dont tu n'as pas de facture (logiciel, abonnement, service cloud), demande : "As-tu la facture pour [NomService] ? Tu peux l'uploader directement." — seulement si la facture aiderait à clarifier les taxes ou la catégorie
6. Quand tu apprends quelque chose de réutilisable sur un service récurrent, tag-le avec <souvenir service="NomExact">ce que c'est</souvenir>

FORMAT DES ENTRÉES :
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
- Une seule question à la fois, jamais une liste de questions
- Une entrée par transaction réelle
- Si les taxes ne sont pas visibles, calcule-les (TPS 5%, TVQ 9.975%)
- Les achats B2B avec numéro TPS : taxes remboursables
- Si tu vois le même achat sur le relevé de carte de crédit ET sur le relevé bancaire (paiement de la carte), ne le compte qu'une seule fois — depuis le relevé de carte de crédit
- Parle en français québécois, sois direct et concis`
}

export const maxDuration = 300
export const dynamic = 'force-dynamic'

const NO_CACHE = { 'Cache-Control': 'no-store, no-cache, must-revalidate' }

export async function POST(req: NextRequest) {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Non authentifié', { status: 401, headers: NO_CACHE })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return new Response('Accès refusé', { status: 403, headers: NO_CACHE })

    const body = await req.json() as {
      messages: { role: 'user' | 'assistant'; content: string }[]
      files?: { data: string; name: string; type: string }[]
      newFiles?: { data: string; name: string; type: string; msgIndex: number }[]
      mode?: 'dates' | 'qa'
      memory?: { service: string; description: string }[]
    }

    const { messages, files, newFiles, mode, memory } = body
    const system = mode === 'dates' ? SYSTEM_DATES : buildSystemQA(memory ?? [])

    type AnthropicMsg = Parameters<typeof anthropic.messages.stream>[0]['messages'][number]

    const SUPPORTED_IMAGES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
    type ImgMime = typeof SUPPORTED_IMAGES[number]

    function fileToBlock(f: { data: string; name: string; type: string }) {
      if (f.type === 'application/pdf') {
        return { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: f.data }, title: f.name }
      } else if ((SUPPORTED_IMAGES as readonly string[]).includes(f.type)) {
        return { type: 'image' as const, source: { type: 'base64' as const, media_type: f.type as ImgMime, data: f.data } }
      } else {
        const text = Buffer.from(f.data, 'base64').toString('utf-8')
        return { type: 'text' as const, text: `=== Fichier : ${f.name} ===\n${text}` }
      }
    }

    const anthropicMessages: AnthropicMsg[] = messages.map((m, i) => {
      const extraFiles = (newFiles ?? []).filter(f => f.msgIndex === i)
      if (i === 0 && files?.length) {
        const docBlocks = files.map(fileToBlock)
        return {
          role: 'user' as const,
          content: [...docBlocks, { type: 'text' as const, text: m.content }],
        }
      }
      if (extraFiles.length > 0 && m.role === 'user') {
        return {
          role: 'user' as const,
          content: [...extraFiles.map(fileToBlock), { type: 'text' as const, text: m.content }],
        }
      }
      return { role: m.role, content: m.content }
    })

    const stream = anthropic.messages.stream({
      model:      'claude-sonnet-4-6',
      max_tokens: mode === 'dates' ? 128 : 8096,
      system,
      messages:   anthropicMessages,
    })

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              controller.enqueue(new TextEncoder().encode(chunk.delta.text))
            }
          }
          controller.close()
        } catch (streamErr) {
          const msg = streamErr instanceof Error ? streamErr.message : String(streamErr)
          controller.enqueue(new TextEncoder().encode(`\nERREUR: ${msg}`))
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', ...NO_CACHE },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[analyse-lot]', msg)
    return new Response(`ERREUR: ${msg}`, { status: 500, headers: NO_CACHE })
  }
}
