import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import {
  changeVendorPassword,
  fetchVendorSettings,
  patchVendorSettings,
  type VendorSettingsPayload,
} from '@/api/vendorSettings'
import { ActionButtons } from '@/components/sections/vendor/settings/ActionButtons'
import { BusinessProfileCard } from '@/components/sections/vendor/settings/BusinessProfileCard'
import { CurrentPlanCard } from '@/components/sections/vendor/settings/CurrentPlanCard'
import { NotificationChannelsCard } from '@/components/sections/vendor/settings/NotificationChannelsCard'
import { SecurityAccessCard } from '@/components/sections/vendor/settings/SecurityAccessCard'
import { VerifiedStatusCard } from '@/components/sections/vendor/settings/VerifiedStatusCard'
import { AccountVerificationSection } from '@/components/settings/AccountVerificationSection'
import { EmailVerificationSection } from '@/components/settings/EmailVerificationSection'
import { useAuth } from '@/auth/useAuth'
import { isUserAccountVerified } from '@/lib/accountVerification'
import { getLaravelErrorMessage } from '@/lib/laravelApiError'
import { alert } from '@/lib/sweetAlert'

const VENDOR_SETTINGS_QUERY_KEY = ['vendor', 'settings'] as const

type FormState = {
  businessName: string
  contactFirstName: string
  contactLastName: string
  phone: string
  notifyEmail: boolean
  notifySms: boolean
  notifyWhatsapp: boolean
}

function payloadToForm(data: VendorSettingsPayload): FormState {
  return {
    businessName: data.profile.business_name ?? '',
    contactFirstName: data.profile.first_name ?? '',
    contactLastName: data.profile.last_name ?? '',
    phone: data.profile.phone ?? '',
    notifyEmail: data.notifications.email,
    notifySms: data.notifications.sms,
    notifyWhatsapp: data.notifications.whatsapp,
  }
}

export default function VendorSettings() {
  const queryClient = useQueryClient()
  const { user, refreshSession } = useAuth()

  const settingsQuery = useQuery({
    queryKey: VENDOR_SETTINGS_QUERY_KEY,
    queryFn: fetchVendorSettings,
  })

  const [form, setForm] = useState<FormState | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (settingsQuery.data && form === null) {
      setForm(payloadToForm(settingsQuery.data))
    }
  }, [settingsQuery.data, form])

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null)
      return
    }
    const url = URL.createObjectURL(logoFile)
    setLogoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [logoFile])

  const baseline = useMemo(
    () => (settingsQuery.data ? payloadToForm(settingsQuery.data) : null),
    [settingsQuery.data],
  )

  const profileDirty = useMemo(() => {
    if (!form || !baseline) return false
    return (
      form.businessName !== baseline.businessName ||
      form.contactFirstName !== baseline.contactFirstName ||
      form.contactLastName !== baseline.contactLastName ||
      form.phone !== baseline.phone ||
      form.notifyEmail !== baseline.notifyEmail ||
      form.notifySms !== baseline.notifySms ||
      form.notifyWhatsapp !== baseline.notifyWhatsapp ||
      logoFile !== null
    )
  }, [form, baseline, logoFile])

  const passwordDirty = currentPassword !== '' || newPassword !== '' || confirmPassword !== ''
  const dirty = profileDirty || passwordDirty

  const applyServerPayload = useCallback((data: VendorSettingsPayload) => {
    setForm(payloadToForm(data))
    setLogoFile(null)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    queryClient.setQueryData(VENDOR_SETTINGS_QUERY_KEY, data)
  }, [queryClient])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form) throw new Error('Settings not loaded')

      if (passwordDirty) {
        if (!currentPassword || !newPassword || !confirmPassword) {
          throw new Error('Fill in all password fields to change your password.')
        }
        if (newPassword !== confirmPassword) {
          throw new Error('New password and confirmation do not match.')
        }
        if (newPassword.length < 8) {
          throw new Error('New password must be at least 8 characters.')
        }
        await changeVendorPassword({
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: confirmPassword,
        })
      }

      if (profileDirty) {
        const updated = await patchVendorSettings(
          {
            first_name: form.contactFirstName.trim(),
            last_name: form.contactLastName.trim(),
            business_name: form.businessName.trim(),
            phone: form.phone.trim(),
            settings: {
              notifications: {
                email: form.notifyEmail,
                sms: form.notifySms,
                whatsapp: form.notifyWhatsapp,
              },
            },
          },
          { logo: logoFile },
        )
        return updated
      }

      return settingsQuery.data!
    },
    onSuccess: async (data) => {
      if (data) applyServerPayload(data)
      await alert.toast.success('Settings saved successfully.')
    },
    onError: async (error) => {
      await alert.toast.error(getLaravelErrorMessage(error, 'Could not save settings.'))
    },
  })

  function handleDiscard() {
    if (!settingsQuery.data) return
    applyServerPayload(settingsQuery.data)
  }

  if (settingsQuery.isLoading || !form || !settingsQuery.data) {
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

  const data = settingsQuery.data

  return (
    <div className="p-4 md:p-6">
      <section className="space-y-6 md:space-y-8">
        {!isUserAccountVerified(user) ? (
          <AccountVerificationSection
            user={user}
            onVerified={() => {
              void settingsQuery.refetch()
            }}
          />
        ) : null}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] lg:items-start">
          <div className="space-y-6">
            <BusinessProfileCard
              businessName={form.businessName}
              contactFirstName={form.contactFirstName}
              contactLastName={form.contactLastName}
              phone={form.phone}
              logoUrl={data.profile.logo_url}
              logoPreview={logoPreview}
              disabled={saveMutation.isPending}
              onBusinessNameChange={(v) => setForm((f) => (f ? { ...f, businessName: v } : f))}
              onContactFirstNameChange={(v) => setForm((f) => (f ? { ...f, contactFirstName: v } : f))}
              onContactLastNameChange={(v) => setForm((f) => (f ? { ...f, contactLastName: v } : f))}
              onPhoneChange={(v) => setForm((f) => (f ? { ...f, phone: v } : f))}
              onLogoChange={setLogoFile}
            />
            <div className="rounded-xl border-0 border-l-4 border-brand-red bg-card p-5 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-foreground font-manrope">Business Email</h3>
              <EmailVerificationSection
                email={data.profile.email ?? ''}
                emailVerified={Boolean(data.profile.email_verified)}
                emailVerificationRequired={Boolean(data.profile.email_verification_required)}
                disabled={saveMutation.isPending}
                settingsQueryKey={[...VENDOR_SETTINGS_QUERY_KEY]}
                inputId="vendor-settings-email"
                onVerified={() => {
                  void refreshSession()
                }}
              />
            </div>
            <SecurityAccessCard
              disabled={saveMutation.isPending}
              currentPassword={currentPassword}
              newPassword={newPassword}
              confirmPassword={confirmPassword}
              showCurrentPassword={showCurrentPassword}
              showNewPassword={showNewPassword}
              showConfirmPassword={showConfirmPassword}
              onCurrentPasswordChange={setCurrentPassword}
              onNewPasswordChange={setNewPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onToggleCurrentPassword={() => setShowCurrentPassword((v) => !v)}
              onToggleNewPassword={() => setShowNewPassword((v) => !v)}
              onToggleConfirmPassword={() => setShowConfirmPassword((v) => !v)}
            />
            <ActionButtons
              dirty={dirty}
              saving={saveMutation.isPending}
              onDiscard={handleDiscard}
              onSave={() => saveMutation.mutate()}
            />
          </div>

          <div className="space-y-6">
            <VerifiedStatusCard verification={data.verification} />
            <NotificationChannelsCard
              notifyEmail={form.notifyEmail}
              setNotifyEmail={(v) => setForm((f) => (f ? { ...f, notifyEmail: v } : f))}
              notifySms={form.notifySms}
              setNotifySms={(v) => setForm((f) => (f ? { ...f, notifySms: v } : f))}
              notifyWhatsapp={form.notifyWhatsapp}
              setNotifyWhatsapp={(v) => setForm((f) => (f ? { ...f, notifyWhatsapp: v } : f))}
            />
            <CurrentPlanCard subscription={data.subscription} />
          </div>
        </div>
      </section>
    </div>
  )
}
