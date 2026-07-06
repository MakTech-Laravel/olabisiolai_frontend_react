import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/auth/useAuth";
import { fetchVerificationPackages } from "@/features/verification/vendorVerificationApi";
import { formatMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";

const paleSurface = "bg-[#EEF2FF]";

function baseComparisonRows(verificationPrice: string): {
  feature: string;
  basic: string;
  premium: string;
  premiumHighlight?: boolean;
}[] {
  return [
    { feature: "Product image limit", basic: "5 images", premium: "20 images" },
    { feature: "Search placement", basic: "Standard", premium: "Priority boost" },
    { feature: "Analytics dashboard", basic: "Basic stats", premium: "Comprehensive" },
    { feature: "Support response", basic: "48 hours", premium: "Instant priority" },
    {
      feature: "Verification badge",
      basic: `${verificationPrice} extra`,
      premium: "Free included",
      premiumHighlight: true,
    },
  ];
}

export function PlanComparisonTable() {
  const { isAuthenticated } = useAuth();

  const verificationQuery = useQuery({
    queryKey: ["vendor", "verification-packages"],
    queryFn: fetchVerificationPackages,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const cheapestVerificationAmount = verificationQuery.data?.packages.length
    ? Math.min(...verificationQuery.data.packages.map((p) => p.amount))
    : null;

  const verificationPrice = cheapestVerificationAmount != null
    ? formatMoney(cheapestVerificationAmount, verificationQuery.data?.currency)
    : "Paid";

  const comparisonRows = baseComparisonRows(verificationPrice);

  return (
    <div className="space-y-4">
      <h2 className="text-center text-sm font-medium uppercase tracking-wider text-muted-foreground font-inter">
        Compare plans
      </h2>
      <div className={cn("overflow-hidden rounded-2xl shadow-sm", paleSurface)}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-indigo-100/80">
                <th className="px-5 py-4 font-semibold text-foreground font-manrope">Features</th>
                <th className="px-5 py-4 font-semibold text-foreground font-manrope">Basic</th>
                <th className="px-5 py-4 font-semibold text-foreground font-manrope">Premium</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.feature} className="border-b border-indigo-100/60 last:border-0">
                  <td className="px-5 py-3.5 font-medium text-foreground font-inter">{row.feature}</td>
                  <td className="px-5 py-3.5 text-muted-foreground font-inter">{row.basic}</td>
                  <td
                    className={cn(
                      "px-5 py-3.5 font-inter",
                      row.premiumHighlight ? "font-semibold text-primary" : "text-foreground",
                    )}
                  >
                    {row.premium}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
