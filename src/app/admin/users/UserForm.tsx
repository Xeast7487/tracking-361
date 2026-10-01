'use client'

import { useState, useTransition } from 'react'
import { createUserAction, updateUserAction } from '@/app/actions'
import { useLanguage } from '@/lib/LanguageContext'
import { translations } from '@/lib/translations'

interface User {
  id: string
  full_name: string
  email: string
  role: string
  hourly_rate: number | null
  is_active: boolean
  is_web_dept: boolean
  discord_user_id?: string | null
  notify_discord?: boolean
}

interface Props {
  mode: 'create' | 'edit'
  user?: User
}

export default function UserForm({ mode, user }: Props) {
  const [open, setOpen] = useState(mode === 'create')
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()
  const { lang } = useLanguage()
  const t = translations[lang].userForm

  if (mode === 'edit' && !open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-ghost text-xs px-2 py-1">
        {t.edit}
      </button>
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError('')
    setSuccess('')
    startTransition(async () => {
      const res = mode === 'create'
        ? await createUserAction(fd)
        : await updateUserAction(user!.id, fd)
      if (res?.error) { setError(res.error); return }
      setSuccess(mode === 'create' ? t.created : t.updated)
      if (mode === 'create') (e.target as HTMLFormElement).reset()
      if (mode === 'edit') setTimeout(() => setOpen(false), 1200)
    })
  }

  return (
    <form onSubmit={handleSubmit} className={mode === 'edit' ? 'space-y-3 mt-2 p-3 bg-slate-900/60 rounded-lg border border-slate-700' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'}>
      <div>
        <label className="label">{t.fullName}</label>
        <input name="full_name" type="text" required defaultValue={user?.full_name}
          placeholder="Jane Tremblay" className="input" />
      </div>
      {mode === 'create' && (
        <div>
          <label className="label">{t.email}</label>
          <input name="email" type="email" required placeholder="jane@agence361.com" className="input" />
        </div>
      )}
      <div>
        <label className="label">{mode === 'create' ? t.password : t.newPassword}</label>
        <input name="password" type="password" required={mode === 'create'}
          placeholder={mode === 'edit' ? t.passwordPlaceholderEdit : '••••••••'} className="input" />
      </div>
      <div>
        <label className="label">{t.role}</label>
        <select name="role" defaultValue={user?.role ?? 'employee'} className="input">
          <option value="employee">{t.roleEmployee}</option>
          <option value="admin">{t.roleAdmin}</option>
        </select>
      </div>
      <div>
        <label className="label">{t.hourlyRate}</label>
        <input name="hourly_rate" type="number" step="0.01" min="0"
          defaultValue={user?.hourly_rate ?? ''} placeholder="25.00" className="input" />
      </div>
      <div className="flex items-center gap-3 col-span-full">
        <input name="is_web_dept" type="checkbox" id="is_web_dept" value="true"
          defaultChecked={user?.is_web_dept ?? false} className="w-4 h-4 accent-blue-500" />
        <div>
          <label htmlFor="is_web_dept" className="text-sm font-medium text-slate-200 cursor-pointer">{t.webDept}</label>
          <p className="text-xs text-slate-500">{t.webDeptDesc}</p>
        </div>
      </div>
      {mode === 'edit' && (
        <div>
          <label className="label">{t.status}</label>
          <select name="is_active" defaultValue={user?.is_active ? 'true' : 'false'} className="input">
            <option value="true">{t.statusActive}</option>
            <option value="false">{t.statusDisabled}</option>
          </select>
        </div>
      )}

      {mode === 'edit' && (
        <div className="col-span-full border-t border-slate-700/50 pt-3 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Notifications Discord</p>
          <div>
            <label className="label">Discord User ID</label>
            <input
              name="discord_user_id"
              type="text"
              defaultValue={user?.discord_user_id ?? ''}
              placeholder="ex: 737391146707452048"
              className="input font-mono text-xs"
            />
            <p className="text-xs text-slate-600 mt-1">Clic droit sur l'utilisateur dans Discord → Copier l'identifiant</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              name="notify_discord"
              type="checkbox"
              id={`notify_discord_${user?.id}`}
              value="true"
              defaultChecked={user?.notify_discord ?? false}
              className="w-4 h-4 accent-violet-500"
            />
            <div>
              <label htmlFor={`notify_discord_${user?.id}`} className="text-sm font-medium text-slate-200 cursor-pointer">
                Notifier si résumé manquant
              </label>
              <p className="text-xs text-slate-500">Le bot envoie un DM à 17h si l'employé n'a pas écrit son résumé</p>
            </div>
          </div>
        </div>
      )}

      {error   && <p className="text-red-400 text-sm col-span-full">{error}</p>}
      {success && <p className="text-green-400 text-sm col-span-full">{success}</p>}

      <div className={`flex gap-2 ${mode === 'edit' ? '' : 'col-span-full'}`}>
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? '...' : mode === 'create' ? t.createAccount : t.save}
        </button>
        {mode === 'edit' && (
          <button type="button" onClick={() => setOpen(false)} className="btn-ghost text-sm">{t.cancel}</button>
        )}
      </div>
    </form>
  )
}
