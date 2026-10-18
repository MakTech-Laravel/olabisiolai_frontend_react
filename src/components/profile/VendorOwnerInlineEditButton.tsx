import { useEffect, useRef, useState } from 'react'
import { Pencil } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { VendorOwnerModalShell } from '@/components/profile/VendorOwnerModalShell'
import {
  fetchVendorBusinessProfile,
  type VendorBusinessProfile,
} from '@/features/business/vendorBusinessProfileApi'
import { updateVendorBusiness, getVendorBusinessUpdateError } from '@/features/business/vendorBusinessApi'
import { buildUpdatePayload } from '@/features/profile/vendorOwnerEdit'
import { showError, showSuccess } from '@/lib/sweetAlert'
import { cn } from '@/lib/utils'
import { BUSINESS_OVERVIEW_MAX_LENGTH, clampBusinessOverview } from '@/constants/businessOverview'

type OwnerEditableField = 'business_name' | 'business_description'

type VendorOwnerInlineEditButtonProps = {
  field: OwnerEditableField
  label: string
  currentValue: string
  className?: string
  onSaved?: (value: string) => void
  /** When set, load/save this business instead of the account active business. */
  businessId?: number
}

export function VendorOwnerInlineEditButton({
  field,
  label,
  currentValue,
  className,
  onSaved,
  businessId,
}: VendorOwnerInlineEditButtonProps) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<VendorBusinessProfile | null>(null)
  const [value, setValue] = useState(currentValue)
  const loadGenerationRef = useRef(0)

  useEffect(() => {
    if (!open) {
      setValue(currentValue)
    }
  }, [currentValue, open])

  useEffect(() => {
    loadGenerationRef.current += 1
    setOpen(false)
    setProfile(null)
    setLoading(false)
  }, [businessId])

  async function handleOpen() {
    const generation = ++loadGenerationRef.current
    const requestedBusinessId = businessId
    setOpen(true)
    setLoading(true)
    try {
      const loaded = await fetchVendorBusinessProfile(requestedBusinessId)
      if (generation !== loadGenerationRef.current) return
      if (
        typeof requestedBusinessId === 'number' &&
        Number.isFinite(requestedBusinessId) &&
        requestedBusinessId > 0 &&
        loaded.id !== requestedBusinessId
      ) {
        throw new Error('Loaded profile does not match this business page.')
      }
      setProfile(loaded)
      setValue(field === 'business_name' ? loaded.businessName : loaded.description)
    } catch {
      if (generation !== loadGenerationRef.current) return
      showError('Could not load your business profile for editing.')
      setOpen(false)
      setProfile(null)
    } finally {
      if (generation === loadGenerationRef.current) {
        setLoading(false)
      }
    }
  }

  async function handleSave() {
    if (!profile) return

    const targetBusinessId = businessId
    if (
      typeof targetBusinessId === 'number' &&
      Number.isFinite(targetBusinessId) &&
      targetBusinessId > 0 &&
      profile.id !== targetBusinessId
    ) {
      showError('This editor is out of sync with the business page. Please close and try again.')
      return
    }

    const trimmed = value.trim()
    if (!trimmed) {
      showError(`${label} cannot be empty.`)
      return
    }
    if (field === 'business_description' && trimmed.length > BUSINESS_OVERVIEW_MAX_LENGTH) {
      showError(`Overview must be ${BUSINESS_OVERVIEW_MAX_LENGTH} characters or fewer.`)
      return
    }

    setLoading(true)
    try {
      const patch =
        field === 'business_name'
          ? { business_name: trimmed }
          : { business_description: trimmed }
      const payload = buildUpdatePayload(profile, patch)
      if (typeof targetBusinessId === 'number' && Number.isFinite(targetBusinessId) && targetBusinessId > 0) {
        payload.business_id = targetBusinessId
      }
      await updateVendorBusiness(payload)
      showSuccess(`${label} updated.`)
      onSaved?.(trimmed)
      setOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['business'] })
      await queryClient.invalidateQueries({ queryKey: ['vendor', 'business'] })
      await queryClient.invalidateQueries({ queryKey: ['user', 'businesses'] })
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

      <VendorOwnerModalShell
        title={`Edit ${label.toLowerCase()}`}
        open={open}
        loading={loading}
        onClose={() => setOpen(false)}
        onSave={() => void handleSave()}
        saveDisabled={!profile || loading}
      >
        {field === 'business_name' ? (
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={loading}
            autoFocus
          />
        ) : (
          <div>
            <Textarea
              value={value}
              rows={4}
              onChange={(event) => setValue(clampBusinessOverview(event.target.value))}
              disabled={loading}
              maxLength={BUSINESS_OVERVIEW_MAX_LENGTH}
              autoFocus
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">
              {value.length}/{BUSINESS_OVERVIEW_MAX_LENGTH}
            </p>
          </div>
        )}
      </VendorOwnerModalShell>
    </>
  )
}
