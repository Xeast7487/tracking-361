import { createSupabaseServerClient } from '@/lib/supabase-server'
import UserForm from './UserForm'
import { getLang } from '@/lib/getLang'
import { translations } from '@/lib/translations'

export default async function UsersPage() {
  const supabase = await createSupabaseServerClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, hourly_rate, is_active, created_at')
    .order('created_at')

  const lang = await getLang()
  const t = translations[lang].adminUsers

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t.title}</h1>
      </div>

      {/* New user form */}
      <div className="card">
        <h2 className="font-semibold text-white mb-5">{t.createAccount}</h2>
        <UserForm mode="create" />
      </div>

      {/* Users list */}
      <div>
        <h2 className="font-semibold text-slate-300 mb-3">{t.existingAccounts} ({users?.length ?? 0})</h2>

        {/* Mobile cards */}
        <div className="sm:hidden space-y-3">
          {(users ?? []).map(u => (
            <div key={u.id} className={`bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-[0_1px_8px_rgba(0,0,0,0.3)] ${!u.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{u.full_name}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    u.role === 'admin' ? 'bg-blue-900/50 text-blue-400 border border-blue-800/50' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {u.role === 'admin' ? t.roleAdmin : t.roleEmployee}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    u.is_active ? 'bg-green-900/40 text-green-400' : 'bg-slate-700 text-slate-500'
                  }`}>
                    {u.is_active ? t.statusActive : t.statusDisabled}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-700/60 pt-3">
                <span className="text-sm text-slate-400">{u.hourly_rate ? `${u.hourly_rate}$ / h` : '—'}</span>
                <UserForm mode="edit" user={u} />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/80 text-left">
                <th className="px-4 py-3 font-semibold text-slate-400">{t.name}</th>
                <th className="px-4 py-3 font-semibold text-slate-400">{t.email}</th>
                <th className="px-4 py-3 font-semibold text-slate-400">{t.role}</th>
                <th className="px-4 py-3 font-semibold text-slate-400">{t.rate}</th>
                <th className="px-4 py-3 font-semibold text-slate-400">{t.status}</th>
                <th className="px-4 py-3 font-semibold text-slate-400">{t.actions}</th>
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
                      {u.role === 'admin' ? t.roleAdmin : t.roleEmployee}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{u.hourly_rate ? `${u.hourly_rate}$` : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      u.is_active ? 'bg-green-900/40 text-green-400' : 'bg-slate-700 text-slate-500'
                    }`}>
                      {u.is_active ? t.statusActive : t.statusDisabled}
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
