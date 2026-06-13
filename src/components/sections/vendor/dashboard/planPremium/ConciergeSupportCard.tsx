import { Headset, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ConciergeSupportCard() {
  return (
    <Card className="rounded-2xl border-border-light bg-card shadow-sm">
      <CardContent className="space-y-5 p-6 md:p-8">
        <div className="flex gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sky-700">
            <Headset className="size-6" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <h3 className="text-xl font-bold text-foreground font-manrope">Dedicated concierge support</h3>
            <p className="text-sm leading-relaxed text-muted-foreground font-inter">
              24/7 priority line for Premium vendors — get help with listings, boosts, and account settings whenever you
              need it.
            </p>
          </div>
        </div>
        <div className="flex gap-2 items-center mt-10">
          <Button
            className="flex-1 bg-brand-red font-inter font-semibold text-white hover:bg-brand-red/90 sm:flex-auto"
            asChild
          >
            <Link to="/vendor/leads?channel=admin">Contact support</Link>
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-11 w-11 shrink-0 border-border"
            aria-label="Open messages"
            asChild
          >
            <Link to="/vendor/leads?channel=admin">
              <MessageSquare className="size-5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
