import type { ReactNode } from "react"
import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Bell,
  Camera,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Smartphone,
  UserSquare2,
} from "lucide-react"
import { Link } from "react-router-dom"

import { changeUserPassword } from "@/api/userPassword"
import { fetchUserSettings, patchUserSettings, type UserSettingsPayload } from "@/api/userSettings"
import { useAuth } from "@/auth/useAuth"
import { AccountVerificationSection } from "@/components/settings/AccountVerificationSection"
import { EmailVerificationSection } from "@/components/settings/EmailVerificationSection"
import { UserShell } from "@/components/partials/user/UserShell"
import { HeaderAvatar } from "@/components/ui/HeaderAvatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { isUserAccountVerified } from "@/lib/accountVerification"
import { getLaravelErrorMessage } from "@/lib/laravelApiError"
import { resolveMediaUrl } from "@/lib/mediaUrl"
import { cn } from "@/lib/utils"

const LOGO_FOOTER = "/images/landing/gidira-logo-footer.svg"
const DEFAULT_HEADER_AVATAR = "/images/avatar/default-header-avatar.png"

function resolveProfileAvatarUrl(
  profile: { image_path?: string | null; image_url?: string | null } | undefined,
  user: { image_path?: string | null; image_url?: string | null } | null | undefined,
  cacheKey?: number,
): string {
  const path = profile?.image_path ?? user?.image_path ?? null
  const url = profile?.image_url ?? user?.image_url ?? null
  const base = path
    ? resolveMediaUrl(path, DEFAULT_HEADER_AVATAR)
    : resolveMediaUrl(url, DEFAULT_HEADER_AVATAR) || DEFAULT_HEADER_AVATAR

  if (!cacheKey || !path) {
    return base || DEFAULT_HEADER_AVATAR
  }

  const separator = base.includes("?") ? "&" : "?"
  return `${base}${separator}v=${cacheKey}`
}

const footerColumns = [
  {
    title: "Company",
    links: [
      { label: "About Gidira", to: "/about" },
      { label: "Contact Us", to: "/contact" },
      { label: "Careers", to: "/careers" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & Conditions", to: "/terms" },
      { label: "Privacy Policy", to: "/privacy-policy" },
      { label: "Cookies Policy", to: "/cookies-policy" },
    ],
  },
  {
    title: "Resources",
    links: [{ label: "FAQs", to: "/faq" }],
  },
] as const

function readBool(v: unknown, fallback: boolean): boolean {
  if (typeof v === "boolean") return v
  if (v === 1 || v === "1") return true
  if (v === 0 || v === "0") return false
  return fallback
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  disabled,
  autoComplete,
  visible,
  onToggleVisible,
  wrapperClassName,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  disabled: boolean
  autoComplete: string
  visible: boolean
  onToggleVisible: () => void
  wrapperClassName?: string
}) {
  return (
    <div className={cn("space-y-1.5", wrapperClassName)}>
      <label className="text-xs text-chat-meta" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-11 rounded-lg border-chat-border-subtle bg-chat-input-bg pr-11"
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={onToggleVisible}
          disabled={disabled}
          className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-r-lg text-chat-meta transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-50"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </div>
    </div>
  )
}

function ToggleRow({
  title,
  description,
  enabled,
  onToggle,
  icon,
  disabled,
}: {
  title: string
  description: string
  enabled: boolean
  onToggle: (next: boolean) => void
  icon: ReactNode
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-chat-border-subtle px-4 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-md bg-surface-soft p-1.5 text-chat-accent">{icon}</span>
        <div>
          <p className="text-sm font-medium text-ink">{title}</p>
          <p className="text-xs text-chat-meta">{description}</p>
        </div>
      </div>
      <button
        type="button"
        disabled={disabled}
        role="switch"
        aria-checked={enabled}
        onClick={() => onToggle(!enabled)}
        className={cn(
          "relative h-7 w-12 shrink-0 self-end rounded-full transition-colors sm:self-auto",
          enabled ? "bg-chat-accent" : "bg-border-gray",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-5 rounded-full bg-white shadow transition-all",
            enabled ? "left-6" : "left-1",
          )}
        />
      </button>
    </div>
  )
}

export default function AccountSettings() {
  const { user, refreshSession } = useAuth()
  const queryClient = useQueryClient()

  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [emailNotify, setEmailNotify] = React.useState(true)
  const [pushNotify, setPushNotify] = React.useState(true)
  const [smsNotify, setSmsNotify] = React.useState(false)
  const [banner, setBanner] = React.useState<{ type: "error" | "ok"; text: string } | null>(null)

  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false)
  const [showNewPassword, setShowNewPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [profileImageFile, setProfileImageFile] = React.useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = React.useState<string | null>(null)
  const [avatarCacheKey, setAvatarCacheKey] = React.useState(0)
  const profileImageInputRef = React.useRef<HTMLInputElement>(null)

  const settingsQuery = useQuery({
    queryKey: ["user-settings"],
    queryFn: fetchUserSettings,
  })

  React.useEffect(() => {
    const data = settingsQuery.data
    if (!data) return
    setFirstName(data.profile.first_name ?? "")
    setLastName(data.profile.last_name ?? "")
    setPhone(data.profile.phone ?? "")
    setEmailNotify(Boolean(data.profile.wants_marketing_emails))
    const notif =
      data.settings.notifications && typeof data.settings.notifications === "object"
        ? (data.settings.notifications as Record<string, unknown>)
        : {}
    setPushNotify(readBool(notif.push, true))
    setSmsNotify(readBool(notif.sms, false))
  }, [settingsQuery.data])

  React.useEffect(() => {
    if (!profileImageFile) {
      setProfileImagePreview(null)
      return
    }
    const url = URL.createObjectURL(profileImageFile)
    setProfileImagePreview(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [profileImageFile])

  const applySavedProfile = React.useCallback(
    async (payload: UserSettingsPayload) => {
      queryClient.setQueryData(["user-settings"], payload)
      setProfileImageFile(null)
      if (profileImageInputRef.current) {
        profileImageInputRef.current.value = ""
      }
      if (payload.profile.image_path) {
        setAvatarCacheKey(Date.now())
      }
      await refreshSession()
    },
    [queryClient, refreshSession],
  )

  const uploadProfileImageMutation = useMutation({
    mutationFn: (file: File) => patchUserSettings({}, { image: file }),
    onSuccess: async (payload) => {
      await applySavedProfile(payload)
      setBanner({ type: "ok", text: "Profile photo updated." })
    },
    onError: (err) => {
      setProfileImageFile(null)
      if (profileImageInputRef.current) {
        profileImageInputRef.current.value = ""
      }
      setBanner({ type: "error", text: getLaravelErrorMessage(err, "Could not update profile photo.") })
    },
  })

  const saveAllMutation = useMutation({
    mutationFn: async () => {
      const cp = currentPassword.trim()
      const np = newPassword.trim()
      const cf = confirmPassword.trim()
      const wantsPw = cp.length > 0 || np.length > 0 || cf.length > 0
      if (wantsPw && (!cp || !np || !cf)) {
        throw new Error(
          "To change your password, fill current, new, and confirm. Or leave all three empty.",
        )
      }

      const payload = await patchUserSettings(
        {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim() || null,
          wants_marketing_emails: emailNotify,
          settings: {
            notifications: {
              email: emailNotify,
              push: pushNotify,
              sms: smsNotify,
            },
          },
        },
        profileImageFile ? { image: profileImageFile } : undefined,
      )

      if (wantsPw) {
        try {
          await changeUserPassword({
            current_password: cp,
            password: np,
            password_confirmation: cf,
          })
        } catch (err) {
          queryClient.setQueryData(["user-settings"], payload)
          await refreshSession()
          throw new Error(
            `Profile and preferences were saved, but your password could not be updated: ${getLaravelErrorMessage(err)}`,
          )
        }
      }

      return { payload, changedPassword: wantsPw }
    },
    onSuccess: async ({ payload, changedPassword }) => {
      await applySavedProfile(payload)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
      setBanner({
        type: "ok",
        text: changedPassword
          ? "All changes saved, including your new password."
          : "Your details were saved.",
      })
    },
    onError: (err) => {
      setBanner({ type: "error", text: getLaravelErrorMessage(err) })
    },
  })

  const pushPreferenceMutation = useMutation({
    mutationFn: (push: boolean) =>
      patchUserSettings({
        settings: { notifications: { push } },
      }),
    onMutate: async (nextPush) => {
      await queryClient.cancelQueries({ queryKey: ["user-settings"] })
      const previous = queryClient.getQueryData<UserSettingsPayload>(["user-settings"])
      setPushNotify(nextPush)
      return { previous }
    },
    onError: (err, _nextPush, context) => {
      const prev = context?.previous
      if (prev) {
        const notif =
          prev.settings.notifications && typeof prev.settings.notifications === "object"
            ? (prev.settings.notifications as Record<string, unknown>)
            : {}
        setPushNotify(readBool(notif.push, true))
      }
      setBanner({ type: "error", text: getLaravelErrorMessage(err) })
    },
    onSuccess: (payload) => {
      queryClient.setQueryData(["user-settings"], payload)
      const notif =
        payload.settings.notifications && typeof payload.settings.notifications === "object"
          ? (payload.settings.notifications as Record<string, unknown>)
          : {}
      setPushNotify(readBool(notif.push, true))
      setBanner(null)
    },
  })

  const displayName =
    settingsQuery.data?.profile.name?.trim() ||
    user?.name?.trim() ||
    user?.email?.split("@")[0] ||
    "Your account"
  const displayEmail = settingsQuery.data?.profile.email ?? user?.email ?? ""

  const savedAvatarSrc = resolveProfileAvatarUrl(
    settingsQuery.data?.profile,
    user,
    avatarCacheKey || undefined,
  )
  const avatarSrc = profileImagePreview || savedAvatarSrc

  const busy =
    settingsQuery.isLoading ||
    saveAllMutation.isPending ||
    uploadProfileImageMutation.isPending
  const accountVerified = isUserAccountVerified(user)

  function onProfileImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setBanner({ type: "error", text: "Please choose an image file (JPEG, PNG, or WebP)." })
      event.target.value = ""
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setBanner({ type: "error", text: "Profile photo must be 10 MB or smaller." })
      event.target.value = ""
      return
    }
    setBanner(null)
    setProfileImageFile(file)
    uploadProfileImageMutation.mutate(file)
  }

  return (
    <>
      <UserShell>
        <section className="min-h-0 flex-1 bg-chat-surface p-3 sm:p-6 lg:p-8">
          <Link
            to="/user/settings"
            className="mb-4 inline-flex items-center text-sm font-medium text-chat-accent hover:underline"
          >
            ← Back to Settings & Activity
          </Link>
          {banner ? (
            <div
              className={cn(
                "mb-4 rounded-lg px-4 py-3 text-sm",
                banner.type === "error"
                  ? "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200"
                  : "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
              )}
              role={banner.type === "error" ? "alert" : "status"}
            >
              {banner.text}
            </div>
          ) : null}

          {settingsQuery.isError ? (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
              {getLaravelErrorMessage(settingsQuery.error, "Could not load settings.")}
              <Button
                type="button"
                variant="outline"
                className="ml-3 h-8"
                onClick={() => void settingsQuery.refetch()}
              >
                Retry
              </Button>
            </div>
          ) : null}

          {!accountVerified ? (
            <AccountVerificationSection
              user={user}
              className="mb-4"
              onVerified={() => {
                void settingsQuery.refetch()
              }}
            />
          ) : null}

          <div className="rounded-xl bg-card p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative shrink-0 self-start sm:self-auto">
                <HeaderAvatar
                  src={avatarSrc}
                  alt="Profile avatar"
                  className="size-14 rounded-full sm:size-16"
                />
                <input
                  ref={profileImageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  disabled={busy}
                  onChange={onProfileImageChange}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => profileImageInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 rounded-full bg-chat-accent p-1.5 text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Change profile photo"
                >
                  <Camera className="size-3.5" aria-hidden />
                </button>
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-ink sm:text-3xl">{displayName}</h1>
                <p className="truncate text-sm text-body-secondary sm:text-base">{displayEmail}</p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => profileImageInputRef.current?.click()}
                  className="mt-1 text-sm font-medium text-chat-accent hover:underline disabled:opacity-60"
                >
                  {uploadProfileImageMutation.isPending
                    ? "Uploading photo…"
                    : profileImageFile
                      ? "Uploading selected photo…"
                      : "Change profile photo"}
                </button>
              </div>
            </div>
          </div>

          <section className="mt-6">
            <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-ink sm:text-2xl">
              <UserSquare2 className="size-5 text-chat-accent" />
              Personal Information
            </h2>
            <div className="rounded-xl bg-card p-5 shadow-sm sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs text-chat-meta" htmlFor="settings-first-name">
                    First name
                  </label>
                  <Input
                    id="settings-first-name"
                    value={firstName}
                    onChange={(e) => {
                      setBanner(null)
                      setFirstName(e.target.value)
                    }}
                    disabled={busy}
                    className="h-11 rounded-lg border-chat-border-subtle bg-chat-input-bg"
                    autoComplete="given-name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-chat-meta" htmlFor="settings-last-name">
                    Last name
                  </label>
                  <Input
                    id="settings-last-name"
                    value={lastName}
                    onChange={(e) => {
                      setBanner(null)
                      setLastName(e.target.value)
                    }}
                    disabled={busy}
                    className="h-11 rounded-lg border-chat-border-subtle bg-chat-input-bg"
                    autoComplete="family-name"
                  />
                </div>
              </div>
              <EmailVerificationSection
                email={displayEmail}
                emailVerified={Boolean(settingsQuery.data?.profile.email_verified)}
                emailVerificationRequired={Boolean(settingsQuery.data?.profile.email_verification_required)}
                disabled={busy}
                onVerified={() => {
                  void refreshSession()
                }}
              />
              <div className="mt-4 space-y-1.5">
                <label className="text-xs text-chat-meta" htmlFor="settings-phone">
                  Phone number
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-chat-meta" />
                  <Input
                    id="settings-phone"
                    value={phone}
                    onChange={(e) => {
                      setBanner(null)
                      setPhone(e.target.value)
                    }}
                    disabled={busy}
                    className="h-11 rounded-lg border-chat-border-subtle bg-chat-input-bg pl-10"
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6">
            <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-ink sm:text-2xl">
              <Lock className="size-5 text-chat-accent" />
              Password &amp; Security
            </h2>
            <div className="rounded-xl bg-card p-5 shadow-sm sm:p-6">
              <p className="mb-2 text-xs text-chat-meta">
                Leave all password fields empty to keep your current password. New password must be at least 8
                characters.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <PasswordField
                  id="settings-current-password"
                  label="Current password"
                  value={currentPassword}
                  onChange={(v) => {
                    setBanner(null)
                    setCurrentPassword(v)
                  }}
                  disabled={busy || settingsQuery.isError}
                  autoComplete="current-password"
                  visible={showCurrentPassword}
                  onToggleVisible={() => setShowCurrentPassword((p) => !p)}
                  wrapperClassName="sm:col-span-2"
                />
                <PasswordField
                  id="settings-new-password"
                  label="New password"
                  value={newPassword}
                  onChange={(v) => {
                    setBanner(null)
                    setNewPassword(v)
                  }}
                  disabled={busy || settingsQuery.isError}
                  autoComplete="new-password"
                  visible={showNewPassword}
                  onToggleVisible={() => setShowNewPassword((p) => !p)}
                />
                <PasswordField
                  id="settings-confirm-password"
                  label="Confirm new password"
                  value={confirmPassword}
                  onChange={(v) => {
                    setBanner(null)
                    setConfirmPassword(v)
                  }}
                  disabled={busy || settingsQuery.isError}
                  autoComplete="new-password"
                  visible={showConfirmPassword}
                  onToggleVisible={() => setShowConfirmPassword((p) => !p)}
                />
              </div>
              <p className="mt-4 text-xs text-chat-meta">
                Forgot your password? Sign out and use{" "}
                <span className="font-medium text-ink">Forget password</span> on the login page.
              </p>
            </div>
          </section>

          <section className="mt-6">
            <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-ink sm:text-2xl">
              <Bell className="size-5 text-chat-accent" />
              Notification Preferences
            </h2>
            <div className="rounded-xl bg-card shadow-sm">
              <ToggleRow
                title="Email notifications"
                description="Product updates, booking confirmations, and quotes."
                enabled={emailNotify}
                onToggle={(v) => {
                  setBanner(null)
                  setEmailNotify(v)
                }}
                disabled={busy}
                icon={<Mail className="size-4" />}
              />
              <ToggleRow
                title="Push notifications"
                description="Real-time alerts for messages and activity. Saves immediately when toggled."
                enabled={pushNotify}
                onToggle={(v) => {
                  setBanner(null)
                  pushPreferenceMutation.mutate(v)
                }}
                disabled={
                  settingsQuery.isLoading ||
                  settingsQuery.isError ||
                  saveAllMutation.isPending ||
                  pushPreferenceMutation.isPending
                }
                icon={<Bell className="size-4" />}
              />
              <ToggleRow
                title="SMS alerts"
                description="Important security alerts via text message."
                enabled={smsNotify}
                onToggle={(v) => {
                  setBanner(null)
                  setSmsNotify(v)
                }}
                disabled={busy}
                icon={<Smartphone className="size-4" />}
              />
            </div>
          </section>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              className="h-11 w-full rounded-xl bg-brand px-6 text-ice hover:bg-brand/90 sm:w-auto"
              disabled={busy || settingsQuery.isError}
              onClick={() => {
                setBanner(null)
                saveAllMutation.mutate()
              }}
            >
              <Save className="size-4" />
              {saveAllMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-1 text-sm text-brand-red sm:justify-start"
            >
              <ShieldCheck className="size-4" />
              Deactivate account
            </button>
          </div>
        </section>
      </UserShell>

      <footer className="bg-footer-bar">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-14 xl:px-12">
          <div className="grid gap-8 md:grid-cols-[280px_1fr]">
            <div>
              <img src={LOGO_FOOTER} alt="Gidira" className="h-8 w-auto" />
              <p className="mt-4 text-sm text-white">FIND BETTER | CONNECT FASTER</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              {footerColumns.map((column) => (
                <div key={column.title}>
                  <h4 className="text-base font-semibold text-white">{column.title}</h4>
                  <ul className="mt-4 space-y-2">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <Link to={link.to} className="text-sm text-footer-muted hover:text-white">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 border-t border-white/20 pt-8 text-center">
            <p className="text-sm text-footer-muted">
              © 2026 GIDIRA. All rights reserved. Built for Nigeria&apos;s Digital Economy.
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
