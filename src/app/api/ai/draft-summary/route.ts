import { createSupabaseServerClient } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function formatHours(ms: number): string {
  const totalMin = Math.round(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h}h` : `${h}h${m.toString().padStart(2, '0')}`
}

export async function POST(_req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Non authentifié', { status: 401 })

  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Toronto' })

  const { data: entries } = await supabase
    .from('time_entries')
    .select('started_at, ended_at, total_paused_ms, notes, clients(name), projects(name)')
    .eq('user_id', user.id)
    .gte('started_at', `${today}T00:00:00`)
    .not('ended_at', 'is', null)
    .order('started_at')

  if (!entries?.length) {
    return new Response('Aucune entrée de temps pour aujourd\'hui.', { status: 200 })
  }

  const lines = entries.map((e: any) => {
    const durationMs = Math.max(0,
      new Date(e.ended_at).getTime() - new Date(e.started_at).getTime() - (e.total_paused_ms ?? 0)
    )
    const client = (e.clients as any)?.name ?? 'N/A'
    const project = (e.projects as any)?.name ?? 'N/A'
    const notes = e.notes ? ` (note : ${e.notes})` : ''
    return `- ${formatHours(durationMs)} sur "${client} / ${project}"${notes}`
  }).join('\n')

  const stream = anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: `Tu es un assistant qui aide les employés de l'Agence 361 à rédiger leur résumé de journée.
À partir des entrées de temps fournies, génère un résumé naturel, à la première personne, en français.
Le résumé doit être concis (3-5 phrases), professionnel mais humain. Mentionne les clients/projets sur lesquels tu as travaillé et le temps passé.
NE commence PAS par "Aujourd'hui j'ai..." — varie l'introduction. PAS de listes à puces, du texte continu.`,
    messages: [{
      role: 'user',
      content: `Voici mes entrées de temps d'aujourd'hui (${today}) :\n${lines}\n\nRédige mon résumé de journée.`,
    }],
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
