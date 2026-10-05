import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { fetchAllLeaveRequestsAction } from '@/app/actions'
import LeaveReviewClient from './LeaveReviewClient'

export default async function AdminCongesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const requests = await fetchAllLeaveRequestsAction()

  const pending  = requests.filter((r: any) => r.status === 'pending')
  const resolved = requests.filter((r: any) => r.status !== 'pending')

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Congés</h1>
          <p className="text-slate-400 text-sm mt-1">Approuve ou refuse les demandes de l&apos;équipe.</p>
        </div>
        {pending.length > 0 && (
          <span className="bg-amber-500/15 text-amber-400 border border-amber-500/25 text-xs font-bold px-3 py-1.5 rounded-full">
            {pending.length} en attente
          </span>
        )}
      </div>

      {pending.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">En attente de révision</h2>
          <div className="space-y-2">
            {pending.map((r: any) => <LeaveReviewClient key={r.id} request={r} />)}
          </div>
        </section>
      )}

      {resolved.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Historique</h2>
          <div className="space-y-2">
            {resolved.map((r: any) => <LeaveReviewClient key={r.id} request={r} readonly />)}
          </div>
        </section>
      )}

      {requests.length === 0 && (
        <div className="text-center py-16 text-slate-600 text-sm">Aucune demande de congé.</div>
      )}
    </div>
  )
}
