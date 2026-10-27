import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { PrintButton } from './PrintButton'

interface Entree {
  id: string
  date_transaction: string
  description: string
  categorie: string
  type: string
  montant_ht: number
  tps: number
  tvq: number
  montant_total: number
}

const CATEGORIE_LABELS: Record<string, string> = {
  revenu:             'Revenu',
  depense_materiel:   'Matériel',
  depense_logiciel:   'Logiciel',
  salaire:            'Salaire',
  sous_traitance:     'Sous-traitance',
  autre:              'Autre',
}

function fmt(n: number) {
  return n.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })
}

export default async function ImprimerLotPage({ params }: { params: { lotId: string } }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin')

  const [{ data: lot }, { data: rawEntrees }, { data: rawAttachments }] = await Promise.all([
    supabase.from('compta_lots').select('*').eq('id', params.lotId).single(),
    supabase.from('compta_entrees').select('*').eq('lot_id', params.lotId).order('date_transaction', { ascending: true }),
    supabase.from('compta_lot_attachments').select('id, nom_fichier, storage_path, type_fichier').eq('lot_id', params.lotId).order('created_at'),
  ])

  if (!lot) notFound()

  const entrees: Entree[] = (rawEntrees ?? []) as Entree[]

  // Générer des URLs signées pour les pièces jointes
  const attachments: { name: string; url: string; isImage: boolean }[] = []
  for (const att of (rawAttachments ?? []) as { id: string; nom_fichier: string; storage_path: string; type_fichier: string | null }[]) {
    const { data: signed } = await supabase.storage
      .from('compta-documents')
      .createSignedUrl(att.storage_path, 3600)
    if (signed?.signedUrl) {
      attachments.push({
        name: att.nom_fichier,
        url: signed.signedUrl,
        isImage: (att.type_fichier ?? '').startsWith('image/'),
      })
    }
  }

  const revenus  = entrees.filter(e => e.type === 'revenu')
  const depenses = entrees.filter(e => e.type === 'depense')
  const salaires = entrees.filter(e => e.categorie === 'salaire')

  const totalRevenuHT  = revenus.reduce((s, e)  => s + Number(e.montant_ht), 0)
  const totalDepenseHT = depenses.reduce((s, e) => s + Number(e.montant_ht), 0)
  const beneficeNet    = totalRevenuHT - totalDepenseHT
  const totalSalaires  = salaires.reduce((s, e) => s + Number(e.montant_ht), 0)

  const tpsCollected = revenus.reduce((s, e)  => s + Number(e.tps), 0)
  const tvqCollected = revenus.reduce((s, e)  => s + Number(e.tvq), 0)
  const tpsITC       = depenses.reduce((s, e) => s + Number(e.tps), 0)
  const tvqITC       = depenses.reduce((s, e) => s + Number(e.tvq), 0)
  const netTPS       = tpsCollected - tpsITC
  const netTVQ       = tvqCollected - tvqITC

  const exportDate = new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .compta-shell { box-shadow: none !important; }
          @page { margin: 1.2cm 1.4cm; }
        }
        body { background: #f3f4f6; font-family: system-ui, -apple-system, sans-serif; }
        .compta-shell { background: white; max-width: 860px; margin: 32px auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.18); color: #111; }
        .compta-header { background: #243d3d; color: white; padding: 30px 36px; display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .compta-header-logo { font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; opacity: 0.6; }
        .compta-header-title { font-size: 24px; font-weight: 800; margin-top: 5px; letter-spacing: -0.4px; }
        .compta-header-right { text-align: right; }
        .compta-header-period { font-size: 15px; font-weight: 700; }
        .compta-header-sub { font-size: 12px; opacity: 0.55; margin-top: 5px; }
        .compta-body { padding: 28px 36px; display: flex; flex-direction: column; gap: 24px; }
        .compta-section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 10px; }
        .compta-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .compta-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .compta-card { background: #f9fafb; border-radius: 8px; padding: 14px 16px; border: 1px solid #e5e7eb; }
        .compta-card-label { font-size: 11px; color: #9ca3af; margin-bottom: 4px; }
        .compta-card-value { font-size: 18px; font-weight: 800; }
        .compta-card-sub { font-size: 11px; color: #d1d5db; margin-top: 3px; }
        .compta-green  { color: #16a34a; }
        .compta-red    { color: #dc2626; }
        .compta-amber  { color: #d97706; }
        .compta-blue   { color: #2563eb; }
        .compta-dark   { color: #111827; }
        .compta-divider { border: none; border-top: 1px solid #e5e7eb; margin: 0; }
        .compta-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .compta-table th { text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #9ca3af; padding: 6px 10px 8px; border-bottom: 1px solid #e5e7eb; }
        .compta-table th:last-child { text-align: right; }
        .compta-table td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
        .compta-table td:last-child { text-align: right; font-weight: 700; }
        .compta-table tr:last-child td { border-bottom: none; }
        .compta-badge { display: inline-block; font-size: 10px; padding: 2px 7px; border-radius: 9999px; background: #f3f4f6; color: #6b7280; font-weight: 600; }
        .compta-footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 14px 36px; font-size: 11px; color: #9ca3af; display: flex; justify-content: space-between; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      `}</style>

      {/* Barre no-print */}
      <div className="no-print" style={{ maxWidth: '860px', margin: '24px auto 0', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <Link href={`/admin/comptabilite/${params.lotId}`} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ← Retour
        </Link>
        <PrintButton />
      </div>

      <div className="compta-shell">
        {/* Header */}
        <div className="compta-header">
          <div>
            <div className="compta-header-logo">Agence 361</div>
            <div className="compta-header-title">Rapport comptable</div>
          </div>
          <div className="compta-header-right">
            <div className="compta-header-period">{lot.periode_label ?? 'Période non définie'}</div>
            <div className="compta-header-sub">Généré le {exportDate}</div>
            <div className="compta-header-sub">{entrees.length} entrée{entrees.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        <div className="compta-body">
          {/* Résumé financier */}
          <div>
            <div className="compta-section-title">Résumé financier</div>
            <div className="compta-grid-4">
              <div className="compta-card">
                <div className="compta-card-label">Revenus HT</div>
                <div className="compta-card-value compta-green">{fmt(totalRevenuHT)}</div>
                <div className="compta-card-sub">{revenus.length} entrée{revenus.length !== 1 ? 's' : ''}</div>
              </div>
              <div className="compta-card">
                <div className="compta-card-label">Dépenses HT</div>
                <div className="compta-card-value compta-red">{fmt(totalDepenseHT)}</div>
                <div className="compta-card-sub">{depenses.length} entrée{depenses.length !== 1 ? 's' : ''}</div>
              </div>
              <div className="compta-card">
                <div className="compta-card-label">Bénéfice net</div>
                <div className={`compta-card-value ${beneficeNet >= 0 ? 'compta-dark' : 'compta-red'}`}>{fmt(beneficeNet)}</div>
                <div className="compta-card-sub">avant impôts</div>
              </div>
              <div className="compta-card">
                <div className="compta-card-label">Masse salariale</div>
                <div className="compta-card-value compta-dark">{fmt(totalSalaires)}</div>
                <div className="compta-card-sub">HT</div>
              </div>
            </div>
          </div>

          <hr className="compta-divider" />

          {/* Taxes */}
          <div>
            <div className="compta-section-title">Provisions fiscales</div>
            <div className="compta-grid-3">
              <div className="compta-card">
                <div className="compta-card-label">TPS nette à remettre</div>
                <div className={`compta-card-value ${netTPS > 0 ? 'compta-amber' : 'compta-green'}`}>{fmt(netTPS)}</div>
                <div className="compta-card-sub">Perçue {fmt(tpsCollected)} — CTI {fmt(tpsITC)}</div>
              </div>
              <div className="compta-card">
                <div className="compta-card-label">TVQ nette à remettre</div>
                <div className={`compta-card-value ${netTVQ > 0 ? 'compta-amber' : 'compta-green'}`}>{fmt(netTVQ)}</div>
                <div className="compta-card-sub">Perçue {fmt(tvqCollected)} — CTI {fmt(tvqITC)}</div>
              </div>
              <div className="compta-card">
                <div className="compta-card-label">Provision impôts (~25 %)</div>
                <div className="compta-card-value compta-blue">{fmt(Math.max(0, beneficeNet * 0.25))}</div>
                <div className="compta-card-sub">estimation indicative</div>
              </div>
            </div>
          </div>

          <hr className="compta-divider" />

          {/* Entrées */}
          <div>
            <div className="compta-section-title">Détail des entrées ({entrees.length})</div>
            <table className="compta-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Catégorie</th>
                  <th>HT</th>
                  <th>TPS</th>
                  <th>TVQ</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {entrees.map(e => (
                  <tr key={e.id}>
                    <td style={{ color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {new Date(e.date_transaction + 'T12:00:00').toLocaleDateString('fr-CA', { day: '2-digit', month: 'short' })}
                    </td>
                    <td style={{ maxWidth: '220px' }}>{e.description}</td>
                    <td><span className="compta-badge">{CATEGORIE_LABELS[e.categorie] ?? e.categorie}</span></td>
                    <td className={e.type === 'revenu' ? 'compta-green' : 'compta-red'}>
                      {e.type === 'revenu' ? '+' : '-'}{fmt(Number(e.montant_ht))}
                    </td>
                    <td style={{ color: '#6b7280' }}>{fmt(Number(e.tps))}</td>
                    <td style={{ color: '#6b7280' }}>{fmt(Number(e.tvq))}</td>
                    <td style={{ color: '#374151' }}>{fmt(Number(e.montant_total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pièces jointes */}
        {attachments.length > 0 && (
          <div className="compta-section" style={{ pageBreakBefore: 'always' }}>
            <div className="compta-section-title">Pièces jointes ({attachments.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '12px' }}>
              {attachments.map((att, i) => (
                <div key={i}>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', fontWeight: 600 }}>
                    📎 {att.name}
                  </div>
                  {att.isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={att.url} alt={att.name} style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                  ) : (
                    <a href={att.url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#3b82f6' }}>
                      Ouvrir le PDF
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="compta-footer">
          <span>Agence 361 — Rapport comptable confidentiel</span>
          <span>Généré le {exportDate}</span>
        </div>
      </div>
    </>
  )
}
