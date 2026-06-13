import { Gauge, Headset } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { VendorDashboardCardProps } from "../dashboardTypes";

export function DashboardSupportCard({ dashboard }: VendorDashboardCardProps) {
  return (
    <Card className="overflow-hidden rounded-xl border-border-light shadow-sm">
      <div className="space-y-4 p-6 md:p-8">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white shadow-sm">
            <Gauge className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <h3 className="text-xl font-bold text-foreground font-manrope">Dedicated Support</h3>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {dashboard.support.avgResponseLabel}
            </p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground font-inter">
          Need help optimizing your profile or managing your listings? Our experts are here for you.
        </p>
        <Button
          type="button"
          size="sm"
          className="gap-2 rounded-lg border-0 bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-950 shadow-none hover:bg-sky-200/90"
          asChild
        >
          <Link to="/vendor/leads?channel=admin">
            <Headset className="size-4" aria-hidden />
            Contact Support
          </Link>
        </Button>
      </div>
    </Card>
  );
}
