'use client'

import { useState, useEffect, useTransition } from 'react'
import { clockInAction, clockOutAction, createClientAction, createProjectAction } from '@/app/actions'
import { formatTime } from '@/lib/utils'

interface Client  { id: string; name: string }
interface Project { id: string; client_id: string; name: string }
interface ActiveEntry {
  id: string
  started_at: string
  clients:  { name: string } | null
  projects: { name: string } | null
  notes: string | null
  is_billable: boolean
}

export default function ClockWidget({
  activeEntry: initial,
  clients: initialClients,
  projects: initialProjects,
}: {
  activeEntry: ActiveEntry | null
  clients: Client[]
  projects: Project[]
}) {
  const [isPending, startTransition] = useTransition()
  const [elapsed, setElapsed]       = useState('00:00:00')
  const [error, setError]           = useState('')

  // Local lists (updated on create)
  const [clients, setClients]   = useState(initialClients)
  const [projects, setProjects] = useState(initialProjects)

  // Form
  const [clientId,   setClientId]   = useState('')
  const [projectId,  setProjectId]  = useState('')
  const [notes,      setNotes]      = useState('')
  const [billable,   setBillable]   = useState(true)

  // Inline create
  const [showNewClient,  setShowNewClient]  = useState(false)
  const [newClientName,  setNewClientName]  = useState('')
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')

  const filteredProjects = projects.filter(p => p.client_id === clientId)

  // Live timer
  useEffect(() => {
    if (!initial) return
    const tick = () => {
      const diff = Date.now() - new Date(initial.started_at).getTime()
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1_000)
      setElapsed(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [initial])

  const addClient = async () => {
    if (!newClientName.trim()) return
    const res = await createClientAction(newClientName)
    if (res.error) { setError(res.error); return }
    setClients(p => [...p, res.data])
    setClientId(res.data.id)
    setProjectId('')
    setNewClientName('')
    setShowNewClient(false)
  }

  const addProject = async () => {
    if (!newProjectName.trim() || !clientId) return
    const res = await createProjectAction(clientId, newProjectName)
    if (res.error) { setError(res.error); return }
    setProjects(p => [...p, res.data])
    setProjectId(res.data.id)
    setNewProjectName('')
    setShowNewProject(false)
  }

  const handleClockIn = () => {
    if (!clientId)  { setError('Sélectionne un client.'); return }
    if (!projectId) { setError('Sélectionne un projet.'); return }
    setError('')
    startTransition(async () => {
      const res = await clockInAction(clientId, projectId, notes, billable)
      if (res?.error) setError(res.error)
    })
  }

  const handleClockOut = () => {
    if (!initial) return
    startTransition(async () => {
      const res = await clockOutAction(initial.id)
      if (res?.error) setError(res.error)
    })
  }

  // ── Active session view ──────────────────────────────────
  if (initial) {
    return (
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm font-semibold text-green-400 uppercase tracking-wider">Session en cours</span>
        </div>
        <div className="font-mono text-5xl font-bold tabular-nums text-white">{elapsed}</div>
        <div className="space-y-1 text-sm text-slate-400">
          <p><span className="text-slate-500">Client : </span><span className="text-slate-200">{initial.clients?.name}</span></p>
          <p><span className="text-slate-500">Projet : </span><span className="text-slate-200">{initial.projects?.name}</span></p>
          {initial.notes && <p><span className="text-slate-500">Notes : </span>{initial.notes}</p>}
          <p>
            {initial.is_billable
              ? <span className="badge-billable">Facturable</span>
              : <span className="badge-unbillable">Non facturable</span>}
          </p>
          <p className="text-slate-600 text-xs">Démarré à {formatTime(initial.started_at)}</p>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button onClick={handleClockOut} disabled={isPending} className="btn-danger w-full py-3 text-base">
          {isPending ? 'Arrêt en cours...' : 'Terminer la session'}
        </button>
      </div>
    )
  }

  // ── Start session form ───────────────────────────────────
  return (
    <div className="card space-y-5">
      <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Nouvelle session</p>

      {error && (
        <p className="text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Client */}
      <div>
        <label className="label">Client</label>
        {showNewClient ? (
          <div className="flex gap-2">
            <input autoFocus value={newClientName} onChange={e => setNewClientName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addClient()}
              placeholder="Nom du client" className="input" />
            <button onClick={addClient} className="btn-primary px-3">✓</button>
            <button onClick={() => { setShowNewClient(false); setNewClientName('') }} className="btn-secondary px-3">✕</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <select value={clientId} onChange={e => { setClientId(e.target.value); setProjectId('') }} className="input">
              <option value="">Choisir un client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={() => setShowNewClient(true)} className="btn-secondary px-3 whitespace-nowrap">+ Nouveau</button>
          </div>
        )}
      </div>

      {/* Project */}
      <div>
        <label className="label">Projet</label>
        {showNewProject ? (
          <div className="flex gap-2">
            <input autoFocus value={newProjectName} onChange={e => setNewProjectName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addProject()}
              placeholder="Nom du projet" className="input" />
            <button onClick={addProject} className="btn-primary px-3">✓</button>
            <button onClick={() => { setShowNewProject(false); setNewProjectName('') }} className="btn-secondary px-3">✕</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <select value={projectId} onChange={e => setProjectId(e.target.value)} disabled={!clientId} className="input disabled:opacity-40">
              <option value="">{clientId ? 'Choisir un projet...' : 'Sélectionne un client d\'abord'}</option>
              {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={() => setShowNewProject(true)} disabled={!clientId}
              className="btn-secondary px-3 whitespace-nowrap disabled:opacity-40">+ Nouveau</button>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="label">Notes <span className="text-slate-600 font-normal">(optionnel)</span></label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          placeholder="Description du travail effectué..."
          className="input resize-none" />
      </div>

      {/* Billable toggle */}
      <button type="button" onClick={() => setBillable(b => !b)}
        className="flex items-center gap-3 group">
        <div className={`relative w-10 h-5 rounded-full transition ${billable ? 'bg-blue-600' : 'bg-slate-600'}`}>
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${billable ? 'left-5' : 'left-0.5'}`} />
        </div>
        <span className={`text-sm font-medium transition ${billable ? 'text-slate-200' : 'text-slate-500'}`}>
          Heures facturables
        </span>
      </button>

      <button onClick={handleClockIn} disabled={isPending} className="btn-primary w-full py-3 text-base">
        {isPending ? 'Démarrage...' : 'Démarrer la session'}
      </button>
    </div>
  )
}
