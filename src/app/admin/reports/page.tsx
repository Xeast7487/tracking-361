import { createSupabaseServerClient } from '@/lib/supabase-server'
import ManualEntryForm from './ManualEntryForm'
import EntryList from '@/components/EntryList'
import ExportButtons from './ExportButtons'
import { getLang } from '@/lib/getLang'
import { translations } from '@/lib/translations'

interface Props {
  searchParams: { from?: string; to?: string; user_id?: string; client_id?: string; project_id?: string; billable?: string; web_dept?: string; charge_client?: string }
}

export default async function ReportsPage({ searchParams }: Props) {
  const supabase = await createSupabaseServerClient()

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const isSuperAdmin = currentUser?.email === 'a.monier@agence361.com'

  const lang = await getLang()
  const t = translations[lang].adminReports

  const to        = searchParams.to        ?? new Date().toISOString().split('T')[0]
  const from      = searchParams.from      ?? (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0] })()
  const userId    = searchParams.user_id    ?? ''
  const clientId  = searchParams.client_id  ?? ''
  const projectId = searchParams.project_id ?? ''
  const billable      = searchParams.billable      ?? ''
  const webDept       = searchParams.web_dept      ?? ''
  const chargeClient  = searchParams.charge_client ?? ''

  const [profilesRes, clientsRes, projectsRes, allProjectsRes, allClientsRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, is_web_dept').eq('is_active', true).order('full_name'),
    supabase.from('clients').select('id, name').order('name'),
    clientId
      ? supabase.from('projects').select('id, name, client_id').eq('client_id', clientId).order('name')
      : supabase.from('projects').select('id, name, client_id').order('name'),
    supabase.from('projects').select('id, name, client_id').order('name'),
    supabase.from('clients').select('id, name').order('name'),
  ])

  let query = supabase
    .from('time_entries')
    .select('id, started_at, ended_at, notes, is_billable, charge_web_dept, charge_client, client_hourly_rate, total_paused_ms, client_id, project_id, clients(name), projects(name), profiles(full_name, hourly_rate, is_web_dept)')
    .gte('started_at', `${from}T00:00:00`)
    .lte('started_at', `${to}T23:59:59`)
    .order('started_at', { ascending: false })

  if (userId)    query = query.eq('user_id', userId)
  if (clientId)  query = query.eq('client_id', clientId)
  if (projectId) query = query.eq('project_id', projectId)
  if (billable === 'true')  query = query.eq('is_billable', true)
  if (billable === 'false') query = query.eq('is_billable', false)
  if (webDept === 'true')      query = query.eq('charge_web_dept', true)
  if (chargeClient === 'true') query = query.eq('charge_client', true)

  const { data: entries } = await query

  // Calcul coût département web
  const webEntries = (entries ?? []).filter((e: any) => e.charge_web_dept)
  const webCost = webEntries.reduce((sum: number, e: any) => {
    if (!e.ended_at) return sum
    const ms = new Date(e.ended_at).getTime() - new Date(e.started_at).getTime() - (e.total_paused_ms ?? 0)
    const hours = Math.max(0, ms / 3_600_000)
    const rate = e.profiles?.hourly_rate ?? 0
    return sum + hours * rate
  }, 0)

  // Calcul facturation clients
  const clientBillingEntries = (entries ?? []).filter((e: any) => e.charge_client && e.ended_at)
  const clientBillingMap = new Map<string, { clientName: string; hours: number; amount: number }>()
  for (const e of clientBillingEntries) {
    const clientName = (e as any).clients?.name ?? 'Sans client'
    const ms = Math.max(0, new Date(e.ended_at).getTime() - new Date(e.started_at).getTime() - (e.total_paused_ms ?? 0))
    const hours = ms / 3_600_000
    const amount = hours * ((e as any).client_hourly_rate ?? 0)
    const existing = clientBillingMap.get(clientName)
    if (existing) { existing.hours += hours; existing.amount += amount }
    else clientBillingMap.set(clientName, { clientName, hours, amount })
  }
  const clientBillingGroups = Array.from(clientBillingMap.values()).sort((a, b) => b.amount - a.amount)
  const totalClientBillingAmount = clientBillingGroups.reduce((sum, g) => sum + g.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white">{t.title}</h1>
        <div className="no-print flex gap-2">
          <ExportButtons entries={(entries ?? []) as any} />
        </div>
      </div>

      {/* Super Admin — Saisie manuelle */}
      {isSuperAdmin && (
        <ManualEntryForm
          profiles={(profilesRes.data ?? []) as any}
          clients={(allClientsRes.data ?? []) as any}
          projects={(allProjectsRes.data ?? []) as any}
        />
      )}

      {/* Filters */}
      <form className="card grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 items-end no-print">
        <div>
          <label className="label">{t.from}</label>
          <input type="date" name="from" defaultValue={from} className="input" />
        </div>
        <div>
          <label className="label">{t.to}</label>
          <input type="date" name="to" defaultValue={to} className="input" />
        </div>
        <div>
          <label className="label">{t.employee}</label>
          <select name="user_id" defaultValue={userId} className="input">
            <option value="">{t.all}</option>
            {(profilesRes.data ?? []).map(p => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
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
        <div>
          <label className="label">{t.billable}</label>
          <select name="billable" defaultValue={billable} className="input">
            <option value="">{t.all}</option>
            <option value="true">{t.billable}</option>
            <option value="false">{t.nonBillable}</option>
          </select>
        </div>
        <div>
          <label className="label">{t.webDept}</label>
          <select name="web_dept" defaultValue={webDept} className="input">
            <option value="">{t.all}</option>
            <option value="true">{t.webDeptOnly}</option>
          </select>
        </div>
        <div>
          <label className="label">{t.chargeClient}</label>
          <select name="charge_client" defaultValue={chargeClient} className="input">
            <option value="">{t.all}</option>
            <option value="true">{t.chargeClientOnly}</option>
          </select>
        </div>
        <button type="submit" className="btn-primary">{t.filter}</button>
      </form>

      {clientBillingGroups.length > 0 && (
        <div className="card bg-emerald-900/20 border border-emerald-700/40">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <p className="text-xs text-emerald-400 uppercase tracking-wider font-semibold mb-1">{t.clientBillingTitle}</p>
              <p className="text-white font-semibold">{t.clientBillingEntries(clientBillingEntries.length)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-400 uppercase tracking-wider font-semibold mb-1">{t.clientBillingTotal}</p>
              <p className="text-2xl font-bold text-emerald-300">{totalClientBillingAmount.toFixed(2)} $</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-emerald-800/40">
                  <th className="pb-2 font-semibold text-emerald-400/80">{t.client}</th>
                  <th className="pb-2 font-semibold text-emerald-400/80 text-right">{t.clientBillingHours}</th>
                  <th className="pb-2 font-semibold text-emerald-400/80 text-right">{t.clientBillingAmount}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/30">
                {clientBillingGroups.map(g => (
                  <tr key={g.clientName}>
                    <td className="py-2 text-slate-200 font-medium">{g.clientName}</td>
                    <td className="py-2 text-slate-300 text-right font-mono">
                      {Math.floor(g.hours)}h {Math.round((g.hours % 1) * 60).toString().padStart(2, '0')}m
                    </td>
                    <td className="py-2 font-bold text-emerald-300 text-right">{g.amount.toFixed(2)} $</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {webDept === 'true' && webEntries.length > 0 && (
        <div className="card bg-orange-900/20 border border-orange-700/40">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-orange-400 uppercase tracking-wider font-semibold mb-1">{t.webDept}</p>
              <p className="text-white font-semibold">{webEntries.length} entrée{webEntries.length > 1 ? 's' : ''} chargée{webEntries.length > 1 ? 's' : ''} au département web</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-orange-400 uppercase tracking-wider font-semibold mb-1">{t.cost}</p>
              <p className="text-2xl font-bold text-orange-300">{webCost.toFixed(2)} $</p>
            </div>
          </div>
        </div>
      )}

      {/* Print header */}
      <div className="hidden print:block mb-4">
        <h2 className="text-xl font-bold">{t.printTitle}</h2>
        <p className="text-sm text-gray-600">{t.period} : {from} → {to}</p>
      </div>

      <EntryList entries={(entries ?? []) as any} showEmployee isAdmin allowEdit />
    </div>
  )
}
