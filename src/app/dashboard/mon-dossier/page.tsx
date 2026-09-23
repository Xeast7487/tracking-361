import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { fetchDossierEntriesAction } from '@/app/actions'

const TYPE_LABELS: Record<string, string> = {
  rencontre:             'Rencontre',
  performance:           'Analyse de performance',
  disciplinaire:         'Rencontre disciplinaire',
  avertissement:         'Avertissement',
  avertissement_ecrit:   'Avertissement écrit',
  avertissement_verbal:  'Avertissement verbal',
  felicitation:          'Félicitation',
  note:                  'Note',
}

const TYPE_COLORS: Record<string, string> = {
  rencontre:             'bg-blue-500/15 text-blue-400 border-blue-500/25',
  performance:           'bg-violet-500/15 text-violet-400 border-violet-500/25',
  disciplinaire:         'bg-red-500/15 text-red-400 border-red-500/25',
  avertissement:         'bg-amber-500/15 text-amber-400 border-amber-500/25',
  avertissement_ecrit:   'bg-orange-500/15 text-orange-400 border-orange-500/25',
  avertissement_verbal:  'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  felicitation:          'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  note:                  'bg-slate-500/15 text-slate-400 border-slate-500/25',
}

export default async function MonDossierPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const entries = await fetchDossierEntriesAction(user.id) as any[]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">Mon dossier</h1>
        <p className="text-slate-500 text-sm mt-1">
          {entries.length === 0
            ? 'Aucune entrée pour le moment.'
            : `${entries.length} entrée${entries.length !== 1 ? 's' : ''} dans votre dossier`}
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-20 text-slate-600">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p className="text-sm">Votre dossier est vide.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry: any) => {
            const date = new Date(entry.created_at).toLocaleDateString('fr-CA', {
              day: 'numeric', month: 'long', year: 'numeric',
            })
            return (
              <div key={entry.id} className="bg-slate-900 border border-slate-800/60 rounded-xl p-5">
                <div className="flex items-center gap-2.5 flex-wrap mb-2">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${TYPE_COLORS[entry.type]}`}>
                    {TYPE_LABELS[entry.type]}
                  </span>
                  <p className="font-semibold text-white">{entry.title}</p>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                <p className="text-xs text-slate-600 mt-3">{date}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
