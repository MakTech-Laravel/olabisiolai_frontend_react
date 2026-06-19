import { useEffect, useState } from 'react'
import { Pencil, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  fetchVendorBusinessProfileForId,
  type VendorBusinessProfile,
} from '@/features/business/vendorBusinessProfileApi'
import { getLaravelErrorMessage } from '@/lib/laravelApiError'
import { updateVendorBusiness, getVendorBusinessUpdateError } from '@/features/business/vendorBusinessApi'
import { buildUpdatePayload } from '@/features/profile/vendorOwnerEdit'
import { showError, showSuccess } from '@/lib/sweetAlert'
import { cn } from '@/lib/utils'

type OwnerEditableField = 'business_name' | 'business_description'

type VendorOwnerInlineEditButtonProps = {
  businessId?: number
  field: OwnerEditableField
  label: string
  currentValue: string
  className?: string
  onSaved?: (value: string) => void
}

export function VendorOwnerInlineEditButton({
  businessId,
  field,
  label,
  currentValue,
  className,
  onSaved,
}: VendorOwnerInlineEditButtonProps) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<VendorBusinessProfile | null>(null)
  const [value, setValue] = useState(currentValue)

  useEffect(() => {
    if (!open) {
      setValue(currentValue)
    }
  }, [currentValue, open])

  async function handleOpen() {
    if (!businessId || businessId <= 0) {
      showError('Could not determine which business profile to edit.')
      return
    }

    setOpen(true)
    setLoading(true)
    try {
      const loaded = await fetchVendorBusinessProfileForId(businessId)
      setProfile(loaded)
      setValue(field === 'business_name' ? loaded.businessName : loaded.description)
    } catch (error) {
      showError(getLaravelErrorMessage(error, 'Could not load your business profile for editing.'))
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!profile) return

    const trimmed = value.trim()
    if (!trimmed) {
      showError(`${label} cannot be empty.`)
      return
    }

    setLoading(true)
    try {
      const patch =
        field === 'business_name'
          ? { business_name: trimmed }
          : { business_description: trimmed }
      await updateVendorBusiness(buildUpdatePayload(profile, patch))
      showSuccess(`${label} updated.`)
      onSaved?.(trimmed)
      setOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['business'] })
      await queryClient.invalidateQueries({ queryKey: ['vendor', 'business'] })
    } catch (error) {
      showError(getVendorBusinessUpdateError(error, `Could not update ${label.toLowerCase()}. Please try again.`))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void handleOpen()}
        className={cn(
          'inline-flex size-8 items-center justify-center rounded-full border border-border-light bg-card text-brand shadow-sm transition hover:bg-surface-soft',
          className,
        )}
        aria-label={`Edit ${label.toLowerCase()}`}
      >
        <Pencil className="size-4" aria-hidden />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="owner-inline-edit-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-card p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="owner-inline-edit-title" className="text-lg font-semibold text-ink">
                Edit {label.toLowerCase()}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex size-9 items-center justify-center rounded-full hover:bg-surface-soft"
                aria-label="Close"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            {field === 'business_name' ? (
              <Input
                value={value}
                onChange={(event) => setValue(event.target.value)}
                disabled={loading}
                autoFocus
              />
            ) : (
              <Textarea
                value={value}
                rows={5}
                onChange={(event) => setValue(event.target.value)}
                disabled={loading}
                autoFocus
              />
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void handleSave()} disabled={loading || !profile}>
                {loading ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
