'use client'

import { useState, useTransition } from 'react'
import { submitLeaveRequestAction, fetchMyLeaveRequestsAction } from '@/app/actions'
import { useEffect } from 'react'

const TYPE_LABELS: Record<string, string> = {
  vacances:  'Vacances',
  maladie:   'Maladie',
  personnel: 'Personnel',
  autre:     'Autre',
}

const STATUS_STYLES: Record<string, string> = {
  pending:  'bg-amber-500/12 text-amber-400 border-amber-500/25',
  approved: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25',
  denied:   'bg-red-500/12 text-red-400 border-red-500/25',
}
const STATUS_LABELS: Record<string, string> = {
  pending:  'En attente',
  approved: 'Approuvée',
  denied:   'Refusée',
}

function daysBetween(start: string, end: string) {
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return Math.round(diff / 86400000) + 1
}
function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function CongesPage() {
  const [requests, setRequests]   = useState<any[]>([])
  const [isPending, startTransition] = useTransition()
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetchMyLeaveRequestsAction().then(setRequests)
  }, [])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setSuccess('')
    const fd = new FormData(e.currentTarget)
    const form = e.currentTarget
    startTransition(async () => {
      const res = await submitLeaveRequestAction(fd)
      if (res?.error) { setError(res.error); return }
      setSuccess('Demande envoyée ! Un admin va la réviser bientôt.')
      form.reset()
      const updated = await fetchMyLeaveRequestsAction()
      setRequests(updated)
      setTimeout(() => setSuccess(''), 4000)
    })
  }

  const pending  = requests.filter(r => r.status === 'pending')
  const resolved = requests.filter(r => r.status !== 'pending')

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Demandes de congé</h1>
        <p className="text-slate-400 text-sm mt-1">Soumets une demande et consulte l&apos;historique de tes congés.</p>
      </div>

      {/* Formulaire */}
      <div className="card p-6 border border-blue-700/30 bg-blue-900/5">
        <h2 className="font-semibold text-blue-300 mb-4 flex items-center gap-2 text-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Nouvelle demande
        </h2>
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Type de congé</label>
            <select name="type" required className="input">
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="sm:col-span-1" />
          <div>
            <label className="label">Date de début</label>
            <input name="start_date" type="date" required min={today} className="input" />
          </div>
          <div>
            <label className="label">Date de fin</label>
            <input name="end_date" type="date" required min={today} className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notes (optionnel)</label>
            <input name="notes" type="text" placeholder="Précisions, contexte..." className="input" />
          </div>
          {error   && <p className="text-red-400 text-sm sm:col-span-2">{error}</p>}
          {success && <p className="text-emerald-400 text-sm sm:col-span-2">{success}</p>}
          <div className="sm:col-span-2 flex justify-end">
            <button type="submit" disabled={isPending}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition">
              {isPending ? 'Envoi...' : 'Envoyer la demande'}
            </button>
          </div>
        </form>
      </div>

      {/* En attente */}
      {pending.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">En attente</h2>
          <div className="space-y-2">
            {pending.map(r => <RequestCard key={r.id} r={r} />)}
          </div>
        </section>
      )}

      {/* Historique */}
      {resolved.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Historique</h2>
          <div className="space-y-2">
            {resolved.map(r => <RequestCard key={r.id} r={r} />)}
          </div>
        </section>
      )}

      {requests.length === 0 && (
        <div className="text-center py-12 text-slate-600 text-sm">Aucune demande pour l&apos;instant.</div>
      )}
    </div>
  )
}

function RequestCard({ r }: { r: any }) {
  const days = daysBetween(r.start_date, r.end_date)
  return (
    <div className="card px-4 py-3 flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-white">{TYPE_LABELS[r.type] ?? r.type}</span>
          <span className="text-xs text-slate-500">{fmtDate(r.start_date)} - {fmtDate(r.end_date)}</span>
          <span className="text-xs text-slate-600">{days} jour{days > 1 ? 's' : ''}</span>
        </div>
        {r.notes && <p className="text-xs text-slate-500 mt-0.5 truncate">{r.notes}</p>}
      </div>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[r.status]}`}>
        {STATUS_LABELS[r.status]}
      </span>
    </div>
  )
}
