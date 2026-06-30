'use client'

import { useEffect, useState } from 'react'

type Status = 'loading' | 'unsupported' | 'denied' | 'active' | 'inactive'

export default function PushNotificationToggle() {
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        setStatus('active')
      } else {
        setStatus(Notification.permission === 'denied' ? 'denied' : 'inactive')
      }
    })
  }, [])

  async function enable() {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
      if (res.ok) setStatus('active')
    } catch {
      setStatus(Notification.permission === 'denied' ? 'denied' : 'inactive')
    }
  }

  async function disable() {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
    }
    setStatus('inactive')
  }

  if (status === 'loading' || status === 'unsupported') return null

  if (status === 'denied') {
    return (
      <p className="text-xs text-slate-500">
        Notifications bloquées — autorise-les dans les paramètres du navigateur.
      </p>
    )
  }

  if (status === 'active') {
    return (
      <button
        onClick={disable}
        className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
        Notifications actives — Désactiver
      </button>
    )
  }

  return (
    <button onClick={enable} className="btn-secondary text-sm">
      🔔 Activer les notifications de pause
    </button>
  )
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}
