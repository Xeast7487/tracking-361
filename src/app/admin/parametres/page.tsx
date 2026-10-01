import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getDiscordSettingsAction, getEmployeesNotifyAction } from '@/app/actions'
import DiscordSettingsForm from './DiscordSettingsForm'

export default async function ParametresPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'a.monier@agence361.com') redirect('/admin')

  const [settings, employees] = await Promise.all([
    getDiscordSettingsAction(),
    getEmployeesNotifyAction(),
  ])

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">Paramètres</h1>
        <p className="text-slate-500 text-sm mt-1">Configuration du bot Discord et des notifications.</p>
      </div>

      <DiscordSettingsForm
        initialToken={settings?.discord_bot_token ?? ''}
        initialOwnerId={settings?.discord_owner_id ?? ''}
        employees={employees as { id: string; full_name: string; notify_discord: boolean | null }[]}
      />
    </div>
  )
}
