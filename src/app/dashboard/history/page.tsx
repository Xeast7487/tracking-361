import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import EntryList from '@/components/EntryList'
import { getLang } from '@/lib/getLang'
import { translations } from '@/lib/translations'

interface Props {
  searchParams: { from?: string; to?: string }
}

export default async function HistoryPage({ searchParams }: Props) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const lang = await getLang()
  const t = translations[lang].history

  const to   = searchParams.to   ?? new Date().toISOString().split('T')[0]
  const from = searchParams.from ?? (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0] })()

  const { data: entries } = await supabase
    .from('time_entries')
    .select('id, started_at, ended_at, notes, is_billable, clients(name), projects(name)')
    .eq('user_id', user.id)
    .gte('started_at', `${from}T00:00:00`)
    .lte('started_at', `${to}T23:59:59`)
    .order('started_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t.title}</h1>

      {/* Date filter */}
      <form className="flex flex-wrap items-end gap-3 card">
        <div>
          <label className="label">{t.from}</label>
          <input type="date" name="from" defaultValue={from} className="input w-auto" />
        </div>
        <div>
          <label className="label">{t.to}</label>
          <input type="date" name="to" defaultValue={to} className="input w-auto" />
        </div>
        <button type="submit" className="btn-primary">{t.filter}</button>
      </form>

      <EntryList entries={(entries ?? []) as any} />
    </div>
  )
}
