import * as React from 'react'
import { ArrowRight } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getAuthErrorMessage, getAuthFieldErrors } from '@/features/auth/errorMessage'
import { extractUserFromAuthPayload } from '@/api/laravelResponse'
import { getUserRoles } from '@/auth/roles'
import { resolvePostLoginPath, verifyLoginTwoFactor } from '@/features/auth/service'
import { type AuthRole } from '@/features/auth/types'
import { type LoginReturnTarget } from '@/features/auth/loginReturn'
import { navigateAfterLogin } from '@/features/auth/navigateAfterLogin'
import { fulfillPendingFavoriteSave } from '@/features/auth/pendingFavoriteSave'
import {
  applyOtpInputAtIndex,
  applyOtpPasteAtIndex,
  createEmptyOtpDigits,
} from '@/lib/otpDigitsInput'

const CODE_LENGTH = 6

type LocationState = {
  twoFactorToken?: string
  role?: AuthRole
  from?: LoginReturnTarget
}

export default function LoginTwoFactor() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const location = useLocation()
  const state = (location.state ?? {}) as LocationState
  const { setToken, setUser, refreshSession, resetAuthState, authStrategy } = useAuth()

  const [digits, setDigits] = React.useState<string[]>(() => createEmptyOtpDigits(CODE_LENGTH))
  const [recoveryMode, setRecoveryMode] = React.useState(false)
  const [recoveryCode, setRecoveryCode] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({})

  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([])

  React.useEffect(() => {
    if (!state.twoFactorToken) {
      navigate('/login/email', { replace: true })
    }
  }, [navigate, state.twoFactorToken])

  const role: AuthRole = state.role === 'vendor' ? 'vendor' : 'user'
  const code = recoveryMode ? recoveryCode.trim() : digits.join('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!state.twoFactorToken) return

    if (!recoveryMode && code.length !== CODE_LENGTH) {
      setError('Enter the 6-digit code from your authenticator app.')
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
      const loggedInUser = await verifyLoginTwoFactor(
        {
          two_factor_token: state.twoFactorToken,
          code,
          role,
        },
        { authStrategy, setToken, setUser, refreshSession, resetAuthState },
      )

      const roles = getUserRoles(extractUserFromAuthPayload(loggedInUser))
      const isVendor = roles.includes('vendor') || role === 'vendor'

      await fulfillPendingFavoriteSave(queryClient)

      if (isVendor) {
        navigate(await resolvePostLoginPath(loggedInUser, role), { replace: true })
        return
      }

      if (navigateAfterLogin(navigate, state.from)) {
        return
      }

      navigate(await resolvePostLoginPath(loggedInUser, role), { replace: true })
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

  if (!state.twoFactorToken) {
    return null
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-auth-bg p-4">
      <div className="w-full max-w-md rounded-lg bg-card p-8 shadow-lg">
        <div className="mb-8 space-y-2 text-center">
          <h2 className="font-inter text-2xl font-semibold text-foreground">Two-factor authentication</h2>
          <p className="text-sm text-muted-foreground">
            {recoveryMode
              ? 'Enter one of your recovery codes to sign in.'
              : 'Open your authenticator app and enter the 6-digit code.'}
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
              {recoveryMode ? 'Use authenticator code instead' : 'Use a recovery code instead'}
            </button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login/email" className="text-primary hover:underline">
              Back to login
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
