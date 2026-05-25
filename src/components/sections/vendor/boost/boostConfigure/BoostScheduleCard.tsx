import { AlarmCheck, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function BoostScheduleCard() {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <p className="inline-flex items-center gap-2 text-xl font-manrope font-bold">
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-muted text-xl font-manrope font-bold">
            2
          </span>
          Boost Schedule
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Start Date</p>
            <div className="inline-flex w-full items-center gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm">
              <CalendarDays className="size-4 text-muted-foreground" />
              11/20/2023
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">End Date</p>
            <div className="inline-flex w-full items-center gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm">
              <CalendarDays className="size-4 text-muted-foreground" />
              11/27/2023
            </div>
          </div>
        </div>

        <div className="flex gap-2 items-center rounded-md border bg-muted/20 px-3 py-2 text-sm">
          <AlarmCheck className="text-brand-red" />
          <p className="w-xs"> Your boost will run for 7 consecutive days starting next Monday.</p>
        </div>
      </CardContent>
    </Card>
  );
}
