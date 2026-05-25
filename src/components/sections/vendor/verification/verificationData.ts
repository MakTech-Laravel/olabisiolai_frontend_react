import type { LucideIcon } from "lucide-react";
import { ArrowRight, CircleUserRound, FileText, Lock, ShieldCheck, Store } from "lucide-react";

import type { VerificationPackage } from "@/features/verification/vendorVerificationApi";

export type PlanId = "individual" | "business" | "ltd";

export type Plan = {
    id: PlanId;
    title: string;
    amount: number;
    description: string;
    /** Shown under the plan grid when this tier is selected — what happens after payment. */
    afterPurchaseNote: string;
    perks: string[];
    icon: LucideIcon;
    /** Default panel fill when not selected (design: white vs soft blue). */
    surface: "tint" | "white";
    /** Perk row style: bold navy caps vs checklist. */
    perkStyle: "badge" | "list";
};

export const plans: Plan[] = [
    {
        id: "individual",
        title: "Individual",
        amount: 2500,
        description:
            "Best for solo entrepreneurs and independent contractors. Requires government ID and personal biometric verification.",
        afterPurchaseNote:
            "After payment you will upload your ID and business documents. Track each file on your status page — see what is approved, rejected, or still under review, and re-upload if admin requests changes.",
        perks: ["Trusted badge"],
        icon: CircleUserRound,
        surface: "tint",
        perkStyle: "badge",
    },
    {
        id: "business",
        title: "Business Name",
        amount: 5000,
        description:
            "For registered sole proprietorships. Includes CAC document validation and business account linkage.",
        afterPurchaseNote:
            "After payment, submit your CAC certificate, identity proof, and address proof. Your document status page shows admin decisions on every file so you always know what to fix.",
        perks: ["Vendor priority", "Storefront personalization"],
        icon: Store,
        surface: "white",
        perkStyle: "list",
    },
    {
        id: "ltd",
        title: "Limited Company (LTD)",
        amount: 10000,
        description:
            "The gold standard for corporate entities. Comprehensive verification of directors, shareholders, and legal status.",
        afterPurchaseNote:
            "After payment, upload incorporation documents and director IDs. Use the document status page to follow review progress and replace any file marked as flagged by our team.",
        perks: ["Enterprise blue badge"],
        icon: FileText,
        surface: "tint",
        perkStyle: "badge",
    },
];

export const whyVerifyItems = [
    {
        title: "Increased Trust",
        description: "Verified vendors receive 3x more inquiries and build lasting customer relationships.",
        icon: ShieldCheck,
    },
    {
        title: "Priority Support",
        description: "Get dedicated assistance with verification, disputes, and account management.",
        icon: ArrowRight,
    },
    {
        title: "Secure Payments",
        description: "Access to Gidira Pay with enhanced fraud protection and instant settlements.",
        icon: Lock,
    },
    {
        title: "Marketplace Access",
        description: "Unlock premium features and visibility across all marketplace categories.",
        icon: Store,
    },
];

/** Overlay API prices onto static plan cards (admin-configurable). */
export function plansWithApiPricing(
    staticPlans: Plan[],
    apiPackages: VerificationPackage[] | undefined,
): Plan[] {
    if (!apiPackages?.length) return staticPlans;
    return staticPlans.map((plan) => {
        const fromApi = apiPackages.find((p) => p.id === plan.id);
        if (!fromApi) return plan;
        return {
            ...plan,
            title: fromApi.title?.trim() || plan.title,
            amount: fromApi.amount,
            description: fromApi.description?.trim() || plan.description,
            perks: fromApi.perks?.length ? fromApi.perks : plan.perks,
        };
    });
}

export const processSteps = [
    {
        step: "1",
        title: "Select Your Tier",
        description: "Choose the verification plan that matches your business structure.",
    },
    {
        step: "2",
        title: "Submit Documents",
        description: "Upload required documents and complete biometric verification.",
    },
    {
        step: "3",
        title: "Review & Approval",
        description: "Our team reviews your application within 24-48 hours.",
    },
    {
        step: "4",
        title: "Get Verified",
        description: "Receive your verification badge and unlock all marketplace features.",
    },
];
