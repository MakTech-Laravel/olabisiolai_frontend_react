import { ChoosePlanHeader } from "@/components/sections/vendor/chooseYourPlan/ChoosePlanHeader";
import { PlanComparisonTable } from "@/components/sections/vendor/chooseYourPlan/PlanComparisonTable";
import { PlanFaq } from "@/components/sections/vendor/chooseYourPlan/PlanFaq";
import { PlanFooterCta } from "@/components/sections/vendor/chooseYourPlan/PlanFooterCta";
import { PlanPricingCards } from "@/components/sections/vendor/chooseYourPlan/PlanPricingCards";
import { PlanPromoBanner } from "@/components/sections/vendor/chooseYourPlan/PlanPromoBanner";

export default function ChooseYourVendorPlan() {
    return (
        <div className="p-4 md:p-6">
            <div className="mx-auto max-w-5xl space-y-12 text-foreground md:space-y-16">
                <ChoosePlanHeader />
                <PlanPricingCards />
                <PlanComparisonTable />
                <PlanPromoBanner />
                <PlanFaq />
                <PlanFooterCta />
            </div>
        </div>
    );
}
