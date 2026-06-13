import { BadgeCheck, Eye } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useVendorProfileContext } from "@/components/sections/vendor/profile/VendorProfileContext";

function Label({ children }: { children: string }) {
  return (
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

function verificationLabel(status: string, isFlagged: boolean): string {
  if (status === "approved") return "Verified";
  if (isFlagged) return "Verification flagged";
  if (status === "pending") return "Pending verification";
  return "Not verified yet";
}

export function ProfileVisibilityCard() {
  const { profile } = useVendorProfileContext();
  if (!profile) return null;

  const isActive = profile.businessStatus === "active";
  const isVerified = profile.verificationStatus === "approved";
  const isFlagged = profile.isFlagged;
  const isPending = profile.verificationStatus === "pending" && !isFlagged;

  return (
    <Card className="overflow-hidden rounded-xl border-border-light shadow-sm">
      <CardHeader className="space-y-1 border-b border-border-light px-6 py-5">
        <CardTitle className="text-lg font-bold text-foreground font-manrope">Profile Visibility</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Eye className="size-5" aria-hidden />
          </div>
          <div>
            <p className="font-semibold text-foreground font-manrope">
              {isActive ? "Profile visible" : "Profile hidden"}
            </p>
            <p className="text-sm text-muted-foreground font-inter">
              {isActive
                ? "Your listing appears in customer search results."
                : "Your listing is hidden while your account is inactive or suspended. Contact support if you need help."}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "rounded-lg border p-4",
            isVerified
              ? "border-emerald-200 bg-emerald-50"
              : isFlagged
                ? "border-red-200 bg-red-50"
                : isPending
                  ? "border-amber-200 bg-amber-50"
                  : "border-gray-200 bg-gray-50",
          )}
        >
          <div className="flex gap-3">
            <BadgeCheck
              className={cn(
                "size-5 shrink-0",
                isVerified
                  ? "text-emerald-600"
                  : isFlagged
                    ? "text-red-600"
                    : isPending
                      ? "text-amber-600"
                      : "text-gray-500",
              )}
              aria-hidden
            />
            <div>
              <p
                className={cn(
                  "font-semibold font-manrope",
                  isVerified
                    ? "text-emerald-800"
                    : isFlagged
                      ? "text-red-800"
                      : isPending
                        ? "text-amber-800"
                        : "text-gray-800",
                )}
              >
                {verificationLabel(profile.verificationStatus, isFlagged)}
              </p>
              <p
                className={cn(
                  "text-sm font-inter",
                  isVerified
                    ? "text-emerald-700"
                    : isFlagged
                      ? "text-red-700"
                      : isPending
                        ? "text-amber-700"
                        : "text-gray-600",
                )}
              >
                {isVerified
                  ? "Your business is verified on the platform"
                  : isFlagged
                    ? "Admin flagged your application. Fix issues and apply again."
                    : isPending
                      ? "Verification is under admin review"
                      : "Apply for verification to build more trust with customers"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Listing status</Label>
          <p className="text-sm capitalize text-foreground">
            Business: <span className="font-medium">{profile.businessStatus}</span>
            {profile.boostStatus === "active" ? (
              <span className="ml-2 text-sky-600">· Boost active</span>
            ) : null}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
