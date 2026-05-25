import { Card, CardContent } from "@/components/ui/card";

export function LeadsHeader() {
  return (
    <Card className="overflow-hidden rounded-xl border-neutral-200/90 bg-card shadow-sm">
      <CardContent className="space-y-4 p-5 md:p-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground font-manrope md:text-2xl">Your Leads</h1>
      </CardContent>
    </Card>
  );
}
