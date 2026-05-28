'use client'

interface Entry {
  started_at: string
  ended_at: string | null
  notes: string | null
  is_billable: boolean
  clients:  { name: string } | null
  projects: { name: string } | null
  profiles: { full_name: string } | null
}

export default function ExportButtons({ entries }: { entries: Entry[] }) {
  function exportCSV() {
    const headers = ['Employé', 'Date', 'Heure début', 'Heure fin', 'Durée (h)', 'Client', 'Projet', 'Facturable', 'Notes']

    const rows = entries.map(e => {
      const start = new Date(e.started_at)
      const end   = e.ended_at ? new Date(e.ended_at) : null
      const durH  = end ? ((end.getTime() - start.getTime()) / 3_600_000).toFixed(2) : ''
      return [
        e.profiles?.full_name ?? '',
        start.toLocaleDateString('fr-CA'),
        start.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }),
        end  ? end.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }) : 'En cours',
        durH,
        e.clients?.name  ?? '',
        e.projects?.name ?? '',
        e.is_billable ? 'Oui' : 'Non',
        e.notes ?? '',
      ]
    })

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `rapport_${new Date().toLocaleDateString('fr-CA')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <button onClick={exportCSV} className="btn-secondary text-sm">
        ⬇ Exporter CSV
      </button>
      <button onClick={() => window.print()} className="btn-secondary text-sm">
        🖨 Imprimer
      </button>
    </>
  )
}
