'use client'

import { useState, useEffect, useTransition } from 'react'
import { clockInAction, clockOutAction, pauseEntryAction, resumeEntryAction, createClientAction, createProjectAction } from '@/app/actions'
import { formatTime } from '@/lib/utils'
import { useLanguage } from '@/lib/LanguageContext'
import { translations } from '@/lib/translations'

interface Client  { id: string; name: string }
interface Project { id: string; client_id: string; name: string }
interface ActiveEntry {
  id: string
  started_at: string
  paused_at: string | null
  total_paused_ms: number
  clients:  { name: string } | null
  projects: { name: string } | null
  notes: string | null
  is_billable: boolean
}

export default function ClockWidget({
  activeEntry: initial,
  clients: initialClients,
  projects: initialProjects,
  isWebDept,
}: {
  activeEntry: ActiveEntry | null
  clients: Client[]
  projects: Project[]
  isWebDept: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [elapsed, setElapsed]       = useState('00:00:00')
  const [error, setError]           = useState('')
  const { lang } = useLanguage()
  const t = translations[lang].clock

  const [clients, setClients]   = useState(initialClients)
  const [projects, setProjects] = useState(initialProjects)

  const [clientId,   setClientId]   = useState('')
  const [projectId,  setProjectId]  = useState('')
  const [billable,       setBillable]       = useState(true)
  const [chargeWebDept,  setChargeWebDept]  = useState(false)

  const [showNewClient,  setShowNewClient]  = useState(false)
  const [newClientName,  setNewClientName]  = useState('')
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')

  const [showStopForm, setShowStopForm] = useState(false)
  const [stopNotes,    setStopNotes]    = useState('')

  const filteredProjects = projects.filter(p => p.client_id === clientId)

  useEffect(() => {
    if (!initial) return
    const tick = () => {
      const totalMs = Date.now() - new Date(initial.started_at).getTime()
      const pausedMs = (initial.total_paused_ms ?? 0) +
        (initial.paused_at ? Date.now() - new Date(initial.paused_at).getTime() : 0)
      const workMs = Math.max(0, totalMs - pausedMs)
      const h = Math.floor(workMs / 3_600_000)
      const m = Math.floor((workMs % 3_600_000) / 60_000)
      const s = Math.floor((workMs % 60_000) / 1_000)
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
    if (!clientId)  { setError(t.selectClient); return }
    if (!projectId) { setError(t.selectProject); return }
    setError('')
    startTransition(async () => {
      const res = await clockInAction(clientId, projectId, '', billable, chargeWebDept)
      if (res?.error) setError(res.error)
    })
  }

  const handleClockOut = () => {
    if (!initial) return
    startTransition(async () => {
      const res = await clockOutAction(initial.id, stopNotes)
      if (res?.error) setError(res.error)
      else { setShowStopForm(false); setStopNotes('') }
    })
  }

  const handlePause = () => {
    if (!initial) return
    startTransition(async () => {
      const res = await pauseEntryAction(initial.id)
      if (res?.error) setError(res.error)
    })
  }

  const handleResume = () => {
    if (!initial) return
    startTransition(async () => {
      const res = await resumeEntryAction(initial.id)
      if (res?.error) setError(res.error)
    })
  }

  // ── Active session view ──────────────────────────────────
  if (initial) {
    const isPaused = !!initial.paused_at
    return (
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-green-400 animate-pulse'}`} />
          <span className={`text-sm font-semibold uppercase tracking-wider ${isPaused ? 'text-amber-400' : 'text-green-400'}`}>
            {isPaused ? t.onBreak : t.sessionInProgress}
          </span>
        </div>
        <div className={`font-mono text-5xl font-bold tabular-nums ${isPaused ? 'text-slate-400' : 'text-white'}`}>{elapsed}</div>
        <div className="space-y-1 text-sm text-slate-400">
          <p><span className="text-slate-500">{t.clientLabel} : </span><span className="text-slate-200">{initial.clients?.name}</span></p>
          <p><span className="text-slate-500">{t.projectLabel} : </span><span className="text-slate-200">{initial.projects?.name}</span></p>
          {initial.notes && <p><span className="text-slate-500">{t.notesLabel} : </span>{initial.notes}</p>}
          <p>
            {initial.is_billable
              ? <span className="badge-billable">{t.billable}</span>
              : <span className="badge-unbillable">{t.nonBillable}</span>}
          </p>
          <p className="text-slate-600 text-xs">{t.startedAt} {formatTime(initial.started_at, lang)}</p>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {showStopForm ? (
          <div className="space-y-3">
            <div>
              <label className="label">{t.addNotes}</label>
              <textarea
                autoFocus
                value={stopNotes}
                onChange={e => setStopNotes(e.target.value)}
                rows={3}
                placeholder={t.stopNotesPlaceholder}
                className="input resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowStopForm(false); setStopNotes('') }} disabled={isPending}
                className="btn-secondary flex-1 py-3 text-base">
                {t.cancelStop}
              </button>
              <button onClick={handleClockOut} disabled={isPending} className="btn-danger flex-1 py-3 text-base">
                {isPending ? t.stopping : t.confirmStop}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            {isPaused ? (
              <button onClick={handleResume} disabled={isPending} className="btn-primary flex-1 py-3 text-base">
                {isPending ? t.resuming : t.resume}
              </button>
            ) : (
              <button onClick={handlePause} disabled={isPending} className="btn-secondary flex-1 py-3 text-base">
                {isPending ? t.pausing : t.pause}
              </button>
            )}
            <button onClick={() => setShowStopForm(true)} disabled={isPending} className="btn-danger flex-1 py-3 text-base">
              {t.stop}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Start session form ───────────────────────────────────
  return (
    <div className="card space-y-5">
      <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{t.newSession}</p>

      {error && (
        <p className="text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Client */}
      <div>
        <label className="label">{t.client}</label>
        {showNewClient ? (
          <div className="flex gap-2">
            <input autoFocus value={newClientName} onChange={e => setNewClientName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addClient()}
              placeholder={t.clientName} className="input" />
            <button onClick={addClient} className="btn-primary px-3">✓</button>
            <button onClick={() => { setShowNewClient(false); setNewClientName('') }} className="btn-secondary px-3">✕</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <select value={clientId} onChange={e => { setClientId(e.target.value); setProjectId('') }} className="input">
              <option value="">{t.chooseClient}</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={() => setShowNewClient(true)} className="btn-secondary px-3 whitespace-nowrap">{t.newBtn}</button>
          </div>
        )}
      </div>

      {/* Project */}
      <div>
        <label className="label">{t.project}</label>
        {showNewProject ? (
          <div className="flex gap-2">
            <input autoFocus value={newProjectName} onChange={e => setNewProjectName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addProject()}
              placeholder={t.projectName} className="input" />
            <button onClick={addProject} className="btn-primary px-3">✓</button>
            <button onClick={() => { setShowNewProject(false); setNewProjectName('') }} className="btn-secondary px-3">✕</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <select value={projectId} onChange={e => setProjectId(e.target.value)} disabled={!clientId} className="input disabled:opacity-40">
              <option value="">{clientId ? t.chooseProject : t.selectClientFirst}</option>
              {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={() => setShowNewProject(true)} disabled={!clientId}
              className="btn-secondary px-3 whitespace-nowrap disabled:opacity-40">{t.newBtn}</button>
          </div>
        )}
      </div>

      {/* Billable toggle */}
      <button type="button" onClick={() => setBillable(b => !b)}
        className="flex items-center gap-3 group">
        <div className={`relative w-10 h-5 rounded-full transition ${billable ? 'bg-blue-600' : 'bg-slate-600'}`}>
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${billable ? 'left-5' : 'left-0.5'}`} />
        </div>
        <span className={`text-sm font-medium transition ${billable ? 'text-slate-200' : 'text-slate-500'}`}>
          {t.billableHours}
        </span>
      </button>

      {isWebDept && (
        <button type="button" onClick={() => setChargeWebDept(b => !b)}
          className="flex items-center gap-3 group">
          <div className={`relative w-10 h-5 rounded-full transition ${chargeWebDept ? 'bg-orange-600' : 'bg-slate-600'}`}>
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${chargeWebDept ? 'left-5' : 'left-0.5'}`} />
          </div>
          <span className={`text-sm font-medium transition ${chargeWebDept ? 'text-orange-300' : 'text-slate-500'}`}>
            {t.chargeWebDept}
          </span>
        </button>
      )}

      <button onClick={handleClockIn} disabled={isPending} className="btn-primary w-full py-3 text-base">
        {isPending ? t.starting : t.startSession}
      </button>
    </div>
  )
}
