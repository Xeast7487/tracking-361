import { createSupabaseServerClient } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function formatHours(ms: number): string {
  const totalMin = Math.round(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m}min`
  return m === 0 ? `${h}h` : `${h}h${m.toString().padStart(2, '0')}`
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Non authentifié', { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return new Response('Accès refusé', { status: 403 })

  const { messages } = await req.json() as { messages: { role: 'user' | 'assistant'; content: string }[] }
  if (!messages?.length) return new Response('Messages manquants', { status: 400 })

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const fromDate = thirtyDaysAgo.toLocaleDateString('sv-SE', { timeZone: 'America/Toronto' })

  const [entriesRes, summariesRes] = await Promise.all([
    supabase
      .from('time_entries')
      .select('user_id, started_at, ended_at, total_paused_ms, notes, is_billable, clients(name), projects(name), profiles(full_name)')
      .gte('started_at', `${fromDate}T00:00:00`)
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false }),
    supabase
      .from('daily_summaries')
      .select('summary_date, content, user_id, profiles(full_name)')
      .gte('summary_date', fromDate)
      .order('summary_date', { ascending: false }),
  ])

  const entries = (entriesRes.data ?? []) as any[]
  const summaries = (summariesRes.data ?? []) as any[]

  // Group time entries by date → employee
  const byDate: Record<string, Record<string, { hours: number; projects: Record<string, number> }>> = {}
  for (const e of entries) {
    const date = (e.started_at as string).slice(0, 10)
    const emp = (e.profiles as any)?.full_name ?? 'Inconnu'
    const client = (e.clients as any)?.name ?? 'N/A'
    const project = (e.projects as any)?.name ?? 'N/A'
    const durationMs = Math.max(0,
      new Date(e.ended_at).getTime() - new Date(e.started_at).getTime() - (e.total_paused_ms ?? 0)
    )
    if (!byDate[date]) byDate[date] = {}
    if (!byDate[date][emp]) byDate[date][emp] = { hours: 0, projects: {} }
    byDate[date][emp].hours += durationMs
    const key = `${client} / ${project}`
    byDate[date][emp].projects[key] = (byDate[date][emp].projects[key] ?? 0) + durationMs
  }

  const timeContext = Object.entries(byDate)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, byEmp]) => {
      const lines = Object.entries(byEmp).map(([emp, d]) => {
        const projLines = Object.entries(d.projects)
          .map(([proj, ms]) => `      · ${formatHours(ms)} → ${proj}`)
          .join('\n')
        return `  ${emp} (total: ${formatHours(d.hours)})\n${projLines}`
      })
      return `📅 ${date}\n${lines.join('\n')}`
    }).join('\n\n')

  const summaryContext = summaries.map((s: any) =>
    `[${s.summary_date}] ${(s.profiles as any)?.full_name ?? 'Inconnu'} :\n${s.content}`
  ).join('\n\n---\n\n')

  const system = `Tu es l'assistant de l'Agence 361. Tu parles directement au gestionnaire, en français, de façon naturelle et concise — comme si tu lui faisais un point verbal rapide.

Quand on te demande où on en est avec un client ou un projet, réponds simplement : ce qu'on a fait, quand, combien d'heures, et ce que les employés ont dit dans leurs résumés. Donne les dates. Pas de mise en forme complexe, pas de titres, pas de listes à puces si ce n'est pas nécessaire — juste du texte clair.

Voici les données de l'équipe des 30 derniers jours.

HEURES PAR JOUR
${timeContext || 'Aucune entrée.'}

RÉSUMÉS DES EMPLOYÉS
${summaryContext || 'Aucun résumé.'}`

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system,
    messages,
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
