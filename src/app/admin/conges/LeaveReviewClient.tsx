'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { reviewLeaveRequestAction } from '@/app/actions'

const TYPE_LABELS: Record<string, string> = {
  vacances: 'Vacances', maladie: 'Maladie', personnel: 'Personnel', autre: 'Autre',
}
const STATUS_STYLES: Record<string, string> = {
  pending:  'bg-amber-500/12 text-amber-400 border-amber-500/25',
  approved: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25',
  denied:   'bg-red-500/12 text-red-400 border-red-500/25',
}
const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente', approved: 'Approuvee', denied: 'Refusee',
}

function daysBetween(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1
}
function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function LeaveReviewClient({ request: r, readonly }: { request: any; readonly?: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const days = daysBetween(r.start_date, r.end_date)
  const employeeName = r.employee?.full_name ?? 'Inconnu'

  function review(status: 'approved' | 'denied') {
    startTransition(async () => {
      await reviewLeaveRequestAction(r.id, status)
      router.refresh()
    })
  }

  return (
    <div className="card px-4 py-3 flex flex-wrap items-center gap-3">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
        {employeeName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-white">{employeeName}</span>
          <span className="text-xs text-slate-400">{TYPE_LABELS[r.type] ?? r.type}</span>
          <span className="text-xs text-slate-500">{fmtDate(r.start_date)} - {fmtDate(r.end_date)}</span>
          <span className="text-xs text-slate-600">{days} jour{days > 1 ? 's' : ''}</span>
        </div>
        {r.notes && <p className="text-xs text-slate-500 mt-0.5 truncate">{r.notes}</p>}
        {!readonly && r.status === 'approved' && r.reviewer?.full_name && (
          <p className="text-xs text-emerald-600 mt-0.5">Approuvee par {r.reviewer.full_name}</p>
        )}
        {!readonly && r.status === 'denied' && r.reviewer?.full_name && (
          <p className="text-xs text-red-600 mt-0.5">Refusee par {r.reviewer.full_name}</p>
        )}
      </div>

      {/* Actions ou badge */}
      {readonly || r.status !== 'pending' ? (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[r.status]}`}>
          {STATUS_LABELS[r.status]}
        </span>
      ) : (
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => review('approved')} disabled={isPending}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition">
            Approuver
          </button>
          <button onClick={() => review('denied')} disabled={isPending}
            className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition">
            Refuser
          </button>
        </div>
      )}
    </div>
  )
}
