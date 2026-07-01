import { useCallback, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import { fetchVendorSettings, patchVendorSettings } from '@/api/vendorSettings'
import { NotificationChannelsCard } from '@/components/sections/vendor/settings/NotificationChannelsCard'
import { getLaravelErrorMessage } from '@/lib/laravelApiError'
import { alert } from '@/lib/sweetAlert'

const VENDOR_SETTINGS_QUERY_KEY = ['vendor', 'settings'] as const

type NotificationForm = {
  notifyEmail: boolean
  notifySms: boolean
  notifyWhatsapp: boolean
}

export default function VendorSettings() {
  const queryClient = useQueryClient()

  const settingsQuery = useQuery({
    queryKey: VENDOR_SETTINGS_QUERY_KEY,
    queryFn: fetchVendorSettings,
  })

  const [form, setForm] = useState<NotificationForm | null>(null)

  useEffect(() => {
    if (!settingsQuery.data || form !== null) return
    setForm({
      notifyEmail: settingsQuery.data.notifications.email,
      notifySms: settingsQuery.data.notifications.sms,
      notifyWhatsapp: settingsQuery.data.notifications.whatsapp,
    })
  }, [settingsQuery.data, form])

  const saveMutation = useMutation({
    mutationFn: (next: NotificationForm) =>
      patchVendorSettings({
        settings: {
          notifications: {
            email: next.notifyEmail,
            sms: next.notifySms,
            whatsapp: next.notifyWhatsapp,
          },
        },
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(VENDOR_SETTINGS_QUERY_KEY, data)
      setForm({
        notifyEmail: data.notifications.email,
        notifySms: data.notifications.sms,
        notifyWhatsapp: data.notifications.whatsapp,
      })
      void alert.toast.success('Notification preferences saved.')
    },
    onError: async (error) => {
      await alert.toast.error(getLaravelErrorMessage(error, 'Could not save notification settings.'))
      if (settingsQuery.data) {
        setForm({
          notifyEmail: settingsQuery.data.notifications.email,
          notifySms: settingsQuery.data.notifications.sms,
          notifyWhatsapp: settingsQuery.data.notifications.whatsapp,
        })
      }
    },
  })

  const updateNotification = useCallback(
    (patch: Partial<NotificationForm>) => {
      setForm((current) => {
        if (!current) return current
        const next = { ...current, ...patch }
        saveMutation.mutate(next)
        return next
      })
    },
    [saveMutation],
  )

  if (settingsQuery.isLoading || !form) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <Loader2 className="size-8 animate-spin text-brand-red" aria-label="Loading settings" />
      </div>
    )
  }

  if (settingsQuery.isError) {
    return (
      <div className="p-6 text-center text-sm text-destructive">
        {getLaravelErrorMessage(settingsQuery.error, 'Could not load settings.')}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-lg">
        <NotificationChannelsCard
          disabled={saveMutation.isPending}
          notifyEmail={form.notifyEmail}
          setNotifyEmail={(v) => updateNotification({ notifyEmail: v })}
          notifySms={form.notifySms}
          setNotifySms={(v) => updateNotification({ notifySms: v })}
          notifyWhatsapp={form.notifyWhatsapp}
          setNotifyWhatsapp={(v) => updateNotification({ notifyWhatsapp: v })}
        />
      </div>
    </div>
  )
}
