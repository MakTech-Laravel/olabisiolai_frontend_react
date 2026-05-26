import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Heart, MapPin, Star } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { removeFavorite } from '@/api/favorites'
import { DirectMessageButton } from '@/components/business/DirectMessageButton'
import { ShowPhoneNumberReveal } from '@/components/ShowPhoneNumberReveal'
import { businessProfilePath } from '@/lib/businessProfile'
import { resolveBusinessContactPhone } from '@/lib/whatsappUrl'

export type FavoriteBusinessCardProps = {
  businessInfoId: number
  title: string
  category: string
  location: string
  rating: number
  reviews: number
  /** API may omit; paragraph hidden when empty */
  description?: string
  image: string
  verified: boolean
  phone?: string | null
  whatsapp?: string | null
  vendorUserUuid?: string | null
}

export function FavoriteBusinessCard({
  businessInfoId,
  title,
  category,
  location,
  rating,
  reviews,
  description,
  image,
  verified,
  phone,
  whatsapp,
  vendorUserUuid,
}: FavoriteBusinessCardProps) {
  const contactPhone = resolveBusinessContactPhone(whatsapp, phone)
  const queryClient = useQueryClient()
  const { pathname } = useLocation()
  const [removing, setRemoving] = useState(false)
  const profileTo = businessProfilePath(businessInfoId)
  const desc = description?.trim()

  const handleRemoveFavorite = async (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (removing) return
    setRemoving(true)
    try {
      await removeFavorite(businessInfoId)
      await queryClient.invalidateQueries({ queryKey: ['user-favorites'] })
    } catch (err) {
      console.error('Failed to remove favorite:', err)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-border-light bg-card shadow-sm">
      <div className="relative h-48 bg-muted">
        <Link to={profileTo} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
          <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
        </Link>
        <button
          type="button"
          onClick={handleRemoveFavorite}
          disabled={removing}
          className="absolute left-3 top-3 z-10 rounded-full bg-white/90 p-1.5 shadow-md transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Remove from favorites"
        >
          <Heart className="size-5 fill-brand-red text-brand-red" aria-hidden />
        </button>
        {verified ? (
          <div className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-footer-bar px-3 py-1 text-[11px] font-semibold text-ice">
            <CheckCircle2 className="size-3.5" aria-hidden />
            VERIFIED
          </div>
        ) : null}
      </div>

      <div className="space-y-3 p-5">
        <h3 className="line-clamp-1 text-lg font-semibold leading-7 text-ink-heading">
          <Link to={profileTo} className="hover:underline">
            {title}
          </Link>
        </h3>
        <div className="space-y-1">
          <p className="text-sm font-medium text-footer-bar">{category}</p>
          <p className="inline-flex items-center gap-1 text-sm text-body-secondary">
            <MapPin className="size-3.5" aria-hidden />
            {location}
          </p>
        </div>
        <p className="inline-flex items-center gap-1 text-sm">
          <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
          <span className="font-medium text-ink-heading">{rating}</span>
          <span className="text-chat-meta">({reviews})</span>
        </p>
        {desc ? (
          <p className="line-clamp-2 text-sm leading-5 text-body-secondary">{desc}</p>
        ) : null}

        <div className="space-y-2 pt-1">
          <ShowPhoneNumberReveal
            useShadcnButton
            isolateFromParentClicks={false}
            phoneNumber={contactPhone}
            className="h-11 w-full rounded-xl bg-brand-red text-base font-medium text-ice hover:bg-brand-red/90"
            iconClassName="size-4 shrink-0"
          />
          <DirectMessageButton
            businessInfoId={businessInfoId}
            vendorUserUuid={vendorUserUuid}
            fromPath={pathname}
            messagesPath="/user/messages"
            className="h-11 w-full rounded-xl border-brand bg-surface-soft text-base font-medium text-brand hover:bg-surface-wash"
            iconClassName="size-4 shrink-0"
          />
        </div>
      </div>
    </article>
  )
}
