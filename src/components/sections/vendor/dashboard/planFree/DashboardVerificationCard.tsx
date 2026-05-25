import { BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { VendorDashboardCardProps } from "../dashboardTypes";

const badgeClass: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  amber: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  red: "bg-red-100 text-red-700 hover:bg-red-100",
  muted: "bg-muted text-muted-foreground hover:bg-muted",
};

export function DashboardVerificationCard({ dashboard }: VendorDashboardCardProps) {
  const { verification } = dashboard;

  return (
    <Card>
      <div className="space-y-3 p-8">
        <h2 className="text-xl font-bold text-foreground font-manrope">Verification Status</h2>
        <div className="space-y-3">
          <Badge className={cn(badgeClass[verification.badgeTone] ?? badgeClass.muted)}>
            <BadgeCheck className="mr-1 size-3.5" />
            {verification.statusLabel}
          </Badge>
          <div className="max-w-xl">
            <p>{verification.description}</p>
          </div>
          <Button variant="outline" size="sm" className="w-full font-inter text-base font-bold" asChild>
            <Link to="/vendor/verification">View Status</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
