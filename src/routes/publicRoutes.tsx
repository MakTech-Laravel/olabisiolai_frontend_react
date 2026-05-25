import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

import { FrontendLayout } from "@/layouts/frontend/FrontendLayout";
import { suspensePage } from "@/routes/routeUtils";
import { VendorOnboardingGate } from "@/components/partials/vendor/VendorOnboardingGate";
import { VendorPremiumPaymentGate } from "@/components/partials/vendor/VendorPremiumPaymentGate";
import VendorSubscriptionPay from "@/pages/vendor/VendorSubscriptionPay";

const Home = lazy(() => import("@/pages/frontend/Home"));
const Cart = lazy(() => import("@/pages/frontend/Cart"));
const About = lazy(() => import("@/pages/frontend/About"));
const Contact = lazy(() => import("@/pages/frontend/Contact"));
const Terms = lazy(() => import("@/pages/frontend/Terms"));
const PrivacyPolicy = lazy(() => import("@/pages/frontend/PrivacyPolicy"));
const SingleApplication = lazy(() => import("@/pages/frontend/SingleApplication"));
const CookiesPolicy = lazy(() => import("@/pages/frontend/CookiesPolicy"));
const Careers = lazy(() => import("@/pages/frontend/Careers"));
const Faq = lazy(() => import("@/pages/frontend/Faq"));
const BusinessTips = lazy(() => import("@/pages/frontend/BusinessTips/index"));
const PhotosThatSell = lazy(() => import("@/pages/frontend/BusinessTips/PhotosThatSell"));
const WritingACompellingDescription = lazy(
  () => import("@/pages/frontend/BusinessTips/WritingACompellingDescription"),
);
const GettingMorePositiveReviews = lazy(
  () => import("@/pages/frontend/BusinessTips/GettingMorePositiveReviews"),
);
const RespondingToCustomerEnquiries = lazy(
  () => import("@/pages/frontend/BusinessTips/RespondingToCustomerEnquiries"),
);
const MarketingBeyondGidira = lazy(() => import("@/pages/frontend/BusinessTips/MarketingBeyondGidira"));
const PricingYourServicesRight = lazy(() => import("@/pages/frontend/BusinessTips/PricingYourServicesRight"));
const Filters = lazy(() => import("@/pages/frontend/Filters"));
const Trade = lazy(() => import("@/pages/frontend/Trade"));
const Service = lazy(() => import("@/pages/frontend/Service"));
const DirectMessage = lazy(() => import("@/pages/frontend/DirectMessage"));
const GiveReview = lazy(() => import("@/pages/frontend/GiveReview"));
const ChooseYourVendorPlan = lazy(() => import("@/pages/vendor/ChooseYourVendorPlan"));
const PlanForm = lazy(() => import("@/pages/vendor/PlanForm"));

/** Public marketing and content routes (no role gate). */
export const publicRoutes: RouteObject = {
  element: <FrontendLayout />,
  children: [
    { path: "/", element: suspensePage(Home) },
    { path: "/cart", element: suspensePage(Cart) },
    { path: "/filters", element: suspensePage(Filters) },
    { path: "/trade", element: suspensePage(Trade) },
    { path: "/service", element: suspensePage(Service) },
    { path: "/businesses/:slug", element: suspensePage(Service) },
    { path: "/messages", element: suspensePage(DirectMessage) },
    { path: "/reviews", element: suspensePage(GiveReview) },
    { path: "/about", element: suspensePage(About) },
    { path: "/contact", element: suspensePage(Contact) },
    { path: "/faq", element: suspensePage(Faq) },
    { path: "/business-tips", element: suspensePage(BusinessTips) },
    { path: "/business-tips/photos-that-sell", element: suspensePage(PhotosThatSell) },
    {
      path: "/business-tips/writing-a-compelling-description",
      element: suspensePage(WritingACompellingDescription),
    },
    {
      path: "/business-tips/getting-more-positive-reviews",
      element: suspensePage(GettingMorePositiveReviews),
    },
    {
      path: "/business-tips/responding-to-customer-enquiries",
      element: suspensePage(RespondingToCustomerEnquiries),
    },
    {
      path: "/business-tips/marketing-beyond-gidira",
      element: suspensePage(MarketingBeyondGidira),
    },
    {
      path: "/business-tips/pricing-your-services-right",
      element: suspensePage(PricingYourServicesRight),
    },
    { path: "/terms", element: suspensePage(Terms) },
    { path: "/privacy-policy", element: suspensePage(PrivacyPolicy) },
    { path: "/single-application", element: suspensePage(SingleApplication) },
    { path: "/cookies-policy", element: suspensePage(CookiesPolicy) },
    { path: "/careers", element: suspensePage(Careers) },
    {
      path: "/vendor/choose-your-plan",
      element: (
        <VendorOnboardingGate onboardingOnly>
          {suspensePage(ChooseYourVendorPlan)}
        </VendorOnboardingGate>
      ),
    },
    {
      path: "/vendor/plan-form",
      element: (
        <VendorOnboardingGate onboardingOnly requireAuth>
          {suspensePage(PlanForm)}
        </VendorOnboardingGate>
      ),
    },
    {
      path: "/vendor/premium-payment",
      element: (
        <VendorPremiumPaymentGate>
          <VendorSubscriptionPay />
        </VendorPremiumPaymentGate>
      ),
    },
  ],
};
