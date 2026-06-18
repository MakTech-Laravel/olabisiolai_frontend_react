import { lazy } from "react";
import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";

import { FrontendLayout } from "@/layouts/frontend/FrontendLayout";
import { suspensePage } from "@/routes/routeUtils";
import { VendorPremiumPaymentGate } from "@/components/partials/vendor/VendorPremiumPaymentGate";
import VendorSubscriptionPay from "@/pages/vendor/VendorSubscriptionPay";

const Home = lazy(() => import("@/pages/frontend/Home"));
const Cart = lazy(() => import("@/pages/frontend/Cart"));
const About = lazy(() => import("@/pages/frontend/About"));
const Contact = lazy(() => import("@/pages/frontend/Contact"));
const Terms = lazy(() => import("@/pages/frontend/Terms"));
const PrivacyPolicy = lazy(() => import("@/pages/frontend/PrivacyPolicy"));
const CareerJobDetail = lazy(() => import("@/pages/frontend/CareerJobDetail"));
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
const BusinessReviews = lazy(() => import("@/pages/frontend/BusinessReviews"));
const VendorPremiumInfo = lazy(() => import("@/pages/vendor/VendorPremiumInfo"));
const RedirectChooseYourPlan = lazy(() => import("@/pages/vendor/RedirectChooseYourPlan"));
const RefundPolicy = lazy(() => import("@/pages/frontend/RefundPolicy"));
const CommunityGuidelines = lazy(() => import("@/pages/frontend/CommunityGuidelines"));
const VendorAgreement = lazy(() => import("@/pages/frontend/VendorAgreement"));
const LegacyVendorOnboardingRedirect = lazy(() => import("@/pages/vendor/LegacyVendorOnboardingRedirect"));

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
    { path: "/businesses/:slug/reviews", element: suspensePage(BusinessReviews) },
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
    { path: "/cookies-policy", element: suspensePage(CookiesPolicy) },
    { path: "/community-guidelines", element: suspensePage(CommunityGuidelines) },
    { path: "/vendor-agreement", element: suspensePage(VendorAgreement) },
    { path: "/refund-policy", element: suspensePage(RefundPolicy) },
    { path: "/careers", element: suspensePage(Careers) },
    { path: "/careers/:slug", element: suspensePage(CareerJobDetail) },
    {
      path: "/single-application",
      element: <Navigate to="/careers/product-manager" replace />,
    },
    {
      path: "/vendor/choose-your-plan",
      element: suspensePage(RedirectChooseYourPlan),
    },
    {
      path: "/vendor/plan-form",
      element: suspensePage(LegacyVendorOnboardingRedirect),
    },
    {
      path: "/vendor/premium-info",
      element: suspensePage(VendorPremiumInfo),
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
