import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { fetchDossierEntriesAction, logDossierExportAction } from '@/app/actions'
import { PrintButton } from './PrintButton'

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

export default async function ExportDossierPage({ params }: { params: { userId: string } }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: employee } = await supabase
    .from('profiles')
    .select('id, full_name, email, created_at')
    .eq('id', params.userId)
    .single()

  if (!employee) redirect('/admin/dossiers')

  const entries = await fetchDossierEntriesAction(params.userId)
  await logDossierExportAction(params.userId)

  const exportDate = new Date().toLocaleDateString('fr-CA', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Toolbar — masqué à l'impression */}
      <div className="print:hidden flex items-center gap-4">
        <Link
          href={`/admin/dossiers/${params.userId}`}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-white flex-1">Aperçu avant impression</h1>
        <PrintButton />
      </div>

      {/* Document imprimable */}
      <div className="print:text-black bg-white text-slate-900 rounded-xl p-8 shadow-sm print:shadow-none print:p-0 print:bg-transparent">
        {/* En-tête */}
        <div className="border-b border-slate-200 pb-6 mb-6">
          <h1 className="text-2xl font-bold">Dossier de l'employé</h1>
          <div className="mt-3 space-y-0.5 text-sm text-slate-600">
            <p><strong>Nom :</strong> {employee.full_name}</p>
            <p><strong>Courriel :</strong> {employee.email}</p>
            <p><strong>Généré le :</strong> {exportDate}</p>
            <p><strong>Nombre d'entrées :</strong> {entries.length}</p>
          </div>
        </div>

        {/* Entrées */}
        {entries.length === 0 ? (
          <p className="text-slate-500 italic">Aucune entrée dans ce dossier.</p>
        ) : (
          <div className="space-y-6">
            {entries.map((entry: any, idx: number) => {
              const date = new Date(entry.created_at).toLocaleDateString('fr-CA', {
                day: 'numeric', month: 'long', year: 'numeric',
              })
              const signDate = entry.signed_at
                ? new Date(entry.signed_at).toLocaleDateString('fr-CA', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })
                : null
              const attachments: any[] = entry.attachments ?? []

              return (
                <div key={entry.id} className="border border-slate-200 rounded-lg p-5 break-inside-avoid">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {TYPE_LABELS[entry.type] ?? entry.type}
                      </span>
                      {entry.is_confidential && (
                        <span className="ml-2 text-xs font-semibold text-rose-600">[CONFIDENTIEL]</span>
                      )}
                      <h2 className="text-base font-bold mt-0.5">{entry.title}</h2>
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap">{date}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Ajouté par : {entry.creator?.full_name ?? '—'}</span>
                    {signDate
                      ? <span className="text-teal-700 font-medium">✓ Signé le {signDate}</span>
                      : <span className="text-slate-400">Non signé</span>
                    }
                  </div>
                  {attachments.length > 0 && (
                    <div className="mt-2 text-xs text-slate-500">
                      Pièces jointes : {attachments.map((a: any) => a.name).join(', ')}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Pied de page */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-400">
          Document confidentiel — Généré le {exportDate}
        </div>
      </div>
    </div>
  )
}
