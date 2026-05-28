export function formatDuration(startedAt: string, endedAt: string | null): string {
  if (!endedAt) return 'En cours'
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime()
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`
}

export function formatDurationDecimal(startedAt: string, endedAt: string): string {
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime()
  return (ms / 3_600_000).toFixed(2)
}

const TZ = 'America/Toronto'

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric', timeZone: TZ })
}

export function todayISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date())
}

export function weekStartISO(): string {
  const today = new Date(new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date()))
  today.setDate(today.getDate() - today.getDay() + 1) // lundi
  return today.toISOString().split('T')[0]
}
