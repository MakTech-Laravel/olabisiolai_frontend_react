import { cn } from "@/lib/utils";

const paleSurface = "bg-[#EEF2FF]";

const faqItems: { q: string; a: string }[] = [
  {
    q: "Can I switch plans later?",
    a: "Yes. You can upgrade to Premium at any time from your dashboard, and changes apply instantly for new billing periods.",
  },
  {
    q: "What is Priority Boost?",
    a: "Priority Boost gives you higher placement in category search and eligibility for homepage carousel spots so more buyers see your business first.",
  },
  {
    q: "How long does verification take?",
    a: "Verification is a separate one-time fee (Individual, Business Name, or LTD). After payment, upload documents and our team reviews them. The verified badge appears only after approval—not from Premium subscription.",
  },
];

export function PlanFaq() {
  return (
    <div className="space-y-4">
      <h2 className="text-center text-sm font-medium uppercase tracking-wider text-muted-foreground font-inter">
        Frequently asked questions
      </h2>
      <div className="space-y-4">
        {faqItems.map((item) => (
          <div key={item.q} className={cn("rounded-2xl p-6 shadow-sm", paleSurface)}>
            <h3 className="text-base font-bold text-foreground font-manrope">{item.q}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground font-inter">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
