import { BadgeCheck, TrendingUp, Users, Zap } from "lucide-react";

export type PricingOption = {
  duration: string;
  price: string;
};

export type Feature = {
  text: string;
  checked: boolean;
};

export type Plan = {
  id: string;
  title: string;
  subtitle: string;
  pricingOptions: PricingOption[];
  slotStatus: "available" | "occupied";
  slotLabel?: string;
  features: Feature[];
  cta: string;
  colorScheme: "orange" | "gray" | "yellow";
  medal: number;
  badge?: string;
  highlighted?: boolean;
};

export const oneTimePlans: Plan[] = [
  {
    id: "bronze",
    title: "Top 10 Boost",
    subtitle: "Affordable visibility for growing businesses",
    pricingOptions: [
      { duration: "7 Days", price: "₦3,000" },
      { duration: "14 Days", price: "₦5,000" },
      { duration: "30 Days", price: "₦10,000" },
    ],
    slotStatus: "available",
    features: [
      { text: "Appear in Top 10 in your LGA", checked: true },
      { text: "Boost badge on listing", checked: true },
      { text: "Increased visibility & enquiries", checked: true },
      { text: "No exclusivity", checked: false },
    ],
    cta: "Boost with Bronze",
    colorScheme: "orange",
    medal: 3,
  },
  {
    id: "silver",
    title: "Top 5 Boost",
    subtitle: "Higher visibility for competitive LGAs",
    pricingOptions: [
      { duration: "7 Days", price: "₦5,000" },
      { duration: "14 Days", price: "₦8,000" },
      { duration: "30 Days", price: "₦15,000" },
    ],
    slotStatus: "available",
    features: [
      { text: "Guaranteed Top 5 placement", checked: true },
      { text: "Higher ranking than Bronze", checked: true },
      { text: "Boost badge & strong visibility", checked: true },
      { text: "No exclusivity", checked: false },
    ],
    cta: "Boost with Silver",
    colorScheme: "gray",
    medal: 2,
    highlighted: true,
    badge: "Most Popular",
  },
  {
    id: "gold",
    title: "Top 1 Exclusive",
    subtitle: "The #1 spot — only one business per LGA",
    pricingOptions: [
      { duration: "7 Days", price: "₦10,000" },
      { duration: "14 Days", price: "₦15,000" },
      { duration: "30 Days", price: "₦20,000" },
    ],
    slotStatus: "occupied",
    features: [
      { text: "Guaranteed #1 position", checked: true },
      { text: "Exclusive — one per LGA", checked: true },
      { text: "Spotlight badge & 10X more reach", checked: true },
      { text: "Premium vendors get first access", checked: true },
    ],
    cta: "Join Waiting List",
    colorScheme: "yellow",
    medal: 1,
  },
];

export const subscriptionPlans: Plan[] = [
  {
    id: "starter-sub",
    title: "Starter Subscription",
    subtitle: "Consistent weekly exposure",
    pricingOptions: [{ duration: "Monthly", price: "₦6,000" }],
    slotStatus: "available",
    features: [
      { text: "Weekly boost slots", checked: true },
      { text: "Search highlighting", checked: true },
      { text: "Email support", checked: true },
    ],
    cta: "Start Starter Plan",
    colorScheme: "orange",
    medal: 3,
  },
  {
    id: "growth-sub",
    title: "Growth Subscription",
    subtitle: "For growing vendor storefronts",
    pricingOptions: [{ duration: "Monthly", price: "₦15,000" }],
    slotStatus: "available",
    features: [
      { text: "Priority placement", checked: true },
      { text: "Boost scheduling", checked: true },
      { text: "Priority support", checked: true },
    ],
    cta: "Choose Growth",
    colorScheme: "gray",
    medal: 2,
    highlighted: true,
    badge: "Most Popular",
  },
  {
    id: "elite-sub",
    title: "Elite Subscription",
    subtitle: "Maximum reach and premium placement",
    pricingOptions: [{ duration: "Monthly", price: "₦30,000" }],
    slotStatus: "available",
    features: [
      { text: "Premium boost slots", checked: true },
      { text: "Featured badge", checked: true },
      { text: "Dedicated manager", checked: true },
    ],
    cta: "Go Elite",
    colorScheme: "yellow",
    medal: 1,
  },
];

export const benefitItems = [
  {
    title: "2.4x Views",
    description: "Average increase in store visibility with Pro Boost",
    icon: TrendingUp,
  },
  {
    title: "New Audience",
    description: "Reach customers who would not normally find you",
    icon: Users,
  },
  {
    title: "Instant Start",
    description: "Your boost goes live within minutes of purchase",
    icon: Zap,
  },
  {
    title: "Verified Badge",
    description: "Gain immediate trust with the featured seller badge",
    icon: BadgeCheck,
  },
];
