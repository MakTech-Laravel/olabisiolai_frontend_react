import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'

import { FrontendLayout } from '@/layouts/frontend/FrontendLayout'
import { suspensePage } from '@/routes/routeUtils'
import { VendorPremiumPaymentGate } from '@/components/partials/vendor/VendorPremiumPaymentGate'
import VendorSubscriptionPay from '@/pages/vendor/VendorSubscriptionPay'

// Eager imports for SEO SSR paths — avoids Suspense "Loading…" placeholders in crawler HTML.
import Home from '@/pages/frontend/Home'
import About from '@/pages/frontend/About'
import Contact from '@/pages/frontend/Contact'
import Terms from '@/pages/frontend/Terms'
import PrivacyPolicy from '@/pages/frontend/PrivacyPolicy'
import DeleteAccount from '@/pages/frontend/DeleteAccount'
import CareerJobDetail from '@/pages/frontend/CareerJobDetail'
import CookiesPolicy from '@/pages/frontend/CookiesPolicy'
import Careers from '@/pages/frontend/Careers'
import Faq from '@/pages/frontend/Faq'
import BusinessTips from '@/pages/frontend/BusinessTips/index'
import PhotosThatSell from '@/pages/frontend/BusinessTips/PhotosThatSell'
import WritingACompellingDescription from '@/pages/frontend/BusinessTips/WritingACompellingDescription'
import GettingMorePositiveReviews from '@/pages/frontend/BusinessTips/GettingMorePositiveReviews'
import RespondingToCustomerEnquiries from '@/pages/frontend/BusinessTips/RespondingToCustomerEnquiries'
import MarketingBeyondGidira from '@/pages/frontend/BusinessTips/MarketingBeyondGidira'
import PricingYourServicesRight from '@/pages/frontend/BusinessTips/PricingYourServicesRight'
import Filters from '@/pages/frontend/Filters'
import Catalog from '@/pages/frontend/Catalog'
import CatalogItemDetail from '@/pages/frontend/CatalogItemDetail'
import BusinessCatalogBrowse from '@/pages/frontend/BusinessCatalogBrowse'
import Service from '@/pages/frontend/Service'
import BusinessReviews from '@/pages/frontend/BusinessReviews'
import VendorPremiumInfo from '@/pages/vendor/VendorPremiumInfo'
import RedirectChooseYourPlan from '@/pages/vendor/RedirectChooseYourPlan'
import RefundPolicy from '@/pages/frontend/RefundPolicy'
import CommunityGuidelines from '@/pages/frontend/CommunityGuidelines'
import VendorAgreement from '@/pages/frontend/VendorAgreement'
import LegacyVendorOnboardingRedirect from '@/pages/vendor/LegacyVendorOnboardingRedirect'

// CSR-only public paths can stay lazy.
const Cart = lazy(() => import('@/pages/frontend/Cart'))
const DirectMessage = lazy(() => import('@/pages/frontend/DirectMessage'))
const GiveReview = lazy(() => import('@/pages/frontend/GiveReview'))

/** Public marketing and content routes (no role gate). */
export const publicRoutes: RouteObject = {
  element: <FrontendLayout />,
  children: [
    { path: '/', element: <Home /> },
    { path: '/cart', element: suspensePage(Cart) },
    { path: '/filters', element: <Filters /> },
    { path: '/catalog', element: <Catalog /> },
    { path: '/catalog/items/:itemId', element: <CatalogItemDetail /> },
    { path: '/trade', element: <Navigate to="/vendor/choose-your-plan" replace /> },
    { path: '/service', element: <Service /> },
    { path: '/businesses/:slug', element: <Service /> },
    { path: '/businesses/:slug/catalog', element: <BusinessCatalogBrowse /> },
    { path: '/businesses/:slug/reviews', element: <BusinessReviews /> },
    { path: '/messages', element: suspensePage(DirectMessage) },
    { path: '/reviews', element: suspensePage(GiveReview) },
    { path: '/about', element: <About /> },
    { path: '/contact', element: <Contact /> },
    { path: '/faq', element: <Faq /> },
    { path: '/business-tips', element: <BusinessTips /> },
    { path: '/business-tips/photos-that-sell', element: <PhotosThatSell /> },
    {
      path: '/business-tips/writing-a-compelling-description',
      element: <WritingACompellingDescription />,
    },
    {
      path: '/business-tips/getting-more-positive-reviews',
      element: <GettingMorePositiveReviews />,
    },
    {
      path: '/business-tips/responding-to-customer-enquiries',
      element: <RespondingToCustomerEnquiries />,
    },
    {
      path: '/business-tips/marketing-beyond-gidira',
      element: <MarketingBeyondGidira />,
    },
    {
      path: '/business-tips/pricing-your-services-right',
      element: <PricingYourServicesRight />,
    },
    { path: '/terms', element: <Terms /> },
    { path: '/privacy-policy', element: <PrivacyPolicy /> },
    { path: '/delete-account', element: <DeleteAccount /> },
    { path: '/cookies-policy', element: <CookiesPolicy /> },
    { path: '/community-guidelines', element: <CommunityGuidelines /> },
    { path: '/vendor-agreement', element: <VendorAgreement /> },
    { path: '/refund-policy', element: <RefundPolicy /> },
    { path: '/careers', element: <Careers /> },
    { path: '/careers/:slug', element: <CareerJobDetail /> },
    {
      path: '/single-application',
      element: <Navigate to="/careers/product-manager" replace />,
    },
    {
      path: '/vendor/choose-your-plan',
      element: <RedirectChooseYourPlan />,
    },
    {
      path: '/vendor/plan-form',
      element: <LegacyVendorOnboardingRedirect />,
    },
    {
      path: '/vendor/premium-info',
      element: <VendorPremiumInfo />,
    },
    {
      path: '/vendor/premium-payment',
      element: (
        <VendorPremiumPaymentGate>
          <VendorSubscriptionPay />
        </VendorPremiumPaymentGate>
      ),
    },
  ],
}
