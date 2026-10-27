'use client'

import { useState, useTransition } from 'react'
import { adminClockInAction } from '@/app/actions'

type Employee = { id: string; full_name: string }
type Client   = { id: string; name: string }
type Project  = { id: string; client_id: string | null; name: string }

export default function AdminClockInButton({
  employees,
  clients,
  projects,
}: {
  employees: Employee[]
  clients:   Client[]
  projects:  Project[]
}) {
  const [open, setOpen]       = useState(false)
  const [userId, setUserId]   = useState('')
  const [clientId, setClientId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [notes, setNotes]     = useState('')
  const [billable, setBillable] = useState(false)
  const [startedAt, setStartedAt] = useState(() => {
    const now = new Date()
    now.setSeconds(0, 0)
    return now.toISOString().slice(0, 16)
  })
  const [error, setError]     = useState('')
  const [pending, startTransition] = useTransition()

  const filteredProjects = clientId
    ? projects.filter(p => p.client_id === clientId)
    : projects

  function handleOpen() {
    const now = new Date()
    now.setSeconds(0, 0)
    setStartedAt(now.toISOString().slice(0, 16))
    setUserId('')
    setClientId('')
    setProjectId('')
    setNotes('')
    setBillable(false)
    setError('')
    setOpen(true)
  }

  function handleSubmit() {
    if (!userId) { setError('Sélectionne un employé.'); return }
    const iso = new Date(startedAt).toISOString()
    setError('')
    startTransition(async () => {
      const res = await adminClockInAction(userId, clientId, projectId, notes, billable, iso)
      if (res?.error) { setError(res.error); return }
      setOpen(false)
    })
  }

  return (
    <>
      <button onClick={handleOpen} className="btn-primary flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
        Puncher un employé
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <h2 className="font-semibold text-white">Puncher un employé</h2>
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Employé */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Employé *</label>
                <select
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">-- Sélectionner --</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.full_name}</option>
                  ))}
                </select>
              </div>

              {/* Heure de début */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Heure de début</label>
                <input
                  type="datetime-local"
                  value={startedAt}
                  onChange={e => setStartedAt(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>

              {/* Client */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Client</label>
                <select
                  value={clientId}
                  onChange={e => { setClientId(e.target.value); setProjectId('') }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">-- Aucun --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Projet */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Projet</label>
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  disabled={filteredProjects.length === 0}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 disabled:opacity-40"
                >
                  <option value="">-- Aucun --</option>
                  {filteredProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Optionnel…"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              {/* Facturable */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setBillable(b => !b)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${billable ? 'bg-blue-500' : 'bg-white/10'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${billable ? 'translate-x-5' : ''}`} />
                </div>
                <span className="text-sm text-slate-300">Facturable</span>
              </label>

              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>

            <div className="px-6 pb-5 flex gap-3 justify-end">
              <button onClick={() => setOpen(false)} className="btn-secondary">Annuler</button>
              <button onClick={handleSubmit} disabled={pending} className="btn-primary disabled:opacity-50">
                {pending ? 'En cours…' : 'Démarrer le tracking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
