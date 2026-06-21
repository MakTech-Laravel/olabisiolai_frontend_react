import { Link } from 'react-router-dom'
import { Camera, ChevronLeft, Loader2, Pencil, User } from 'lucide-react'

import { AppNotificationBell } from '@/components/notifications/AppNotificationBell'
import { HeaderAvatar } from '@/components/ui/HeaderAvatar'
import { cn } from '@/lib/utils'

const LOGO_HEADER = '/images/landing/gidira-logo-header.svg'

type ProfileHubHeaderProps = {
  onOpenSwitcher: () => void
}

export function ProfileHubHeader({ onOpenSwitcher }: ProfileHubHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border-light bg-white px-[18px] py-3.5">
      <div className="mx-auto flex w-full max-w-[430px] items-center justify-between gap-3">
        <Link to="/" className="inline-flex shrink-0 items-center">
          <img src={LOGO_HEADER} alt="Gidira" className="h-8 w-auto" decoding="async" />
        </Link>
        <div className="flex items-center gap-1.5">
          <AppNotificationBell
            viewAllHref="/user/activity"
            triggerClassName="h-[42px] w-[42px] rounded-xl hover:bg-auth-bg"
          />
          <button
            type="button"
            onClick={onOpenSwitcher}
            className="inline-flex size-[42px] items-center justify-center rounded-xl bg-brand text-white shadow-[0_4px_10px_rgba(225,36,42,0.28)] transition-opacity hover:opacity-90"
            aria-label="Switch account"
          >
            <User className="size-[22px]" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
    </header>
  )
}

type ProfileIdentitySectionProps = {
  displayName: string
  handleLabel?: string | null
  avatarUrl: string
  followingCount: number
  reviewsCount: number
  isPhotoUploading: boolean
  photoError?: string | null
  onOpenPhotoPicker: () => void
  onPhotoChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  photoInputRef: React.RefObject<HTMLInputElement | null>
  onOpenSwitcher?: () => void
}

export function ProfileIdentitySection({
  displayName,
  handleLabel,
  avatarUrl,
  followingCount,
  reviewsCount,
  isPhotoUploading,
  photoError,
  onOpenPhotoPicker,
  onPhotoChange,
  photoInputRef,
  onOpenSwitcher,
}: ProfileIdentitySectionProps) {
  return (
    <section className="bg-white px-[18px] pb-[18px] pt-[22px] lg:rounded-2xl lg:border lg:border-border-light lg:shadow-[0_1px_2px_rgba(16,22,32,0.05),0_1px_1px_rgba(16,22,32,0.04)]">
      <div className="flex items-center gap-[15px]">
        <div className="relative shrink-0">
          <HeaderAvatar
            src={avatarUrl}
            alt={displayName}
            className="size-[74px] rounded-full shadow-[0_6px_16px_rgba(27,79,216,0.28)] ring-0"
          />
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            disabled={isPhotoUploading}
            onChange={onPhotoChange}
          />
          <button
            type="button"
            disabled={isPhotoUploading}
            onClick={onOpenPhotoPicker}
            className="absolute -bottom-0.5 -right-0.5 flex size-[26px] items-center justify-center rounded-full border border-border-light bg-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Change profile photo"
          >
            {isPhotoUploading ? (
              <Loader2 className="size-3.5 animate-spin text-body-secondary" aria-hidden />
            ) : (
              <Camera className="size-3.5 text-body-secondary" strokeWidth={2} aria-hidden />
            )}
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="font-heading text-[21px] font-bold leading-tight tracking-[-0.01em] text-ink">
              {displayName}
            </h1>
            {onOpenSwitcher ? (
              <button
                type="button"
                onClick={onOpenSwitcher}
                className="inline-flex size-6 shrink-0 items-center justify-center rounded-[7px] bg-auth-bg text-body-secondary"
                aria-label="Switch account"
              >
                <svg viewBox="0 0 24 24" className="size-[15px]" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                  <path d="M7 10l5-5 5 5M7 14l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : null}
          </div>

          {handleLabel ? <p className="mt-0.5 text-[13.5px] text-chat-meta">{handleLabel}</p> : null}

          <div className="mt-3.5 flex gap-6">
            <Link to="/user/following" className="text-left">
              <b className="font-heading text-[17px] font-bold text-ink">{followingCount.toLocaleString()}</b>
              <span className="ml-1.5 text-[12.5px] text-chat-meta">following</span>
            </Link>
            <Link to="/user/reviews" className="text-left">
              <b className="font-heading text-[17px] font-bold text-ink">{reviewsCount.toLocaleString()}</b>
              <span className="ml-1.5 text-[12.5px] text-chat-meta">reviews written</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Link
          to="/user/settings/account"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-auth-bg px-3.5 py-3 text-[14.5px] font-semibold text-ink transition-transform active:scale-[0.985]"
        >
          <Pencil className="size-[17px] text-body-secondary" strokeWidth={2} aria-hidden />
          Edit profile
        </Link>
      </div>

      {photoError ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {photoError}
        </p>
      ) : null}
    </section>
  )
}

type ProfileManageBackBarProps = {
  onBack: () => void
}

export function ProfileManageBackBar({ onBack }: ProfileManageBackBarProps) {
  return (
    <div className="flex items-center gap-1.5 border-b border-border-light bg-white px-3.5 py-3.5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-[15px] font-semibold text-chat-accent"
      >
        <ChevronLeft className="size-5" strokeWidth={2} aria-hidden />
        Profile
      </button>
    </div>
  )
}

export function profileHubChipClass(variant: 'premium' | 'free' | 'boost' | 'verified') {
  return cn(
    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.02em]',
    variant === 'premium' && 'bg-gradient-to-br from-[#9A6B1F] to-[#C99A3F] text-white',
    variant === 'free' && 'bg-auth-bg text-body-secondary',
    variant === 'boost' && 'bg-[#FDEAEA] text-brand',
    variant === 'verified' && 'bg-[#E7F6EF] text-[#13a36b]',
  )
}
