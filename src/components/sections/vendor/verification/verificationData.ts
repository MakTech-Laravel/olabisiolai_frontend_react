import type { LucideIcon } from "lucide-react";
import { ArrowRight, FileText, Lock, ShieldCheck, Store } from "lucide-react";

import type { VerificationPackage } from "@/features/verification/vendorVerificationApi";

export type PlanId = "business" | "ltd";

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
        id: "business",
        title: "Business Name",
        amount: 5000,
        description:
            "For registered and unregistered sole proprietors. Includes identity verification, proof of address and optional CAC.",
        afterPurchaseNote:
            "After payment, submit identity proof and address proof. CAC / business registration is optional. Your document status page shows admin decisions on every file so you always know what to fix.",
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
