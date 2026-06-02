import type { Lang } from './translations'

export function formatDuration(startedAt: string, endedAt: string | null, totalPausedMs = 0, inProgressLabel = 'En cours'): string {
  if (!endedAt) return inProgressLabel
  const ms = Math.max(0, new Date(endedAt).getTime() - new Date(startedAt).getTime() - totalPausedMs)
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`
}

export function formatDurationDecimal(startedAt: string, endedAt: string, totalPausedMs = 0): string {
  const ms = Math.max(0, new Date(endedAt).getTime() - new Date(startedAt).getTime() - totalPausedMs)
  return (ms / 3_600_000).toFixed(2)
}

const TZ = 'America/Toronto'

export function formatTime(iso: string, lang: Lang = 'fr'): string {
  const locale = lang === 'en' ? 'en-CA' : 'fr-CA'
  return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone: TZ })
}

export function formatDate(iso: string, lang: Lang = 'fr'): string {
  const locale = lang === 'en' ? 'en-CA' : 'fr-CA'
  return new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric', timeZone: TZ })
}

export function todayISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date())
}

export function weekStartISO(): string {
  const today = new Date(new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date()))
  today.setDate(today.getDate() - today.getDay() + 1) // lundi / monday
  return today.toISOString().split('T')[0]
}
