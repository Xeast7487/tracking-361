'use client'

import { useState } from 'react'
import { adminClockOutAction } from '@/app/actions'

export default function AdminClockOutButton({ entryId, label }: { entryId: string; label: string }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!confirm(label + ' ?')) return
    setLoading(true)
    await adminClockOutAction(entryId)
    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 whitespace-nowrap flex-shrink-0"
    >
      {loading ? '…' : label}
    </button>
  )
}
