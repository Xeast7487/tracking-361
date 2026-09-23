import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createDossierEntryAction, deleteDossierEntryAction, fetchDossierEntriesAction } from '@/app/actions'

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

export default async function AdminDossierEmployeePage({ params }: { params: { userId: string } }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: employee } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active, created_at')
    .eq('id', params.userId)
    .single()

  if (!employee) redirect('/admin/dossiers')

  const entries = await fetchDossierEntriesAction(params.userId) as any[]
  const initials = employee.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/dossiers"
          className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{employee.full_name}</h1>
            <p className="text-slate-500 text-sm">{employee.email}</p>
          </div>
        </div>
      </div>

      {/* New entry form */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-6">
        <h2 className="font-semibold text-white mb-5">Nouvelle entrée au dossier</h2>
        <form action={createDossierEntryAction as any} className="space-y-4">
          <input type="hidden" name="employee_id" value={params.userId} />
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Type *</label>
              <select
                name="type"
                required
                defaultValue="rencontre"
                className="w-full bg-slate-800 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-colors"
              >
                {Object.entries(TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Titre *</label>
              <input
                name="title"
                required
                placeholder="Ex. Rencontre du 22 septembre 2026"
                className="w-full bg-slate-800 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-colors"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Contenu *</label>
              <textarea
                name="content"
                required
                rows={5}
                placeholder="Décrivez les points abordés, les décisions prises, les observations…"
                className="w-full bg-slate-800 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              Ajouter au dossier
            </button>
          </div>
        </form>
      </div>

      {/* Entries list */}
      {entries.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p className="text-sm">Aucune entrée dans ce dossier.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Historique — {entries.length} entrée{entries.length !== 1 ? 's' : ''}
          </h2>
          {entries.map((entry: any) => (
            <EntryCard key={entry.id} entry={entry} employeeId={params.userId} />
          ))}
        </div>
      )}
    </div>
  )
}

function EntryCard({ entry, employeeId }: { entry: any; employeeId: string }) {
  const creatorName = entry.creator?.full_name ?? '—'
  const date = new Date(entry.created_at).toLocaleDateString('fr-CA', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap mb-2">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${TYPE_COLORS[entry.type]}`}>
              {TYPE_LABELS[entry.type]}
            </span>
            <p className="font-semibold text-white">{entry.title}</p>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 flex-wrap">
            <span>{date}</span>
            <span>Ajouté par&nbsp;: <span className="text-slate-400">{creatorName}</span></span>
          </div>
        </div>

        <form action={deleteDossierEntryAction.bind(null, entry.id, employeeId) as any}>
          <button
            type="submit"
            className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/8 border border-slate-700/40 hover:border-red-500/20 transition-colors"
          >
            Supprimer
          </button>
        </form>
      </div>
    </div>
  )
}
