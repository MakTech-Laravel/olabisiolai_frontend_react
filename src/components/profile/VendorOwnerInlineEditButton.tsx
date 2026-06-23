import { useEffect, useState } from 'react'
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

type OwnerEditableField = 'business_name' | 'business_description'

type VendorOwnerInlineEditButtonProps = {
  field: OwnerEditableField
  label: string
  currentValue: string
  className?: string
  onSaved?: (value: string) => void
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
          <Textarea
            value={value}
            rows={5}
            onChange={(event) => setValue(event.target.value)}
            disabled={loading}
            autoFocus
          />
        )}
      </VendorOwnerModalShell>
    </>
  )
}
