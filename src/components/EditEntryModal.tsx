'use client'

import { useState, useTransition } from 'react'
import { updateEntryAction, fetchClientsAndProjectsAction } from '@/app/actions'
import { useLanguage } from '@/lib/LanguageContext'
import { translations } from '@/lib/translations'

interface EntryForEdit {
  id: string
  started_at: string
  ended_at: string | null
  client_id: string | null
  project_id: string | null
  notes: string | null
  is_billable: boolean
}

interface Client  { id: string; name: string }
interface Project { id: string; client_id: string; name: string }

function toLocal(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EditEntryModal({ entry }: { entry: EntryForEdit }) {
  const [open, setOpen]           = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError]         = useState('')
  const [clients, setClients]     = useState<Client[]>([])
  const [projects, setProjects]   = useState<Project[]>([])
  const [loaded, setLoaded]       = useState(false)
  const { lang } = useLanguage()
  const t = translations[lang].editEntry

  const [startedAt, setStartedAt] = useState(toLocal(entry.started_at))
  const [endedAt,   setEndedAt]   = useState(entry.ended_at ? toLocal(entry.ended_at) : '')
  const [clientId,  setClientId]  = useState(entry.client_id ?? '')
  const [projectId, setProjectId] = useState(entry.project_id ?? '')
  const [notes,     setNotes]     = useState(entry.notes ?? '')
  const [billable,  setBillable]  = useState(entry.is_billable)

  const filteredProjects = projects.filter(p => p.client_id === clientId)

  const handleOpen = async () => {
    if (!loaded) {
      const data = await fetchClientsAndProjectsAction()
      setClients(data.clients)
      setProjects(data.projects)
      setLoaded(true)
    }
    setOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const res = await updateEntryAction(entry.id, {
        started_at: new Date(startedAt).toISOString(),
        ended_at:   endedAt ? new Date(endedAt).toISOString() : null,
        client_id:  clientId  || null,
        project_id: projectId || null,
        notes:      notes.trim() || null,
        is_billable: billable,
      })
      if (res?.error) setError(res.error)
      else setOpen(false)
    })
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-slate-600 hover:text-blue-400 transition text-xs px-2 py-1 rounded hover:bg-blue-900/20"
        title={t.editTooltip}
      >
        ✏
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 card w-full max-w-lg animate-scale-in space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white text-lg">{t.title}</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white transition text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">{t.start}</label>
                  <input
                    type="datetime-local"
                    value={startedAt}
                    onChange={e => setStartedAt(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">{t.end}</label>
                  <input
                    type="datetime-local"
                    value={endedAt}
                    onChange={e => setEndedAt(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">{t.client}</label>
                <select
                  value={clientId}
                  onChange={e => { setClientId(e.target.value); setProjectId('') }}
                  className="input"
                >
                  <option value="">{t.none}</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="label">{t.project}</label>
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="input"
                  disabled={!clientId}
                >
                  <option value="">{t.none}</option>
                  {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="label">{t.notes}</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="input resize-none"
                  placeholder={t.notesPlaceholder}
                />
              </div>

              <button type="button" onClick={() => setBillable(b => !b)} className="flex items-center gap-3 group">
                <div className={`relative w-10 h-5 rounded-full transition ${billable ? 'bg-blue-600' : 'bg-slate-600'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${billable ? 'left-5' : 'left-0.5'}`} />
                </div>
                <span className={`text-sm font-medium transition ${billable ? 'text-slate-200' : 'text-slate-500'}`}>
                  {t.billableHours}
                </span>
              </button>

              {error && (
                <p className="text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={isPending} className="btn-primary flex-1">
                  {isPending ? t.saving : t.save}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
                  {t.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
