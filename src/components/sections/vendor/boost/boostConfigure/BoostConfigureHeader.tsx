import { ChevronRight } from "lucide-react";

export function BoostConfigureHeader() {
  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        <p className="text-xs font-inter font-medium uppercase text-muted-foreground">Business Center</p>
        <ChevronRight className="w-4 h-4" />
        <p className="text-xs font-inter font-medium uppercase text-brand-red">Configure your boost</p>
      </div>
      <h1 className="text-4xl font-extrabold font-manrope tracking-tight text-foreground mb-4">
        Configure Your Boost
      </h1>
      <p className="max-w-xl text-base font-inter font-normal text-muted-foreground">
        Target your audience with precision. Select specific Lagos areas and define your timeline to maximize your
        business visibility.
      </p>
    </div>
  );
}
