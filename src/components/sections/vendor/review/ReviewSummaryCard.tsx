import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { summaryRows } from "./reviewData";

export function ReviewSummaryCard() {
  return (
    <Card>
      <CardContent className="space-y-4 p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold font-inter">Customer Reviews</h2>
            <p className="text-base font-inter text-muted-foreground">Manage and respond to customer feedback</p>
          </div>
          <div className="text-right">
            <p className="inline-flex items-center gap-1 text-4xl font-bold">
              <Star className="size-5 fill-yellow-400 text-yellow-400" />
              4.6
            </p>
            <p className="text-xs text-muted-foreground">28 reviews</p>
          </div>
        </div>

        <div className="space-y-2">
          {summaryRows.map((row) => (
            <div key={row.stars} className="grid grid-cols-[22px_1fr_20px] items-center gap-10 text-xs">
              <span className="font-inter font-medium text-sm">{row.stars}*</span>
              <div className="h-2 rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-yellow-400" style={{ width: `${row.percent}%` }} />
              </div>
              <span className="text-right text-muted-foreground">{row.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
