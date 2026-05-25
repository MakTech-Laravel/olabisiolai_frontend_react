import { PremiumAccessButton } from "@/components/partials/vendor/PremiumAccessButton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DashboardPremiumCtaBar() {
  return (
    <Card className={cn("border-brand-red/30 bg-brand-red text-white")}>
      <CardContent className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
        <p className="inline-flex items-center gap-2 text-sm font-medium sm:text-base">
          Grow your business faster with Premium
        </p>
        <PremiumAccessButton variant="secondary" className="bg-white text-brand-red hover:bg-white/90">
          Upgrade Now
        </PremiumAccessButton>
      </CardContent>
    </Card>
  );
}
