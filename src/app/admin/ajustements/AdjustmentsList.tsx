'use client'

import { useState, useTransition } from 'react'
import { approveAdjustmentRequestAction, rejectAdjustmentRequestAction } from '@/app/actions'

type Request = {
  id: string
  status: string
  reason: string
  admin_note: string | null
  created_at: string
  requested_started_at: string
  requested_ended_at: string
  profiles: { full_name: string } | null
  time_entries: {
    started_at: string
    ended_at: string | null
    clients: { name: string } | null
    projects: { name: string } | null
  } | null
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('fr-CA', {
    timeZone: 'America/Toronto',
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function duration(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const h = Math.floor(ms / 3600000)
  const m = Math.round((ms % 3600000) / 60000)
  return h > 0 ? `${h}h${m.toString().padStart(2,'0')}` : `${m}min`
}

const statusLabel: Record<string, { label: string; color: string }> = {
  pending:  { label: 'En attente', color: 'text-yellow-400 bg-yellow-400/10' },
  approved: { label: 'Approuvé',   color: 'text-green-400  bg-green-400/10'  },
  rejected: { label: 'Refusé',     color: 'text-red-400    bg-red-400/10'    },
}

function RequestCard({ req, onUpdate }: { req: Request; onUpdate: (id: string, status: string) => void }) {
  const [pending, startTransition] = useTransition()
  const [rejectNote, setRejectNote] = useState('')
  const [showReject, setShowReject] = useState(false)

  function approve() {
    startTransition(async () => {
      await approveAdjustmentRequestAction(req.id)
      onUpdate(req.id, 'approved')
    })
  }

  function reject() {
    startTransition(async () => {
      await rejectAdjustmentRequestAction(req.id, rejectNote || undefined)
      onUpdate(req.id, 'rejected')
      setShowReject(false)
    })
  }

  const s = statusLabel[req.status] ?? statusLabel.pending
  const entry = req.time_entries

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-white">{req.profiles?.full_name ?? '—'}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {[entry?.clients?.name, entry?.projects?.name].filter(Boolean).join(' — ')}
            {' · '}
            {new Date(req.created_at).toLocaleDateString('fr-CA', { timeZone: 'America/Toronto', dateStyle: 'medium' })}
          </p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${s.color}`}>
          {s.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-slate-800/50 rounded-xl p-3 space-y-1">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Original</p>
          {entry ? (
            <>
              <p className="text-slate-300">{fmt(entry.started_at)} → {entry.ended_at ? fmt(entry.ended_at) : '…'}</p>
              {entry.ended_at && <p className="text-xs text-slate-500">{duration(entry.started_at, entry.ended_at)}</p>}
            </>
          ) : <p className="text-slate-500 text-xs">—</p>}
        </div>
        <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-3 space-y-1">
          <p className="text-xs text-blue-400 font-medium uppercase tracking-wide">Demandé</p>
          <p className="text-slate-200">{fmt(req.requested_started_at)} → {fmt(req.requested_ended_at)}</p>
          <p className="text-xs text-slate-500">{duration(req.requested_started_at, req.requested_ended_at)}</p>
        </div>
      </div>

      <div className="bg-slate-800/40 rounded-lg px-3 py-2">
        <p className="text-xs text-slate-500 mb-1">Raison</p>
        <p className="text-sm text-slate-300">{req.reason}</p>
      </div>

      {req.admin_note && (
        <div className="bg-red-900/20 rounded-lg px-3 py-2">
          <p className="text-xs text-red-400 mb-1">Note admin</p>
          <p className="text-sm text-slate-300">{req.admin_note}</p>
        </div>
      )}

      {req.status === 'pending' && (
        <div className="flex gap-2 pt-1">
          {!showReject ? (
            <>
              <button
                onClick={approve}
                disabled={pending}
                className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-xl transition-colors"
              >
                {pending ? '…' : 'Approuver'}
              </button>
              <button
                onClick={() => setShowReject(true)}
                disabled={pending}
                className="flex-1 bg-red-900/40 hover:bg-red-900/60 border border-red-800/50 disabled:opacity-50 text-red-300 text-sm font-medium py-2 rounded-xl transition-colors"
              >
                Refuser
              </button>
            </>
          ) : (
            <div className="flex-1 space-y-2">
              <input
                autoFocus
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                placeholder="Note optionnelle pour l'employé..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
              <div className="flex gap-2">
                <button onClick={reject} disabled={pending} className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-xl transition-colors">
                  {pending ? '…' : 'Confirmer le refus'}
                </button>
                <button onClick={() => setShowReject(false)} className="px-4 text-sm text-slate-400 hover:text-white transition-colors">
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdjustmentsList({ initialRequests }: { initialRequests: Request[] }) {
  const [requests, setRequests] = useState(initialRequests)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')

  function handleUpdate(id: string, status: string) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  const filtered = filter === 'pending' ? requests.filter(r => r.status === 'pending') : requests
  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Demandes d'ajustement</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-yellow-400 mt-1">{pendingCount} en attente</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${filter === 'pending' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            En attente {pendingCount > 0 && `(${pendingCount})`}
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Toutes
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12 text-slate-500">
          <p>{filter === 'pending' ? 'Aucune demande en attente.' : 'Aucune demande.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(req => (
            <RequestCard key={req.id} req={req} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  )
}
