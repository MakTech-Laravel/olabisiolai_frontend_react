import * as React from 'react'
import { ArrowRight } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getAuthErrorMessage, getAuthFieldErrors } from '@/features/auth/errorMessage'
import { type LoginReturnTarget } from '@/features/auth/loginReturn'
import { navigateAfterLogin } from '@/features/auth/navigateAfterLogin'
import {
  resendTwoFactorLoginOtp,
  resolvePostLoginPath,
  verifyAdminLoginTwoFactor,
  verifyLoginTwoFactor,
} from '@/features/auth/service'
import {
  getTwoFactorLoginSession,
  saveTwoFactorLoginSession,
} from '@/features/auth/twoFactorLoginStorage'
import { type AuthRole } from '@/features/auth/types'
import {
  applyOtpInputAtIndex,
  applyOtpPasteAtIndex,
  createEmptyOtpDigits,
} from '@/lib/otpDigitsInput'

const CODE_LENGTH = 6

type LocationState = {
  twoFactorToken?: string
  role?: AuthRole | 'admin'
  verificationChannel?: 'email' | 'phone'
  maskedEmail?: string
  maskedPhone?: string
  from?: LoginReturnTarget
}

export default function LoginTwoFactor() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? {}) as LocationState
  const { setToken, setUser, refreshSession, resetAuthState, authStrategy } = useAuth()

  const storedSession = React.useMemo(() => getTwoFactorLoginSession(), [])

  const isAdmin =
    state.role === 'admin' || storedSession?.role === 'admin' || location.pathname.startsWith('/admin/login/two-factor')

  const twoFactorToken = state.twoFactorToken ?? storedSession?.token
  const role: AuthRole | 'admin' = isAdmin ? 'admin' : state.role === 'vendor' ? 'vendor' : storedSession?.role ?? 'user'
  const marketplaceRole: AuthRole = role === 'vendor' ? 'vendor' : 'user'

  const [verificationChannel, setVerificationChannel] = React.useState<'email' | 'phone'>(
    state.verificationChannel ?? storedSession?.verificationChannel ?? 'email',
  )
  const [maskedEmail, setMaskedEmail] = React.useState(state.maskedEmail ?? storedSession?.maskedEmail)
  const [maskedPhone, setMaskedPhone] = React.useState(state.maskedPhone ?? storedSession?.maskedPhone)

  const [digits, setDigits] = React.useState<string[]>(() => createEmptyOtpDigits(CODE_LENGTH))
  const [recoveryMode, setRecoveryMode] = React.useState(false)
  const [recoveryCode, setRecoveryCode] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [resending, setResending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({})

  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([])

  React.useEffect(() => {
    if (!twoFactorToken) {
      navigate(isAdmin ? '/admin/login' : '/login/email', { replace: true })
      return
    }

    saveTwoFactorLoginSession({
      token: twoFactorToken,
      role,
      verificationChannel,
      maskedEmail,
      maskedPhone,
    })
  }, [isAdmin, maskedEmail, maskedPhone, navigate, role, twoFactorToken, verificationChannel])

  const code = recoveryMode ? recoveryCode.trim() : digits.join('')

  const deliveryHint =
    verificationChannel === 'phone'
      ? maskedPhone
        ? `We sent a 6-digit code to ${maskedPhone}.`
        : 'We sent a 6-digit code to your phone.'
      : maskedEmail
        ? `We sent a 6-digit code to ${maskedEmail}.`
        : 'We sent a 6-digit code to your email.'

  async function onResend() {
    if (!twoFactorToken || resending) return

    setResending(true)
    setError(null)
    try {
      const delivery = await resendTwoFactorLoginOtp(twoFactorToken, isAdmin)
      setVerificationChannel(delivery.verificationChannel)
      if (delivery.maskedEmail) setMaskedEmail(delivery.maskedEmail)
      if (delivery.maskedPhone) setMaskedPhone(delivery.maskedPhone)
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Could not resend the verification code.'))
    } finally {
      setResending(false)
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!twoFactorToken) return

    if (!recoveryMode && code.length !== CODE_LENGTH) {
      setError('Enter the 6-digit verification code.')
      return
    }

    if (recoveryMode && code.length < 8) {
      setError('Enter a valid recovery code.')
      return
    }

    setLoading(true)
    setError(null)
    setFieldErrors({})

    try {
      const handlers = { authStrategy, setToken, setUser, refreshSession, resetAuthState }

      const loginResult = isAdmin
        ? await verifyAdminLoginTwoFactor(
            {
              two_factor_token: twoFactorToken,
              code,
            },
            handlers,
          )
        : await verifyLoginTwoFactor(
            {
              two_factor_token: twoFactorToken,
              code,
              role: marketplaceRole,
            },
            handlers,
          )

      if (loginResult.kind !== 'authenticated') {
        throw new Error('Unable to restore your session after two-factor verification.')
      }

      if (isAdmin) {
        navigate('/admin/dashboard', { replace: true })
        return
      }

      const loggedInUser = loginResult.user

      if (navigateAfterLogin(navigate, state.from)) {
        return
      }

      navigate(await resolvePostLoginPath(loggedInUser, marketplaceRole), { replace: true })
    } catch (err) {
      const errors = getAuthFieldErrors(err)
      setFieldErrors(errors)
      setError(getAuthErrorMessage(err, 'Invalid authentication code. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  function handleDigitChange(index: number, value: string) {
    setDigits((prev) => {
      const { next, focusIndex } = applyOtpInputAtIndex(prev, index, value, CODE_LENGTH)
      inputRefs.current[focusIndex]?.focus()
      return next
    })
  }

  function handleDigitPaste(index: number, event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData('text')
    if (!pasted.replace(/\D/g, '')) return

    event.preventDefault()
    setDigits((prev) => {
      const { next, focusIndex } = applyOtpPasteAtIndex(prev, index, pasted, CODE_LENGTH)
      inputRefs.current[focusIndex]?.focus()
      return next
    })
  }

  function handleDigitKeyDown(index: number, key: string) {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  if (!twoFactorToken) {
    return null
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-auth-bg p-4">
      <div className="w-full max-w-md rounded-lg bg-card p-8 shadow-lg">
        <div className="mb-8 space-y-2 text-center">
          <h2 className="font-inter text-2xl font-semibold text-foreground">
            {isAdmin ? 'Admin two-factor authentication' : 'Two-factor authentication'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {recoveryMode
              ? 'Enter one of your recovery codes to sign in.'
              : `${deliveryHint} You can also use a code from your authenticator app.`}
          </p>
        </div>

        <form className="space-y-6" onSubmit={onSubmit}>
          {recoveryMode ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Recovery code</label>
              <Input
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                placeholder="XXXX-XXXX"
                className="h-11 uppercase"
                autoComplete="one-time-code"
              />
              {fieldErrors.code ? (
                <p className="mt-1 text-sm text-destructive">{fieldErrors.code}</p>
              ) : null}
            </div>
          ) : (
            <div className="flex justify-center gap-2">
              {digits.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el
                  }}
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onPaste={(e) => handleDigitPaste(index, e)}
                  onKeyDown={(e) => handleDigitKeyDown(index, e.key)}
                  className="h-12 w-11 text-center text-lg"
                  aria-label={`Digit ${index + 1}`}
                />
              ))}
            </div>
          )}

          {fieldErrors.code && !recoveryMode ? (
            <p className="text-center text-sm text-destructive">{fieldErrors.code}</p>
          ) : null}

          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full justify-center rounded-lg bg-brand text-base font-medium text-ice shadow-none hover:bg-brand/90"
          >
            <span className="inline-flex items-center gap-2">
              {loading ? 'Verifying...' : 'Verify and sign in'}
              <ArrowRight className="size-4" />
            </span>
          </Button>

          {!recoveryMode ? (
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-primary hover:underline disabled:opacity-50"
                disabled={resending}
                onClick={() => void onResend()}
              >
                {resending ? 'Sending code...' : 'Resend verification code'}
              </button>
            </div>
          ) : null}

          <div className="text-center">
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() => {
                setRecoveryMode((v) => !v)
                setError(null)
                setFieldErrors({})
              }}
            >
              {recoveryMode ? 'Use verification or authenticator code instead' : 'Use a recovery code instead'}
            </button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            <Link to={isAdmin ? '/admin/login' : '/login/email'} className="text-primary hover:underline">
              Back to login
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
