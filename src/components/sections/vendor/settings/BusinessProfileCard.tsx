import { useRef } from 'react'
import { Camera } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { resolveMediaUrl } from '@/lib/mediaUrl'

function Label({ children }: { children: string }) {
  return (
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  )
}

type Props = {
  businessName: string
  contactFirstName: string
  contactLastName: string
  phone: string
  logoUrl: string | null
  logoPreview: string | null
  disabled?: boolean
  onBusinessNameChange: (value: string) => void
  onContactFirstNameChange: (value: string) => void
  onContactLastNameChange: (value: string) => void
  onPhoneChange: (value: string) => void
  onLogoChange: (file: File | null) => void
}

export function BusinessProfileCard({
  businessName,
  contactFirstName,
  contactLastName,
  phone,
  logoUrl,
  logoPreview,
  disabled,
  onBusinessNameChange,
  onContactFirstNameChange,
  onContactLastNameChange,
  onPhoneChange,
  onLogoChange,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const displayLogo = logoPreview || resolveMediaUrl(logoUrl ?? '') || null

  return (
    <Card className="overflow-hidden rounded-xl border-0 border-l-4 border-brand-red shadow-sm ">
      <CardHeader className="relative flex flex-row flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 pr-28 sm:pr-0">
          <CardTitle className="text-2xl font-extrabold text-foreground font-manrope">
            Business Profile
          </CardTitle>
          <p className="text-sm text-muted-foreground font-inter">
            Manage your public presence and contact details.
          </p>
        </div>
        <div className="absolute right-6 top-5 sm:static sm:shrink-0">
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1 px-2 py-3 disabled:opacity-60"
          >
            <div className="relative size-16 overflow-hidden rounded-full border border-border-light bg-muted">
              {displayLogo ? (
                <img src={displayLogo} alt="" className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <Camera className="size-6" aria-hidden />
                </div>
              )}
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Logo
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={disabled}
            onChange={(e) => onLogoChange(e.target.files?.[0] ?? null)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>Business name</Label>
            <Input
              value={businessName}
              onChange={(e) => onBusinessNameChange(e.target.value)}
              disabled={disabled}
              className="h-11 border-border-light bg-accent/60 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-sky-500/25"
            />
          </div>
          <div>
            <Label>Contact Person</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={contactFirstName}
                onChange={(e) => onContactFirstNameChange(e.target.value)}
                disabled={disabled}
                placeholder="First name"
                className="h-11 border-border-light bg-accent/60 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-sky-500/25"
              />
              <Input
                value={contactLastName}
                onChange={(e) => onContactLastNameChange(e.target.value)}
                disabled={disabled}
                placeholder="Last name"
                className="h-11 border-border-light bg-accent/60 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-sky-500/25"
              />
            </div>
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              disabled={disabled}
              className="h-11 border-border-light bg-accent/60 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-sky-500/25"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
