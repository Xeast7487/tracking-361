'use client'

import { useState, useTransition } from 'react'
import {
  createClientAction,
  createProjectAction,
  deleteClientAction,
  deleteProjectAction,
} from '@/app/actions'
import WebClientToggle from '@/components/WebClientToggle'

type Project = { id: string; name: string }
type Client  = { id: string; name: string; is_web_client: boolean | null; projects: Project[] }

export default function ClientsManager({ initialClients }: { initialClients: Client[] }) {
  const [clients, setClients]           = useState<Client[]>(initialClients)
  const [newClientName, setNewClientName] = useState('')
  const [addingProject, setAddingProject] = useState<string | null>(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [error, setError]               = useState('')
  const [isPending, startTransition]    = useTransition()

  function handleAddClient(e: React.FormEvent) {
    e.preventDefault()
    if (!newClientName.trim()) return
    setError('')
    startTransition(async () => {
      const res = await createClientAction(newClientName.trim())
      if (res.error) { setError(res.error); return }
      setClients(prev => [...prev, { id: res.data.id, name: res.data.name, is_web_client: false, projects: [] }].sort((a, b) => a.name.localeCompare(b.name)))
      setNewClientName('')
    })
  }

  function handleDeleteClient(clientId: string, clientName: string) {
    if (!confirm(`Supprimer le client « ${clientName} » ?\nTous ses projets seront aussi supprimés.`)) return
    startTransition(async () => {
      const res = await deleteClientAction(clientId)
      if (res?.error) { setError(res.error); return }
      setClients(prev => prev.filter(c => c.id !== clientId))
    })
  }

  function handleAddProject(e: React.FormEvent, clientId: string) {
    e.preventDefault()
    if (!newProjectName.trim()) return
    setError('')
    startTransition(async () => {
      const res = await createProjectAction(clientId, newProjectName.trim())
      if (res.error) { setError(res.error); return }
      setClients(prev => prev.map(c =>
        c.id === clientId
          ? { ...c, projects: [...c.projects, { id: res.data.id, name: res.data.name }] }
          : c
      ))
      setNewProjectName('')
      setAddingProject(null)
    })
  }

  function handleDeleteProject(projectId: string, projectName: string, clientId: string) {
    if (!confirm(`Supprimer le projet « ${projectName} » ?`)) return
    startTransition(async () => {
      const res = await deleteProjectAction(projectId)
      if (res?.error) { setError(res.error); return }
      setClients(prev => prev.map(c =>
        c.id === clientId ? { ...c, projects: c.projects.filter(p => p.id !== projectId) } : c
      ))
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Clients & Projets</h1>
        <span className="text-slate-500 text-sm">{clients.length} client{clients.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Ajouter un client ─────────────────────────────── */}
      <form onSubmit={handleAddClient} className="card flex gap-3 items-center">
        <input
          type="text"
          value={newClientName}
          onChange={e => setNewClientName(e.target.value)}
          placeholder="Nom du nouveau client..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={isPending || !newClientName.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Ajouter un client
        </button>
      </form>

      {error && (
        <p className="text-red-400 text-sm bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-2">{error}</p>
      )}

      {/* ── Liste des clients ─────────────────────────────── */}
      {clients.length === 0 ? (
        <div className="card text-slate-500 text-sm text-center py-10">Aucun client pour le moment.</div>
      ) : (
        <div className="space-y-3">
          {clients.map(client => (
            <div key={client.id} className="card space-y-3">

              {/* En-tête client */}
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-white">{client.name}</span>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Toggle Web */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">Web</span>
                    <WebClientToggle clientId={client.id} isWebClient={!!client.is_web_client} />
                  </div>

                  {/* Bouton ajouter un projet */}
                  <button
                    onClick={() => {
                      if (addingProject === client.id) {
                        setAddingProject(null)
                        setNewProjectName('')
                      } else {
                        setAddingProject(client.id)
                        setNewProjectName('')
                      }
                    }}
                    className="text-slate-400 hover:text-blue-400 text-xs px-2 py-1 rounded hover:bg-blue-900/20 transition-colors flex items-center gap-1"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Projet
                  </button>

                  {/* Supprimer client */}
                  <button
                    onClick={() => handleDeleteClient(client.id, client.name)}
                    disabled={isPending}
                    className="text-slate-500 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-900/20 transition-colors flex items-center gap-1 disabled:opacity-40"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                    Supprimer
                  </button>
                </div>
              </div>

              {/* Projets */}
              {client.projects.length > 0 && (
                <div className="pl-4 border-l border-slate-700 space-y-0.5">
                  {client.projects.map(project => (
                    <div key={project.id} className="flex items-center justify-between py-1 group">
                      <span className="text-slate-400 text-sm">{project.name}</span>
                      <button
                        onClick={() => handleDeleteProject(project.id, project.name, client.id)}
                        disabled={isPending}
                        className="text-slate-600 hover:text-red-400 text-xs px-2 py-0.5 rounded hover:bg-red-900/20 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100 disabled:opacity-40"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {client.projects.length === 0 && addingProject !== client.id && (
                <p className="text-slate-600 text-xs pl-4">Aucun projet.</p>
              )}

              {/* Formulaire ajouter un projet */}
              {addingProject === client.id && (
                <form
                  onSubmit={e => handleAddProject(e, client.id)}
                  className="flex gap-2 pl-4"
                >
                  <input
                    autoFocus
                    type="text"
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    placeholder="Nom du projet..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={isPending || !newProjectName.trim()}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Ajouter
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingProject(null); setNewProjectName('') }}
                    className="text-slate-500 hover:text-slate-300 text-xs px-2 py-1.5 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                </form>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  )
}
