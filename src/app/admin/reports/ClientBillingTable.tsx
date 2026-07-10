'use client'

import { useTransition } from 'react'
import { markClientPaidAction } from '@/app/actions'

export interface BillingGroup {
  clientId: string
  clientName: string
  hours: number
  amount: number
  isPaid: boolean
  notes: string[]
}

interface Props {
  groups: BillingGroup[]
  from: string
  to: string
  labels: {
    client: string
    hours: string
    amount: string
    paid: string
  }
}

export default function ClientBillingTable({ groups, from, to, labels }: Props) {
  const [pending, startTransition] = useTransition()

  function toggle(clientId: string, currentPaid: boolean) {
    startTransition(() => {
      markClientPaidAction(clientId, from, to, !currentPaid)
    })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-emerald-800/40">
            <th className="pb-2 font-semibold text-emerald-400/80">{labels.client}</th>
            <th className="pb-2 font-semibold text-emerald-400/80 text-right">{labels.hours}</th>
            <th className="pb-2 font-semibold text-emerald-400/80 text-right">{labels.amount}</th>
            <th className="pb-2 font-semibold text-emerald-400/80 text-center w-16">{labels.paid}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-emerald-900/30">
          {groups.map(g => (
            <tr key={g.clientId} className={g.isPaid ? 'opacity-60' : ''}>
              <td className="py-2">
                <div className="flex items-center gap-2 text-slate-200 font-medium">
                  {g.isPaid && (
                    <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <div>
                    <span className={g.isPaid ? 'line-through text-slate-400' : ''}>{g.clientName}</span>
                    {g.notes.length > 0 && (
                      <ul className="mt-0.5 space-y-0.5">
                        {g.notes.map((note, i) => (
                          <li key={i} className="text-xs text-slate-400 leading-snug">{note}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </td>
              <td className={`py-2 text-right font-mono ${g.isPaid ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                {Math.floor(g.hours)}h {Math.round((g.hours % 1) * 60).toString().padStart(2, '0')}m
              </td>
              <td className={`py-2 font-bold text-right ${g.isPaid ? 'text-slate-500 line-through' : 'text-emerald-300'}`}>
                {g.amount.toFixed(2)} $
              </td>
              <td className="py-2 text-center">
                <button
                  onClick={() => toggle(g.clientId, g.isPaid)}
                  disabled={pending}
                  aria-label={g.isPaid ? 'Marquer comme non payé' : 'Marquer comme payé'}
                  className={`w-5 h-5 rounded border-2 inline-flex items-center justify-center transition-all ${
                    g.isPaid
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-emerald-700 hover:border-emerald-400 bg-transparent'
                  } ${pending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {g.isPaid && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
