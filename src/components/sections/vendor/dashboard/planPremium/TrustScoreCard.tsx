import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { VendorDashboardCardProps } from "../dashboardTypes";

export function TrustScoreCard({ dashboard }: VendorDashboardCardProps) {
  const { stats } = dashboard;

  return (
    <Card className="rounded-2xl border-border-light bg-card shadow-sm">
      <CardContent className="space-y-5 p-6 md:p-8">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Shield className="size-6" aria-hidden />
          </div>
          <Link
            to="/vendor/verification"
            className="text-[11px] font-bold uppercase tracking-wide text-primary hover:underline font-inter"
          >
            Trust status
          </Link>
        </div>
        <TrustScoreValue score={stats.trustScore} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-sky-50/90 px-4 py-3 dark:bg-sky-950/30">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Profile strength
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground font-inter">{stats.profileStrength}</p>
          </div>
          <div className="rounded-xl bg-sky-50/90 px-4 py-3 dark:bg-sky-950/30">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Vendor tier</p>
            <p className="mt-1 text-sm font-semibold text-foreground font-inter">{stats.vendorTier}</p>
          </div>
        </div>
        <Button className="w-full bg-primary font-inter font-semibold text-primary-foreground hover:bg-primary/90" asChild>
          <Link to="/vendor/verification">View details</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function TrustScoreValue({ score }: { score: number }) {
  return (
    <div>
      <p className="font-manrope text-4xl font-bold tracking-tight text-foreground">
        {score}
        <span className="text-lg font-semibold text-muted-foreground"> / 100</span>
      </p>
    </div>
  );
}
