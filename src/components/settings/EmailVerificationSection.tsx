import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2, Mail, RefreshCw } from 'lucide-react'

import {
  resendUserEmailOtp,
  updateUserEmail,
  verifyUserEmailOtp,
} from '@/api/userEmailVerification'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getLaravelErrorMessage } from '@/lib/laravelApiError'
import { cn } from '@/lib/utils'

type Props = {
  email: string
  emailVerified: boolean
  emailVerificationRequired: boolean
  disabled?: boolean
  settingsQueryKey?: string[]
  onVerified?: () => void
  className?: string
  inputId?: string
}

export function EmailVerificationSection({
  email,
  emailVerified,
  emailVerificationRequired,
  disabled = false,
  settingsQueryKey = ['user-settings'],
  onVerified,
  className,
  inputId = 'settings-email',
}: Props) {
  const queryClient = useQueryClient()
  const [draftEmail, setDraftEmail] = React.useState(email)
  const [otpCode, setOtpCode] = React.useState('')
  const [showOtpStep, setShowOtpStep] = React.useState(emailVerificationRequired)
  const [banner, setBanner] = React.useState<{ type: 'error' | 'success'; text: string } | null>(null)

  React.useEffect(() => {
    setDraftEmail(email)
  }, [email])

  React.useEffect(() => {
    if (emailVerificationRequired) {
      setShowOtpStep(true)
    }
  }, [emailVerificationRequired])

  const updateEmailMutation = useMutation({
    mutationFn: (nextEmail: string) => updateUserEmail(nextEmail),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: settingsQueryKey })
      setShowOtpStep(true)
      setOtpCode('')
      setBanner({
        type: 'success',
        text: 'Verification code sent. Check your inbox and enter the code below.',
      })
    },
    onError: (err) => {
      setBanner({ type: 'error', text: getLaravelErrorMessage(err) })
    },
  })

  const verifyOtpMutation = useMutation({
    mutationFn: (code: string) => verifyUserEmailOtp(code),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: settingsQueryKey })
      setShowOtpStep(false)
      setOtpCode('')
      setBanner({ type: 'success', text: 'Email verified successfully.' })
      onVerified?.()
    },
    onError: (err) => {
      setBanner({ type: 'error', text: getLaravelErrorMessage(err) })
    },
  })

  const resendMutation = useMutation({
    mutationFn: () => resendUserEmailOtp(),
    onSuccess: (message) => {
      setBanner({ type: 'success', text: message })
    },
    onError: (err) => {
      setBanner({ type: 'error', text: getLaravelErrorMessage(err) })
    },
  })

  const busy =
    disabled ||
    updateEmailMutation.isPending ||
    verifyOtpMutation.isPending ||
    resendMutation.isPending

  const canEditEmail = !emailVerified || emailVerificationRequired
  const normalizedDraft = draftEmail.trim().toLowerCase()
  const normalizedCurrent = (email ?? '').trim().toLowerCase()
  const emailChanged = normalizedDraft !== normalizedCurrent

  function handleSaveEmail() {
    setBanner(null)
    if (!normalizedDraft) {
      setBanner({ type: 'error', text: 'Please enter your email address.' })
      return
    }
    updateEmailMutation.mutate(normalizedDraft)
  }

  function handleVerifyOtp() {
    setBanner(null)
    const code = otpCode.replace(/\D/g, '')
    if (code.length !== 6) {
      setBanner({ type: 'error', text: 'Enter the 6-digit verification code.' })
      return
    }
    verifyOtpMutation.mutate(code)
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs text-chat-meta" htmlFor={inputId}>
          Email
        </label>
        {email && emailVerified ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-3.5" aria-hidden />
            Verified
          </span>
        ) : email && emailVerificationRequired ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300">
            <AlertCircle className="size-3.5" aria-hidden />
            Unverified
          </span>
        ) : null}
      </div>

      <div className="relative">
        <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-chat-meta" />
        <Input
          id={inputId}
          type="email"
          value={draftEmail}
          onChange={(e) => {
            setBanner(null)
            setDraftEmail(e.target.value)
          }}
          readOnly={!canEditEmail}
          disabled={busy}
          placeholder="you@example.com"
          className={cn(
            'h-11 rounded-lg border-chat-border-subtle pl-10',
            canEditEmail ? 'bg-chat-input-bg' : 'bg-muted/40 text-chat-meta',
          )}
          autoComplete="email"
        />
      </div>

      {!email && (
        <p className="text-xs text-chat-meta">
          Add an email to receive receipts and account updates. You will need to verify it before making purchases.
        </p>
      )}

      {canEditEmail && (emailChanged || !email) && (
        <Button
          type="button"
          size="sm"
          disabled={busy || !normalizedDraft}
          onClick={handleSaveEmail}
          className="h-9"
        >
          {updateEmailMutation.isPending ? 'Sending code…' : email ? 'Update & send code' : 'Add email & send code'}
        </Button>
      )}

      {showOtpStep && email && emailVerificationRequired && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <p className="text-sm text-amber-950 dark:text-amber-100">
            Enter the 6-digit code sent to <strong>{email}</strong> to verify this email.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={(e) => {
                setBanner(null)
                setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
              }}
              disabled={busy}
              placeholder="000000"
              className="h-11 max-w-[10rem] rounded-lg border-chat-border-subtle bg-white text-center tracking-[0.3em] dark:bg-background"
              aria-label="Email verification code"
            />
            <Button type="button" size="sm" disabled={busy} onClick={handleVerifyOtp} className="h-9">
              {verifyOtpMutation.isPending ? 'Verifying…' : 'Verify email'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => resendMutation.mutate()}
              className="h-9 gap-1.5 text-chat-meta"
            >
              <RefreshCw className={cn('size-3.5', resendMutation.isPending && 'animate-spin')} aria-hidden />
              Resend code
            </Button>
          </div>
        </div>
      )}

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
  )
}
