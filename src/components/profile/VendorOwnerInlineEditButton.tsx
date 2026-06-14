import { useEffect, useState } from 'react'
import { Pencil, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  fetchVendorBusinessProfile,
  type VendorBusinessProfile,
} from '@/features/business/vendorBusinessProfileApi'
import { updateVendorBusiness } from '@/features/business/vendorBusinessApi'
import { showError, showSuccess } from '@/lib/sweetAlert'
import { cn } from '@/lib/utils'

type OwnerEditableField = 'business_name' | 'business_description'

type VendorOwnerInlineEditButtonProps = {
  field: OwnerEditableField
  label: string
  currentValue: string
  className?: string
  onSaved?: (value: string) => void
}

function buildUpdatePayload(profile: VendorBusinessProfile, field: OwnerEditableField, value: string) {
  return {
    category_id: String(profile.categoryId),
    subcategory: profile.subcategory,
    location_id: String(profile.locationId),
    business_name: field === 'business_name' ? value : profile.businessName,
    location: profile.locationFullName,
    state: profile.state,
    city: profile.city,
    lga: profile.lga,
    business_description: field === 'business_description' ? value : profile.description,
    phone: profile.phone,
    whatsapp: profile.whatsapp,
    website: profile.website,
    full_address: profile.streetAddress,
    services: profile.services,
    social_accounts: profile.socialAccounts,
    keep_cover_paths: profile.coverPhotoPaths,
    business_hours: profile.businessHours,
  }
}

export function VendorOwnerInlineEditButton({
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
    setOpen(true)
    setLoading(true)
    try {
      const loaded = await fetchVendorBusinessProfile()
      setProfile(loaded)
      setValue(field === 'business_name' ? loaded.businessName : loaded.description)
    } catch {
      showError('Could not load your business profile for editing.')
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
      await updateVendorBusiness(buildUpdatePayload(profile, field, trimmed))
      showSuccess(`${label} updated.`)
      onSaved?.(trimmed)
      setOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['business'] })
      await queryClient.invalidateQueries({ queryKey: ['vendor', 'business'] })
    } catch {
      showError(`Could not update ${label.toLowerCase()}. Please try again.`)
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
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
