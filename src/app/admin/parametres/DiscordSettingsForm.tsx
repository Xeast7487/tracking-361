'use client'

import { useState, useTransition } from 'react'
import { saveDiscordSettingAction, updateEmployeeNotifyAction } from '@/app/actions'

interface Employee {
  id: string
  full_name: string
  notify_discord: boolean | null
}

interface Props {
  initialToken: string
  initialOwnerId: string
  employees: Employee[]
}

function MaskToken(token: string) {
  if (!token) return ''
  if (token.length <= 8) return '••••••••'
  return token.slice(0, 6) + '••••••••••••' + token.slice(-4)
}

export default function DiscordSettingsForm({ initialToken, initialOwnerId, employees }: Props) {
  const [token, setToken] = useState(initialToken)
  const [showToken, setShowToken] = useState(false)
  const [ownerId, setOwnerId] = useState(initialOwnerId)
  const [savedToken, setSavedToken] = useState(false)
  const [savedOwner, setSavedOwner] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [notifyMap, setNotifyMap] = useState<Record<string, boolean>>(
    Object.fromEntries(employees.map(e => [e.id, e.notify_discord ?? false]))
  )
  const [togglingId, setTogglingId] = useState<string | null>(null)

  function saveField(key: string, value: string, onSuccess: () => void) {
    setError(null)
    startTransition(async () => {
      const res = await saveDiscordSettingAction(key, value)
      if (res?.error) setError(res.error)
      else onSuccess()
    })
  }

  async function toggleNotify(userId: string, current: boolean) {
    setTogglingId(userId)
    const res = await updateEmployeeNotifyAction(userId, !current)
    if (!res?.error) setNotifyMap(prev => ({ ...prev, [userId]: !current }))
    setTogglingId(null)
  }

  return (
    <div className="space-y-6">

      {/* Bot Discord */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-indigo-400">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.024.015.045.032.057a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm">Bot Discord</h2>
            <p className="text-xs text-slate-500">TiClaude - configuration de connexion</p>
          </div>
        </div>

        {/* Token */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Token du bot</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={e => { setToken(e.target.value); setSavedToken(false) }}
                placeholder="Colle ton token Discord ici"
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowToken(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showToken ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            <button
              onClick={() => saveField('discord_bot_token', token, () => setSavedToken(true))}
              disabled={isPending || !token.trim()}
              className="flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {savedToken ? 'Sauvegardé' : 'Sauvegarder'}
            </button>
          </div>
          {initialToken && (
            <p className="text-xs text-slate-600">Token actuel : {MaskToken(initialToken)}</p>
          )}
        </div>

        {/* Owner Discord ID */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Ton Discord User ID</label>
          <p className="text-xs text-slate-600">Pour activer le Developer Mode sur Discord : Paramètres utilisateur &gt; Avancés &gt; Mode développeur. Ensuite clic droit sur ton nom &gt; Copier l&apos;identifiant.</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={ownerId}
              onChange={e => { setOwnerId(e.target.value); setSavedOwner(false) }}
              placeholder="ex: 123456789012345678"
              className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
            />
            <button
              onClick={() => saveField('discord_owner_id', ownerId, () => setSavedOwner(true))}
              disabled={isPending || !ownerId.trim()}
              className="flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {savedOwner ? 'Sauvegardé' : 'Sauvegarder'}
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      {/* Notifications par employé */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm">Notifications par employé</h2>
            <p className="text-xs text-slate-500">Le bot t&apos;avertit uniquement pour les employés activés ci-dessous.</p>
          </div>
        </div>

        <div className="space-y-2">
          {employees.length === 0 && (
            <p className="text-sm text-slate-600 text-center py-4">Aucun employé actif.</p>
          )}
          {employees.map(emp => {
            const enabled = notifyMap[emp.id] ?? false
            const isToggling = togglingId === emp.id
            return (
              <div key={emp.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-slate-800/40 border border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                    {emp.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-200">{emp.full_name}</span>
                </div>
                <button
                  onClick={() => toggleNotify(emp.id, enabled)}
                  disabled={isToggling}
                  className={`relative w-11 h-6 rounded-full transition-all flex-shrink-0 ${
                    enabled ? 'bg-violet-600/70' : 'bg-slate-700'
                  } ${isToggling ? 'opacity-50' : ''}`}
                  aria-label={`Notifications pour ${emp.full_name}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Info cron */}
      <div className="bg-slate-900/50 border border-slate-800/40 rounded-xl p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-400">Comment ça fonctionne</p>
        <p>Le bot vérifie chaque jour de semaine à 17h (heure de Montréal) si les employés activés ont soumis leur résumé. Si ce n&apos;est pas le cas, il t&apos;envoie un DM sur Discord.</p>
        <p className="text-slate-600">Assure-toi que le bot est dans un serveur en commun avec toi pour pouvoir t&apos;envoyer un message privé.</p>
      </div>
    </div>
  )
}
