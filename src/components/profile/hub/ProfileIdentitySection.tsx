import { Link } from 'react-router-dom'
import { Camera, ChevronLeft, Home, Loader2, LogOut, Pencil, User } from 'lucide-react'

import { useAuth } from '@/auth/useAuth'
import { HeaderAvatar } from '@/components/ui/HeaderAvatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const LOGO_HEADER = '/images/landing/gidira-logo-header.svg'

type ProfileHubHeaderProps = {
  avatarUrl: string
}

export function ProfileHubHeader({ avatarUrl }: ProfileHubHeaderProps) {
  const { logout } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-border-light bg-white px-[18px] py-3.5">
      <div className="mx-auto flex w-full max-w-[430px] items-center justify-between gap-3">
        <Link to="/" className="inline-flex shrink-0 items-center">
          <img src={LOGO_HEADER} alt="Gidira" className="h-8 w-auto" decoding="async" />
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="size-[42px] overflow-hidden rounded-xl bg-brand p-0 shadow-[0_4px_10px_rgba(225,36,42,0.28)] hover:bg-brand/90"
              aria-label="Account menu"
            >
              <HeaderAvatar src={avatarUrl} alt="Account" className="size-[42px] rounded-xl" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/" className="flex items-center gap-2">
                <Home className="size-4" aria-hidden />
                Home
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/user/profile" className="flex items-center gap-2">
                <User className="size-4" aria-hidden />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                void logout()
              }}
              className="text-brand-red focus:text-brand-red"
            >
              <LogOut className="size-4" aria-hidden />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
          <h1 className="font-heading text-[21px] font-bold leading-tight tracking-[-0.01em] text-ink">
            {displayName}
          </h1>

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
