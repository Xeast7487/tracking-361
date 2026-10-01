import { createSupabaseServerClient } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Non authentifié', { status: 401 })

  const { question } = await req.json()
  if (!question?.trim()) return new Response('Question manquante', { status: 400 })

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const fromDate = thirtyDaysAgo.toLocaleDateString('sv-SE', { timeZone: 'America/Toronto' })

  const { data: summaries } = await supabase
    .from('daily_summaries')
    .select('summary_date, content, profiles(full_name)')
    .gte('summary_date', fromDate)
    .order('summary_date', { ascending: false })

  const context = (summaries ?? []).map((s: any) => {
    const name = (s.profiles as any)?.full_name ?? 'Inconnu'
    return `[${s.summary_date}] ${name} :\n${s.content}`
  }).join('\n\n---\n\n')

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `Tu es un assistant interne de l'agence de création 361. Tu as accès aux résumés quotidiens des employés des 30 derniers jours.
Réponds aux questions en te basant uniquement sur ces résumés. Sois concis, précis et direct.
Réponds toujours en français. Si l'information demandée n'est pas dans les résumés, dis-le clairement.
Format : texte simple, pas de listes à puces excessives, garde un ton professionnel mais accessible.

Résumés disponibles :
${context || 'Aucun résumé disponible pour les 30 derniers jours.'}`,
    messages: [{ role: 'user', content: question }],
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

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
