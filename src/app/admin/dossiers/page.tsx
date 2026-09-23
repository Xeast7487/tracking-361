import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminDossiersPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: employees } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active')
    .order('full_name')

  const activeEmployees   = (employees ?? []).filter(e => e.is_active)
  const inactiveEmployees = (employees ?? []).filter(e => !e.is_active)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">Dossiers des employés</h1>
        <p className="text-slate-500 text-sm mt-1">{activeEmployees.length} employé{activeEmployees.length !== 1 ? 's' : ''} actif{activeEmployees.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="space-y-2">
        {activeEmployees.map(emp => (
          <EmployeeRow key={emp.id} employee={emp} />
        ))}
      </div>

      {inactiveEmployees.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-widest">Inactifs</h2>
          <div className="space-y-2">
            {inactiveEmployees.map(emp => (
              <EmployeeRow key={emp.id} employee={emp} inactive />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function EmployeeRow({ employee, inactive }: { employee: any; inactive?: boolean }) {
  const initials = employee.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <Link
      href={`/admin/dossiers/${employee.id}`}
      className={`flex items-center gap-4 bg-slate-900 border border-slate-800/60 rounded-xl p-4 hover:border-slate-700/60 hover:bg-slate-800/40 transition-all group ${inactive ? 'opacity-50' : ''}`}
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white group-hover:text-blue-300 transition-colors">{employee.full_name}</p>
        <p className="text-xs text-slate-500">{employee.email}</p>
      </div>
      <div className="flex items-center gap-3">
        {employee.role === 'admin' && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25 uppercase tracking-wider">
            Admin
          </span>
        )}
        <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
