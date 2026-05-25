import { Check, Lock } from "lucide-react";

export function PlanFeatureCheck({ children }: { children: string }) {
  return (
    <li className="flex items-start gap-3 text-sm font-inter text-foreground">
      <Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
      <span>{children}</span>
    </li>
  );
}

export function PlanFeatureLocked({ children }: { children: string }) {
  return (
    <li className="flex items-start gap-3 text-sm font-inter text-muted-foreground">
      <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </li>
  );
}
