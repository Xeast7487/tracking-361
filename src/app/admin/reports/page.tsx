import { createSupabaseServerClient } from '@/lib/supabase-server'
import EntryList from '@/components/EntryList'
import ExportButtons from './ExportButtons'

interface Props {
  searchParams: { from?: string; to?: string; user_id?: string; client_id?: string; billable?: string }
}

export default async function ReportsPage({ searchParams }: Props) {
  const supabase = createSupabaseServerClient()

  const to      = searchParams.to      ?? new Date().toISOString().split('T')[0]
  const from    = searchParams.from    ?? (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0] })()
  const userId   = searchParams.user_id   ?? ''
  const clientId = searchParams.client_id ?? ''
  const billable = searchParams.billable  ?? ''

  // Fetch filter options
  const [profilesRes, clientsRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name'),
    supabase.from('clients').select('id, name').order('name'),
  ])

  // Build query
  let query = supabase
    .from('time_entries')
    .select('id, started_at, ended_at, notes, is_billable, clients(name), projects(name), profiles(full_name)')
    .gte('started_at', `${from}T00:00:00`)
    .lte('started_at', `${to}T23:59:59`)
    .order('started_at', { ascending: false })

  if (userId)   query = query.eq('user_id', userId)
  if (clientId) query = query.eq('client_id', clientId)
  if (billable === 'true')  query = query.eq('is_billable', true)
  if (billable === 'false') query = query.eq('is_billable', false)

  const { data: entries } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white">Rapports d'heures</h1>
        <div className="no-print flex gap-2">
          <ExportButtons entries={(entries ?? []) as any} />
        </div>
      </div>

      {/* Filters */}
      <form className="card grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end no-print">
        <div>
          <label className="label">Du</label>
          <input type="date" name="from" defaultValue={from} className="input" />
        </div>
        <div>
          <label className="label">Au</label>
          <input type="date" name="to" defaultValue={to} className="input" />
        </div>
        <div>
          <label className="label">Employé</label>
          <select name="user_id" defaultValue={userId} className="input">
            <option value="">Tous</option>
            {(profilesRes.data ?? []).map(p => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Client</label>
          <select name="client_id" defaultValue={clientId} className="input">
            <option value="">Tous</option>
            {(clientsRes.data ?? []).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Facturable</label>
          <select name="billable" defaultValue={billable} className="input">
            <option value="">Tous</option>
            <option value="true">Facturable</option>
            <option value="false">Non-facturable</option>
          </select>
        </div>
        <button type="submit" className="btn-primary">Filtrer</button>
      </form>

      {/* Print header */}
      <div className="hidden print:block mb-4">
        <h2 className="text-xl font-bold">Rapport d'heures — Tracking 361</h2>
        <p className="text-sm text-gray-600">Période : {from} → {to}</p>
      </div>

      <EntryList entries={(entries ?? []) as any} showEmployee isAdmin />
    </div>
  )
}
