import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { fetchDossierEntriesAction, signDossierEntryAction } from '@/app/actions'
import { MonDossierFilters } from './MonDossierFilters'

const TYPE_LABELS: Record<string, string> = {
  rencontre:            'Rencontre',
  performance:          'Analyse de performance',
  disciplinaire:        'Rencontre disciplinaire',
  avertissement:        'Avertissement',
  avertissement_ecrit:  'Avertissement écrit',
  avertissement_verbal: 'Avertissement verbal',
  felicitation:         'Félicitation',
  note:                 'Note',
}

const TYPE_COLORS: Record<string, string> = {
  rencontre:            'bg-blue-500/15 text-blue-400 border-blue-500/25',
  performance:          'bg-violet-500/15 text-violet-400 border-violet-500/25',
  disciplinaire:        'bg-red-500/15 text-red-400 border-red-500/25',
  avertissement:        'bg-amber-500/15 text-amber-400 border-amber-500/25',
  avertissement_ecrit:  'bg-orange-500/15 text-orange-400 border-orange-500/25',
  avertissement_verbal: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  felicitation:         'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  note:                 'bg-slate-500/15 text-slate-400 border-slate-500/25',
}

const TYPE_DOT: Record<string, string> = {
  rencontre:            'bg-blue-500',
  performance:          'bg-violet-500',
  disciplinaire:        'bg-red-500',
  avertissement:        'bg-amber-500',
  avertissement_ecrit:  'bg-orange-500',
  avertissement_verbal: 'bg-yellow-500',
  felicitation:         'bg-emerald-500',
  note:                 'bg-slate-500',
}

export default async function MonDossierPage({
  searchParams,
}: {
  searchParams: { type?: string; search?: string }
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const filters = { type: searchParams.type, search: searchParams.search }
  const entries = await fetchDossierEntriesAction(user.id, filters)

  const signedCount   = entries.filter((e: any) => e.signed_at).length
  const unsignedCount = entries.filter((e: any) => !e.signed_at).length
  const hasFilters    = searchParams.type || searchParams.search

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Mon dossier</h1>
        <p className="text-slate-500 text-sm mt-1">
          {entries.length === 0
            ? 'Aucune entrée pour le moment.'
            : `${entries.length} entrée${entries.length !== 1 ? 's' : ''}${unsignedCount > 0 ? ` · ${unsignedCount} en attente de signature` : ''}`}
        </p>
      </div>

      {/* Filters */}
      <MonDossierFilters />

      {entries.length === 0 ? (
        <div className="text-center py-20 text-slate-600">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p className="text-sm">{hasFilters ? 'Aucun résultat pour ces filtres.' : 'Votre dossier est vide.'}</p>
        </div>
      ) : (
        <div className="relative space-y-3 before:absolute before:left-1.5 before:top-5 before:bottom-5 before:w-px before:bg-slate-800">
          {entries.map((entry: any) => {
            const date = new Date(entry.created_at).toLocaleDateString('fr-CA', {
              day: 'numeric', month: 'long', year: 'numeric',
            })
            const attachments: any[] = entry.attachments ?? []

            return (
              <div key={entry.id} className="relative pl-6">
                {/* Timeline dot */}
                <div className={`absolute left-0 top-4 w-3 h-3 rounded-full border-2 border-slate-950 ${TYPE_DOT[entry.type] ?? 'bg-slate-500'}`} />

                <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap mb-2">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${TYPE_COLORS[entry.type] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/25'}`}>
                          {TYPE_LABELS[entry.type] ?? entry.type}
                        </span>
                        {entry.signed_at && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-teal-500/10 text-teal-400 border-teal-500/20 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Signé
                          </span>
                        )}
                        <p className="font-semibold text-white">{entry.title}</p>
                      </div>

                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{entry.content}</p>

                      {/* Attachments */}
                      {attachments.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          {attachments.map((att: any) => (
                            <div key={att.id} className="flex items-center gap-2 text-xs">
                              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              <a
                                href={`/api/dossier-file/${att.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
                              >
                                {att.name}
                              </a>
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-slate-600 mt-3">{date}</p>
                    </div>

                    {/* Sign button */}
                    {!entry.signed_at && (
                      <form action={signDossierEntryAction.bind(null, entry.id) as any} className="flex-shrink-0">
                        <button
                          type="submit"
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-teal-600/15 text-teal-400 hover:bg-teal-600/25 border border-teal-500/20 hover:border-teal-500/40 transition-colors whitespace-nowrap"
                        >
                          Prendre connaissance
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
