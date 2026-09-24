'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateDossierEntryAction, deleteDossierEntryAction, deleteDossierAttachmentAction, uploadDossierAttachmentAction } from '@/app/actions'

const TYPE_LABELS: Record<string, string> = {
  rencontre:            'Rencontre',
  performance:          'Analyse de performance',
  disciplinaire:        'Rencontre disciplinaire',
  avertissement:        'Avertissement',
  avertissement_ecrit:  'Avertissement écrit',
  avertissement_verbal: 'Avertissement verbal',
  felicitation:         'Félicitation',
  note:                 'Note',
}

const TYPE_COLORS: Record<string, string> = {
  rencontre:            'bg-blue-500/15 text-blue-400 border-blue-500/25',
  performance:          'bg-violet-500/15 text-violet-400 border-violet-500/25',
  disciplinaire:        'bg-red-500/15 text-red-400 border-red-500/25',
  avertissement:        'bg-amber-500/15 text-amber-400 border-amber-500/25',
  avertissement_ecrit:  'bg-orange-500/15 text-orange-400 border-orange-500/25',
  avertissement_verbal: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  felicitation:         'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  note:                 'bg-slate-500/15 text-slate-400 border-slate-500/25',
}

const TYPE_DOT: Record<string, string> = {
  rencontre:            'bg-blue-500',
  performance:          'bg-violet-500',
  disciplinaire:        'bg-red-500',
  avertissement:        'bg-amber-500',
  avertissement_ecrit:  'bg-orange-500',
  avertissement_verbal: 'bg-yellow-500',
  felicitation:         'bg-emerald-500',
  note:                 'bg-slate-500',
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

export function EntryCardClient({
  entry,
  employeeId,
}: {
  entry: any
  employeeId: string
}) {
  const router   = useRouter()
  const [editing, setEditing]         = useState(false)
  const [confirming, setConfirming]   = useState(false)
  const [isPending, startTransition]  = useTransition()
  const [editError, setEditError]     = useState<string | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)

  const date = new Date(entry.created_at).toLocaleDateString('fr-CA', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const attachments: any[] = entry.attachments ?? []

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEditError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updateDossierEntryAction(entry.id, employeeId, fd)
      if (res?.error) {
        setEditError(res.error)
      } else {
        setEditing(false)
        router.refresh()
      }
    })
  }

  function handleDelete() {
    if (!confirming) { setConfirming(true); return }
    startTransition(async () => {
      await deleteDossierEntryAction(entry.id, employeeId)
      router.refresh()
    })
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFile(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('entry_id', entry.id)
    fd.append('employee_id', employeeId)
    await uploadDossierAttachmentAction(fd)
    setUploadingFile(false)
    router.refresh()
    e.target.value = ''
  }

  function handleDeleteAttachment(attachmentId: string) {
    startTransition(async () => {
      await deleteDossierAttachmentAction(attachmentId, employeeId)
      router.refresh()
    })
  }

  if (editing) {
    return (
      <div className="relative pl-6">
        <div className={`absolute left-0 top-4 w-3 h-3 rounded-full border-2 border-slate-950 ${TYPE_DOT[entry.type] ?? 'bg-slate-500'}`} />
        <div className="bg-slate-900 border border-blue-500/30 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-blue-400 mb-4">Modifier l'entrée</h3>
          <form onSubmit={handleEdit} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Type</label>
                <select
                  name="type"
                  defaultValue={entry.type}
                  className="w-full bg-slate-800 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  {Object.entries(TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Titre</label>
                <input
                  name="title"
                  required
                  defaultValue={entry.title}
                  className="w-full bg-slate-800 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1">Contenu</label>
                <textarea
                  name="content"
                  required
                  rows={6}
                  defaultValue={entry.content}
                  className="w-full bg-slate-800 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-white resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="is_confidential"
                    defaultChecked={entry.is_confidential}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/30"
                  />
                  <span className="text-sm text-slate-300">Confidentiel</span>
                </label>
              </div>
            </div>
            {editError && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{editError}</p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setEditing(false); setEditError(null) }}
                className="text-sm px-4 py-2 rounded-lg text-slate-400 hover:text-white border border-slate-700/40 hover:border-slate-600 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="text-sm px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold transition-colors"
              >
                {isPending ? 'Sauvegarde…' : 'Sauvegarder'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="relative pl-6">
      {/* Timeline dot */}
      <div className={`absolute left-0 top-4 w-3 h-3 rounded-full border-2 border-slate-950 ${TYPE_DOT[entry.type] ?? 'bg-slate-500'}`} />

      <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-5 hover:border-slate-700/60 transition-colors">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${TYPE_COLORS[entry.type] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/25'}`}>
                {TYPE_LABELS[entry.type] ?? entry.type}
              </span>
              {entry.is_confidential && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-rose-500/10 text-rose-400 border-rose-500/20 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Confidentiel
                </span>
              )}
              {entry.signed_at && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-teal-500/10 text-teal-400 border-teal-500/20 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Signé
                </span>
              )}
              <p className="font-semibold text-white">{entry.title}</p>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{entry.content}</p>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {attachments.map((att: any) => (
                  <div key={att.id} className="flex items-center gap-2 text-xs">
                    <svg className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <a
                      href={`/api/dossier-file/${att.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline underline-offset-2 truncate max-w-xs"
                    >
                      {att.name}
                    </a>
                    {att.size_bytes && (
                      <span className="text-slate-600">({formatSize(att.size_bytes)})</span>
                    )}
                    <button
                      onClick={() => handleDeleteAttachment(att.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors ml-1"
                      title="Supprimer"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 flex-wrap">
              <span>{date}</span>
              <span>Ajouté par&nbsp;: <span className="text-slate-400">{entry.creator?.full_name ?? '—'}</span></span>
              {entry.signed_at && (
                <span className="text-teal-600">
                  Signé le {new Date(entry.signed_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Upload attachment */}
            <label className={`relative cursor-pointer text-xs font-medium px-3 py-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/8 border border-slate-700/40 hover:border-blue-500/20 transition-colors ${uploadingFile ? 'opacity-50 pointer-events-none' : ''}`}>
              <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {uploadingFile ? '…' : 'Joindre'}
              <input
                type="file"
                accept=".pdf,image/*"
                className="sr-only"
                onChange={handleFileUpload}
              />
            </label>

            <button
              onClick={() => setEditing(true)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/8 border border-slate-700/40 hover:border-blue-500/20 transition-colors"
            >
              Modifier
            </button>

            <button
              onClick={handleDelete}
              disabled={isPending}
              onBlur={() => setConfirming(false)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                confirming
                  ? 'text-white bg-red-600 border-red-600'
                  : 'text-slate-600 hover:text-red-400 hover:bg-red-500/8 border-slate-700/40 hover:border-red-500/20'
              }`}
            >
              {confirming ? 'Confirmer' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
