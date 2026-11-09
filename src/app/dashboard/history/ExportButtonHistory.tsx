'use client'

import { useLanguage } from '../../../lib/LanguageContext'
import { translations } from '../../../lib/translations'

interface Entry {
  started_at: string
  ended_at: string | null
  notes: string | null
  is_billable: boolean
  total_paused_ms?: number | null
  clients: { name: string } | null
  projects: { name: string } | null
}

export default function ExportButtonHistory({ entries }: { entries: Entry[] }) {
  const { lang } = useLanguage()
  const t = translations[lang].history
  const locale = lang === 'en' ? 'en-CA' : 'fr-CA'

  function exportCSV() {
    const rows = entries.map(e => {
      const start = new Date(e.started_at)
      const end = e.ended_at ? new Date(e.ended_at) : null
      const pausedMs = e.total_paused_ms ?? 0
      const durH = end
        ? (Math.max(0, end.getTime() - start.getTime() - pausedMs) / 3_600_000).toFixed(2)
        : ''
      return [
        start.toLocaleDateString(locale),
        start.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
        end ? end.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : t.inProgress,
        durH,
        e.clients?.name ?? '',
        e.projects?.name ?? '',
        e.is_billable ? t.yes : t.no,
        e.notes ?? '',
      ]
    })

    const csv = [t.csvHeaders, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${t.filename}_${new Date().toLocaleDateString(locale)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button onClick={exportCSV} className="btn-secondary text-sm">
      {t.exportCSV}
    </button>
  )
}
