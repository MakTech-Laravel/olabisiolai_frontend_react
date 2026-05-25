import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent } from "@/components/ui/card";
import { fetchVendorBoostCatalog } from "@/features/boost/vendorBoostApi";
import { cn } from "@/lib/utils";

const tierBorder: Record<string, string> = {
  GOLD: "border-l-yellow-500",
  SILVER: "border-l-slate-400",
  BRONZE: "border-l-amber-700",
};

export function ActiveBoostsCard() {
  const { data: catalog, isPending } = useQuery({
    queryKey: ["vendor", "boost", "catalog"],
    queryFn: fetchVendorBoostCatalog,
    staleTime: 30_000,
  });

  const activeRows = (catalog?.campaigns ?? []).filter((c) => c.display_status === "active");
  const pendingRows = (catalog?.campaigns ?? []).filter((c) => c.display_status === "pending_admin");
  const displayRows = [...activeRows, ...pendingRows].slice(0, 5);

  return (
    <Card className="rounded-2xl border-border-light bg-card shadow-sm">
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b border-border-light px-6 py-5 md:px-8">
          <h3 className="text-xl font-bold text-foreground font-manrope">Active boosts</h3>
          <Link
            to="/vendor/boost"
            className="text-sm font-semibold text-primary hover:underline font-inter"
          >
            Manage all
          </Link>
        </div>
        <ul className="divide-y divide-border-light px-6 py-2 md:px-8">
          {isPending ? (
            <li className="py-6 text-sm text-muted-foreground">Loading boosts…</li>
          ) : displayRows.length === 0 ? (
            <li className="py-6 text-sm text-muted-foreground">No active or pending boosts.</li>
          ) : (
            displayRows.map((row) => (
              <li
                key={row.id}
                className={cn(
                  "border-l-4 py-4 pl-4",
                  tierBorder[row.tier_badge] ?? "border-l-primary",
                )}
              >
                <p className="font-semibold text-foreground font-manrope">
                  {row.tier_label} · {row.location?.lga}
                </p>
                <p
                  className={cn(
                    "mt-1 text-xs uppercase tracking-wide font-inter",
                    row.display_status === "pending_admin"
                      ? "text-amber-700 font-semibold"
                      : "text-muted-foreground",
                  )}
                >
                  {row.display_status === "active"
                    ? `${row.duration_left_label ?? "Active"} remaining`
                    : row.display_status_label}
                </p>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
