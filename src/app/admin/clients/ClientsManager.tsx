'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import {
  createClientAction,
  createProjectAction,
  deleteClientAction,
  deleteProjectAction,
  renameClientAction,
  renameProjectAction,
} from '@/app/actions'
import WebClientToggle from '@/components/WebClientToggle'

type Project = { id: string; name: string }
type Client  = { id: string; name: string; is_web_client: boolean | null; projects: Project[] }

/* ── Icônes ─────────────────────────────────────────────────────────────── */
const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IconTrash = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
)
const IconPencil = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

/* ── Composant inline edit ──────────────────────────────────────────────── */
function InlineEdit({
  value,
  onSave,
  disabled,
  className = '',
}: {
  value: string
  onSave: (v: string) => Promise<void>
  disabled: boolean
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(value)
  const inputRef              = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

  async function save() {
    if (!draft.trim() || draft.trim() === value) { setEditing(false); setDraft(value); return }
    await onSave(draft.trim())
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1 flex-1">
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setEditing(false); setDraft(value) } }}
          className={`bg-slate-700 border border-blue-500 rounded px-2 py-0.5 text-white focus:outline-none ${className}`}
          autoFocus
        />
        <button onClick={save} className="text-green-400 hover:text-green-300 p-0.5 transition-colors"><IconCheck /></button>
        <button onClick={() => { setEditing(false); setDraft(value) }} className="text-slate-500 hover:text-slate-300 p-0.5 transition-colors"><IconX /></button>
      </div>
    )
  }

  return (
    <button
      onClick={() => !disabled && setEditing(true)}
      className="group flex items-center gap-2 text-left hover:text-white transition-colors"
    >
      <span className={className}>{value}</span>
      <span className="opacity-0 group-hover:opacity-60 transition-opacity"><IconPencil /></span>
    </button>
  )
}

/* ── Bouton supprimer avec confirmation inline ──────────────────────────── */
function DeleteButton({ label, onConfirm, disabled }: { label: string; onConfirm: () => void; disabled: boolean }) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 bg-red-950/60 border border-red-800/50 rounded-lg px-2 py-1">
        <span className="text-red-300 text-xs">Confirmer ?</span>
        <button
          onClick={() => { setConfirming(false); onConfirm() }}
          disabled={disabled}
          className="text-red-300 hover:text-red-100 text-xs font-semibold px-1.5 py-0.5 rounded hover:bg-red-800/50 transition-colors"
        >
          Oui
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-slate-400 hover:text-slate-200 text-xs px-1 py-0.5 rounded transition-colors"
        >
          Non
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      disabled={disabled}
      className="text-slate-500 hover:text-red-400 text-xs px-2 py-1 rounded-lg hover:bg-red-900/20 transition-colors flex items-center gap-1.5 disabled:opacity-40"
    >
      <IconTrash />
      {label}
    </button>
  )
}

/* ── Panneau détail client ──────────────────────────────────────────────── */
function ClientDetail({
  client,
  onRenameClient,
  onDeleteClient,
  onAddProject,
  onRenameProject,
  onDeleteProject,
  isPending,
}: {
  client: Client
  onRenameClient: (id: string, name: string) => Promise<void>
  onDeleteClient:  (id: string, name: string) => void
  onAddProject:    (clientId: string, name: string) => Promise<void>
  onRenameProject: (id: string, name: string) => Promise<void>
  onDeleteProject: (id: string, clientId: string) => void
  isPending: boolean
}) {
  const [newProjectName, setNewProjectName] = useState('')
  const [showAddProject, setShowAddProject] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (showAddProject) inputRef.current?.focus() }, [showAddProject])

  async function submitProject(e: React.FormEvent) {
    e.preventDefault()
    if (!newProjectName.trim()) return
    await onAddProject(client.id, newProjectName.trim())
    setNewProjectName('')
    setShowAddProject(false)
  }

  return (
    <div className="space-y-6">
      {/* En-tête client */}
      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1.5">Client</p>
            <InlineEdit
              value={client.name}
              onSave={v => onRenameClient(client.id, v)}
              disabled={isPending}
              className="text-xl font-bold text-white"
            />
          </div>
          <DeleteButton
            label="Supprimer"
            onConfirm={() => onDeleteClient(client.id, client.name)}
            disabled={isPending}
          />
        </div>

        {/* Toggle Web */}
        <div className="flex items-center gap-3 pt-1 border-t border-slate-700/60">
          <span className="text-sm text-slate-400">Client web</span>
          <WebClientToggle clientId={client.id} isWebClient={!!client.is_web_client} />
          <span className="text-xs text-slate-600">{client.is_web_client ? 'Actif' : 'Inactif'}</span>
        </div>
      </div>

      {/* Projets */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Projets</h3>
            <p className="text-xs text-slate-500 mt-0.5">{client.projects.length} projet{client.projects.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowAddProject(v => !v)}
            className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-900/20 transition-colors"
          >
            <IconPlus />
            Ajouter
          </button>
        </div>

        {/* Formulaire nouveau projet */}
        {showAddProject && (
          <form onSubmit={submitProject} className="flex gap-2">
            <input
              ref={inputRef}
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              placeholder="Nom du projet..."
              className="flex-1 bg-slate-800 border border-blue-500/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={isPending || !newProjectName.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Créer
            </button>
            <button
              type="button"
              onClick={() => { setShowAddProject(false); setNewProjectName('') }}
              className="text-slate-500 hover:text-slate-300 px-3 py-2 rounded-lg transition-colors"
            >
              <IconX />
            </button>
          </form>
        )}

        {/* Liste des projets */}
        {client.projects.length === 0 && !showAddProject ? (
          <p className="text-slate-600 text-sm text-center py-4">Aucun projet. Clique sur Ajouter pour en créer un.</p>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {client.projects.map(project => (
              <div key={project.id} className="flex items-center justify-between gap-3 py-2.5 group">
                <InlineEdit
                  value={project.name}
                  onSave={v => onRenameProject(project.id, v)}
                  disabled={isPending}
                  className="text-sm text-slate-300"
                />
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DeleteButton
                    label=""
                    onConfirm={() => onDeleteProject(project.id, client.id)}
                    disabled={isPending}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Composant principal ────────────────────────────────────────────────── */
export default function ClientsManager({ initialClients }: { initialClients: Client[] }) {
  const [clients, setClients]         = useState<Client[]>(initialClients)
  const [selectedId, setSelectedId]   = useState<string | null>(initialClients[0]?.id ?? null)
  const [newClientName, setNewClientName] = useState('')
  const [showAddClient, setShowAddClient] = useState(false)
  const [search, setSearch]           = useState('')
  const [mobileView, setMobileView]   = useState<'list' | 'detail'>('list')
  const [isPending, startTransition]  = useTransition()

  const selected = clients.find(c => c.id === selectedId) ?? null
  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  function selectClient(id: string) {
    setSelectedId(id)
    setMobileView('detail')
  }

  /* ── Actions ── */
  function handleAddClient(e: React.FormEvent) {
    e.preventDefault()
    if (!newClientName.trim()) return
    startTransition(async () => {
      const res = await createClientAction(newClientName.trim())
      if (res.error) return
      const newClient: Client = { id: res.data.id, name: res.data.name, is_web_client: false, projects: [] }
      setClients(prev => [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name, 'fr')))
      setNewClientName('')
      setShowAddClient(false)
      setSelectedId(res.data.id)
      setMobileView('detail')
    })
  }

  async function handleRenameClient(id: string, name: string) {
    const res = await renameClientAction(id, name)
    if (res?.error) return
    setClients(prev => prev.map(c => c.id === id ? { ...c, name } : c).sort((a, b) => a.name.localeCompare(b.name, 'fr')))
  }

  function handleDeleteClient(id: string) {
    startTransition(async () => {
      const res = await deleteClientAction(id)
      if (res?.error) return
      const remaining = clients.filter(c => c.id !== id)
      setClients(remaining)
      setSelectedId(remaining[0]?.id ?? null)
      setMobileView('list')
    })
  }

  async function handleAddProject(clientId: string, name: string) {
    const res = await createProjectAction(clientId, name)
    if (res.error) return
    setClients(prev => prev.map(c =>
      c.id === clientId
        ? { ...c, projects: [...c.projects, { id: res.data.id, name: res.data.name }] }
        : c
    ))
  }

  async function handleRenameProject(projectId: string, name: string) {
    const res = await renameProjectAction(projectId, name)
    if (res?.error) return
    setClients(prev => prev.map(c => ({
      ...c,
      projects: c.projects.map(p => p.id === projectId ? { ...p, name } : p),
    })))
  }

  function handleDeleteProject(projectId: string, clientId: string) {
    startTransition(async () => {
      const res = await deleteProjectAction(projectId)
      if (res?.error) return
      setClients(prev => prev.map(c =>
        c.id === clientId ? { ...c, projects: c.projects.filter(p => p.id !== projectId) } : c
      ))
    })
  }

  return (
    <div className="space-y-4">
      {/* ── En-tête ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients & Projets</h1>
          <p className="text-slate-500 text-sm mt-0.5">{clients.length} client{clients.length !== 1 ? 's' : ''} au total</p>
        </div>
        <button
          onClick={() => setShowAddClient(v => !v)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <IconPlus />
          Nouveau client
        </button>
      </div>

      {/* ── Formulaire nouveau client ── */}
      {showAddClient && (
        <form onSubmit={handleAddClient} className="card flex gap-3 items-center">
          <input
            autoFocus
            type="text"
            value={newClientName}
            onChange={e => setNewClientName(e.target.value)}
            placeholder="Nom du client..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={isPending || !newClientName.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            Créer
          </button>
          <button
            type="button"
            onClick={() => { setShowAddClient(false); setNewClientName('') }}
            className="text-slate-500 hover:text-slate-300 px-3 py-2 rounded-lg transition-colors"
          >
            <IconX />
          </button>
        </form>
      )}

      {/* ── Layout deux colonnes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 min-h-[500px]">

        {/* ── Colonne gauche : liste clients ── */}
        <div className={`card p-0 flex flex-col overflow-hidden ${mobileView === 'detail' ? 'hidden lg:flex' : 'flex'}`}>
          {/* Recherche */}
          <div className="p-3 border-b border-slate-700/60">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un client..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Liste */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-700/40">
            {filtered.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-8 px-4">Aucun résultat.</p>
            ) : (
              filtered.map(client => (
                <button
                  key={client.id}
                  onClick={() => selectClient(client.id)}
                  className={`w-full text-left px-4 py-3 transition-colors flex items-center justify-between gap-2 group ${
                    selectedId === client.id
                      ? 'bg-blue-600/15 border-l-2 border-blue-500'
                      : 'hover:bg-slate-700/40 border-l-2 border-transparent'
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${selectedId === client.id ? 'text-white' : 'text-slate-300'}`}>
                      {client.name}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {client.projects.length} projet{client.projects.length !== 1 ? 's' : ''}
                      {client.is_web_client ? ' · Web' : ''}
                    </p>
                  </div>
                  <span className={`flex-shrink-0 transition-colors ${selectedId === client.id ? 'text-blue-400' : 'text-slate-700 group-hover:text-slate-500'}`}>
                    <IconChevron />
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Colonne droite : détail ── */}
        <div className={mobileView === 'list' ? 'hidden lg:block' : 'block'}>
          {/* Bouton retour mobile */}
          {mobileView === 'detail' && (
            <button
              onClick={() => setMobileView('list')}
              className="lg:hidden flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-3 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Retour à la liste
            </button>
          )}

          {selected ? (
            <ClientDetail
              key={selected.id}
              client={selected}
              onRenameClient={handleRenameClient}
              onDeleteClient={(id) => handleDeleteClient(id)}
              onAddProject={handleAddProject}
              onRenameProject={handleRenameProject}
              onDeleteProject={handleDeleteProject}
              isPending={isPending}
            />
          ) : (
            <div className="card h-full flex items-center justify-center">
              <p className="text-slate-600 text-sm">Sélectionne un client dans la liste.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
