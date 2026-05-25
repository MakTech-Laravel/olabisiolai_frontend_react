import { ArrowRight, Search, ShieldCheck, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EstimatedReachCard() {
  const navigate = useNavigate();

  return (
    <>
      <Card className="border-0 bg-gradient-to-b from-[#0a2a5f] to-[#092047] text-white">
        <CardContent className="space-y-4 p-5">
          <div className="flex gap-2 items-center">
            <div className="relative w-10 h-10">
              <TrendingUp className="w-6 h-6 text-pink-200" />
              <Search className="w-6 h-6 absolute bottom-0 right-0 text-pink-200" />
            </div>
            <p className="text-lg font-inter font-bold text-success-foreground">Estimated Reach</p>
          </div>
          <div className="mt-8">
            <p className="text-xs font-inter  text-success-foreground/80">Potential Views</p>
            <p className="text-5xl font-extrabold font-inter">
              42.5K <span className="text-sm font-extrabold font-inter">+12%</span>{" "}
            </p>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between text-xs">
              <span className="text-success-foreground/80">Target Accuracy</span>
              <span className="font-semibold">High (88%)</span>
            </div>
            <div className="h-2 rounded-full bg-white/20">
              <div className="h-full w-[88%] rounded-full bg-brand-red" />
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-success-foreground/80">Target Accuracy</span>
              <span className="font-semibold">180 - 240</span>
            </div>
          </div>

          <div className="mt-8 rounded-md bg-white/10 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-normal font-inter text-xs text-success-foreground/80">Current Plan</span>
              <span className="font-normal font-inter text-xs text-success-foreground/80">Premium Vendor</span>
            </div>
            <div className="mt-1 flex items-center  justify-between">
              <span className="font-bold font-inter text-xs text-success-foreground">Daily Limit</span>
              <span className="font-bold font-inter text-xs text-success-foreground">6,000 Views</span>
            </div>
          </div>

          <Button className="w-full bg-brand-red text-white hover:bg-brand-red/90" onClick={() => navigate("/vendor/boost/review-pay")}>
            Proceed to Payment
            <ArrowRight className="size-4" />
          </Button>

          <p className="text-center text-[10px] uppercase tracking-wide text-sky-100/80">Secure checkout by Gidira Pay</p>
        </CardContent>
      </Card>

      <Card className="bg-sky-50">
        <CardContent className="inline-flex items-start gap-2 p-4 text-sm text-sky-900">
          <ShieldCheck className="mt-0.5 size-4" />
          If your reach falls below 80% of our estimate, we'll extend your boost for 24 hours at no extra cost.
        </CardContent>
      </Card>
    </>
  );
}
