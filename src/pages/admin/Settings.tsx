import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, Loader2, Lock, Save, Shield, UserRound } from 'lucide-react'

import { fetchAdminProfile, updateAdminProfile } from '@/api/adminProfileApi'
import {
  confirmAdminTwoFactor,
  disableAdminTwoFactor,
  enableAdminTwoFactor,
  fetchAdminTwoFactorStatus,
} from '@/api/adminTwoFactorApi'
import { TwoFactorSetupModal } from '@/components/sections/vendor/settings/TwoFactorSetupModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getLaravelErrorMessage } from '@/lib/laravelApiError'
import { alert, Swal } from '@/lib/sweetAlert'
import { cn } from '@/lib/utils'

function Toggle({
  on,
  onToggle,
  disabled,
}: {
  on: boolean
  onToggle: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 disabled:opacity-50',
        on ? 'bg-chat-accent' : 'bg-slate-300',
      )}
    >
      <span
        className={cn(
          'inline-block size-[18px] rounded-full bg-white shadow transition-transform duration-200',
          on ? 'translate-x-[22px]' : 'translate-x-[3px]',
        )}
      />
    </button>
  )
}

export default function PlatformSettings() {
  const queryClient = useQueryClient()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
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

  const profileQuery = useQuery({
    queryKey: ['admin', 'profile'],
    queryFn: fetchAdminProfile,
  })

  const twoFactorQuery = useQuery({
    queryKey: ['admin', 'two-factor'],
    queryFn: fetchAdminTwoFactorStatus,
  })

  useEffect(() => {
    const admin = profileQuery.data?.admin
    if (!admin) return
    setFirstName(admin.first_name ?? '')
    setLastName(admin.last_name ?? '')
    setPhone(admin.phone ?? '')
    setEmail(admin.email ?? '')
  }, [profileQuery.data?.admin])

  useEffect(() => {
    if (twoFactorQuery.data) {
      setTwoFactorEnabled(twoFactorQuery.data.enabled)
    }
  }, [twoFactorQuery.data])

  const saveMutation = useMutation({
    mutationFn: () =>
      updateAdminProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        ...(newPassword
          ? {
              current_password: currentPassword,
              password: newPassword,
              password_confirmation: confirmPassword,
            }
          : {}),
      }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'profile'] })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      await alert.toast.success('Profile updated successfully.')
      const admin = data.admin
      setFirstName(admin.first_name ?? '')
      setLastName(admin.last_name ?? '')
      setPhone(admin.phone ?? '')
      setEmail(admin.email ?? '')
    },
    onError: (error) => {
      void alert.toast.error(getLaravelErrorMessage(error, 'Could not update profile.'))
    },
  })

  async function handleTwoFactorToggle(enabled: boolean) {
    if (twoFactorBusy) return

    if (enabled) {
      setTwoFactorBusy(true)
      try {
        const result = await enableAdminTwoFactor()
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

    const result = await Swal.fire({
      title: 'Disable two-factor authentication?',
      input: 'password',
      inputPlaceholder: 'Password',
      inputAttributes: { autocomplete: 'current-password' },
      showCancelButton: true,
      confirmButtonText: 'Disable 2FA',
      confirmButtonColor: '#dc2626',
    })

    if (!result.isConfirmed || typeof result.value !== 'string' || !result.value.trim()) {
      return
    }

    setTwoFactorBusy(true)
    try {
      await disableAdminTwoFactor(result.value.trim())
      setTwoFactorEnabled(false)
      await alert.toast.success('Two-factor authentication disabled.')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'two-factor'] })
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
    void queryClient.invalidateQueries({ queryKey: ['admin', 'two-factor'] })
    await Swal.fire({
      icon: 'success',
      title: 'Two-factor enabled',
      html: `<p class="text-sm text-slate-600 mb-3">Store these recovery codes in a safe place:</p><pre class="text-left text-xs bg-slate-100 p-3 rounded-lg overflow-x-auto">${recoveryCodes.join('\n')}</pre>`,
    })
  }

  const busy = saveMutation.isPending
  const loading = profileQuery.isLoading

  return (
    <div className="bg-slate-50 p-4">
      <div className="w-full space-y-4">
        <div className="mb-2">
          <h1 className="text-2xl font-semibold leading-tight text-ink-heading sm:text-3xl">Profile &amp; Security</h1>
          <p className="mt-1 text-sm text-chat-meta">Manage your admin account and two-factor authentication.</p>
        </div>

        {profileQuery.isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {getLaravelErrorMessage(profileQuery.error, 'Could not load profile.')}
          </div>
        ) : null}

        <section className="rounded-2xl border border-chat-border-subtle bg-card p-5">
          <div className="mb-4 flex items-center gap-3 border-b border-border-gray pb-4">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-blue-50 text-chat-accent">
              <UserRound className="size-4" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-ink">Profile</h2>
              <p className="text-sm text-chat-meta">Update your name and contact details.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-chat-meta">First name</label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading || busy}
                className="h-10"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-chat-meta">Last name</label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading || busy}
                className="h-10"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-chat-meta">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || busy}
                autoComplete="email"
                className="h-10"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-chat-meta">Phone</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading || busy}
                placeholder="+234 800 000 0000"
                className="h-10"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-chat-border-subtle bg-card p-5">
          <div className="mb-4 flex items-center gap-3 border-b border-border-gray pb-4">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Lock className="size-4" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-ink">Password</h2>
              <p className="text-sm text-chat-meta">Leave blank to keep your current password.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-chat-meta">Current password</label>
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={loading || busy}
                autoComplete="current-password"
                className="h-10 pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-chat-meta"
                onClick={() => setShowCurrentPassword((v) => !v)}
                aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
              >
                {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <div className="relative">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-chat-meta">New password</label>
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading || busy}
                autoComplete="new-password"
                className="h-10 pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-chat-meta"
                onClick={() => setShowNewPassword((v) => !v)}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <div className="relative">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-chat-meta">Confirm password</label>
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading || busy}
                autoComplete="new-password"
                className="h-10 pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-chat-meta"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-chat-border-subtle bg-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Shield className="size-4" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-ink">Two-Factor Authentication</h2>
                <p className="text-sm text-chat-meta">
                  {twoFactorEnabled
                    ? 'Authenticator app is active on this account.'
                    : 'Add an extra layer of security with a TOTP authenticator app.'}
                </p>
              </div>
            </div>
            <Toggle
              on={twoFactorEnabled}
              onToggle={() => void handleTwoFactorToggle(!twoFactorEnabled)}
              disabled={twoFactorBusy || twoFactorQuery.isLoading || loading}
            />
          </div>
        </section>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={loading || busy || !firstName.trim() || !lastName.trim() || !email.trim()}
            className="min-w-36"
          >
            {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            Save changes
          </Button>
        </div>
      </div>

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
        confirmFn={async (code) => {
          const result = await confirmAdminTwoFactor(code)
          return { recovery_codes: result.recovery_codes }
        }}
      />
    </div>
  )
}
