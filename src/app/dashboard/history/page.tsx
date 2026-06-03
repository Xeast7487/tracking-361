import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import EntryList from '@/components/EntryList'
import { getLang } from '@/lib/getLang'
import { translations } from '@/lib/translations'

interface Props {
  searchParams: { from?: string; to?: string; client_id?: string; project_id?: string }
}

export default async function HistoryPage({ searchParams }: Props) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const lang = await getLang()
  const t = translations[lang].history

  const to        = searchParams.to        ?? new Date().toISOString().split('T')[0]
  const from      = searchParams.from      ?? (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0] })()
  const clientId  = searchParams.client_id  ?? ''
  const projectId = searchParams.project_id ?? ''

  const [clientsRes, projectsRes] = await Promise.all([
    supabase.from('clients').select('id, name').order('name'),
    clientId
      ? supabase.from('projects').select('id, name').eq('client_id', clientId).order('name')
      : supabase.from('projects').select('id, name').order('name'),
  ])

  let query = supabase
    .from('time_entries')
    .select('id, started_at, ended_at, notes, is_billable, total_paused_ms, client_id, project_id, clients(name), projects(name)')
    .eq('user_id', user.id)
    .gte('started_at', `${from}T00:00:00`)
    .lte('started_at', `${to}T23:59:59`)
    .order('started_at', { ascending: false })

  if (clientId)  query = query.eq('client_id', clientId)
  if (projectId) query = query.eq('project_id', projectId)

  const { data: entries } = await query

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t.title}</h1>

      {/* Filters */}
      <form className="card grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
        <div>
          <label className="label">{t.from}</label>
          <input type="date" name="from" defaultValue={from} className="input" />
        </div>
        <div>
          <label className="label">{t.to}</label>
          <input type="date" name="to" defaultValue={to} className="input" />
        </div>
        <div>
          <label className="label">{t.client}</label>
          <select name="client_id" defaultValue={clientId} className="input">
            <option value="">{t.all}</option>
            {(clientsRes.data ?? []).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{t.project}</label>
          <select name="project_id" defaultValue={projectId} className="input">
            <option value="">{t.all}</option>
            {(projectsRes.data ?? []).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary">{t.filter}</button>
      </form>

      <EntryList entries={(entries ?? []) as any} />
    </div>
  )
}
