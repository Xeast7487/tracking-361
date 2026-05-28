'use client'

import { formatDate, formatTime, formatDuration } from '@/lib/utils'
import DeleteEntryButton from './DeleteEntryButton'
import EditEntryModal from './EditEntryModal'

export interface TimeEntry {
  id: string
  started_at: string
  ended_at: string | null
  client_id: string | null
  project_id: string | null
  notes: string | null
  is_billable: boolean
  clients:  { name: string } | null
  projects: { name: string } | null
  profiles?: { full_name: string } | null
}

interface Props {
  entries: TimeEntry[]
  showEmployee?: boolean
  isAdmin?: boolean
  allowEdit?: boolean
}

export default function EntryList({ entries, showEmployee = false, isAdmin = false, allowEdit = false }: Props) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <svg className="mx-auto mb-3 opacity-30" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <p className="text-sm">Aucune entrée pour cette période.</p>
      </div>
    )
  }

  const totalMs = entries
    .filter(e => e.ended_at)
    .reduce((acc, e) => acc + (new Date(e.ended_at!).getTime() - new Date(e.started_at).getTime()), 0)
  const totalH = Math.floor(totalMs / 3_600_000)
  const totalM = Math.floor((totalMs % 3_600_000) / 60_000)
  const billableMs = entries
    .filter(e => e.ended_at && e.is_billable)
    .reduce((acc, e) => acc + (new Date(e.ended_at!).getTime() - new Date(e.started_at).getTime()), 0)
  const billableH = Math.floor(billableMs / 3_600_000)
  const billableM = Math.floor((billableMs % 3_600_000) / 60_000)

  const showActions = allowEdit || isAdmin

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/80 text-left">
              {showEmployee && <th className="px-4 py-3 font-semibold text-slate-400 whitespace-nowrap">Employé</th>}
              <th className="px-4 py-3 font-semibold text-slate-400 whitespace-nowrap">Date</th>
              <th className="px-4 py-3 font-semibold text-slate-400 whitespace-nowrap">Début</th>
              <th className="px-4 py-3 font-semibold text-slate-400 whitespace-nowrap">Fin</th>
              <th className="px-4 py-3 font-semibold text-slate-400 whitespace-nowrap">Durée</th>
              <th className="px-4 py-3 font-semibold text-slate-400 whitespace-nowrap">Client</th>
              <th className="px-4 py-3 font-semibold text-slate-400 whitespace-nowrap">Projet</th>
              <th className="px-4 py-3 font-semibold text-slate-400 whitespace-nowrap">Facturable</th>
              <th className="px-4 py-3 font-semibold text-slate-400">Notes</th>
              {showActions && <th className="px-4 py-3 w-20" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {entries.map(e => (
              <tr key={e.id} className="hover:bg-slate-800/40 transition">
                {showEmployee && (
                  <td className="px-4 py-3 text-slate-200 whitespace-nowrap font-medium">
                    {e.profiles?.full_name ?? '—'}
                  </td>
                )}
                <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{formatDate(e.started_at)}</td>
                <td className="px-4 py-3 text-slate-300 whitespace-nowrap font-mono">{formatTime(e.started_at)}</td>
                <td className="px-4 py-3 text-slate-300 whitespace-nowrap font-mono">
                  {e.ended_at ? formatTime(e.ended_at) : <span className="text-green-400 text-xs animate-pulse">En cours</span>}
                </td>
                <td className="px-4 py-3 text-slate-200 whitespace-nowrap font-semibold">
                  {formatDuration(e.started_at, e.ended_at)}
                </td>
                <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{e.clients?.name ?? '—'}</td>
                <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{e.projects?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  {e.is_billable
                    ? <span className="badge-billable">💰 Oui</span>
                    : <span className="badge-unbillable">Non</span>}
                </td>
                <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">{e.notes ?? ''}</td>
                {showActions && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {allowEdit && (
                        <EditEntryModal
                          key={e.id + (e.ended_at ?? '')}
                          entry={{
                            id:         e.id,
                            started_at: e.started_at,
                            ended_at:   e.ended_at,
                            client_id:  e.client_id,
                            project_id: e.project_id,
                            notes:      e.notes,
                            is_billable: e.is_billable,
                          }}
                        />
                      )}
                      {isAdmin && <DeleteEntryButton entryId={e.id} />}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Total :</span>
          <span className="font-bold text-white">{totalH}h {totalM.toString().padStart(2,'0')}m</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Facturable :</span>
          <span className="font-bold text-green-400">{billableH}h {billableM.toString().padStart(2,'0')}m</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Entrées :</span>
          <span className="font-bold text-slate-300">{entries.length}</span>
        </div>
      </div>
    </div>
  )
}
