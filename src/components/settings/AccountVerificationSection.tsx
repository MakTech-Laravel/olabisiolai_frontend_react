import * as React from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react'

import { useAuth } from '@/auth/useAuth'
import type { AuthUser } from '@/auth/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getAuthErrorMessage } from '@/features/auth/errorMessage'
import { resolveAuthRole } from '@/features/auth/roleSelection'
import {
  resendRegistrationOtp,
  verifyRegistrationOtp,
} from '@/features/auth/service'
import {
  accountVerificationDestination,
  resolveRegistrationVerificationChannel,
} from '@/lib/accountVerification'
import { cn } from '@/lib/utils'

type Props = {
  user: AuthUser | null | undefined
  className?: string
  onVerified?: () => void
}

export function AccountVerificationSection({ user, className, onVerified }: Props) {
  const { authStrategy, refreshSession } = useAuth()
  const [otpCode, setOtpCode] = React.useState('')
  const [banner, setBanner] = React.useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const channel = resolveRegistrationVerificationChannel(user)
  const destination = accountVerificationDestination(user, channel)
  const contactLabel =
    channel === 'phone'
      ? user?.phone || 'your phone number'
      : user?.email || 'your email address'

  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      const role = resolveAuthRole(user?.role)
      return verifyRegistrationOtp(
        {
          otp: code,
          verification_channel: channel,
          ...(channel === 'phone' ? { phone: user?.phone ?? undefined } : { email: user?.email ?? undefined }),
        },
        { authStrategy, setToken: () => {}, setUser: () => {}, refreshSession, resetAuthState: () => {} },
        role,
      )
    },
    onSuccess: async () => {
      setOtpCode('')
      setBanner({ type: 'success', text: 'Account verified successfully.' })
      await refreshSession()
      onVerified?.()
    },
    onError: (error) => {
      setBanner({
        type: 'error',
        text: getAuthErrorMessage(error, 'Invalid or expired verification code.'),
      })
    },
  })

  const resendMutation = useMutation({
    mutationFn: async () => {
      await resendRegistrationOtp({ email: user?.email ?? '' })
    },
    onSuccess: () => {
      setBanner({
        type: 'success',
        text:
          channel === 'phone'
            ? 'A new verification code was sent to your phone.'
            : 'A new verification code was sent to your email.',
      })
    },
    onError: (error) => {
      setBanner({
        type: 'error',
        text: getAuthErrorMessage(error, 'Could not resend verification code.'),
      })
    },
  })

  const busy = verifyMutation.isPending || resendMutation.isPending

  function handleVerify() {
    setBanner(null)
    const code = otpCode.replace(/\D/g, '')
    if (code.length !== 6) {
      setBanner({ type: 'error', text: 'Enter the 6-digit verification code.' })
      return
    }
    verifyMutation.mutate(code)
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-amber-200 bg-amber-50/90 p-5 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/30',
        className,
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-amber-950 dark:text-amber-50">
              Verify your account
            </h2>
            <p className="mt-1 text-sm text-amber-900/90 dark:text-amber-100/90">
              Enter the 6-digit code we sent to <strong>{contactLabel}</strong> to activate your
              account and unlock all settings.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={(event) => {
                setBanner(null)
                setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))
              }}
              disabled={busy}
              placeholder="000000"
              className="h-11 max-w-[10rem] rounded-lg border-amber-200 bg-white text-center tracking-[0.3em] dark:border-amber-800 dark:bg-background"
              aria-label="Account verification code"
            />
            <Button type="button" size="sm" disabled={busy} onClick={handleVerify} className="h-9 gap-1.5">
              <ShieldCheck className="size-4" aria-hidden />
              {verifyMutation.isPending ? 'Verifying…' : 'Verify account'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => resendMutation.mutate()}
              className="h-9 gap-1.5 border-amber-300 bg-white/70 dark:border-amber-800 dark:bg-transparent"
            >
              <RefreshCw className={cn('size-4', resendMutation.isPending && 'animate-spin')} aria-hidden />
              {resendMutation.isPending ? 'Sending…' : 'Resend code'}
            </Button>
          </div>

          <p className="text-xs text-amber-900/80 dark:text-amber-100/80">
            Prefer the full verification screen?{' '}
            <Link to={destination} className="font-medium text-chat-accent hover:underline">
              Continue on verification page
            </Link>
          </p>

          {banner ? (
            <p
              className={cn(
                'text-sm',
                banner.type === 'error'
                  ? 'text-red-700 dark:text-red-300'
                  : 'text-emerald-700 dark:text-emerald-300',
              )}
              role={banner.type === 'error' ? 'alert' : 'status'}
            >
              {banner.text}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
