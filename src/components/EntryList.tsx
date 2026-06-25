'use client'

import { formatDate, formatTime, formatDuration } from '@/lib/utils'
import DeleteEntryButton from './DeleteEntryButton'
import EditEntryModal from './EditEntryModal'
import { useLanguage } from '@/lib/LanguageContext'
import { translations } from '@/lib/translations'

export interface TimeEntry {
  id: string
  started_at: string
  ended_at: string | null
  total_paused_ms?: number
  client_id: string | null
  project_id: string | null
  notes: string | null
  is_billable: boolean
  charge_client?: boolean
  client_hourly_rate?: number | null
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
  const { lang } = useLanguage()
  const t = translations[lang].entries

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <svg className="mx-auto mb-3 opacity-30" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <p className="text-sm">{t.noEntries}</p>
      </div>
    )
  }

  const workMs = (e: TimeEntry) =>
    Math.max(0, new Date(e.ended_at!).getTime() - new Date(e.started_at).getTime() - (e.total_paused_ms ?? 0))
  const totalMs = entries.filter(e => e.ended_at).reduce((acc, e) => acc + workMs(e), 0)
  const totalH = Math.floor(totalMs / 3_600_000)
  const totalM = Math.floor((totalMs % 3_600_000) / 60_000)
  const billableMs = entries.filter(e => e.ended_at && e.is_billable).reduce((acc, e) => acc + workMs(e), 0)
  const billableH = Math.floor(billableMs / 3_600_000)
  const billableM = Math.floor((billableMs % 3_600_000) / 60_000)

  const showActions = allowEdit || isAdmin

  return (
    <div>
      {/* ── Mobile card list (below sm) ───────────────────── */}
      <div className="sm:hidden space-y-3">
        {entries.map(e => (
          <div key={e.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3 shadow-[0_1px_8px_rgba(0,0,0,0.3)]">
            {/* Top row: client/project + billable badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                {showEmployee && e.profiles?.full_name && (
                  <p className="text-xs text-slate-500 font-medium mb-0.5">{e.profiles.full_name}</p>
                )}
                <p className="font-semibold text-white leading-tight truncate">{e.clients?.name ?? '—'}</p>
                <p className="text-sm text-slate-400 truncate">{e.projects?.name ?? '—'}</p>
              </div>
              <div className="flex-shrink-0">
                {e.charge_client
                  ? <span className="badge-client-billing">{t.chargeClientYes}</span>
                  : e.is_billable
                  ? <span className="badge-billable">{t.billableYes}</span>
                  : <span className="badge-unbillable">{t.billableNo}</span>}
              </div>
            </div>

            {/* Time row */}
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span className="text-slate-500 text-xs">{formatDate(e.started_at, lang)}</span>
              <span className="font-mono text-xs">
                {formatTime(e.started_at, lang)}
                {' → '}
                {e.ended_at
                  ? formatTime(e.ended_at, lang)
                  : <span className="text-green-400 animate-pulse">{t.inProgress}</span>}
              </span>
              <span className="ml-auto font-bold text-white font-mono text-sm">
                {formatDuration(e.started_at, e.ended_at, e.total_paused_ms, t.inProgress)}
              </span>
            </div>

            {/* Notes */}
            {e.notes && (
              <p className="text-xs text-slate-500 border-t border-slate-700/60 pt-2 leading-snug">{e.notes}</p>
            )}

            {/* Actions */}
            {showActions && (
              <div className="flex items-center gap-2 border-t border-slate-700/60 pt-2">
                {allowEdit && (
                  <EditEntryModal
                    key={e.id + (e.ended_at ?? '')}
                    entry={{
                      id:                 e.id,
                      started_at:         e.started_at,
                      ended_at:           e.ended_at,
                      client_id:          e.client_id,
                      project_id:         e.project_id,
                      notes:              e.notes,
                      is_billable:        e.is_billable,
                      charge_client:      e.charge_client ?? false,
                      client_hourly_rate: e.client_hourly_rate ?? null,
                    }}
                  />
                )}
                {isAdmin && <DeleteEntryButton entryId={e.id} />}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Desktop table (sm and above) ──────────────────── */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/80 text-left">
              {showEmployee && <th className="px-4 py-3 font-semibold text-slate-400 whitespace-nowrap">{t.employee}</th>}
              <th className="px-4 py-3 font-semibold text-slate-400 whitespace-nowrap">{t.date}</th>
              <th className="px-4 py-3 font-semibold text-slate-400 whitespace-nowrap">{t.start}</th>
              <th className="px-4 py-3 font-semibold text-slate-400 whitespace-nowrap">{t.end}</th>
              <th className="px-4 py-3 font-semibold text-slate-400 whitespace-nowrap">{t.duration}</th>
              <th className="px-4 py-3 font-semibold text-slate-400 whitespace-nowrap">{t.client}</th>
              <th className="px-4 py-3 font-semibold text-slate-400 whitespace-nowrap">{t.project}</th>
              <th className="px-4 py-3 font-semibold text-slate-400 whitespace-nowrap">{t.billable}</th>
              <th className="px-4 py-3 font-semibold text-slate-400">{t.notes}</th>
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
                <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{formatDate(e.started_at, lang)}</td>
                <td className="px-4 py-3 text-slate-300 whitespace-nowrap font-mono">{formatTime(e.started_at, lang)}</td>
                <td className="px-4 py-3 text-slate-300 whitespace-nowrap font-mono">
                  {e.ended_at ? formatTime(e.ended_at, lang) : <span className="text-green-400 text-xs animate-pulse">{t.inProgress}</span>}
                </td>
                <td className="px-4 py-3 text-slate-200 whitespace-nowrap font-semibold">
                  {formatDuration(e.started_at, e.ended_at, e.total_paused_ms, t.inProgress)}
                </td>
                <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{e.clients?.name ?? '—'}</td>
                <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{e.projects?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  {e.charge_client
                    ? <span className="badge-client-billing">{t.chargeClientYes}</span>
                    : e.is_billable
                    ? <span className="badge-billable">{t.billableYes}</span>
                    : <span className="badge-unbillable">{t.billableNo}</span>}
                </td>
                <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">{e.notes ?? ''}</td>
                {showActions && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {allowEdit && (
                        <EditEntryModal
                          key={e.id + (e.ended_at ?? '')}
                          entry={{
                            id:                 e.id,
                            started_at:         e.started_at,
                            ended_at:           e.ended_at,
                            client_id:          e.client_id,
                            project_id:         e.project_id,
                            notes:              e.notes,
                            is_billable:        e.is_billable,
                            charge_client:      e.charge_client ?? false,
                            client_hourly_rate: e.client_hourly_rate ?? null,
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
      <div className="mt-4 flex flex-wrap gap-4 sm:gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">{t.total} :</span>
          <span className="font-bold text-white">{totalH}h {totalM.toString().padStart(2,'0')}m</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">{t.billableTotal} :</span>
          <span className="font-bold text-green-400">{billableH}h {billableM.toString().padStart(2,'0')}m</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">{t.entries} :</span>
          <span className="font-bold text-slate-300">{entries.length}</span>
        </div>
      </div>
    </div>
  )
}
