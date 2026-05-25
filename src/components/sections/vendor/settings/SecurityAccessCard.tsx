import { Eye, EyeOff, Shield } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

function Label({ children }: { children: string }) {
  return (
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  )
}

function RedToggle({
  checked,
  onCheckedChange,
  disabled,
  id,
}: {
  checked: boolean
  onCheckedChange: (v: boolean) => void
  disabled?: boolean
  id?: string
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-brand-red' : 'bg-muted',
      )}
    >
      <span
        className={cn(
          'pointer-events-none block size-6 rounded-full bg-white shadow-md ring-0 transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

type Props = {
  twoFactorEnabled: boolean
  twoFactorBusy?: boolean
  disabled?: boolean
  currentPassword: string
  newPassword: string
  confirmPassword: string
  showCurrentPassword: boolean
  showNewPassword: boolean
  showConfirmPassword: boolean
  onCurrentPasswordChange: (v: string) => void
  onNewPasswordChange: (v: string) => void
  onConfirmPasswordChange: (v: string) => void
  onToggleCurrentPassword: () => void
  onToggleNewPassword: () => void
  onToggleConfirmPassword: () => void
  onTwoFactorToggle: (enabled: boolean) => void
}

export function SecurityAccessCard({
  twoFactorEnabled,
  twoFactorBusy,
  disabled,
  currentPassword,
  newPassword,
  confirmPassword,
  showCurrentPassword,
  showNewPassword,
  showConfirmPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onToggleCurrentPassword,
  onToggleNewPassword,
  onToggleConfirmPassword,
  onTwoFactorToggle,
}: Props) {
  return (
    <Card className="overflow-hidden rounded-xl border-border-light bg-sky-50/50 shadow-sm">
      <CardHeader className="border-b border-sky-100/80 px-6 py-5">
        <CardTitle className="text-2xl font-extrabold text-foreground font-manrope">
          Security &amp; Access
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 p-6">
        <div className="grid gap-5 lg:grid-cols-3">
          <PasswordField
            label="Current password"
            value={currentPassword}
            visible={showCurrentPassword}
            disabled={disabled}
            autoComplete="current-password"
            onChange={onCurrentPasswordChange}
            onToggleVisible={onToggleCurrentPassword}
          />
          <PasswordField
            label="New password"
            value={newPassword}
            visible={showNewPassword}
            disabled={disabled}
            autoComplete="new-password"
            onChange={onNewPasswordChange}
            onToggleVisible={onToggleNewPassword}
          />
          <PasswordField
            label="Confirm password"
            value={confirmPassword}
            visible={showConfirmPassword}
            disabled={disabled}
            autoComplete="new-password"
            onChange={onConfirmPasswordChange}
            onToggleVisible={onToggleConfirmPassword}
          />
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-border-light bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
              <Shield className="size-5" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground font-manrope">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground font-inter">
                {twoFactorEnabled
                  ? 'Authenticator app is active on this account.'
                  : 'Add an extra layer of security with a TOTP authenticator app.'}
              </p>
            </div>
          </div>
          <RedToggle
            checked={twoFactorEnabled}
            disabled={disabled || twoFactorBusy}
            onCheckedChange={onTwoFactorToggle}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function PasswordField({
  label,
  value,
  visible,
  disabled,
  autoComplete,
  onChange,
  onToggleVisible,
}: {
  label: string
  value: string
  visible: boolean
  disabled?: boolean
  autoComplete: string
  onChange: (v: string) => void
  onToggleVisible: () => void
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder="••••••••"
          className="h-11 border-border-light bg-card pr-11 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-sky-500/25"
        />
        <button
          type="button"
          onClick={onToggleVisible}
          disabled={disabled}
          className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-50"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  )
}
