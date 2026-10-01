'use client'

interface ClientStat {
  id: string
  name: string
  weekHours: number
  weekMinutes: number
  lastActivity: string | null
  lastEmployee: string | null
}

interface Props {
  clients: ClientStat[]
}

function formatLastActivity(date: string | null) {
  if (!date) return null
  const d = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const target = new Date(d)
  target.setHours(0, 0, 0, 0)

  if (target.getTime() === today.getTime()) return "Aujourd'hui"
  if (target.getTime() === yesterday.getTime()) return 'Hier'
  return d.toLocaleDateString('fr-CA', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function ClientStatusWidget({ clients }: Props) {
  const ask = (clientName: string) => {
    const event = new CustomEvent('manager-ai-prompt', {
      detail: `Donne-moi un résumé complet de l'avancement du client **${clientName}** : quels employés ont travaillé dessus, sur quels projets, combien d'heures cette semaine, et ce que disent les résumés à son sujet.`
    })
    window.dispatchEvent(event)
    document.getElementById('manager-ai-chat')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (clients.length === 0) return null

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Clients · semaine en cours</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-3 gap-2">
        {clients.map(c => {
          const hasActivity = c.weekHours > 0 || c.weekMinutes > 0
          const lastLabel = formatLastActivity(c.lastActivity)
          return (
            <button
              key={c.id}
              onClick={() => ask(c.name)}
              className="group text-left bg-slate-900 border border-slate-800/60 hover:border-violet-500/30 rounded-xl p-3.5 transition-all hover:bg-slate-800/60"
            >
              <div className="flex items-start justify-between gap-1 mb-2">
                <p className="text-sm font-semibold text-white leading-tight line-clamp-1">{c.name}</p>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 group-hover:text-violet-400 transition-colors flex-shrink-0 mt-0.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div className="space-y-1">
                <p className={`text-lg font-bold leading-none ${hasActivity ? 'text-white' : 'text-slate-600'}`}>
                  {hasActivity
                    ? `${c.weekHours}h${c.weekMinutes > 0 ? ` ${String(c.weekMinutes).padStart(2, '0')}m` : ''}`
                    : '-'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {lastLabel
                    ? <><span className={lastLabel === "Aujourd'hui" ? 'text-emerald-400' : lastLabel === 'Hier' ? 'text-amber-400/80' : ''}>{lastLabel}</span>{c.lastEmployee ? ` · ${c.lastEmployee.split(' ')[0]}` : ''}</>
                    : 'Aucune activité'}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
