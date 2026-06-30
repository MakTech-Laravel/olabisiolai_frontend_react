import { useState } from 'react'
import { Loader2, X } from 'lucide-react'

import { confirmTwoFactor } from '@/api/vendorTwoFactor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getLaravelErrorMessage } from '@/lib/laravelApiError'
import { alert } from '@/lib/sweetAlert'

type Props = {
  open: boolean
  qrCode: string
  secret: string
  onClose: () => void
  onConfirmed: (recoveryCodes: string[]) => void
  confirmFn?: (code: string) => Promise<{ recovery_codes: string[] }>
}

export function TwoFactorSetupModal({ open, qrCode, secret, onClose, onConfirmed, confirmFn }: Props) {
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  async function handleConfirm() {
    const trimmed = code.replace(/\s/g, '')
    if (trimmed.length !== 6) {
      await alert.toast.error('Enter the 6-digit code from your authenticator app.')
      return
    }

    setSubmitting(true)
    try {
      const result = await (confirmFn ?? confirmTwoFactor)(trimmed)
      onConfirmed(result.recovery_codes)
      setCode('')
    } catch (error) {
      await alert.toast.error(getLaravelErrorMessage(error, 'Invalid authentication code.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-card p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="two-factor-setup-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="two-factor-setup-title" className="text-lg font-bold text-foreground font-manrope">
              Set up authenticator
            </h2>
            <p className="mt-1 text-sm text-muted-foreground font-inter">
              Scan the QR code with Google Authenticator, Authy, or another TOTP app, then enter the 6-digit code.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div
            className="rounded-lg border border-border-light bg-white p-3 [&_svg]:mx-auto"
            dangerouslySetInnerHTML={{ __html: qrCode }}
          />
          <div className="min-w-0 flex-1 rounded-lg border border-border-light bg-accent/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Manual key</p>
            <p className="mt-1 break-all font-mono text-sm text-foreground">{secret}</p>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="2fa-code">
            Authentication code
          </label>
          <Input
            id="2fa-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="h-11 tracking-widest"
            placeholder="000000"
            disabled={submitting}
          />
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="bg-brand-red hover:bg-brand-red/90"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Confirm &amp; enable
          </Button>
        </div>
      </div>
    </div>
  )
}
