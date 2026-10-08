import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const maxDuration = 60

const SYSTEM_PROMPT = `Tu es un assistant spécialisé dans l'analyse de rapports Swydo pour l'Agence 361.
Identifie le type de rapport et extrait TOUTES les métriques disponibles.
Retourne UNIQUEMENT un objet JSON valide (aucun texte autour, aucun bloc markdown).

Structure selon le type détecté :

--- TYPE "swydo_campaign" (rapport de campagnes publicitaires Google Ads / Facebook Ads) ---
{
  "report_type": "swydo_campaign",
  "client": "nom du client",
  "period": "ex: 8 sep – 7 oct 2026",
  "compared_to": null,
  "google": {
    "cost": "CA$2,176.81",
    "cost_per_conv": "CA$241.87",
    "impressions": 151293,
    "clicks": 10744,
    "conversions": 9,
    "phone_calls": 1,
    "ctr": "7.1%",
    "avg_cpc": "CA$0.20"
  },
  "facebook": {
    "spent": "CA$1,041.36",
    "cpc": "CA$1.95",
    "impressions": 37510,
    "reach": 11367,
    "clicks": 904,
    "actions": 604,
    "ctr": "2.41%"
  },
  "facebook_page": null,
  "facebook_reels": null,
  "summary": "Résumé 3-4 phrases en français, professionnel, destiné au client."
}

--- TYPE "facebook_page" (rapport de page Facebook organique) ---
{
  "report_type": "facebook_page",
  "client": "nom du client",
  "period": "ex: 8 sep – 7 oct 2026",
  "compared_to": "ex: 9 août – 7 sep 2026",
  "google": null,
  "facebook": null,
  "facebook_page": {
    "followers_lifetime": 504,
    "followers_change_pct": "+1.6%",
    "impressions": 40965,
    "impressions_change_pct": "-35.5%",
    "reach": 13300,
    "reach_change_pct": "-44.1%",
    "post_clicks": 149,
    "post_clicks_change_pct": "-78.0%",
    "posts": [
      { "text": "Texte du post (tronqué ok)…", "date": "7 oct. 2026", "reach": 2303, "likes": 4, "shares": 1 }
    ],
    "posts_total": { "reach": 3970, "likes": 28, "shares": 6 }
  },
  "facebook_reels": {
    "reach": 0,
    "reach_change_pct": "+∞%",
    "avg_view_time": "10s",
    "avg_view_time_change_pct": "+148.0%",
    "play_count": 1038,
    "play_count_change_pct": "+142.0%",
    "video_view_time": "1h 44m 37s",
    "video_view_time_change_pct": "+240.3%",
    "reels": [
      { "text": "Texte du reel…", "reach": 0, "avg_view_time": "4s", "view_time": "17m 13s", "likes": 4 }
    ],
    "reels_total": { "reach": 0, "avg_view_time": "11s", "video_view_time": "1h 44m 37s", "likes": 27 }
  },
  "summary": "Résumé 3-4 phrases en français, professionnel, destiné au client, sur les performances organiques de la page."
}

Règles :
- Si plusieurs documents sont fournis, fusionne-les en UN SEUL JSON. Le report_type sera "combined" si les types sont mixtes.
- Si une section est absente du rapport, mets null.
- Si un champ spécifique est absent, mets null.
- Les % de variation sont des strings (ex: "+1.6%", "-35.5%", "+∞%").
- Extrais TOUS les posts/reels présents dans le rapport.`

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const formData = await req.formData()
    const files = formData.getAll('pdf') as File[]
    if (!files.length) return NextResponse.json({ error: 'Fichier PDF requis' }, { status: 400 })

    // Encode tous les PDFs reçus
    const docBlocks: any[] = []
    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      docBlocks.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } })
    }

    const userText = files.length > 1
      ? `Analyse ces ${files.length} rapports Swydo (ils peuvent concerner le même client/période) et retourne UN SEUL JSON combiné avec toutes les sections renseignées.`
      : 'Analyse ce rapport Swydo et retourne le JSON structuré.'

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          ...docBlocks,
          { type: 'text', text: userText },
        ],
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: "Impossible d'analyser le rapport" }, { status: 500 })
    }

    const data = JSON.parse(jsonMatch[0])

    const { data: saved, error: dbError } = await supabase
      .from('swydo_reports')
      .insert({
        created_by: user.id,
        report_type:    data.report_type    ?? 'swydo_campaign',
        client:         data.client         ?? '',
        period:         data.period         ?? '',
        compared_to:    data.compared_to    ?? '',
        google:         data.google         ?? null,
        facebook:       data.facebook       ?? null,
        facebook_page:  data.facebook_page  ?? null,
        facebook_reels: data.facebook_reels ?? null,
        summary:        data.summary        ?? '',
        comments:       '',
      })
      .select('*')
      .single()

    if (dbError) {
      console.error('[rapports/analyze] db error:', dbError)
      return NextResponse.json({ error: 'Erreur de sauvegarde' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, report: saved })
  } catch (e: any) {
    console.error('[rapports/analyze]', e)
    return NextResponse.json({ error: e?.message ?? 'Erreur serveur' }, { status: 500 })
  }
}
