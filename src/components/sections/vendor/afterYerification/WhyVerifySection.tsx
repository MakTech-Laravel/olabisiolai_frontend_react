import { Lock, ShieldCheck, Banknote } from "lucide-react";

interface Benefit {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function WhyVerifySection() {
  const benefits: Benefit[] = [
    {
      icon: <ShieldCheck className="h-6 w-6 text-brand-red" />,
      title: "Consumer Confidence",
      description:
        "Build trust with buyers through verified status and secure transactions",
    },
    {
      icon: <Lock className="h-6 w-6 text-brand-red" />,
      title: "Enhanced Security",
      description:
        "Advanced fraud protection and secure payment processing for verified vendors",
    },
    {
      icon: <Banknote className="h-6 w-6 text-brand-red" />,
      title: "Higher Limits",
      description:
        "Access to increased transaction limits and premium marketplace features",
    },
  ];

  return (
    <div className="rounded-xl border bg-black p-4 sm:p-6 shadow-sm">
      <div className="">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-white">Why verify your identity?</h2>
      </div>

      <div className="flex flex-col gap-3 sm:gap-4">
        {benefits.map((benefit, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-white">
              {benefit.icon}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1">
              <h3 className="font-medium text-sm sm:text-base text-white">{benefit.title}: </h3>
              <p className="text-xs sm:text-sm text-white">{benefit.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
