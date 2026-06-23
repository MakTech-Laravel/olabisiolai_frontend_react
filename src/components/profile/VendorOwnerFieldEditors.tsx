import { useEffect, useMemo, useRef, useState } from 'react'
import { Pencil, Plus, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

import { BusinessHoursEditor } from '@/components/business/BusinessHoursEditor'
import { LocationCascadeSelects } from '@/components/locations/LocationCascadeSelects'
import { GoogleAddressAutocomplete } from '@/components/maps/GoogleAddressAutocomplete'
import { env } from '@/config/env'
import { matchVendorLocationFromGoogle } from '@/features/locations/matchVendorLocationFromGoogle'
import type { LgaMapPickResult } from '@/features/maps/lgaMapPickTypes'
import { VendorOwnerModalShell } from '@/components/profile/VendorOwnerModalShell'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { BusinessHourEntry } from '@/features/business/businessHours'
import { useVendorBusinessFormOptions } from '@/features/categories/useVendorBusinessFormOptions'
import { updateVendorBusiness, getVendorBusinessUpdateError } from '@/features/business/vendorBusinessApi'
import {
  fetchVendorBusinessProfile,
  type VendorBusinessProfile,
} from '@/features/business/vendorBusinessProfileApi'
import {
  locationEntriesForStateCity,
  parseVendorLocationOptions,
  uniqueLocationCities,
  uniqueLocationStates,
} from '@/features/locations/vendorLocationOptions'
import { buildUpdatePayload } from '@/features/profile/vendorOwnerEdit'
import {
  BUSINESS_OVERVIEW_MAX_LENGTH,
  businessOverviewLengthError,
  clampBusinessOverview,
} from '@/constants/businessOverview'
import {
  normalizeSocialInput,
  socialPlatformLabel,
  type SocialAccount,
  type SocialPlatform,
} from '@/features/business/socialAccounts'
import { useVendorSubscriptionAccess } from '@/hooks/useVendorSubscriptionAccess'
import { businessPageOwnerPhotoGrid } from '@/lib/businessPageLayout'
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

  async function saveProfile(patch: Parameters<typeof buildUpdatePayload>[1], successMessage: string): Promise<boolean> {
    if (!profile) return false

    setLoading(true)
    try {
      await updateVendorBusiness(buildUpdatePayload(profile, patch))
      showSuccess(successMessage)
      setOpen(false)
      onProfileUpdated?.()
      await queryClient.invalidateQueries({ queryKey: ['business'] })
      await queryClient.invalidateQueries({ queryKey: ['vendor', 'business'] })
      return true
    } catch (error) {
      showError(getVendorBusinessUpdateError(error, 'Could not save changes. Please try again.'))
      return false
    } finally {
      setLoading(false)
    }
  }

  return { open, setOpen, loading, profile, openEditor, saveProfile }
}

export function VendorOwnerLocationEditButton({
  label = 'Location',
  className,
  onProfileUpdated,
}: OwnerEditButtonProps) {
  const { data: formOptions, isPending: formOptionsLoading } = useVendorBusinessFormOptions()
  const parsedLocations = useMemo(
    () => parseVendorLocationOptions(formOptions?.locations),
    [formOptions?.locations],
  )
  const { open, setOpen, loading, profile, openEditor, saveProfile } = useOwnerProfileEditor(onProfileUpdated)
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const [locationId, setLocationId] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [googlePlaceId, setGooglePlaceId] = useState<string | null>(null)

  useEffect(() => {
    if (!profile || !open) return
    const selected = parsedLocations.find((entry) => entry.id === String(profile.locationId)) ?? null
    setState(selected?.state || profile.state || '')
    setCity(selected?.city || profile.city || '')
    setLocationId(selected?.id || String(profile.locationId || ''))
    setStreetAddress(profile.streetAddress || '')
    setLatitude(profile.latitude ?? null)
    setLongitude(profile.longitude ?? null)
    setGooglePlaceId(profile.googlePlaceId ?? null)
  }, [open, parsedLocations, profile])

  function applyGooglePick(pick: LgaMapPickResult) {
    const formatted = pick.formattedAddress?.trim() || ''
    if (formatted) {
      setStreetAddress(formatted)
    }
    setLatitude(pick.lat)
    setLongitude(pick.lng)
    setGooglePlaceId(pick.googlePlaceId)

    const matched = matchVendorLocationFromGoogle(pick, parsedLocations)
    if (matched) {
      setState(matched.state)
      setCity(matched.city)
      setLocationId(matched.id)
    }
  }

  const states = useMemo(() => uniqueLocationStates(parsedLocations), [parsedLocations])
  const cities = useMemo(
    () => uniqueLocationCities(parsedLocations, state),
    [parsedLocations, state],
  )
  const lgaOptions = useMemo(
    () => locationEntriesForStateCity(parsedLocations, state, city),
    [parsedLocations, state, city],
  )
  const selectedEntry = parsedLocations.find((entry) => entry.id === locationId) ?? null

  return (
    <>
      <OwnerEditTrigger label={label} className={className} onClick={() => void openEditor()} />
      <VendorOwnerModalShell
        title="Edit location"
        open={open}
        loading={loading || formOptionsLoading}
        onClose={() => setOpen(false)}
        onSave={() => {
          if (!locationId) {
            showError('Please select your state, city, and LGA.')
            return
          }
          void saveProfile(
            {
              location_id: Number(locationId),
              location: selectedEntry?.label ?? profile?.locationFullName ?? '',
              state: selectedEntry?.state ?? state,
              city: selectedEntry?.city ?? city,
              lga: selectedEntry?.lga ?? profile?.lga ?? '',
              street_address: streetAddress.trim(),
              latitude: latitude ?? undefined,
              longitude: longitude ?? undefined,
              google_place_id: googlePlaceId ?? undefined,
            },
            'Location updated.',
          )
        }}
        saveDisabled={!locationId}
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Street address</label>
          <GoogleAddressAutocomplete
            apiKey={env.googleMapsApiKey}
            value={streetAddress}
            onValueChange={setStreetAddress}
            onPick={applyGooglePick}
            disabled={loading || formOptionsLoading}
            placeholder="e.g. 7 Adeola Odeku Street, Victoria Island"
          />
          <p className="mt-2 text-[12px] text-body-secondary">
            Type to search — Google suggestions appear as you type. State, city, and LGA below are filled
            automatically when possible.
          </p>
        </div>
        <LocationCascadeSelects
          state={state}
          city={city}
          locationId={locationId}
          states={states}
          cities={cities}
          lgaOptions={lgaOptions.map((entry) => ({ id: entry.id, lga: entry.lga }))}
          onStateChange={(nextState) => {
            setState(nextState)
            setCity('')
            setLocationId('')
          }}
          onCityChange={(nextCity) => {
            setCity(nextCity)
            setLocationId('')
          }}
          onLocationChange={setLocationId}
          disabled={loading || formOptionsLoading}
          stateLoading={formOptionsLoading}
        />
      </VendorOwnerModalShell>
    </>
  )
}

export function VendorOwnerCategoryEditButton({
  label = 'Category',
  className,
  onProfileUpdated,
}: OwnerEditButtonProps) {
  const { data: formOptions, isPending: formOptionsLoading } = useVendorBusinessFormOptions()
  const categories = formOptions?.categories ?? []
  const { open, setOpen, loading, profile, openEditor, saveProfile } = useOwnerProfileEditor(onProfileUpdated)
  const [categoryId, setCategoryId] = useState('')
  const [subcategory, setSubcategory] = useState('')

  const selectedCategory = categories.find((category) => String(category.id) === categoryId) ?? null
  const subcategoryOptions = selectedCategory?.subcategories ?? []

  useEffect(() => {
    if (!profile || !open) return
    setCategoryId(String(profile.categoryId || ''))
    setSubcategory(profile.subcategory?.trim() || '')
  }, [open, profile])

  useEffect(() => {
    if (!open || subcategoryOptions.length === 0) return
    if (subcategory && subcategoryOptions.includes(subcategory)) return
    setSubcategory(subcategoryOptions[0] ?? '')
  }, [categoryId, open, subcategory, subcategoryOptions])

  return (
    <>
      <OwnerEditTrigger label={label} className={className} onClick={() => void openEditor()} />
      <VendorOwnerModalShell
        title="Edit category"
        open={open}
        loading={loading || formOptionsLoading}
        onClose={() => setOpen(false)}
        onSave={() => {
          if (!categoryId) {
            showError('Please select a category.')
            return
          }
          if (subcategoryOptions.length > 0 && !subcategory.trim()) {
            showError('Please select a subcategory.')
            return
          }
          void saveProfile(
            {
              category_id: Number(categoryId),
              subcategory: subcategory.trim() || undefined,
            },
            'Category updated.',
          )
        }}
        saveDisabled={!categoryId}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Category</label>
            <select
              value={categoryId}
              disabled={loading || formOptionsLoading}
              onChange={(event) => {
                setCategoryId(event.target.value)
                setSubcategory('')
              }}
              className="h-11 w-full rounded-md border border-border-light bg-background px-3 text-sm"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          {subcategoryOptions.length > 0 ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Subcategory</label>
              <select
                value={subcategory}
                disabled={loading || formOptionsLoading}
                onChange={(event) => setSubcategory(event.target.value)}
                className="h-11 w-full rounded-md border border-border-light bg-background px-3 text-sm"
              >
                <option value="">Select subcategory</option>
                {subcategoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      </VendorOwnerModalShell>
    </>
  )
}

type VendorOwnerDetailsEditButtonProps = OwnerEditButtonProps & {
  onNameSaved?: (value: string) => void
  onDescriptionSaved?: (value: string) => void
}

export function VendorOwnerDetailsEditButton({
  label = 'details',
  className,
  onProfileUpdated,
  onNameSaved,
  onDescriptionSaved,
}: VendorOwnerDetailsEditButtonProps) {
  const { data: formOptions, isPending: formOptionsLoading } = useVendorBusinessFormOptions()
  const categories = formOptions?.categories ?? []
  const { open, setOpen, loading, profile, openEditor, saveProfile } = useOwnerProfileEditor(onProfileUpdated)
  const [businessName, setBusinessName] = useState('')
  const [businessDescription, setBusinessDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategory, setSubcategory] = useState('')

  const selectedCategory = categories.find((category) => String(category.id) === categoryId) ?? null
  const subcategoryOptions = selectedCategory?.subcategories ?? []

  useEffect(() => {
    if (!profile || !open) return
    setBusinessName(profile.businessName?.trim() || '')
    setBusinessDescription(profile.description?.trim() || '')
    setCategoryId(String(profile.categoryId || ''))
    setSubcategory(profile.subcategory?.trim() || '')
  }, [open, profile])

  useEffect(() => {
    if (!open || subcategoryOptions.length === 0) return
    if (subcategory && subcategoryOptions.includes(subcategory)) return
    setSubcategory(subcategoryOptions[0] ?? '')
  }, [categoryId, open, subcategory, subcategoryOptions])

  return (
    <>
      <OwnerEditTrigger label={label} className={className} onClick={() => void openEditor()} />
      <VendorOwnerModalShell
        title="Edit details"
        open={open}
        loading={loading || formOptionsLoading}
        onClose={() => setOpen(false)}
        onSave={async () => {
          const trimmedName = businessName.trim()
          if (!trimmedName) {
            showError('Please enter a business name.')
            return
          }
          if (!categoryId) {
            showError('Please select a category.')
            return
          }
          if (subcategoryOptions.length > 0 && !subcategory.trim()) {
            showError('Please select a subcategory.')
            return
          }
          const trimmedDescription = businessDescription.trim()
          const overviewError = businessOverviewLengthError(businessDescription)
          if (overviewError) {
            showError(overviewError)
            return
          }
          const saved = await saveProfile(
            {
              business_name: trimmedName,
              business_description: trimmedDescription,
              category_id: Number(categoryId),
              subcategory: subcategory.trim() || undefined,
            },
            'Details updated.',
          )
          if (saved) {
            onNameSaved?.(trimmedName)
            onDescriptionSaved?.(trimmedDescription)
          }
        }}
        saveDisabled={!businessName.trim() || !categoryId}
      >
        <div className="space-y-4">
          {!categoryId ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Select a category below to enable saving.
            </p>
          ) : null}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Business name</label>
            <Input
              value={businessName}
              disabled={loading || formOptionsLoading}
              onChange={(event) => setBusinessName(event.target.value)}
              placeholder="Your business name"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Category</label>
            <select
              value={categoryId}
              disabled={loading || formOptionsLoading}
              onChange={(event) => {
                setCategoryId(event.target.value)
                setSubcategory('')
              }}
              className="h-11 w-full rounded-md border border-border-light bg-background px-3 text-sm"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          {subcategoryOptions.length > 0 ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Subcategory</label>
              <select
                value={subcategory}
                disabled={loading || formOptionsLoading}
                onChange={(event) => setSubcategory(event.target.value)}
                className="h-11 w-full rounded-md border border-border-light bg-background px-3 text-sm"
              >
                <option value="">Select subcategory</option>
                {subcategoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">About</label>
            <Textarea
              value={businessDescription}
              disabled={loading || formOptionsLoading}
              onChange={(event) => setBusinessDescription(clampBusinessOverview(event.target.value))}
              placeholder="Short description about your business (max 150 characters)"
              rows={4}
              maxLength={BUSINESS_OVERVIEW_MAX_LENGTH}
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">
              {businessDescription.length}/{BUSINESS_OVERVIEW_MAX_LENGTH}
            </p>
          </div>
        </div>
      </VendorOwnerModalShell>
    </>
  )
}

export function VendorOwnerContactEditButton({
  label = 'Contact details',
  className,
  onProfileUpdated,
}: OwnerEditButtonProps) {
  const CONTACT_SOCIAL_PLATFORMS: SocialPlatform[] = ['facebook', 'instagram', 'tiktok', 'linkedin', 'x']
  const { open, setOpen, loading, profile, openEditor, saveProfile } = useOwnerProfileEditor(onProfileUpdated)
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [website, setWebsite] = useState('')
  const [socialValues, setSocialValues] = useState<Record<SocialPlatform, string>>({
    facebook: '',
    instagram: '',
    tiktok: '',
    linkedin: '',
    x: '',
    youtube: '',
    pinterest: '',
    threads: '',
    snapchat: '',
  })

  useEffect(() => {
    if (!profile || !open) return
    setPhone(profile.phone)
    setWhatsapp(profile.whatsapp)
    setWebsite(profile.website)
    setSocialValues({
      facebook: profile.socialAccounts.find((account) => account.platform === 'facebook')?.url ?? '',
      instagram: profile.socialAccounts.find((account) => account.platform === 'instagram')?.url ?? '',
      tiktok: profile.socialAccounts.find((account) => account.platform === 'tiktok')?.url ?? '',
      linkedin: profile.socialAccounts.find((account) => account.platform === 'linkedin')?.url ?? '',
      x: profile.socialAccounts.find((account) => account.platform === 'x')?.url ?? '',
      youtube: profile.socialAccounts.find((account) => account.platform === 'youtube')?.url ?? '',
      pinterest: profile.socialAccounts.find((account) => account.platform === 'pinterest')?.url ?? '',
      threads: profile.socialAccounts.find((account) => account.platform === 'threads')?.url ?? '',
      snapchat: profile.socialAccounts.find((account) => account.platform === 'snapchat')?.url ?? '',
    })
  }, [open, profile])

  function buildSocialAccounts(): SocialAccount[] {
    const edited = CONTACT_SOCIAL_PLATFORMS.map((platform) => ({
      platform,
      url: normalizeSocialInput(platform, socialValues[platform] ?? ''),
    })).filter((account) => account.url)
    const preserved =
      profile?.socialAccounts.filter((account) => !CONTACT_SOCIAL_PLATFORMS.includes(account.platform)) ??
      []

    return [...preserved, ...edited]
  }

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
            {
              phone: phone.trim(),
              whatsapp: whatsapp.trim(),
              website: website.trim(),
              social_accounts: buildSocialAccounts(),
            },
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
          {CONTACT_SOCIAL_PLATFORMS.map((platform) => (
            <div key={platform}>
              <label className="mb-1.5 block text-sm font-medium text-ink">{socialPlatformLabel(platform)}</label>
              <Input
                value={socialValues[platform]}
                onChange={(event) =>
                  setSocialValues((current) => ({ ...current, [platform]: event.target.value }))
                }
                disabled={loading}
                placeholder="@handle or profile link"
              />
            </div>
          ))}
        </div>
      </VendorOwnerModalShell>
    </>
  )
}

export function VendorOwnerServicesEditButton({
  label = 'Products/Services',
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
        title="Edit products/services"
        open={open}
        loading={loading}
        onClose={() => setOpen(false)}
        onSave={() => {
          const services = servicesText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
          void saveProfile({ services }, 'Products/Services updated.')
        }}
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Products/Services offered</label>
          <Textarea
            value={servicesText}
            rows={6}
            placeholder="One product or service per line"
            onChange={(event) => setServicesText(event.target.value)}
            disabled={loading}
          />
          <p className="mt-2 text-xs text-muted-foreground">Enter one product or service per line.</p>
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

export function VendorOwnerPhotoGrid({
  coverPhotos,
  onProfileUpdated,
  addSlot,
}: {
  coverPhotos: string[]
  photoLimit: number
  onProfileUpdated?: () => void
  addSlot?: React.ReactNode
}) {
  const [removingIndex, setRemovingIndex] = useState<number | null>(null)

  async function removePhotoAt(index: number) {
    if (coverPhotos.length <= 1) {
      showError('Please keep at least one gallery photo.')
      return
    }

    setRemovingIndex(index)
    try {
      const profile = await fetchVendorBusinessProfile()
      const keepPaths = profile.coverPhotoPaths.filter((_, i) => i !== index)
      if (keepPaths.length < 1) {
        showError('Please keep at least one gallery photo.')
        return
      }
      await updateVendorBusiness(buildUpdatePayload(profile, { keep_cover_paths: keepPaths }))
      showSuccess('Photo removed.')
      onProfileUpdated?.()
    } catch (error) {
      showError(getVendorBusinessUpdateError(error, 'Could not remove photo.'))
    } finally {
      setRemovingIndex(null)
    }
  }

  return (
    <div className={businessPageOwnerPhotoGrid}>
      {coverPhotos.map((src, index) => (
        <div key={`${src}-${index}`} className="relative aspect-square overflow-hidden rounded-[13px] lg:rounded-xl">
          <img src={src} alt="" className="size-full object-cover" loading="lazy" />
          <button
            type="button"
            disabled={removingIndex === index}
            onClick={() => void removePhotoAt(index)}
            className="edit-only absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-60"
            aria-label={`Remove photo ${index + 1}`}
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
      {addSlot}
    </div>
  )
}
