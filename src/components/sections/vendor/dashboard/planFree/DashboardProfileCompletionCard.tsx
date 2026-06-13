import { Check, Circle } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { VendorDashboardCardProps } from "../dashboardTypes";

export function DashboardProfileCompletionCard({ dashboard }: VendorDashboardCardProps) {
  const { profileCompletion } = dashboard;

  const nextHref =
    profileCompletion.nextStepKey === "profile_photo"
      ? "/vendor/profile"
      : profileCompletion.nextStepKey === "verified_id"
        ? "/vendor/verification"
        : "/vendor/profile";

  return (
    <Card>
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground font-manrope sm:text-xl">Profile Completion</h2>
          <h2 className="text-lg font-bold text-brand-red font-manrope sm:text-xl">{profileCompletion.percent}%</h2>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-blue-100/70">
          <ProfileCompletionBar percent={profileCompletion.percent} />
        </div>
        <div className="text-xs text-muted-foreground space-y-2">
          {profileCompletion.items.map((item) => (
            <p
              key={item.key}
              className="flex items-center gap-1.5 text-sm font-normal text-foreground font-inter sm:text-base"
            >
              {item.done ? (
                <Check className="size-3 rounded-full bg-success text-success-foreground sm:size-4" />
              ) : (
                <Circle className="size-2.5 text-muted-foreground sm:size-3.5" />
              )}
              {item.label}
            </p>
          ))}
        </div>
        <Button
          variant="secondary"
          className="w-full bg-blue-100 py-2.5 text-sm font-semibold text-foreground font-inter hover:bg-blue-100/80 sm:py-3 sm:text-base"
          asChild
        >
          <Link to={nextHref}>
            {profileCompletion.nextStepLabel
              ? `Complete: ${profileCompletion.nextStepLabel}`
              : "View profile"}
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function ProfileCompletionBar({ percent }: { percent: number }) {
  return (
    <div
      className="h-full rounded-full bg-brand-red transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
    />
  );
}
