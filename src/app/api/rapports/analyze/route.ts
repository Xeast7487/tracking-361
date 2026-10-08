import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('pdf') as File | null
  if (!file) return NextResponse.json({ error: 'Fichier PDF requis' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: `Tu es un assistant spécialisé dans l'analyse de rapports publicitaires Swydo pour l'Agence 361.
Extrait les données du rapport PDF et retourne UNIQUEMENT un objet JSON valide (aucun texte autour, aucun bloc markdown) avec cette structure:
{
  "client": "nom du client",
  "period": "période du rapport (ex: 8 sep – 7 oct 2026)",
  "google": {
    "cost": "ex: CA$2,176.81",
    "cost_per_conv": "ex: CA$241.87",
    "impressions": 151293,
    "clicks": 10744,
    "conversions": 9,
    "phone_calls": 1,
    "ctr": "7.1%",
    "avg_cpc": "CA$0.20"
  },
  "facebook": {
    "spent": "ex: CA$1,041.36",
    "cpc": "CA$1.95",
    "impressions": 37510,
    "reach": 11367,
    "clicks": 904,
    "actions": 604,
    "ctr": "2.41%"
  },
  "summary": "Résumé en 3-4 phrases en français, professionnel et accessible, destiné au client. Décris les performances globales des campagnes, mentionne les points forts et les opportunités d'amélioration."
}
Si une plateforme (google ou facebook) n'est pas dans le rapport, mets null pour sa valeur.
Si un champ est absent, mets null.`,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        } as any,
        { type: 'text', text: 'Analyse ce rapport Swydo et retourne le JSON structuré.' },
      ],
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return NextResponse.json({ error: "Impossible d'analyser le rapport" }, { status: 500 })
  }

  try {
    const data = JSON.parse(jsonMatch[0])
    return NextResponse.json({ ok: true, data })
  } catch {
    return NextResponse.json({ error: 'Erreur de parsing JSON' }, { status: 500 })
  }
}
