import { createSupabaseServerClient } from '@/lib/supabase-server'
import UserForm from './UserForm'

export default async function UsersPage() {
  const supabase = createSupabaseServerClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, hourly_rate, is_active, created_at')
    .order('created_at')

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Gestion des employés</h1>
      </div>

      {/* New user form */}
      <div className="card">
        <h2 className="font-semibold text-white mb-5">Créer un compte</h2>
        <UserForm mode="create" />
      </div>

      {/* Users table */}
      <div>
        <h2 className="font-semibold text-slate-300 mb-3">Comptes existants ({users?.length ?? 0})</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/80 text-left">
                <th className="px-4 py-3 font-semibold text-slate-400">Nom</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Courriel</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Rôle</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Taux $/h</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Statut</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {(users ?? []).map(u => (
                <tr key={u.id} className={`hover:bg-slate-800/40 transition ${!u.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-white">{u.full_name}</td>
                  <td className="px-4 py-3 text-slate-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      u.role === 'admin' ? 'bg-blue-900/50 text-blue-400 border border-blue-800/50' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {u.role === 'admin' ? 'Admin' : 'Employé'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{u.hourly_rate ? `${u.hourly_rate}$` : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      u.is_active ? 'bg-green-900/40 text-green-400' : 'bg-slate-700 text-slate-500'
                    }`}>
                      {u.is_active ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <UserForm mode="edit" user={u} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
