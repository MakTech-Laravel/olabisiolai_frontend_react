import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Loader2, Mail, MapPin, Phone, Star, X } from "lucide-react";
import {
  fetchAdminBusinessDetail,
  type AdminBusinessDetail,
} from "@/features/business/adminBusinessInfoApi";
import { resolveMediaUrl } from "@/lib/mediaUrl";

type Status = AdminBusinessDetail["status"];
type Verification = AdminBusinessDetail["verification"];
type Boost = AdminBusinessDetail["boost"];

interface BusinessDetailsModalProps {
  open: boolean;
  onClose: () => void;
  businessId: number | null;
}

const statusStyles: Record<Status, string> = {
  pending: "bg-orange-50 text-orange-500 border border-orange-200",
  active: "bg-green-50 text-green-600 border border-green-200",
  inactive: "bg-amber-50 text-amber-700 border border-amber-200",
  suspended: "bg-red-50 text-red-500 border border-red-200",
};

const verificationStyles: Record<Verification, string> = {
  none: "bg-gray-100 text-gray-600 border border-gray-200",
  pending: "bg-orange-50 text-orange-500 border border-orange-200",
  verified: "bg-green-50 text-green-600 border border-green-200",
  flagged: "bg-red-50 text-red-500 border border-red-200",
};

const boostStyles: Record<Boost, string> = {
  none: "bg-gray-100 text-gray-500 border border-gray-200",
  active: "bg-blue-50 text-blue-500 border border-blue-200",
};

function statusLabel(status: Status): string {
  if (status === "inactive") return "Inactive";
  if (status === "suspended") return "Suspended";
  if (status === "active") return "Active";
  return "Pending";
}

function verificationLabel(verification: Verification): string {
  if (verification === "verified") return "Verified";
  if (verification === "none") return "Not applied";
  if (verification === "flagged") return "Flagged";
  return verification.charAt(0).toUpperCase() + verification.slice(1);
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <div className="text-sm text-gray-800">{children}</div>
    </div>
  );
}

function formatDate(value: string) {
  if (!value.trim()) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function normalizeWebsite(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function BusinessDetailsModal({ open, onClose, businessId }: BusinessDetailsModalProps) {
  const detailQuery = useQuery({
    queryKey: ["admin", "business-info", "detail", businessId],
    queryFn: () => fetchAdminBusinessDetail(businessId as number),
    enabled: open && businessId !== null,
  });

  if (!open || businessId === null) return null;

  const business = detailQuery.data;
  const errorMessage =
    detailQuery.error instanceof Error && detailQuery.error.message.trim()
      ? detailQuery.error.message
      : "Failed to load business details.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-gray-600 shadow-sm hover:bg-gray-100"
        >
          <X className="size-4" />
        </button>

        {detailQuery.isLoading ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 p-8">
            <Loader2 className="size-8 animate-spin text-gray-400" />
            <p className="text-sm text-gray-500">Loading business details…</p>
          </div>
        ) : null}

        {detailQuery.isError ? (
          <div className="p-8">
            <h2 className="text-lg font-semibold text-gray-900">Business Details</h2>
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          </div>
        ) : null}

        {business ? (
          <>
            {business.coverPhotoUrls.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto border-b border-gray-100 bg-gray-50 p-3">
                {business.coverPhotoUrls.map((url, index) => (
                  <img
                    key={`${url}-${index}`}
                    src={resolveMediaUrl(url)}
                    alt={`${business.name} cover ${index + 1}`}
                    className="h-36 w-56 shrink-0 rounded-lg object-cover"
                  />
                ))}
              </div>
            ) : null}

            <div className="overflow-y-auto p-6 pt-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <img
                  src={resolveMediaUrl(business.logoUrl)}
                  alt={`${business.name} logo`}
                  className="h-20 w-20 shrink-0 rounded-xl border border-gray-200 object-cover bg-gray-50"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = resolveMediaUrl("/images/default.jpg");
                  }}
                />
                <div className="min-w-0 flex-1 pr-8">
                  <h2 className="text-xl font-semibold text-gray-900">{business.name}</h2>
                  <p className="mt-1 text-sm text-gray-600">{business.category}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge label={statusLabel(business.status)} className={statusStyles[business.status]} />
                    <Badge
                      label={verificationLabel(business.verification)}
                      className={verificationStyles[business.verification]}
                    />
                    <Badge
                      label={business.boost === "active" ? "Active boost" : "No boost"}
                      className={boostStyles[business.boost]}
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-sm text-gray-600">
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                    <span className="font-medium text-gray-900">{business.averageRating.toFixed(1)}</span>
                    <span>({business.reviewsCount} reviews)</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <DetailRow label="Location">
                  <span className="inline-flex items-start gap-1.5">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-gray-400" />
                    {business.locationFull || business.location}
                  </span>
                </DetailRow>
                <DetailRow label="Joined">
                  {formatDate(business.joinDate)}
                </DetailRow>
                <DetailRow label="Last updated">
                  {formatDate(business.updatedAt)}
                </DetailRow>
                <DetailRow label="Phone">
                  {business.phone ? (
                    <a href={`tel:${business.phone}`} className="inline-flex items-center gap-1.5 text-brand-red hover:underline">
                      <Phone className="size-4" />
                      {business.phone}
                    </a>
                  ) : (
                    "—"
                  )}
                </DetailRow>
                <DetailRow label="WhatsApp">
                  {business.whatsapp ? (
                    <a
                      href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-red hover:underline"
                    >
                      {business.whatsapp}
                    </a>
                  ) : (
                    "—"
                  )}
                </DetailRow>
                <DetailRow label="Website">
                  {business.website ? (
                    <a
                      href={normalizeWebsite(business.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-brand-red hover:underline"
                    >
                      {business.website}
                      <ExternalLink className="size-3.5" />
                    </a>
                  ) : (
                    "—"
                  )}
                </DetailRow>
              </div>

              {business.description ? (
                <div className="mt-6">
                  <DetailRow label="Description">{business.description}</DetailRow>
                </div>
              ) : null}

              {business.services.length > 0 ? (
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Services offered</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {business.services.map((service) => (
                      <li
                        key={service}
                        className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700"
                      >
                        {service}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {business.vendor ? (
                <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Vendor</p>
                  <p className="mt-2 font-medium text-gray-900">{business.vendor.name}</p>
                  {business.vendor.email ? (
                    <a
                      href={`mailto:${business.vendor.email}`}
                      className="mt-1 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-red"
                    >
                      <Mail className="size-4" />
                      {business.vendor.email}
                    </a>
                  ) : null}
                  {business.vendor.phone ? (
                    <p className="mt-1 text-sm text-gray-600">{business.vendor.phone}</p>
                  ) : null}
                </div>
              ) : null}

              {business.messages.length > 0 ? (
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Admin messages</p>
                  <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto">
                    {business.messages.map((msg) => (
                      <li key={msg.id} className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm">
                        <p className="text-gray-800">{msg.message}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {msg.adminName} · {msg.createdAt}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
