'use client'

import { useState } from 'react'
import { toggleWebProjectStepAction } from '@/app/actions'

type WebProject = {
  id: string
  client_id: string
  p1_rencontre_client: boolean
  p1_brief_ecrit: boolean
  p1_contrat_signe: boolean
  p1_collecte_assets: boolean
  p1_acces_environnement: boolean
  p2_recherche_moodboard: boolean
  p2_architecture_site: boolean
  p2_wireframes_1: boolean
  p2_approbation_1: boolean
  p2_wireframes_2: boolean
  p2_approbation_2: boolean
  p3_mise_en_place_env: boolean
  p3_structure_gabarits: boolean
  p3_integration_contenu: boolean
  p3_responsive: boolean
  p3_formulaires_fonct: boolean
  p3_seo: boolean
  p3_optimisation_perf: boolean
  p4_staging_v1: boolean
  p4_modifications_r1: boolean
  p4_staging_v2: boolean
  p4_modifications_r2: boolean
  p4_approbation_finale: boolean
  p5_tests_complets: boolean
  p5_securite_performance: boolean
  p5_mise_en_ligne: boolean
  p5_surveillance: boolean
  p5_formation_client: boolean
  p5_remise_livrables: boolean
  p5_indexation_google: boolean
  p5_installation_pixels: boolean
  p5_facturation: boolean
  notes: string | null
}

type Client = { id: string; name: string }

interface Props {
  clients: Client[]
  webProjects: WebProject[]
}

const PHASES = [
  {
    key: 'p1',
    label: 'Découverte',
    dot: 'bg-blue-500',
    badge: 'bg-blue-900/40 text-blue-300 border border-blue-700/50',
    bar: 'bg-blue-500',
    check: 'text-blue-400',
    steps: [
      { field: 'p1_rencontre_client', label: 'Rencontre client initiale' },
      { field: 'p1_brief_ecrit', label: 'Brief écrit' },
      { field: 'p1_contrat_signe', label: 'Contrat signé' },
      { field: 'p1_collecte_assets', label: 'Collecte des assets' },
      { field: 'p1_acces_environnement', label: "Accès à l'environnement client" },
    ],
  },
  {
    key: 'p2',
    label: 'Conception',
    dot: 'bg-purple-500',
    badge: 'bg-purple-900/40 text-purple-300 border border-purple-700/50',
    bar: 'bg-purple-500',
    check: 'text-purple-400',
    steps: [
      { field: 'p2_recherche_moodboard', label: 'Recherche & Moodboard' },
      { field: 'p2_architecture_site', label: 'Architecture du site' },
      { field: 'p2_wireframes_1', label: 'Wireframes 1' },
      { field: 'p2_approbation_1', label: 'Approbation client' },
      { field: 'p2_wireframes_2', label: 'Wireframes 2' },
      { field: 'p2_approbation_2', label: 'Approbation client' },
    ],
  },
  {
    key: 'p3',
    label: 'Développement',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50',
    bar: 'bg-emerald-500',
    check: 'text-emerald-400',
    steps: [
      { field: 'p3_mise_en_place_env', label: 'Mise en place environnement' },
      { field: 'p3_structure_gabarits', label: 'Structure et gabarits' },
      { field: 'p3_integration_contenu', label: 'Intégration du contenu' },
      { field: 'p3_responsive', label: 'Responsive' },
      { field: 'p3_formulaires_fonct', label: 'Formulaires et fonctionnalités' },
      { field: 'p3_seo', label: 'SEO' },
      { field: 'p3_optimisation_perf', label: 'Optimisation performance' },
    ],
  },
  {
    key: 'p4',
    label: 'Révisions',
    dot: 'bg-amber-500',
    badge: 'bg-amber-900/40 text-amber-300 border border-amber-700/50',
    bar: 'bg-amber-500',
    check: 'text-amber-400',
    steps: [
      { field: 'p4_staging_v1', label: 'Partage lien staging V1 (Bugherd)' },
      { field: 'p4_modifications_r1', label: 'Modifications round 1' },
      { field: 'p4_staging_v2', label: 'Staging V2 (Bugherd)' },
      { field: 'p4_modifications_r2', label: 'Modifications round 2' },
      { field: 'p4_approbation_finale', label: 'Approbation finale' },
    ],
  },
  {
    key: 'p5',
    label: 'Mise en ligne',
    dot: 'bg-rose-500',
    badge: 'bg-rose-900/40 text-rose-300 border border-rose-700/50',
    bar: 'bg-rose-500',
    check: 'text-rose-400',
    steps: [
      { field: 'p5_tests_complets', label: 'Tests complets' },
      { field: 'p5_securite_performance', label: 'Sécurité et performance' },
      { field: 'p5_mise_en_ligne', label: 'Mise en ligne' },
      { field: 'p5_surveillance', label: 'Surveillance post-lancement' },
      { field: 'p5_formation_client', label: 'Formation client' },
      { field: 'p5_remise_livrables', label: 'Remise livrables' },
      { field: 'p5_indexation_google', label: 'Indexation Google' },
      { field: 'p5_installation_pixels', label: 'Installation des pixels' },
      { field: 'p5_facturation', label: 'Facturation' },
    ],
  },
]

const TOTAL_STEPS = PHASES.reduce((s, p) => s + p.steps.length, 0)

function emptyProject(clientId: string): WebProject {
  return {
    id: '', client_id: clientId,
    p1_rencontre_client: false, p1_brief_ecrit: false, p1_contrat_signe: false, p1_collecte_assets: false, p1_acces_environnement: false,
    p2_recherche_moodboard: false, p2_architecture_site: false, p2_wireframes_1: false, p2_approbation_1: false, p2_wireframes_2: false, p2_approbation_2: false,
    p3_mise_en_place_env: false, p3_structure_gabarits: false, p3_integration_contenu: false, p3_responsive: false, p3_formulaires_fonct: false, p3_seo: false, p3_optimisation_perf: false,
    p4_staging_v1: false, p4_modifications_r1: false, p4_staging_v2: false, p4_modifications_r2: false, p4_approbation_finale: false,
    p5_tests_complets: false, p5_securite_performance: false, p5_mise_en_ligne: false, p5_surveillance: false, p5_formation_client: false,
    p5_remise_livrables: false, p5_indexation_google: false, p5_installation_pixels: false, p5_facturation: false,
    notes: null,
  }
}

function countTotal(proj: WebProject) {
  return PHASES.reduce((s, phase) => s + phase.steps.filter(st => proj[st.field as keyof WebProject] === true).length, 0)
}

function countPhase(proj: WebProject, phase: typeof PHASES[0]) {
  return phase.steps.filter(st => proj[st.field as keyof WebProject] === true).length
}

export default function WebProjectChecklist({ clients, webProjects }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [projects, setProjects] = useState<Record<string, WebProject>>(() =>
    Object.fromEntries(webProjects.map(p => [p.client_id, p]))
  )
  const [saving, setSaving] = useState<Set<string>>(new Set())

  async function toggle(clientId: string, field: string) {
    const key = `${clientId}:${field}`
    if (saving.has(key)) return

    const current = projects[clientId] ?? emptyProject(clientId)
    const oldValue = current[field as keyof WebProject] as boolean
    const newValue = !oldValue

    setProjects(prev => ({ ...prev, [clientId]: { ...current, [field]: newValue } }))
    setSaving(prev => new Set([...prev, key]))

    const res = await toggleWebProjectStepAction(clientId, field, newValue)
    if (res?.error) {
      setProjects(prev => ({ ...prev, [clientId]: { ...current, [field]: oldValue } }))
    }

    setSaving(prev => { const n = new Set(prev); n.delete(key); return n })
  }

  return (
    <div className="space-y-3">
      {clients.map(client => {
        const proj = projects[client.id] ?? emptyProject(client.id)
        const done = countTotal(proj)
        const pct = Math.round((done / TOTAL_STEPS) * 100)
        const isOpen = expanded === client.id

        return (
          <div key={client.id} className="rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
            {/* Card header */}
            <button
              onClick={() => setExpanded(isOpen ? null : client.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <span className="font-semibold text-white truncate">{client.name}</span>
                  <span className="text-xs text-slate-400 flex-shrink-0">{done} / {TOTAL_STEPS}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0 w-8 text-right">{pct}%</span>
                </div>
              </div>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={`flex-shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Expanded checklist */}
            {isOpen && (
              <div className="border-t border-slate-700/50 px-4 py-4 space-y-5">
                {PHASES.map(phase => {
                  const phDone = countPhase(proj, phase)
                  const phTotal = phase.steps.length
                  const phPct = Math.round((phDone / phTotal) * 100)
                  const allDone = phDone === phTotal

                  return (
                    <div key={phase.key}>
                      {/* Phase header */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${phase.dot}`} />
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-300">{phase.label}</span>
                        <div className="flex-1 h-px bg-slate-700/50" />
                        <span className={`text-xs px-2 py-0.5 rounded-full ${phase.badge} ${allDone ? 'opacity-100' : 'opacity-70'}`}>
                          {phDone}/{phTotal}
                        </span>
                      </div>
                      {/* Phase progress bar */}
                      <div className="h-1 bg-slate-700 rounded-full overflow-hidden mb-3">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${phase.bar}`}
                          style={{ width: `${phPct}%` }}
                        />
                      </div>
                      {/* Steps */}
                      <div className="space-y-1">
                        {phase.steps.map(step => {
                          const checked = proj[step.field as keyof WebProject] as boolean
                          return (
                            <div
                              key={step.field}
                              className="flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-slate-700/30 transition-colors group"
                              onClick={() => toggle(client.id, step.field)}
                            >
                              <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${
                                checked
                                  ? `${phase.bar} border-transparent`
                                  : 'border-slate-600 group-hover:border-slate-500'
                              }`}>
                                {checked && (
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <span className={`text-sm transition-colors ${checked ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                                {step.label}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {clients.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          Aucun client trouvé. Ajoute des clients depuis l&apos;admin pour commencer.
        </div>
      )}
    </div>
  )
}
