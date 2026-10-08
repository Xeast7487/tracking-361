'use client'

import { useState, useRef, useCallback } from 'react'

interface GoogleData {
  cost: string | null
  cost_per_conv: string | null
  impressions: number | null
  clicks: number | null
  conversions: number | null
  phone_calls: number | null
  ctr: string | null
  avg_cpc: string | null
}

interface FacebookData {
  spent: string | null
  cpc: string | null
  impressions: number | null
  reach: number | null
  clicks: number | null
  actions: number | null
  ctr: string | null
}

interface ReportData {
  client: string
  period: string
  google: GoogleData | null
  facebook: FacebookData | null
  summary: string
}

function fmt(n: number | null) {
  if (n === null || n === undefined) return '—'
  return n.toLocaleString('fr-CA')
}

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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <span>Google Ads</span>
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
        <span>Facebook Ads</span>
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

export default function RapportClient() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<ReportData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [comments, setComments] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((f: File) => {
    if (f.type !== 'application/pdf') { setError('Le fichier doit être un PDF.'); return }
    setFile(f)
    setError(null)
    setReport(null)
    setComments('')
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
      setReport(json.data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toLocaleDateString('fr-CA', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Toronto',
  })

  return (
    <>
      <style>{`
        /* ── Print reset ── */
        @media print {
          body { background: #f3f4f6 !important; }
          .no-print { display: none !important; }
          .rapport-shell { background: white !important; box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; }
        }

        /* ── Rapport preview (screen + print) ── */
        .rapport-shell {
          background: #f8f9fa;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.35);
          color: #111;
        }
        .rapport-header {
          background: #162822;
          color: white;
          padding: 32px 36px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
        }
        .rapport-header-logo {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          opacity: 0.7;
        }
        .rapport-header-brand {
          font-size: 26px;
          font-weight: 800;
          margin-top: 4px;
          letter-spacing: -0.5px;
        }
        .rapport-header-right {
          text-align: right;
        }
        .rapport-header-client {
          font-size: 20px;
          font-weight: 700;
        }
        .rapport-header-period {
          font-size: 13px;
          opacity: 0.65;
          margin-top: 4px;
        }
        .rapport-header-date {
          font-size: 12px;
          opacity: 0.45;
          margin-top: 8px;
        }
        .rapport-body {
          padding: 28px 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .rapport-summary-box {
          background: white;
          border-radius: 10px;
          padding: 20px 24px;
          border-left: 4px solid #162822;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .rapport-summary-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #6b7280;
          margin-bottom: 8px;
        }
        .rapport-summary-text {
          font-size: 14px;
          line-height: 1.65;
          color: #374151;
        }
        .rapport-platform-block {
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .rapport-platform-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 20px;
          font-weight: 700;
          font-size: 14px;
        }
        .rapport-google-header {
          background: #f0fdf4;
          color: #15803d;
          border-bottom: 1px solid #dcfce7;
        }
        .rapport-facebook-header {
          background: #eff6ff;
          color: #1d4ed8;
          border-bottom: 1px solid #dbeafe;
        }
        .rapport-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: #e5e7eb;
        }
        .rapport-metric-card {
          background: white;
          padding: 16px 18px;
        }
        .rapport-metric-value {
          font-size: 20px;
          font-weight: 800;
          color: #111827;
          line-height: 1.2;
        }
        .rapport-metric-label {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }
        .rapport-comments-box {
          background: white;
          border-radius: 10px;
          padding: 20px 24px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .rapport-comments-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #6b7280;
          margin-bottom: 12px;
        }
        .rapport-comments-text {
          font-size: 13px;
          line-height: 1.6;
          color: #374151;
          white-space: pre-wrap;
        }
        @media (max-width: 640px) {
          .rapport-metrics-grid { grid-template-columns: repeat(2, 1fr); }
          .rapport-header { flex-direction: column; }
          .rapport-header-right { text-align: left; }
          .rapport-body { padding: 16px; gap: 16px; }
        }
        @media print {
          .rapport-metrics-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>

      {/* ── Upload zone ── */}
      <div className="no-print mb-8">
        <div
          className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
            dragging
              ? 'border-emerald-400 bg-emerald-900/20'
              : 'border-slate-600 hover:border-slate-400 hover:bg-slate-800/50'
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
            <button onClick={analyze} disabled={loading}
              className="btn-primary gap-3 px-6 min-w-[180px]">
              {loading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Analyse en cours…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  Analyser avec l'IA
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── Report ── */}
      {report && (
        <>
          <div className="no-print flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-100">Aperçu du rapport</h2>
            <button onClick={() => window.print()}
              className="btn-secondary gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Imprimer / PDF
            </button>
          </div>

          <div className="rapport-shell">
            {/* Header */}
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
              {/* Summary */}
              {report.summary && (
                <div className="rapport-summary-box">
                  <div className="rapport-summary-title">Résumé de campagne</div>
                  <p className="rapport-summary-text">{report.summary}</p>
                </div>
              )}

              {/* Platforms */}
              {report.google && <GoogleSection g={report.google} />}
              {report.facebook && <FacebookSection f={report.facebook} />}

              {/* Comments */}
              <div className="rapport-comments-box">
                <div className="rapport-comments-title">Commentaires du conseiller</div>
                <textarea
                  className="no-print w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-emerald-500 transition-colors min-h-[100px]"
                  placeholder="Ajouter des commentaires pour le client…"
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                />
                <p className="rapport-comments-text print-only-comments" style={{ display: 'none' }}>
                  {comments || 'Aucun commentaire.'}
                </p>
                <style>{`@media print { .print-only-comments { display: block !important; } }`}</style>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
