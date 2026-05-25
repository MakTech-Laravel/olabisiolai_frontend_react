import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { container } from "@/lib/container";
import { cn } from "@/lib/utils";

type FaqItem = {
  question: string;
  answer: ReactNode;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is Gidira?",
    answer:
      "Gidira is a trusted national network that connects Nigerians with verified businesses and service providers. It helps users find reliable professionals while giving businesses a modern platform to showcase their services.",
  },
  {
    question: "Who can join Gidira?",
    answer:
      "Any legitimate Nigerian business or service provider can join - whether registered or operating as a sole proprietor. Verification is required before profiles go live.",
  },
  {
    question: "Is Gidira available nationwide?",
    answer: "Yes. Gidira operates nationally across Nigeria.",
  },
  {
    question: "Why does Gidira verify businesses?",
    answer:
      "Verification ensures trust, safety, and accountability. It helps users confidently hire businesses and gives verified providers a competitive edge.",
  },
  {
    question: "What documents are required for verification?",
    answer: (
      <div className="space-y-4 font-medium text-lg leading-7 text-foreground">
        <p>At launch, Gidira uses a lean, manual-first verification process.</p>
        <p>Businesses may be asked for:</p>
        <p>• Government-issued ID</p>
        <p>• Business registration documents (if available)</p>
        <p>• Proof of address or service location</p>
        <p>• Evidence of work (portfolio, photos, or references)</p>
      </div>
    ),
  },
  {
    question: "How long does verification take?",
    answer: "24-72 hours, depending on the completeness of your submission.",
  },
  {
    question: "Can I update my verification details later?",
    answer:
      "Yes. Businesses can update documents or profile information at any time. Verification is reviewed after major changes.",
  },
  {
    question: "How do I create a business profile?",
    answer:
      "Sign up, submit your business details, upload work samples, and complete verification. Once approved, your profile becomes visible to customers.",
  },
  {
    question: "What does a Gidira business profile include?",
    answer: (
      <div className="space-y-4 font-medium text-lg leading-7 text-foreground">
        <p>• Business name and description</p>
        <p>• Services offered</p>
        <p>• Photos and portfolio</p>
        <p>• Ratings and reviews</p>
        <p>• Contact details</p>
        <p>• Verification badge</p>
      </div>
    ),
  },
  {
    question: "Is there a fee to join Gidira?",
    answer:
      "Creating a basic profile is free. Businesses can pay for verification and optional profile‑boosting features.",
  },
  {
    question: "How do I find a business on Gidira?",
    answer:
      "Use the search bar or browse categories to discover verified service providers across Nigeria.",
  },
  {
    question: "Does Gidira handle payments between customers and businesses?",
    answer:
      "No. Gidira does not process payments. Customers pay businesses directly.",
  },
  {
    question: "What payment methods do businesses accept?",
    answer:
      "Most businesses accept bank transfers or cash. Some providers operate a no‑cash policy.",
  },
  {
    question: "How does the rating system work?",
    answer:
      "Customers rate businesses based on service quality, professionalism, and overall experience.",
  },
  {
    question: "Can businesses dispute a review?",
    answer:
      "Yes. Businesses can request a review check if they believe it violates Gidira’s guidelines.",
  },
  {
    question: "How do I reset my password?",
    answer:
      "Use the “Forgot Password” option on the login page and follow the instructions",
  },
  {
    question: "How do I contact Gidira support?",
    answer:
      "You can reach our support team through the Help Centre or via the contact details on the website.",
  },
  {
    question: "Can I deactivate my account?",
    answer:
      "Yes. You can deactivate or delete your account at any time from your settings.",
  },
  {
    question: "Does Gidira offer advertising or boosted visibility?",
    answer:
      "Yes. Businesses can pay for profile boosts to appear higher in search results.",
  },
];

function FaqAnswer({ children }: { children: ReactNode }) {
  if (typeof children === "string") {
    return (
      <p className="w-full text-left font-medium text-lg leading-7 text-foreground">
        {children}
      </p>
    );
  }
  return <div className="w-full text-left text-foreground">{children}</div>;
}

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="w-full bg-background">
      <div
        className={cn(
          container,
          "flex flex-col items-center gap-12 overflow-x-hidden lg:py-24 py-8",
        )}
      >
        <h1 className="text-center font-medium tracking-tight text-ink-heading text-2xl leading-9  sm:leading-10 lg:text-4xl lg:leading-12">
          Gidira – Frequently Asked Questions (FAQs)
        </h1>
        <h2 className="text-center font-medium tracking-tight text-ink-heading text-2xl leading-8 sm:text-3xl sm:leading-9 lg:text-3xl lg:leading-10">
          About Gidira
        </h2>

        <div className="flex w-full flex-col gap-2">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={`${item.question}-${index}`}
                className="flex w-full flex-col gap-2 bg-brand/20"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  className="flex w-full cursor-pointer items-start justify-between bg-surface-soft px-6 py-2 text-left"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span className="pr-3 font-medium text-lg leading-7 text-ink">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`size-6 shrink-0 text-ink transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {isOpen ? (
                  <div className="flex w-full items-center justify-center p-2.5">
                    <FaqAnswer>{item.answer}</FaqAnswer>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
