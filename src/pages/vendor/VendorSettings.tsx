import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import {
  changeVendorPassword,
  fetchVendorSettings,
  patchVendorSettings,
  type VendorSettingsPayload,
} from '@/api/vendorSettings'
import { disableTwoFactor, enableTwoFactor } from '@/api/vendorTwoFactor'
import { ActionButtons } from '@/components/sections/vendor/settings/ActionButtons'
import { BusinessProfileCard } from '@/components/sections/vendor/settings/BusinessProfileCard'
import { CurrentPlanCard } from '@/components/sections/vendor/settings/CurrentPlanCard'
import { NotificationChannelsCard } from '@/components/sections/vendor/settings/NotificationChannelsCard'
import { SecurityAccessCard } from '@/components/sections/vendor/settings/SecurityAccessCard'
import { TwoFactorSetupModal } from '@/components/sections/vendor/settings/TwoFactorSetupModal'
import { VerifiedStatusCard } from '@/components/sections/vendor/settings/VerifiedStatusCard'
import { EmailVerificationSection } from '@/components/settings/EmailVerificationSection'
import { useAuth } from '@/auth/useAuth'
import { getLaravelErrorMessage } from '@/lib/laravelApiError'
import { alert, Swal } from '@/lib/sweetAlert'

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
  const { refreshSession } = useAuth()

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

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorBusy, setTwoFactorBusy] = useState(false)
  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false)
  const [twoFactorQr, setTwoFactorQr] = useState('')
  const [twoFactorSecret, setTwoFactorSecret] = useState('')

  useEffect(() => {
    if (settingsQuery.data && form === null) {
      setForm(payloadToForm(settingsQuery.data))
      setTwoFactorEnabled(settingsQuery.data.security.two_factor_enabled)
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
    setTwoFactorEnabled(data.security.two_factor_enabled)
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

  async function handleTwoFactorToggle(enabled: boolean) {
    if (twoFactorBusy) return

    if (enabled) {
      setTwoFactorBusy(true)
      try {
        const result = await enableTwoFactor()
        setTwoFactorQr(result.qr_code)
        setTwoFactorSecret(result.secret)
        setTwoFactorModalOpen(true)
      } catch (error) {
        await alert.toast.error(getLaravelErrorMessage(error, 'Could not start two-factor setup.'))
      } finally {
        setTwoFactorBusy(false)
      }
      return
    }

    const { value: password, isConfirmed } = await Swal.fire({
      title: 'Disable two-factor authentication?',
      text: 'Enter your account password to confirm.',
      input: 'password',
      inputPlaceholder: 'Password',
      inputAttributes: { autocapitalize: 'off', autocorrect: 'off' },
      showCancelButton: true,
      confirmButtonText: 'Disable 2FA',
      confirmButtonColor: '#E42338',
    })

    if (!isConfirmed || !password) return

    setTwoFactorBusy(true)
    try {
      await disableTwoFactor(password)
      setTwoFactorEnabled(false)
      await alert.toast.success('Two-factor authentication disabled.')
      void queryClient.invalidateQueries({ queryKey: VENDOR_SETTINGS_QUERY_KEY })
    } catch (error) {
      await alert.toast.error(getLaravelErrorMessage(error, 'Could not disable two-factor authentication.'))
    } finally {
      setTwoFactorBusy(false)
    }
  }

  async function handleTwoFactorConfirmed(recoveryCodes: string[]) {
    setTwoFactorModalOpen(false)
    setTwoFactorEnabled(true)
    setTwoFactorQr('')
    setTwoFactorSecret('')
    void queryClient.invalidateQueries({ queryKey: VENDOR_SETTINGS_QUERY_KEY })

    await Swal.fire({
      title: 'Two-factor enabled',
      html: `<p class="text-sm mb-3">Store these recovery codes in a safe place. Each can be used once if you lose your device.</p><pre class="text-left text-xs bg-slate-100 p-3 rounded-lg overflow-auto max-h-48">${recoveryCodes.join('\n')}</pre>`,
      confirmButtonText: 'I have saved my codes',
    })
  }

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
      <TwoFactorSetupModal
        open={twoFactorModalOpen}
        qrCode={twoFactorQr}
        secret={twoFactorSecret}
        onClose={() => {
          setTwoFactorModalOpen(false)
          setTwoFactorQr('')
          setTwoFactorSecret('')
        }}
        onConfirmed={handleTwoFactorConfirmed}
      />

      <section className="space-y-6 md:space-y-8">
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
              twoFactorEnabled={twoFactorEnabled}
              twoFactorBusy={twoFactorBusy}
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
              onTwoFactorToggle={handleTwoFactorToggle}
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
