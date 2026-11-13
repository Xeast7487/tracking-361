// Convertit une date "YYYY-MM-DD" en borne UTC tenant compte du fuseau America/Toronto (EST/EDT automatique)
function torontoOffset(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const probe = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  const tzName = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Toronto',
    timeZoneName: 'shortOffset',
  }).formatToParts(probe).find(p => p.type === 'timeZoneName')?.value ?? 'GMT-5'
  const match = tzName.match(/GMT([+-])(\d+)/)
  return match ? `${match[1]}${String(parseInt(match[2])).padStart(2, '0')}:00` : '-05:00'
}

export function torontoStartOfDay(dateStr: string): string {
  return `${dateStr}T00:00:00${torontoOffset(dateStr)}`
}

export function torontoEndOfDay(dateStr: string): string {
  return `${dateStr}T23:59:59${torontoOffset(dateStr)}`
}
