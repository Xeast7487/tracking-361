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
type Project = { id: string; name: string }
type Client  = { id: string; name: string; projects: Project[] }

/* ── Icônes ──────────────────────────────────────────────────────────────── */
const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
)
const IconPencil = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/>
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
const IconChevronDown = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

/* ── Dropdown client ─────────────────────────────────────────────────────── */
function ClientDropdown({
  clients,
  selected,
  onSelect,
}: {
  clients: Client[]
  selected: Client | null
  onSelect: (id: string) => void
}) {
  const [open, setOpen]   = useState(false)
  const [search, setSearch] = useState('')
  const ref               = useRef<HTMLDivElement>(null)
  const inputRef          = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setSearch('') }}
        className="w-full flex items-center justify-between gap-3 bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-xl px-4 py-3 text-left transition-colors focus:outline-none focus:border-blue-500"
      >
        {selected ? (
          <div className="min-w-0">
            <p className="text-white font-medium text-sm truncate">{selected.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {selected.projects.length} projet{selected.projects.length !== 1 ? 's' : ''}
              {''}
            </p>
          </div>
        ) : (
          <span className="text-slate-500 text-sm">Sélectionner un client...</span>
        )}
        <span className={`flex-shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}>
          <IconChevronDown />
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
          {/* Recherche */}
          <div className="p-2 border-b border-slate-700/60">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          {/* Liste */}
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">Aucun résultat.</p>
            ) : (
              filtered.map(client => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => { onSelect(client.id); setOpen(false); setSearch('') }}
                  className={`w-full text-left px-4 py-2.5 hover:bg-slate-700/50 transition-colors flex items-center justify-between gap-2 ${
                    selected?.id === client.id ? 'bg-blue-600/15' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${selected?.id === client.id ? 'text-blue-300' : 'text-slate-200'}`}>
                      {client.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {client.projects.length} projet{client.projects.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {selected?.id === client.id && (
                    <span className="flex-shrink-0 text-blue-400"><IconCheck /></span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Édition inline ──────────────────────────────────────────────────────── */
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
    const trimmed = draft.trim()
    if (!trimmed || trimmed === value) { setEditing(false); setDraft(value); return }
    await onSave(trimmed)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 flex-1">
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') { setEditing(false); setDraft(value) }
          }}
          className={`bg-slate-700 border border-blue-500 rounded-lg px-2 py-1 text-white focus:outline-none flex-1 ${className}`}
          autoFocus
        />
        <button onClick={save} className="text-green-400 hover:text-green-300 p-1 rounded transition-colors">
          <IconCheck />
        </button>
        <button onClick={() => { setEditing(false); setDraft(value) }} className="text-slate-500 hover:text-slate-300 p-1 rounded transition-colors">
          <IconX />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => !disabled && setEditing(true)}
      disabled={disabled}
      className={`group flex items-center gap-2 text-left hover:text-white transition-colors disabled:cursor-default ${className}`}
    >
      <span>{value}</span>
      <span className="opacity-0 group-hover:opacity-50 transition-opacity text-slate-400">
        <IconPencil />
      </span>
    </button>
  )
}

/* ── Bouton supprimer avec confirmation inline ───────────────────────────── */
function DeleteButton({
  label,
  onConfirm,
  disabled,
  size = 'md',
}: {
  label?: string
  onConfirm: () => void
  disabled: boolean
  size?: 'sm' | 'md'
}) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 bg-red-950/60 border border-red-800/50 rounded-lg px-2.5 py-1">
        <span className="text-red-300 text-xs whitespace-nowrap">Confirmer ?</span>
        <button
          onClick={() => { setConfirming(false); onConfirm() }}
          disabled={disabled}
          className="text-red-300 hover:text-red-100 text-xs font-semibold px-1.5 py-0.5 rounded hover:bg-red-800/40 transition-colors"
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
      className={`flex items-center gap-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-900/20 transition-colors disabled:opacity-40 ${
        size === 'sm' ? 'p-1' : 'px-2.5 py-1.5 text-xs'
      }`}
    >
      <IconTrash />
      {label && <span>{label}</span>}
    </button>
  )
}

/* ── Composant principal ─────────────────────────────────────────────────── */
export default function ClientsManager({
  initialClients,
  totalHours,
}: {
  initialClients: Client[]
  totalHours: number
}) {
  const [clients, setClients]             = useState<Client[]>(initialClients)
  const [selectedId, setSelectedId]       = useState<string | null>(initialClients[0]?.id ?? null)
  const [newClientName, setNewClientName] = useState('')
  const [showAddClient, setShowAddClient] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [showAddProject, setShowAddProject] = useState(false)
  const [isPending, startTransition]      = useTransition()
  const addProjectRef                     = useRef<HTMLInputElement>(null)

  const selected = clients.find(c => c.id === selectedId) ?? null

  useEffect(() => { if (showAddProject) addProjectRef.current?.focus() }, [showAddProject])

  /* ── Clients ── */
  function handleAddClient(e: React.FormEvent) {
    e.preventDefault()
    if (!newClientName.trim()) return
    startTransition(async () => {
      const res = await createClientAction(newClientName.trim())
      if (res.error) return
      const newClient: Client = { id: res.data.id, name: res.data.name, projects: [] }
      setClients(prev => [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name, 'fr')))
      setNewClientName('')
      setShowAddClient(false)
      setSelectedId(res.data.id)
    })
  }

  async function handleRenameClient(id: string, name: string) {
    const res = await renameClientAction(id, name)
    if (res?.error) return
    setClients(prev =>
      prev.map(c => c.id === id ? { ...c, name } : c).sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    )
  }

  function handleDeleteClient(id: string) {
    startTransition(async () => {
      const res = await deleteClientAction(id)
      if (res?.error) return
      const remaining = clients.filter(c => c.id !== id)
      setClients(remaining)
      setSelectedId(remaining[0]?.id ?? null)
    })
  }

  /* ── Projets ── */
  async function handleAddProject(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId || !newProjectName.trim()) return
    const res = await createProjectAction(selectedId, newProjectName.trim())
    if (res.error) return
    setClients(prev => prev.map(c =>
      c.id === selectedId
        ? { ...c, projects: [...c.projects, { id: res.data.id, name: res.data.name }] }
        : c
    ))
    setNewProjectName('')
    setShowAddProject(false)
  }

  async function handleRenameProject(projectId: string, name: string) {
    const res = await renameProjectAction(projectId, name)
    if (res?.error) return
    setClients(prev => prev.map(c => ({
      ...c,
      projects: c.projects.map(p => p.id === projectId ? { ...p, name } : p),
    })))
  }

  function handleDeleteProject(projectId: string) {
    startTransition(async () => {
      const res = await deleteProjectAction(projectId)
      if (res?.error) return
      setClients(prev => prev.map(c => ({
        ...c,
        projects: c.projects.filter(p => p.id !== projectId),
      })))
    })
  }

  const totalProjects = clients.reduce((sum, c) => sum + c.projects.length, 0)
  const h = Math.floor(totalHours)
  const m = Math.round((totalHours - h) * 60)
  const hoursLabel = h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, '0') : ''}` : `${m}min`

  return (
    <div className="space-y-5 max-w-2xl">
      {/* ── Résumé ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-white">{clients.length}</p>
          <p className="text-xs text-slate-500 mt-1">Client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-white">{totalProjects}</p>
          <p className="text-xs text-slate-500 mt-1">Projet{totalProjects !== 1 ? 's' : ''}</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-white">{hoursLabel}</p>
          <p className="text-xs text-slate-500 mt-1">Heures totales</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Clients & Projets</h1>
      </div>

      {/* ── Sélecteur + bouton nouveau client ── */}
      <div className="flex gap-3 items-start">
        <ClientDropdown
          clients={clients}
          selected={selected}
          onSelect={id => { setSelectedId(id); setShowAddClient(false); setShowAddProject(false) }}
        />
        <button
          onClick={() => { setShowAddClient(v => !v); setShowAddProject(false) }}
          className="flex-shrink-0 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-3 rounded-xl transition-colors whitespace-nowrap"
        >
          <IconPlus />
          Nouveau
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
            className="text-slate-500 hover:text-slate-300 p-2 rounded-lg transition-colors"
          >
            <IconX />
          </button>
        </form>
      )}

      {/* ── Détail du client sélectionné ── */}
      {selected && (
        <div className="space-y-4">

          {/* Infos client */}
          <div className="card space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">Nom du client</p>
                <InlineEdit
                  value={selected.name}
                  onSave={v => handleRenameClient(selected.id, v)}
                  disabled={isPending}
                  className="text-lg font-bold text-white"
                />
              </div>
              <DeleteButton
                label="Supprimer le client"
                onConfirm={() => handleDeleteClient(selected.id)}
                disabled={isPending}
              />
            </div>

          </div>

          {/* Projets */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">Projets</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selected.projects.length} projet{selected.projects.length !== 1 ? 's' : ''}
                </p>
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
              <form onSubmit={handleAddProject} className="flex gap-2">
                <input
                  ref={addProjectRef}
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
                  className="text-slate-500 hover:text-slate-300 p-2 rounded-lg transition-colors"
                >
                  <IconX />
                </button>
              </form>
            )}

            {/* Liste projets */}
            {selected.projects.length === 0 && !showAddProject ? (
              <p className="text-slate-600 text-sm text-center py-4">
                Aucun projet pour ce client.
              </p>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {selected.projects.map(project => (
                  <div key={project.id} className="flex items-center justify-between gap-3 py-2.5 group">
                    <InlineEdit
                      value={project.name}
                      onSave={v => handleRenameProject(project.id, v)}
                      disabled={isPending}
                      className="text-sm text-slate-300"
                    />
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DeleteButton
                        onConfirm={() => handleDeleteProject(project.id)}
                        disabled={isPending}
                        size="sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {!selected && !showAddClient && clients.length > 0 && (
        <div className="card text-slate-600 text-sm text-center py-8">
          Sélectionne un client dans le menu ci-dessus.
        </div>
      )}
    </div>
  )
}
