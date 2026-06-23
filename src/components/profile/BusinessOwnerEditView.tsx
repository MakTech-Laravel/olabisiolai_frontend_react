import { Link } from 'react-router-dom'
import { BadgeCheck, Globe, Lock, MapPin, Phone, Star, type LucideIcon } from 'lucide-react'

import { BusinessHoursDisplay } from '@/components/business/BusinessHoursDisplay'
import { SocialPlatformIcon } from '@/components/business/SocialPlatformIcon'
import type { PublicBusiness } from '@/features/business/publicBusinessApi'
import type { SocialAccount, SocialPlatform } from '@/features/business/socialAccounts'
import { isSocialPlatform, socialPlatformLabel } from '@/features/business/socialAccounts'
import {
  VendorOwnerContactEditButton,
  VendorOwnerDetailsEditButton,
  VendorOwnerGalleryEditButton,
  VendorOwnerHoursEditButton,
  VendorOwnerLocationEditButton,
  VendorOwnerLogoEditButton,
  VendorOwnerPhotoGrid,
} from '@/components/profile/VendorOwnerFieldEditors'
import { VendorOwnerCatalogSection } from '@/components/profile/VendorOwnerCatalogSection'
import { OwnerEditSection } from '@/components/profile/OwnerEditSection'
import { buildVendorPremiumInfoPath } from '@/hooks/useVendorSubscriptionAccess'
import { FREE_PHOTO_LIMIT } from '@/constants/planLimits'
import {
  businessPageHero,
  businessPageIdentityCard,
  businessPageOwnerOuter,
  businessPageSectionX,
  businessPageTitle,
} from '@/lib/businessPageLayout'
import { NO_CATEGORY_LABEL, NO_LOCATION_LABEL } from '@/features/business/publicBusinessApi'
import { cn } from '@/lib/utils'

type BusinessOwnerEditViewProps = {
  businessId: number
  businessName: string
  displayName: string
  displayDescription: string
  categoryLabel: string
  subcategoryLabel: string | null
  logoUrl: string
  heroCover: string
  coverPhotos: string[]
  photoLimit: number
  isPremium: boolean
  verified: boolean
  boostActive: boolean
  phone: string | null
  whatsapp: string | null
  website: string | null
  socialAccounts: SocialAccount[]
  business: PublicBusiness | null | undefined
  onDisplayNameChange: (value: string) => void
  onDisplayDescriptionChange: (value: string) => void
  onProfileUpdated: () => void
}

function OwnerEditButton({
  label,
  variant = 'dark',
  className,
  children,
}: {
  label: string
  variant?: 'dark' | 'light' | 'delete'
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex',
        variant === 'dark' &&
          '[&>button]:size-[34px] [&>button]:border-0 [&>button]:bg-[rgba(15,22,32,0.62)] [&>button]:text-white [&>button]:shadow-[0_2px_6px_rgba(0,0,0,0.25)]',
        variant === 'light' &&
          '[&>button]:size-[34px] [&>button]:border [&>button]:border-border-light [&>button]:bg-white [&>button]:text-body-secondary [&>button]:shadow-sm',
        variant === 'delete' &&
          '[&>button]:size-[30px] [&>button]:border-0 [&>button]:bg-white [&>button]:text-brand [&>button]:shadow-sm',
        className,
      )}
    >
      <span className="sr-only">{label}</span>
      {children}
    </span>
  )
}

type ContactRow = {
  label: string
  value: string
  icon: LucideIcon | SocialPlatform
}

function ContactRowIcon({ icon }: { icon: ContactRow['icon'] }) {
  if (typeof icon === 'string' && isSocialPlatform(icon)) {
    return <SocialPlatformIcon platform={icon} className="size-4" aria-hidden />
  }

  const Icon = icon as LucideIcon
  return <Icon className="size-4 opacity-100" aria-hidden />
}

function AspectCover({ src, className }: { src: string; className?: string }) {
  return (
    <div className={cn('relative isolate overflow-hidden bg-border-light', className)}>
      <img src={src} alt="" className="absolute inset-0 block size-full object-cover" loading="lazy" />
    </div>
  )
}

export function BusinessOwnerEditView({
  businessId,
  businessName,
  displayName,
  displayDescription,
  categoryLabel,
  subcategoryLabel,
  logoUrl,
  heroCover,
  coverPhotos,
  photoLimit,
  isPremium,
  verified,
  boostActive,
  phone,
  whatsapp,
  website,
  socialAccounts,
  business,
  onDisplayNameChange,
  onDisplayDescriptionChange,
  onProfileUpdated,
}: BusinessOwnerEditViewProps) {
  const name = displayName || businessName
  const about = displayDescription || business?.description || ''
  const atPhotoCap = coverPhotos.length >= photoLimit
  const managePath = `/user/profile`

  const contactRows = [
    phone ? { label: 'Phone', value: phone, icon: Phone } : null,
    whatsapp ? { label: 'WhatsApp', value: whatsapp, icon: Phone } : null,
    website ? { label: 'Website', value: website, icon: Globe } : null,
    ...socialAccounts.map((account) => ({
      label: socialPlatformLabel(account.platform),
      value: account.url,
      icon: account.platform,
    })),
  ].filter(Boolean) as ContactRow[]

  return (
    <div className={businessPageOwnerOuter}>
      <div id="owner-details" className={cn('scroll-mt-28 grid grid-cols-1 gap-4 lg:grid-cols-2', businessPageSectionX)}>
        <div className="relative">
          <AspectCover src={heroCover} className={businessPageHero} />
          <div className="pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-black/5 lg:rounded-2xl" aria-hidden />
          {isPremium ? (
            <span className="absolute left-4 top-7 z-10 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-[#9A6B1F] to-[#C99A3F] px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white lg:left-5 lg:top-8">
              <Star className="size-3 fill-white" aria-hidden />
              Premium
            </span>
          ) : null}
          {boostActive && !isPremium ? (
            <span className="absolute left-4 top-7 z-10 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-[#9A6B1F] to-[#C99A3F] px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white lg:left-5 lg:top-8">
              <Star className="size-3 fill-white" aria-hidden />
              Boosted
            </span>
          ) : null}
          <div className="edit-only absolute right-4 top-7 z-20 lg:right-5 lg:top-8">
            <OwnerEditButton label="Edit cover" variant="dark">
              <VendorOwnerGalleryEditButton label="Cover photos" onProfileUpdated={onProfileUpdated} />
            </OwnerEditButton>
          </div>
        </div>

        <div className={cn('relative mt-4 lg:mt-0', businessPageIdentityCard)}>
          <div className="edit-only absolute right-3.5 top-3.5 z-20 lg:right-4 lg:top-4">
            <OwnerEditButton label="Edit details" variant="light">
              <VendorOwnerDetailsEditButton
                onProfileUpdated={onProfileUpdated}
                onNameSaved={onDisplayNameChange}
                onDescriptionSaved={onDisplayDescriptionChange}
              />
            </OwnerEditButton>
          </div>
          <div className="relative mb-3 size-16 lg:size-20">
            <AspectCover src={logoUrl} className="size-16 rounded-[18px] shadow-sm lg:size-20 lg:rounded-2xl" />
            <div className="edit-only absolute -bottom-2 -right-2 z-20">
              <OwnerEditButton label="Edit logo" variant="dark" className="[&>button]:size-7">
                <VendorOwnerLogoEditButton label="Business logo" onProfileUpdated={onProfileUpdated} />
              </OwnerEditButton>
            </div>
          </div>
          <h1 className={cn(businessPageTitle, 'pr-10')}>{name}</h1>
          <p className="mt-2 text-[13.5px] text-ink lg:text-base">
            {categoryLabel && categoryLabel !== NO_CATEGORY_LABEL ? (
              <>
                Category: <b className="font-semibold text-chat-accent">{categoryLabel}</b>
              </>
            ) : (
              <span className="italic text-body-secondary">{NO_CATEGORY_LABEL}</span>
            )}
            {subcategoryLabel ? (
              <>
                {' '}
                · <b className="font-semibold text-chat-accent">{subcategoryLabel}</b>
              </>
            ) : null}
          </p>
          <div className="mt-2 flex items-start gap-2 text-sm text-body-secondary lg:text-[15px]">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1">
              {business?.location?.trim() && business.location !== NO_LOCATION_LABEL
                ? business.location
                : NO_LOCATION_LABEL}
            </span>
            <div className="edit-only shrink-0">
              <OwnerEditButton label="Edit location" variant="light">
                <VendorOwnerLocationEditButton onProfileUpdated={onProfileUpdated} />
              </OwnerEditButton>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-body-secondary lg:text-base">
            {about || 'Add a short description about your business.'}
          </p>
        </div>

        <div className="col-span-1 lg:col-span-2 mt-3.5 flex w-full flex-wrap items-center gap-2 rounded-2xl bg-white px-4 py-3.5 shadow-sm lg:px-5">
          {verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF2FD] px-2.5 py-1 text-[11.5px] font-bold text-chat-accent">
              <BadgeCheck className="size-3 fill-chat-accent text-white" aria-hidden />
              Verified
            </span>
          ) : null}
          {isPremium ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-[#9A6B1F] to-[#C99A3F] px-2.5 py-1 text-[11.5px] font-bold text-white">
              ★ Premium
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-auth-bg px-2.5 py-1 text-[11.5px] font-bold text-body-secondary">
              Free plan
            </span>
          )}
          <Link to={managePath} className="ml-auto text-[13px] font-semibold text-chat-accent lg:text-sm">
            Manage
          </Link>
        </div>
      </div>

      <OwnerEditSection id="owner-catalog" className={businessPageSectionX}>
        <VendorOwnerCatalogSection
          businessId={businessId}
          isPremiumActive={isPremium}
          onProfileUpdated={onProfileUpdated}
          layout="edit"
        />
      </OwnerEditSection>

      <OwnerEditSection
        id="owner-photos"
        title="Photos"
        className={businessPageSectionX}
        headerRight={
          <span className="text-[13px] font-semibold text-stat-muted lg:text-sm">
            {coverPhotos.length} of {photoLimit}
          </span>
        }
      >
        <VendorOwnerPhotoGrid
          coverPhotos={coverPhotos}
          photoLimit={photoLimit}
          onProfileUpdated={onProfileUpdated}
          addSlot={
            !atPhotoCap ? (
              <div className="edit-only aspect-square rounded-[13px] border-[1.5px] border-dashed border-[#cfdae6] bg-[#fbfcfe] lg:rounded-xl">
                <VendorOwnerGalleryEditButton
                  label="Add photo"
                  className="flex size-full items-center justify-center [&>button]:size-10 [&>button]:rounded-full [&>button]:border-0 [&>button]:bg-transparent [&>button]:text-chat-accent [&>button]:shadow-none"
                  onProfileUpdated={onProfileUpdated}
                />
              </div>
            ) : !isPremium ? (
              <Link
                to={buildVendorPremiumInfoPath(businessId)}
                className="edit-only grid aspect-square place-items-center rounded-[13px] border-[1.5px] border-dashed border-[#e3d6b5] bg-[#fffbf0] lg:rounded-xl"
                aria-label="Upgrade for more photos"
              >
                <Lock className="size-6 text-[#9A6B1F]" strokeWidth={2} aria-hidden />
              </Link>
            ) : null
          }
        />
        {isPremium ? null : atPhotoCap ? (
          <p className="edit-only mt-3 text-[12.5px] text-body-secondary lg:text-sm">
            Free plan holds {FREE_PHOTO_LIMIT} photos.{' '}
            <Link
              to={buildVendorPremiumInfoPath(businessId)}
              className="font-bold text-chat-accent"
            >
              Upgrade to Premium
            </Link>{' '}
            for up to {photoLimit} photos on Premium.
          </p>
        ) : null}
      </OwnerEditSection>

      <div className={cn('lg:grid lg:grid-cols-2 lg:gap-6', businessPageSectionX)}>
        <OwnerEditSection
          id="owner-hours"
          title="Business hours"
          headerRight={
            <div className="edit-only">
              <OwnerEditButton label="Edit hours" variant="light">
                <VendorOwnerHoursEditButton onProfileUpdated={onProfileUpdated} />
              </OwnerEditButton>
            </div>
          }
        >
          {business ? (
            <BusinessHoursDisplay
              hours={business.businessHours}
              displayRows={business.businessHoursDisplay}
              title=""
              className="mt-1 rounded-2xl border-0 bg-[#EAF2FD] px-[18px] py-1.5 lg:py-2"
            />
          ) : null}
        </OwnerEditSection>

        <OwnerEditSection
          id="owner-contact"
          title="Contact & links"
          headerRight={
            <div className="edit-only">
              <OwnerEditButton label="Edit contact" variant="light">
                <VendorOwnerContactEditButton onProfileUpdated={onProfileUpdated} />
              </OwnerEditButton>
            </div>
          }
        >
          <div className="mt-1 rounded-2xl bg-white px-4 shadow-sm lg:px-5">
            {contactRows.length > 0 ? (
              contactRows.map((row, index) => (
                <div
                  key={`${row.label}-${index}`}
                  className={cn(
                    'flex items-center gap-3 py-3.5 text-sm lg:text-[15px]',
                    index < contactRows.length - 1 && 'border-b border-border-light',
                  )}
                >
                  <span className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-auth-bg text-body-secondary">
                    <ContactRowIcon icon={row.icon} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <small className="block text-[11.5px] text-stat-muted">{row.label}</small>
                    <b className="block truncate text-sm font-semibold text-ink lg:text-[15px]">{row.value}</b>
                  </span>
                </div>
              ))
            ) : (
              <p className="py-4 text-sm text-body-secondary lg:text-[15px]">
                No contact details yet. Tap the pencil to add phone, WhatsApp, and links.
              </p>
            )}
          </div>
        </OwnerEditSection>
      </div>
    </div>
  )
}
