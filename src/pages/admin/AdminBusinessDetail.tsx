import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Loader2, Mail, MapPin, Phone, Star } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  fetchAdminBusinessDetail,
  type AdminBusinessDetail,
  type AdminBusinessPaymentHistoryItem,
} from "@/features/business/adminBusinessInfoApi";
import { formatMoney } from "@/lib/currency";
import { resolveMediaUrl } from "@/lib/mediaUrl";

type Status = AdminBusinessDetail["status"];
type Verification = AdminBusinessDetail["verification"];
type Boost = AdminBusinessDetail["boost"];

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

function transactionTypeLabel(type: string): string {
  if (type === "subscription") return "Subscription";
  if (type === "verification") return "Verification";
  if (type === "boost") return "Boost";
  if (type === "wallet_top_up") return "Wallet top-up";
  return type.replace(/_/g, " ");
}

function subscriptionPackageLabel(item: AdminBusinessPaymentHistoryItem): string | null {
  if (item.transactionType !== "subscription") return null;
  if (item.packageLabel) return item.packageLabel;
  const key = (item.packageId ?? "").toLowerCase();
  if (key.includes("yearly") || key.includes("annual")) return "Yearly";
  if (key.includes("monthly")) return "Monthly";
  if (key.includes("quarterly")) return "Quarterly";
  if (key.includes("lifetime")) return "Lifetime";
  return null;
}

function methodLabel(method: string): string {
  if (method === "bank_transfer") return "Bank transfer";
  if (method === "waived") return "Waived";
  if (method === "wallet") return "Wallet";
  if (method === "card") return "Card";
  return method;
}

function paymentStatusClass(status: string): string {
  if (status === "completed") return "bg-green-50 text-green-700 border-green-200";
  if (status === "pending") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-600 border-red-200";
}

function PaymentHistorySection({
  history,
}: {
  history: AdminBusinessDetail["paymentHistory"];
}) {
  const { summary, items } = history;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Transaction history</h2>
          <p className="mt-1 text-sm text-gray-600">
            All payments linked to this business profile.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Total</p>
          <p className="mt-0.5 text-xl font-semibold text-gray-900">{summary.totalTransactions}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Completed</p>
          <p className="mt-0.5 text-xl font-semibold text-green-700">{summary.completedTransactions}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Pending</p>
          <p className="mt-0.5 text-xl font-semibold text-amber-700">{summary.pendingTransactions}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Paid total</p>
          <p className="mt-0.5 text-xl font-semibold text-gray-900">
            {formatMoney(summary.totalAmountCompleted)}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          No transactions found for this business.
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item: AdminBusinessPaymentHistoryItem) => {
                  const packageLabel = subscriptionPackageLabel(item);
                  return (
                    <tr key={`${item.id}-${item.reference}`} className="bg-white">
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {item.dateShort || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-gray-800">
                            {transactionTypeLabel(item.transactionType)}
                            {packageLabel ? ` · ${packageLabel}` : ""}
                          </span>
                          {item.manualGrant ? (
                            <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                              Manual
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                        {formatMoney(item.amount, item.currency)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {methodLabel(item.method)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${paymentStatusClass(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td
                        className="max-w-[220px] truncate px-4 py-3 font-mono text-xs text-gray-500"
                        title={item.reference}
                      >
                        {item.reference}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default function AdminBusinessDetail() {
  const { businessId } = useParams<{ businessId: string }>();
  const id = Number(businessId);

  const detailQuery = useQuery({
    queryKey: ["admin", "business-info", "detail", id],
    queryFn: () => fetchAdminBusinessDetail(id),
    enabled: Number.isFinite(id) && id > 0,
  });

  if (!Number.isFinite(id) || id <= 0) {
    return (
      <div className="container mx-auto p-2 md:p-4">
        <Link
          to="/admin/businesses"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="size-4" />
          Back to Businesses
        </Link>
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Invalid business id.
        </p>
      </div>
    );
  }

  const business = detailQuery.data;
  const errorMessage =
    detailQuery.error instanceof Error && detailQuery.error.message.trim()
      ? detailQuery.error.message
      : "Failed to load business details.";

  return (
    <div className="container mx-auto space-y-4 p-2 md:p-4">
      <Link
        to="/admin/businesses"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="size-4" />
        Back to Businesses
      </Link>

      {detailQuery.isLoading ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <Loader2 className="size-8 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">Loading business details…</p>
        </div>
      ) : null}

      {detailQuery.isError ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">Business Details</h1>
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        </div>
      ) : null}

      {business ? (
        <>
          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {business.coverPhotoUrls.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto border-b border-gray-100 bg-gray-50 p-3">
                {business.coverPhotoUrls.map((url, index) => (
                  <img
                    key={`${url}-${index}`}
                    src={resolveMediaUrl(url)}
                    alt={`${business.name} cover ${index + 1}`}
                    className="h-40 w-64 shrink-0 rounded-lg object-cover sm:h-48 sm:w-80"
                  />
                ))}
              </div>
            ) : null}

            <div className="p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <img
                  src={resolveMediaUrl(business.logoUrl)}
                  alt={`${business.name} logo`}
                  className="h-20 w-20 shrink-0 rounded-xl border border-gray-200 bg-gray-50 object-cover"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = resolveMediaUrl("https://placehold.net/600x400.png");
                  }}
                />
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-semibold text-gray-900">{business.name}</h1>
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

              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <DetailRow label="Location">
                  <span className="inline-flex items-start gap-1.5">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-gray-400" />
                    {business.locationFull || business.location || "N/A"}
                  </span>
                </DetailRow>
                <DetailRow label="Joined">{formatDate(business.joinDate)}</DetailRow>
                <DetailRow label="Last updated">{formatDate(business.updatedAt)}</DetailRow>
                <DetailRow label="Phone">
                  {business.phone ? (
                    <a
                      href={`tel:${business.phone}`}
                      className="inline-flex items-center gap-1.5 text-brand-red hover:underline"
                    >
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Services offered
                  </p>
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
            </div>
          </section>

          {business.vendor ? (
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Vendor</p>
              <p className="mt-2 text-lg font-medium text-gray-900">{business.vendor.name}</p>
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
                {business.vendor.email ? (
                  <a
                    href={`mailto:${business.vendor.email}`}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-red"
                  >
                    <Mail className="size-4" />
                    {business.vendor.email}
                  </a>
                ) : null}
                {business.vendor.phone ? (
                  <p className="text-sm text-gray-600">{business.vendor.phone}</p>
                ) : null}
              </div>
            </section>
          ) : null}

          <PaymentHistorySection history={business.paymentHistory} />

          {business.messages.length > 0 ? (
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Admin messages
              </p>
              <ul className="mt-3 space-y-2">
                {business.messages.map((msg) => (
                  <li key={msg.id} className="rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2.5 text-sm">
                    <p className="text-gray-800">{msg.message}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {msg.adminName} · {msg.createdAt}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
