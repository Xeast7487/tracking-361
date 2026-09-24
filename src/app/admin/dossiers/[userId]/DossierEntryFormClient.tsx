'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createDossierEntryAction } from '@/app/actions'

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

const today = () => new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })

const TEMPLATES: Record<string, { title: string; content: string }> = {
  avertissement_verbal: {
    title: `Avertissement verbal`,
    content: `Suite à [description de l'événement], un avertissement verbal a été donné le ${today()}.

Points discutés :
-

Suites attendues :
-

L'employé(e) a été informé(e) des conséquences en cas de récidive.`,
  },
  avertissement_ecrit: {
    title: `Avertissement écrit`,
    content: `AVERTISSEMENT ÉCRIT — ${today()}

Motif : [décrire le motif]

Faits reprochés :
-

Attentes de l'employeur :
-

Conséquences en cas de récidive : [préciser]`,
  },
  avertissement: {
    title: `Avertissement`,
    content: `Avertissement émis le ${today()}.

Motif : [décrire le motif]

Mesures demandées :
- `,
  },
  performance: {
    title: `Évaluation de performance`,
    content: `ÉVALUATION DE PERFORMANCE — ${today()}

Points forts :
-
-

Points à améliorer :
-
-

Objectifs pour la prochaine période :
1.
2.

Note globale : /5`,
  },
  disciplinaire: {
    title: `Rencontre disciplinaire`,
    content: `Rencontre disciplinaire tenue le ${today()}.

Participants : [noms]

Motif : [décrire]

Décisions :
-

Suivi prévu : `,
  },
  felicitation: {
    title: `Félicitation`,
    content: `Nous souhaitons souligner l'excellent travail pour [description de la réalisation].

Cet accomplissement démontre [qualités/compétences].

Bravo et continuez sur cette lancée !`,
  },
  rencontre: {
    title: `Rencontre du ${today()}`,
    content: `Participants : [noms]

Sujets abordés :
-
-

Décisions prises :
-

Prochaines étapes :
- `,
  },
}

export function DossierEntryFormClient({ employeeId }: { employeeId: string }) {
  const router   = useRouter()
  const formRef  = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [type, setType]       = useState('rencontre')
  const [title, setTitle]     = useState('')
  const [content, setContent] = useState('')
  const [confidential, setConfidential] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  function handleTypeChange(newType: string) {
    setType(newType)
    const tpl = TEMPLATES[newType]
    if (tpl) {
      setTitle(tpl.title)
      setContent(tpl.content)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const fd = new FormData(formRef.current!)
    startTransition(async () => {
      const res = await createDossierEntryAction(fd)
      if (res?.error) {
        setError(res.error)
      } else {
        setType('rencontre')
        setTitle('')
        setContent('')
        setConfidential(false)
        setFileName(null)
        formRef.current?.reset()
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        router.refresh()
      }
    })
  }

  return (
    <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-6">
      <h2 className="font-semibold text-white mb-5">Nouvelle entrée au dossier</h2>
      <form ref={formRef} onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-4">
        <input type="hidden" name="employee_id" value={employeeId} />

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Type *</label>
            <select
              name="type"
              required
              value={type}
              onChange={e => handleTypeChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-colors"
            >
              {Object.entries(TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Titre */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Titre *</label>
            <input
              name="title"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex. Rencontre du 22 septembre 2026"
              className="w-full bg-slate-800 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-colors"
            />
          </div>

          {/* Contenu */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Contenu *</label>
            <textarea
              name="content"
              required
              rows={6}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Décrivez les points abordés, les décisions prises, les observations…"
              className="w-full bg-slate-800 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-colors"
            />
          </div>

          {/* Pièce jointe */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Pièce jointe (optionnel)</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div className="flex-1 bg-slate-800 border border-slate-700/60 border-dashed rounded-lg px-4 py-2.5 text-sm text-slate-500 hover:border-blue-500/40 hover:text-slate-400 transition-colors truncate">
                {fileName ?? 'Choisir un fichier PDF ou image…'}
              </div>
              <input
                type="file"
                name="file"
                accept=".pdf,image/*"
                className="sr-only"
                onChange={e => setFileName(e.target.files?.[0]?.name ?? null)}
              />
            </label>
          </div>

          {/* Confidentiel */}
          <div className="flex items-center self-end pb-2">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                name="is_confidential"
                checked={confidential}
                onChange={e => setConfidential(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/30"
              />
              <div>
                <span className="text-sm font-medium text-slate-300">Confidentiel</span>
                <p className="text-xs text-slate-600">Visible uniquement par les admins</p>
              </div>
            </label>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">{error}</p>
        )}
        {success && (
          <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2.5">Entrée ajoutée avec succès.</p>
        )}

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            {type !== 'rencontre' && TEMPLATES[type] ? '✦ Gabarit appliqué — modifiez au besoin' : ''}
          </p>
          <button
            type="submit"
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            {isPending ? 'Ajout en cours…' : 'Ajouter au dossier'}
          </button>
        </div>
      </form>
    </div>
  )
}
