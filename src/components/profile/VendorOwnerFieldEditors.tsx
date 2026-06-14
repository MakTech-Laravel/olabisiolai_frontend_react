import { useEffect, useRef, useState } from 'react'
import { Pencil, Plus, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

import { BusinessHoursEditor } from '@/components/business/BusinessHoursEditor'
import { VendorOwnerModalShell } from '@/components/profile/VendorOwnerModalShell'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { BusinessHourEntry } from '@/features/business/businessHours'
import { updateVendorBusiness, getVendorBusinessUpdateError } from '@/features/business/vendorBusinessApi'
import {
  fetchVendorBusinessProfile,
  type VendorBusinessProfile,
} from '@/features/business/vendorBusinessProfileApi'
import { buildUpdatePayload } from '@/features/profile/vendorOwnerEdit'
import { useVendorSubscriptionAccess } from '@/hooks/useVendorSubscriptionAccess'
import { showError, showSuccess } from '@/lib/sweetAlert'
import { cn } from '@/lib/utils'

type OwnerEditButtonProps = {
  label?: string
  className?: string
  onProfileUpdated?: () => void
}

function OwnerEditTrigger({
  label,
  className,
  onClick,
}: {
  label: string
  className?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-full border border-border-light bg-card text-brand shadow-sm transition hover:bg-surface-soft',
        className,
      )}
      aria-label={`Edit ${label.toLowerCase()}`}
    >
      <Pencil className="size-4" aria-hidden />
    </button>
  )
}

function useOwnerProfileEditor(onProfileUpdated?: () => void) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<VendorBusinessProfile | null>(null)

  async function openEditor() {
    setOpen(true)
    setLoading(true)
    try {
      const loaded = await fetchVendorBusinessProfile()
      setProfile(loaded)
    } catch {
      showError('Could not load your business profile for editing.')
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  async function saveProfile(patch: Parameters<typeof buildUpdatePayload>[1], successMessage: string) {
    if (!profile) return

    setLoading(true)
    try {
      await updateVendorBusiness(buildUpdatePayload(profile, patch))
      showSuccess(successMessage)
      setOpen(false)
      onProfileUpdated?.()
      await queryClient.invalidateQueries({ queryKey: ['business'] })
      await queryClient.invalidateQueries({ queryKey: ['vendor', 'business'] })
    } catch (error) {
      showError(getVendorBusinessUpdateError(error, 'Could not save changes. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return { open, setOpen, loading, profile, openEditor, saveProfile }
}

export function VendorOwnerContactEditButton({
  label = 'Contact details',
  className,
  onProfileUpdated,
}: OwnerEditButtonProps) {
  const { open, setOpen, loading, profile, openEditor, saveProfile } = useOwnerProfileEditor(onProfileUpdated)
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [website, setWebsite] = useState('')

  useEffect(() => {
    if (profile && open) {
      setPhone(profile.phone)
      setWhatsapp(profile.whatsapp)
      setWebsite(profile.website)
    }
  }, [open, profile])

  return (
    <>
      <OwnerEditTrigger label={label} className={className} onClick={() => void openEditor()} />
      <VendorOwnerModalShell
        title="Edit contact details"
        open={open}
        loading={loading}
        onClose={() => setOpen(false)}
        onSave={() =>
          void saveProfile(
            { phone: phone.trim(), whatsapp: whatsapp.trim(), website: website.trim() },
            'Contact details updated.',
          )
        }
        saveDisabled={!phone.trim()}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Phone</label>
            <Input value={phone} onChange={(event) => setPhone(event.target.value)} disabled={loading} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">WhatsApp</label>
            <Input value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} disabled={loading} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Website</label>
            <Input value={website} onChange={(event) => setWebsite(event.target.value)} disabled={loading} />
          </div>
        </div>
      </VendorOwnerModalShell>
    </>
  )
}

export function VendorOwnerServicesEditButton({
  label = 'Services',
  className,
  onProfileUpdated,
}: OwnerEditButtonProps) {
  const { open, setOpen, loading, profile, openEditor, saveProfile } = useOwnerProfileEditor(onProfileUpdated)
  const [servicesText, setServicesText] = useState('')

  useEffect(() => {
    if (profile && open) {
      setServicesText(profile.services.join('\n'))
    }
  }, [open, profile])

  return (
    <>
      <OwnerEditTrigger label={label} className={className} onClick={() => void openEditor()} />
      <VendorOwnerModalShell
        title="Edit services"
        open={open}
        loading={loading}
        onClose={() => setOpen(false)}
        onSave={() => {
          const services = servicesText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
          void saveProfile({ services }, 'Services updated.')
        }}
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Services offered</label>
          <Textarea
            value={servicesText}
            rows={6}
            placeholder="One service per line"
            onChange={(event) => setServicesText(event.target.value)}
            disabled={loading}
          />
          <p className="mt-2 text-xs text-muted-foreground">Enter one service per line.</p>
        </div>
      </VendorOwnerModalShell>
    </>
  )
}

export function VendorOwnerHoursEditButton({
  label = 'Business hours',
  className,
  onProfileUpdated,
}: OwnerEditButtonProps) {
  const { open, setOpen, loading, profile, openEditor, saveProfile } = useOwnerProfileEditor(onProfileUpdated)
  const [hours, setHours] = useState<BusinessHourEntry[]>([])

  useEffect(() => {
    if (profile && open) {
      setHours(profile.businessHours)
    }
  }, [open, profile])

  return (
    <>
      <OwnerEditTrigger label={label} className={className} onClick={() => void openEditor()} />
      <VendorOwnerModalShell
        title="Edit business hours"
        open={open}
        loading={loading}
        onClose={() => setOpen(false)}
        onSave={() => void saveProfile({ business_hours: hours }, 'Business hours updated.')}
      >
        <BusinessHoursEditor hours={hours} disabled={loading} onChange={setHours} />
      </VendorOwnerModalShell>
    </>
  )
}

function GalleryThumb({
  src,
  alt,
  onRemove,
}: {
  src: string
  alt: string
  onRemove?: () => void
}) {
  return (
    <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-border-light bg-muted shadow-sm">
      <img src={src} alt={alt} className="size-full object-cover" loading="lazy" />
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
          aria-label="Remove photo"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
}

export function VendorOwnerGalleryEditButton({
  label = 'Photos',
  className,
  onProfileUpdated,
}: OwnerEditButtonProps) {
  const { photoLimit } = useVendorSubscriptionAccess()
  const { open, setOpen, loading, profile, openEditor, saveProfile } = useOwnerProfileEditor(onProfileUpdated)
  const inputRef = useRef<HTMLInputElement>(null)
  const [keepPaths, setKeepPaths] = useState<string[]>([])
  const [existingUrls, setExistingUrls] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])

  useEffect(() => {
    if (profile && open) {
      setKeepPaths(profile.coverPhotoPaths)
      setExistingUrls(profile.coverPhotoUrls)
      setNewFiles([])
      setNewPreviews([])
    }
  }, [open, profile])

  useEffect(() => {
    return () => {
      newPreviews.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [newPreviews])

  const totalCount = keepPaths.length + newFiles.length
  const canAddMore = totalCount < photoLimit

  function handlePick(files: FileList | null) {
    if (!files?.length || !canAddMore) return

    const remaining = photoLimit - totalCount
    const picked = Array.from(files).slice(0, remaining)
    const previews = picked.map((file) => URL.createObjectURL(file))
    setNewFiles((current) => [...current, ...picked])
    setNewPreviews((current) => [...current, ...previews])
  }

  function removeExisting(index: number) {
    setKeepPaths((current) => current.filter((_, i) => i !== index))
    setExistingUrls((current) => current.filter((_, i) => i !== index))
  }

  function removeNew(index: number) {
    setNewFiles((current) => current.filter((_, i) => i !== index))
    setNewPreviews((current) => {
      const next = [...current]
      const [removed] = next.splice(index, 1)
      if (removed) URL.revokeObjectURL(removed)
      return next
    })
  }

  return (
    <>
      <OwnerEditTrigger label={label} className={className} onClick={() => void openEditor()} />
      <VendorOwnerModalShell
        title="Edit gallery photos"
        open={open}
        loading={loading}
        onClose={() => setOpen(false)}
        onSave={() => {
          if (totalCount < 1) {
            showError('Please keep or upload at least one gallery photo.')
            return
          }
          void saveProfile(
            { keep_cover_paths: keepPaths, cover_photos: newFiles },
            'Gallery photos updated.',
          )
        }}
        saveDisabled={totalCount < 1}
      >
        <p className="mb-3 text-xs font-medium text-muted-foreground">
          {totalCount}/{photoLimit} photos on your plan
        </p>
        <div className="flex flex-wrap gap-3">
          {existingUrls.map((src, index) => (
            <GalleryThumb
              key={`existing-${src}-${index}`}
              src={src}
              alt={`Cover ${index + 1}`}
              onRemove={() => removeExisting(index)}
            />
          ))}
          {newPreviews.map((src, index) => (
            <GalleryThumb
              key={`new-${src}-${index}`}
              src={src}
              alt={`New cover ${index + 1}`}
              onRemove={() => removeNew(index)}
            />
          ))}
          {canAddMore ? (
            <>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                tabIndex={-1}
                aria-hidden
                disabled={loading}
                onChange={(event) => {
                  handlePick(event.target.files)
                  event.target.value = ''
                }}
              />
              <button
                type="button"
                disabled={loading}
                onClick={() => inputRef.current?.click()}
                className="inline-flex size-20 shrink-0 items-center justify-center rounded-lg border-[3px] border-dashed border-neutral-300 bg-neutral-50/50 text-muted-foreground transition-colors hover:border-sky-400/60 hover:bg-neutral-100/80"
                aria-label="Add gallery image"
              >
                <Plus className="size-5 stroke-[2.25]" aria-hidden />
              </button>
            </>
          ) : null}
        </div>
      </VendorOwnerModalShell>
    </>
  )
}

export function VendorOwnerLogoEditButton({
  label = 'Business logo',
  className,
  onProfileUpdated,
}: OwnerEditButtonProps) {
  const { open, setOpen, loading, profile, openEditor, saveProfile } = useOwnerProfileEditor(onProfileUpdated)
  const inputRef = useRef<HTMLInputElement>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    if (profile && open) {
      setLogoFile(null)
      setPreviewUrl(profile.logoUrl)
    }
  }, [open, profile])

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  function handlePick(files: FileList | null) {
    const file = files?.[0]
    if (!file) return

    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }

    setLogoFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  return (
    <>
      <OwnerEditTrigger label={label} className={className} onClick={() => void openEditor()} />
      <VendorOwnerModalShell
        title="Edit business logo"
        open={open}
        loading={loading}
        onClose={() => setOpen(false)}
        onSave={() => {
          if (!logoFile) {
            showError('Please choose a logo image to upload.')
            return
          }
          void saveProfile({ logo: logoFile }, 'Business logo updated.')
        }}
        saveDisabled={!logoFile}
      >
        <p className="mb-3 text-xs text-muted-foreground">
          Square images work best. JPG, PNG, or WebP up to 10 MB.
        </p>
        <div className="flex flex-col items-center gap-4">
          <div className="relative size-28 overflow-hidden rounded-xl border border-border-light bg-muted shadow-sm">
            {previewUrl ? (
              <img src={previewUrl} alt="Logo preview" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                No logo yet
              </div>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            tabIndex={-1}
            aria-hidden
            disabled={loading}
            onChange={(event) => {
              handlePick(event.target.files)
              event.target.value = ''
            }}
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-neutral-300 px-4 py-2 text-sm font-medium text-brand hover:border-sky-400/60 hover:bg-neutral-50"
          >
            <Plus className="size-4" aria-hidden />
            {previewUrl && !previewUrl.startsWith('blob:') ? 'Replace logo' : 'Upload logo'}
          </button>
        </div>
      </VendorOwnerModalShell>
    </>
  )
}
