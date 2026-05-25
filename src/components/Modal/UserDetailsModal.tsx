import { BriefcaseBusiness, Copy, UserRound, X } from "lucide-react";
import { useState } from "react";

import { showSuccess } from "@/lib/sweetAlert";

export type UserRole = "user" | "vendor" | "admin";

export type UserAccountProfile = {
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  location?: string | null;
  image_url?: string | null;
  wants_marketing_emails?: boolean;
  email_verified_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type VendorBusinessProfile = {
  id?: number;
  business_name?: string;
  business_description?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  verification_status?: string;
  business_status?: string;
  is_premium?: boolean;
  subscription_plan?: string | null;
  average_rating?: number;
  reviews_count?: number;
  logo_url?: string | null;
  category?: { name?: string } | null;
  location?: { full_name?: string; name?: string; state?: string } | null;
  created_at?: string | null;
};

export type UserDetailsRow = {
  id?: number;
  uuid?: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  status: "active" | "blocked" | "pending";
  joinDate: string;
  userProfile?: UserAccountProfile | null;
  vendorProfile?: VendorBusinessProfile | null;
};

interface UserDetailsModalProps {
  open: boolean;
  onClose: () => void;
  user: UserDetailsRow | null;
  loading?: boolean;
}

function statusClass(status: UserDetailsRow["status"]) {
  if (status === "active") return "bg-success/10 text-success";
  if (status === "pending") return "bg-amber-100 text-amber-600";
  return "bg-tint-red text-brand-red";
}

function roleClass(role: UserRole) {
  if (role === "admin") return "bg-tint-red text-brand-red";
  if (role === "vendor") return "bg-amber-100 text-amber-600";
  return "bg-surface-soft text-chat-accent";
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">{label}</p>
      <p className="mt-0.5 text-sm text-ink break-all">{value ?? "—"}</p>
    </div>
  );
}

function CopyableUuid({ uuid }: { uuid: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(uuid);
      setCopied(true);
      showSuccess("UUID copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="rounded-lg bg-muted px-2 py-1 text-sm font-mono text-ink">{uuid}</code>
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="inline-flex items-center gap-1 rounded-lg border border-border-gray px-2 py-1 text-xs font-medium text-body-secondary hover:bg-muted"
      >
        <Copy className="size-3.5" />
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export function UserDetailsModal({ open, onClose, user, loading = false }: UserDetailsModalProps) {
  if (!open || !user) return null;

  const profile = user.userProfile;
  const vendor = user.vendorProfile;
  const showVendorProfile = user.role === "vendor" && Boolean(vendor);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-details-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-body-secondary hover:bg-muted"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <div className="space-y-6 pr-6">
          <div className="border-b border-border-gray pb-4">
            <h2 id="user-details-title" className="text-2xl font-semibold text-ink">
              User Details
            </h2>
            <p className="mt-1 text-sm text-body-secondary">{user.name}</p>
          </div>

          {loading ? (
            <p className="text-sm text-chat-meta">Loading profile…</p>
          ) : null}

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-ink">Account</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {user.id != null ? <DetailField label="User ID" value={String(user.id)} /> : null}
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">UUID</p>
                {user.uuid ? (
                  <div className="mt-0.5">
                    <CopyableUuid uuid={user.uuid} />
                  </div>
                ) : (
                  <p className="mt-0.5 text-sm text-ink">—</p>
                )}
              </div>
              <DetailField label="Name" value={user.name} />
              <DetailField label="Phone" value={user.phone} />
              <DetailField label="Email" value={user.email} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Role</p>
                <span
                  className={`mt-1 inline-flex min-w-[70px] justify-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${roleClass(user.role)}`}
                >
                  {user.role}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Status</p>
                <span
                  className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(user.status)}`}
                >
                  {user.status === "active" ? "Active" : user.status === "pending" ? "Pending" : "Blocked"}
                </span>
              </div>
              <DetailField label="Join Date" value={user.joinDate} />
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-border-gray bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <UserRound className="size-4 text-chat-accent" />
                <h3 className="text-sm font-semibold text-ink">User Profile</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailField label="First Name" value={profile?.first_name ?? user.name.split(" ")[0]} />
                <DetailField label="Last Name" value={profile?.last_name ?? "—"} />
                <DetailField label="Location" value={profile?.location} />
                <DetailField
                  label="Marketing Emails"
                  value={profile?.wants_marketing_emails ? "Opted in" : "Opted out"}
                />
                <DetailField label="Email Verified" value={profile?.email_verified_at ?? "Not verified"} />
                {profile?.image_url ? (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Profile Photo</p>
                    <img
                      src={profile.image_url}
                      alt=""
                      className="mt-2 size-16 rounded-full border border-border-gray object-cover"
                    />
                  </div>
                ) : null}
              </div>
            </section>

          {showVendorProfile && vendor ? (
            <section className="space-y-3 rounded-xl border border-amber-200/60 bg-amber-50/40 p-4">
              <div className="flex items-center gap-2">
                <BriefcaseBusiness className="size-4 text-amber-700" />
                <h3 className="text-sm font-semibold text-ink">Vendor Profile</h3>
              </div>
              {vendor.logo_url ? (
                <img
                  src={vendor.logo_url}
                  alt=""
                  className="size-14 rounded-lg border border-border-gray object-cover"
                />
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailField label="Business Name" value={vendor.business_name} />
                <DetailField
                  label="Category"
                  value={vendor.category?.name ?? "—"}
                />
                <DetailField
                  label="Location"
                  value={
                    vendor.location?.full_name ??
                    ([vendor.location?.name, vendor.location?.state]
                      .filter(Boolean)
                      .join(", ") || "—")
                  }
                />
                <DetailField label="Business Phone" value={vendor.phone} />
                <DetailField label="WhatsApp" value={vendor.whatsapp} />
                <DetailField label="Website" value={vendor.website} />
                <DetailField label="Verification" value={vendor.verification_status} />
                <DetailField label="Business Status" value={vendor.business_status} />
                <DetailField
                  label="Premium"
                  value={vendor.is_premium ? `Yes (${vendor.subscription_plan ?? "plan"})` : "No"}
                />
                <DetailField
                  label="Rating"
                  value={
                    vendor.reviews_count != null && vendor.reviews_count > 0
                      ? `${vendor.average_rating ?? 0} (${vendor.reviews_count} reviews)`
                      : "No reviews yet"
                  }
                />
                {vendor.business_description ? (
                  <div className="sm:col-span-2">
                    <DetailField label="Description" value={vendor.business_description} />
                  </div>
                ) : null}
              </div>
            </section>
          ) : user.role === "vendor" ? (
            <section className="rounded-xl border border-dashed border-border-gray p-4 text-sm text-chat-meta">
              No vendor business profile has been created yet.
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
