'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// ── Types ─────────────────────────────────────────────────
interface GoogleData {
  cost: string | null; cost_per_conv: string | null; impressions: number | null
  clicks: number | null; conversions: number | null; phone_calls: number | null
  ctr: string | null; avg_cpc: string | null
}
interface FacebookData {
  spent: string | null; cpc: string | null; impressions: number | null
  reach: number | null; clicks: number | null; actions: number | null; ctr: string | null
}
interface Report {
  id: string; client: string; period: string; created_at: string; updated_at: string
  google: GoogleData | null; facebook: FacebookData | null
  summary: string; comments: string
  profiles?: { full_name: string } | null
}

type View = 'list' | 'new' | 'detail'

// ── Helpers ───────────────────────────────────────────────
function fmt(n: number | null) {
  if (n === null || n === undefined) return '—'
  return n.toLocaleString('fr-CA')
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-CA', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/Toronto',
  })
}

// ── Micro components ──────────────────────────────────────
function MetricCard({ label, value }: { label: string; value: string | number | null }) {
  const display = value === null || value === undefined ? '—' : typeof value === 'number' ? fmt(value) : value
  return (
    <div className="rapport-metric-card">
      <div className="rapport-metric-value">{display}</div>
      <div className="rapport-metric-label">{label}</div>
    </div>
  )
}

function GoogleSection({ g }: { g: GoogleData }) {
  return (
    <div className="rapport-platform-block">
      <div className="rapport-platform-header rapport-google-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        Google Ads
      </div>
      <div className="rapport-metrics-grid">
        <MetricCard label="Dépenses" value={g.cost} />
        <MetricCard label="Coût / conversion" value={g.cost_per_conv} />
        <MetricCard label="Impressions" value={g.impressions} />
        <MetricCard label="Clics" value={g.clicks} />
        <MetricCard label="Conversions" value={g.conversions} />
        <MetricCard label="Appels téléph." value={g.phone_calls} />
        <MetricCard label="CTR" value={g.ctr} />
        <MetricCard label="CPC moyen" value={g.avg_cpc} />
      </div>
    </div>
  )
}

function FacebookSection({ f }: { f: FacebookData }) {
  return (
    <div className="rapport-platform-block">
      <div className="rapport-platform-header rapport-facebook-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
        Facebook Ads
      </div>
      <div className="rapport-metrics-grid">
        <MetricCard label="Dépenses" value={f.spent} />
        <MetricCard label="CPC" value={f.cpc} />
        <MetricCard label="Impressions" value={f.impressions} />
        <MetricCard label="Portée" value={f.reach} />
        <MetricCard label="Clics" value={f.clicks} />
        <MetricCard label="Actions" value={f.actions} />
        <MetricCard label="CTR" value={f.ctr} />
      </div>
    </div>
  )
}

function ReportView({ report, onBack }: { report: Report; onBack: () => void }) {
  const [comments, setComments] = useState(report.comments || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(true)

  const today = new Date().toLocaleDateString('fr-CA', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Toronto',
  })

  async function saveComments() {
    setSaving(true)
    try {
      await fetch(`/api/rapports/${report.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments }),
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="no-print flex items-center justify-between mb-4 gap-3">
        <button onClick={onBack} className="btn-ghost gap-2 -ml-1">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Retour
        </button>
        <button onClick={() => window.print()} className="btn-secondary gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Imprimer / PDF
        </button>
      </div>

      <div className="rapport-shell">
        <div className="rapport-header">
          <div>
            <div className="rapport-header-logo">Agence 361</div>
            <div className="rapport-header-brand">Rapport publicitaire</div>
          </div>
          <div className="rapport-header-right">
            <div className="rapport-header-client">{report.client}</div>
            <div className="rapport-header-period">{report.period}</div>
            <div className="rapport-header-date">Généré le {today}</div>
          </div>
        </div>

        <div className="rapport-body">
          {report.summary && (
            <div className="rapport-summary-box">
              <div className="rapport-summary-title">Résumé de campagne</div>
              <p className="rapport-summary-text">{report.summary}</p>
            </div>
          )}

          {report.google && <GoogleSection g={report.google} />}
          {report.facebook && <FacebookSection f={report.facebook} />}

          <div className="rapport-comments-box">
            <div className="rapport-comments-title">Commentaires du conseiller</div>

            {/* Screen: textarea éditable */}
            <textarea
              className="no-print w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-emerald-500 transition-colors min-h-[100px]"
              placeholder="Ajouter des commentaires pour le client…"
              value={comments}
              onChange={e => { setComments(e.target.value); setSaved(false) }}
            />
            <div className="no-print flex justify-end mt-2">
              <button
                onClick={saveComments}
                disabled={saving || saved}
                className="btn-primary text-xs px-4 py-1.5 min-h-0 gap-1.5 disabled:opacity-40"
              >
                {saving ? (
                  <><svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Sauvegarde…</>
                ) : saved ? (
                  <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Sauvegardé</>
                ) : (
                  <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Sauvegarder</>
                )}
              </button>
            </div>

            {/* Print: texte statique */}
            <style>{`@media print { .print-comments-text { display: block !important; } }`}</style>
            <p className="rapport-comments-text print-comments-text" style={{ display: 'none' }}>
              {comments || 'Aucun commentaire.'}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Upload + Analyze ──────────────────────────────────────
function NewRapport({ onSaved }: { onSaved: (r: Report) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((f: File) => {
    if (f.type !== 'application/pdf') { setError('Le fichier doit être un PDF.'); return }
    setFile(f); setError(null)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  async function analyze() {
    if (!file) return
    setLoading(true); setError(null)
    try {
      const fd = new FormData()
      fd.append('pdf', file)
      const res = await fetch('/api/rapports/analyze', { method: 'POST', body: fd })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Erreur inconnue')
      onSaved(json.report)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div
        className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
          dragging ? 'border-emerald-400 bg-emerald-900/20' : 'border-slate-600 hover:border-slate-400 hover:bg-slate-800/50'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        <div className="flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${file ? 'bg-emerald-900/50' : 'bg-slate-700/60'}`}>
            {file ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 15 12 18 15 15"/><line x1="12" y1="9" x2="12" y2="18"/></svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 13 12 10 15 13"/><line x1="12" y1="10" x2="12" y2="18"/></svg>
            )}
          </div>
          {file ? (
            <>
              <p className="font-semibold text-emerald-400">{file.name}</p>
              <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(0)} Ko · Cliquer pour changer</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-slate-200">Déposer le rapport Swydo ici</p>
              <p className="text-sm text-slate-500">ou cliquer pour sélectionner un fichier PDF</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 px-4 py-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm">{error}</div>
      )}

      {file && (
        <div className="mt-4 flex justify-end">
          <button onClick={analyze} disabled={loading} className="btn-primary gap-3 px-6 min-w-[180px]">
            {loading ? (
              <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Analyse en cours…</>
            ) : (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>Analyser avec l'IA</>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

// ── History list ──────────────────────────────────────────
function HistoryList({ onOpen, onNew, refresh }: { onOpen: (r: Report) => void; onNew: () => void; refresh: number }) {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/rapports')
      .then(r => r.json())
      .then(json => { if (json.ok) setReports(json.reports) })
      .finally(() => setLoading(false))
  }, [refresh])

  async function deleteReport(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Supprimer ce rapport ?')) return
    setDeleting(id)
    await fetch(`/api/rapports/${id}`, { method: 'DELETE' })
    setReports(prev => prev.filter(r => r.id !== id))
    setDeleting(null)
  }

  async function openReport(r: Report) {
    if (r.google !== undefined && r.facebook !== undefined && r.summary !== undefined) {
      onOpen(r)
      return
    }
    const res = await fetch(`/api/rapports/${r.id}`)
    const json = await res.json()
    if (json.ok) onOpen(json.report)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-slate-200">Rapports enregistrés</h2>
        <button onClick={onNew} className="btn-primary gap-2 text-sm px-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Analyser un rapport
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-12 justify-center text-slate-500 text-sm">
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          Chargement…
        </div>
      ) : reports.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-14 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <div>
            <p className="font-semibold text-slate-300">Aucun rapport pour l'instant</p>
            <p className="text-slate-500 text-sm mt-1">Analyse ton premier rapport Swydo PDF pour commencer.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {reports.map(r => (
            <div
              key={r.id}
              onClick={() => openReport(r)}
              className="card cursor-pointer hover:border-slate-500 hover:bg-slate-700/50 transition-all duration-150 flex items-center gap-4 py-3 px-4"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-900/40 border border-emerald-800/40 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-100 truncate">{r.client || 'Client inconnu'}</p>
                <p className="text-xs text-slate-500 mt-0.5">{r.period} · {fmtDate(r.created_at)}</p>
              </div>
              {r.comments && (
                <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500 flex-shrink-0">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2v4l4-4h5a2 2 0 0 0 2-2V8"/></svg>
                  Note
                </span>
              )}
              <button
                onClick={e => deleteReport(r.id, e)}
                disabled={deleting === r.id}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                title="Supprimer"
              >
                {deleting === r.id
                  ? <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                }
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────
export default function RapportClient() {
  const [view, setView] = useState<View>('list')
  const [current, setCurrent] = useState<Report | null>(null)
  const [listRefresh, setListRefresh] = useState(0)

  function openReport(r: Report) { setCurrent(r); setView('detail') }
  function goNew() { setView('new') }
  function goList() { setView('list') }

  function onSaved(r: Report) {
    setCurrent(r)
    setView('detail')
    setListRefresh(n => n + 1)
  }

  return (
    <>
      <style>{`
        @media print {
          body { background: #f3f4f6 !important; }
          .no-print { display: none !important; }
          .rapport-shell { box-shadow: none !important; }
        }
        .rapport-shell { background: #f8f9fa; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.35); color: #111; }
        .rapport-header { background: #162822; color: white; padding: 32px 36px; display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .rapport-header-logo { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.7; }
        .rapport-header-brand { font-size: 26px; font-weight: 800; margin-top: 4px; letter-spacing: -0.5px; }
        .rapport-header-right { text-align: right; }
        .rapport-header-client { font-size: 20px; font-weight: 700; }
        .rapport-header-period { font-size: 13px; opacity: 0.65; margin-top: 4px; }
        .rapport-header-date { font-size: 12px; opacity: 0.45; margin-top: 8px; }
        .rapport-body { padding: 28px 32px; display: flex; flex-direction: column; gap: 24px; }
        .rapport-summary-box { background: white; border-radius: 10px; padding: 20px 24px; border-left: 4px solid #162822; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .rapport-summary-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 8px; }
        .rapport-summary-text { font-size: 14px; line-height: 1.65; color: #374151; }
        .rapport-platform-block { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .rapport-platform-header { display: flex; align-items: center; gap: 10px; padding: 14px 20px; font-weight: 700; font-size: 14px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .rapport-google-header { background: #f0fdf4; color: #15803d; border-bottom: 1px solid #dcfce7; }
        .rapport-facebook-header { background: #eff6ff; color: #1d4ed8; border-bottom: 1px solid #dbeafe; }
        .rapport-metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #e5e7eb; }
        .rapport-metric-card { background: white; padding: 16px 18px; }
        .rapport-metric-value { font-size: 20px; font-weight: 800; color: #111827; line-height: 1.2; }
        .rapport-metric-label { font-size: 11px; color: #9ca3af; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
        .rapport-comments-box { background: white; border-radius: 10px; padding: 20px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .rapport-comments-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 12px; }
        .rapport-comments-text { font-size: 13px; line-height: 1.6; color: #374151; white-space: pre-wrap; }
        @media (max-width: 640px) { .rapport-metrics-grid { grid-template-columns: repeat(2, 1fr); } .rapport-header { flex-direction: column; } .rapport-header-right { text-align: left; } .rapport-body { padding: 16px; gap: 16px; } }
        @media print { .rapport-metrics-grid { grid-template-columns: repeat(4, 1fr) !important; } }
      `}</style>

      {view === 'list' && (
        <HistoryList onOpen={openReport} onNew={goNew} refresh={listRefresh} />
      )}

      {view === 'new' && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <button onClick={goList} className="btn-ghost gap-2 -ml-1">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              Retour
            </button>
            <h2 className="text-base font-bold text-slate-200">Analyser un rapport Swydo</h2>
          </div>
          <NewRapport onSaved={onSaved} />
        </div>
      )}

      {view === 'detail' && current && (
        <ReportView report={current} onBack={goList} />
      )}
    </>
  )
}
