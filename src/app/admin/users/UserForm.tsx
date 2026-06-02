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
      {mode === 'edit' && (
        <div>
          <label className="label">{t.status}</label>
          <select name="is_active" defaultValue={user?.is_active ? 'true' : 'false'} className="input">
            <option value="true">{t.statusActive}</option>
            <option value="false">{t.statusDisabled}</option>
          </select>
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
