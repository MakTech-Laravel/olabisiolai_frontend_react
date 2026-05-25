import type { LucideIcon } from "lucide-react";
import { Globe, Mail, Phone } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth/useAuth";
import { SocialAccountsEditor } from "@/components/business/SocialAccountsEditor";
import { BusinessSocialLinks } from "@/components/business/BusinessSocialLinks";
import { useVendorProfileContext } from "@/components/sections/vendor/profile/VendorProfileContext";

function Label({ children }: { children: string }) {
  return (
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

function IconInput({
  label,
  icon: Icon,
  value,
  onChange,
  readOnly,
  placeholder,
  iconClassName,
  error,
}: {
  label: string;
  icon: LucideIcon;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  iconClassName?: string;
  error?: string;
}) {
  return (
    <div className="space-y-0">
      <Label>{label}</Label>
      <div className="relative">
        <Icon
          className={cn(
            "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground",
            iconClassName,
          )}
          aria-hidden
        />
        <Input
          value={value}
          readOnly={readOnly}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          placeholder={placeholder}
          className="h-11 border-border-light bg-background pl-10 pr-3 text-sm shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-sky-500/25"
        />
      </div>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function ContactLinksCard() {
  const { profile, isEditing, draft, setDraftField, fieldErrors } = useVendorProfileContext();
  const { user } = useAuth();

  if (!profile) return null;

  const email = user?.email ?? "";
  const phone = isEditing && draft ? draft.phone : profile.phone;
  const whatsapp = isEditing && draft ? draft.whatsapp : profile.whatsapp;
  const website = isEditing && draft ? draft.website : profile.website;
  const socialAccounts = isEditing && draft ? draft.socialAccounts : profile.socialAccounts;

  return (
    <Card className="overflow-hidden rounded-xl border-border-light shadow-sm">
      <CardHeader className="border-b border-border-light px-6 py-5">
        <CardTitle className="text-lg font-bold text-foreground font-manrope">Contact Links</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 p-6">
        <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-2">
          <IconInput
            label="Phone Number"
            icon={Phone}
            value={phone}
            readOnly={!isEditing}
            onChange={(v) => setDraftField("phone", v)}
            placeholder="Not set"
            error={fieldErrors.phone}
          />
          <IconInput
            label="WhatsApp Number"
            icon={Phone}
            value={whatsapp}
            readOnly={!isEditing}
            onChange={(v) => setDraftField("whatsapp", v)}
            placeholder="Not set"
            error={fieldErrors.whatsapp}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-2">
          <IconInput
            label="Website"
            icon={Globe}
            value={website}
            readOnly={!isEditing}
            onChange={(v) => setDraftField("website", v)}
            placeholder="https://yourbusiness.com"
            error={fieldErrors.website}
          />
          <IconInput label="Account email" icon={Mail} value={email} readOnly placeholder="Not set" />
        </div>

        {isEditing && draft ? (
          <SocialAccountsEditor
            accounts={draft.socialAccounts}
            onChange={(accounts) => setDraftField("socialAccounts", accounts)}
            error={fieldErrors.social_accounts}
          />
        ) : (
          <BusinessSocialLinks accounts={socialAccounts} />
        )}
      </CardContent>
    </Card>
  );
}
